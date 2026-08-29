"use client";
import { fetchLanguageWords } from "@/lib/languages";
import { getQuote, type QuoteLength } from "@/lib/quotes";
import {
  DIFFICULTY_STORAGE_KEY,
  NUMBERS_STORAGE_KEY,
  PUNCTUATION_STORAGE_KEY,
  QUOTE_LENGTH_STORAGE_KEY,
  readStoredBool,
  readStoredDifficulty,
  readStoredQuoteLength,
  readStoredTestMode,
  readStoredTimeOption,
  readStoredWordOption,
  TEST_MODE_STORAGE_KEY,
  type TestMode,
  TIME_OPTION_STORAGE_KEY,
  type TimeOption,
  WORD_OPTION_STORAGE_KEY,
  type WordOption,
} from "@/lib/test-storage";
import type { ResultStats, WpmSnapshot } from "@/lib/types";
import {
  type Difficulty,
  generateWords,
  generateWordsFromPool,
} from "@/lib/words";
import {
  accuracyFromCounts,
  countWpm,
  wpmNumeratorFromCounts,
} from "@/lib/wpm-count";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ResetOverrides = Partial<{
  mode: TestMode;
  quoteLength: QuoteLength;
  wordOption: WordOption;
  timeOption: TimeOption;
  punctuation: boolean;
  numbers: boolean;
  difficulty: Difficulty | undefined;
}>;

interface UseTypingTestProps {
  onFinished?: (finished: boolean) => void;
  onFocusChange?: (focused: boolean) => void;
  onKeyHighlight?: (key: string | null) => void;
  onTypingActiveChange?: (active: boolean) => void;
  onWrongKey?: () => void;
  pauseTypingInputRefocus?: boolean;
}

export function useTypingTest({
  onKeyHighlight,
  onFinished,
  onTypingActiveChange,
  onFocusChange,
  onWrongKey,
  pauseTypingInputRefocus = false,
}: UseTypingTestProps) {
  const pauseRefocusRef = useRef(false);
  useEffect(() => {
    pauseRefocusRef.current = pauseTypingInputRefocus;
  }, [pauseTypingInputRefocus]);

  const [mode, setMode] = useState<TestMode>("time");
  const [timeOption, setTimeOption] = useState<TimeOption>(30);
  const [wordOption, setWordOption] = useState<WordOption>(25);
  const [quoteLength, setQuoteLength] = useState<QuoteLength>("medium");
  const [quoteAuthor, setQuoteAuthor] = useState<string | null>(null);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>("easy");

  const wordPoolRef = useRef<{
    hard: boolean;
    words: string[];
  } | null>(null);

  const [words, setWords] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [rowOffset, setRowOffset] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wordInputs, setWordInputs] = useState<string[]>([]);
  const [wpmHistory, setWpmHistory] = useState<WpmSnapshot[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [isFocused, setIsFocused] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [isActivelyTyping, setIsActivelyTyping] = useState(false);
  const [screenFade, setScreenFade] = useState(1);
  const [wpm, setWpm] = useState(0);
  const [frozenStats, setFrozenStats] = useState<ResultStats | null>(null);
  const correctCharsRef = useRef(0);
  const allTypedRef = useRef(0);
  const errorsThisSecondRef = useRef(0);
  const elapsedSecondsRef = useRef(0);
  const correctedErrorsRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabPressedRef = useRef(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTestRef = useRef<(() => void) | null>(null);

  const mtCounts = useMemo(
    () =>
      countWpm({
        targetWords: words,
        wordInputs,
        typed,
        wordIndex,
        mode,
        final: finished,
      }),
    [words, wordInputs, typed, wordIndex, mode, finished],
  );
  const wpmNumerator = wpmNumeratorFromCounts(mtCounts);
  const accuracy = accuracyFromCounts(mtCounts);
  useEffect(() => {
    correctCharsRef.current = wpmNumerator;
  }, [wpmNumerator]);

  const finishTest = useCallback(
    (finalInputs?: string[], finalTyped?: string) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setFinished(true);
      setShowControls(true);
      onFinished?.(true);
      onTypingActiveChange?.(false);
      setScreenFade(0);
      requestAnimationFrame(() => setScreenFade(1));

      const activeInputs = finalInputs ?? wordInputs;
      const activeTyped = finalTyped ?? typed;
      const activeIndex = finalInputs ? finalInputs.length - 1 : wordIndex;

      const elapsed = startTime
        ? (Date.now() - startTime) / 1000
        : elapsedSecondsRef.current;
      const elapsedMin = elapsed / 60 || 1 / 60;
      const wpmValues = wpmHistory.map((s) => s.wpm).filter((v) => v > 0);
      let consistency = 100;
      if (wpmValues.length > 1) {
        const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
        const variance =
          wpmValues.reduce((a, b) => a + (b - mean) ** 2, 0) / wpmValues.length;
        consistency = Math.max(
          0,
          Math.round(100 - (Math.sqrt(variance) / (mean || 1)) * 100),
        );
      }
      const counts = countWpm({
        targetWords: words,
        wordInputs: activeInputs,
        typed: activeTyped,
        wordIndex: activeIndex,
        mode,
        final: true,
      });
      const computedWpm = Math.round(
        wpmNumeratorFromCounts(counts) / 5 / elapsedMin,
      );
      const computedRaw = Math.max(
        Math.round(allTypedRef.current / 5 / elapsedMin),
        computedWpm,
      );
      setFrozenStats({
        wpm: computedWpm,
        accuracy: accuracyFromCounts(counts),
        raw: computedRaw,
        correctChars: counts.correctWordChars,
        incorrectChars: counts.incorrectChars,
        extraChars: counts.extraChars,
        missedChars: counts.missedChars,
        consistency,
        elapsedSeconds: Math.round(elapsed),
        correctedErrors: correctedErrorsRef.current,
        mode,
        modeDetail:
          mode === "time"
            ? String(timeOption)
            : mode === "words"
              ? String(wordOption)
              : mode === "quote"
                ? quoteLength
                : "",
        wpmHistory,
      });
    },
    [
      onFinished,
      onTypingActiveChange,
      wordInputs,
      typed,
      wordIndex,
      startTime,
      wpmHistory,
      words,
      mode,
      timeOption,
      wordOption,
      quoteLength,
    ],
  );

  useEffect(() => {
    finishTestRef.current = finishTest;
  }, [finishTest]);

  const buildWords = useCallback(
    async (
      count: number,
      opts: {
        punctuation: boolean;
        numbers: boolean;
        difficulty: Difficulty | undefined;
      },
    ): Promise<string[]> => {
      const isHard = opts.difficulty === "hard";
      if (wordPoolRef.current && wordPoolRef.current.hard === isHard) {
        return generateWordsFromPool(wordPoolRef.current.words, count, opts);
      }
      const pool = await fetchLanguageWords(isHard);
      if (pool.length > 0) {
        wordPoolRef.current = { hard: isHard, words: pool };
        return generateWordsFromPool(pool, count, opts);
      }
      return generateWords(count, opts);
    },
    [],
  );

  const resetTestWith = useCallback(
    async (overrides: ResetOverrides = {}) => {
      const m = overrides.mode ?? mode;
      const ql = overrides.quoteLength ?? quoteLength;
      const wo = overrides.wordOption ?? wordOption;
      const to = overrides.timeOption ?? timeOption;
      const p = overrides.punctuation ?? punctuation;
      const n = overrides.numbers ?? numbers;
      const d = "difficulty" in overrides ? overrides.difficulty : difficulty;
      const wc = m === "time" ? 200 : m === "words" ? wo : 100;

      setQuoteAuthor(null);
      if (m === "quote") {
        const { words: newWords, author } = getQuote(ql);
        setWords(newWords);
        setQuoteAuthor(author);
      } else {
        const newWords = await buildWords(wc, {
          punctuation: p,
          numbers: n,
          difficulty: d,
        });
        setWords(newWords);
      }
      setTyped("");
      setWordIndex(0);
      setStarted(false);
      setFinished(false);
      setStartTime(null);
      setWordInputs([]);
      setWpmHistory([]);
      correctCharsRef.current = 0;
      allTypedRef.current = 0;
      errorsThisSecondRef.current = 0;
      elapsedSecondsRef.current = 0;
      correctedErrorsRef.current = 0;
      if (m === "time") {
        setTimeLeft(to);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRowOffset(0);
      setShowControls(true);
      setIsActivelyTyping(false);
      onFinished?.(false);
      onTypingActiveChange?.(false);
      inputRef.current?.focus();
    },
    [
      mode,
      quoteLength,
      wordOption,
      timeOption,
      punctuation,
      numbers,
      difficulty,
      buildWords,
      onFinished,
      onTypingActiveChange,
    ],
  );

  const resetTestImmediate = useCallback(
    () => resetTestWith(),
    [resetTestWith],
  );

  const resetTest = useCallback(
    (overrides: ResetOverrides = {}) => {
      if (resetAnimRef.current) {
        clearTimeout(resetAnimRef.current);
      }
      setResetting(true);
      resetAnimRef.current = setTimeout(() => {
        void resetTestWith(overrides).then(() => {
          setResetting(false);
          resetAnimRef.current = null;
        });
      }, 150);
    },
    [resetTestWith],
  );

  useEffect(() => {
    const storedMode = readStoredTestMode();
    const storedTime = readStoredTimeOption();
    const storedWordOption = readStoredWordOption();
    const storedQuoteLength = readStoredQuoteLength();
    const storedPunctuation = readStoredBool(PUNCTUATION_STORAGE_KEY);
    const storedNumbers = readStoredBool(NUMBERS_STORAGE_KEY);
    const storedDifficulty = readStoredDifficulty();
    const m = storedMode ?? mode;
    const to = storedTime ?? timeOption;
    const wo = storedWordOption ?? wordOption;
    const ql = storedQuoteLength ?? quoteLength;
    const p = storedPunctuation ?? punctuation;
    const n = storedNumbers ?? numbers;
    const d = storedDifficulty === undefined ? difficulty : storedDifficulty;

    setTimeout(() => {
      if (storedMode !== undefined) {
        setMode(storedMode);
      }
      if (storedTime !== undefined) {
        setTimeOption(storedTime);
      }
      if (storedWordOption !== undefined) {
        setWordOption(storedWordOption);
      }
      if (storedQuoteLength !== undefined) {
        setQuoteLength(storedQuoteLength);
      }
      if (storedPunctuation !== undefined) {
        setPunctuation(storedPunctuation);
      }
      if (storedNumbers !== undefined) {
        setNumbers(storedNumbers);
      }
      if (storedDifficulty !== undefined) {
        setDifficulty(storedDifficulty);
      }

      const wc = m === "time" ? 200 : m === "words" ? wo : 100;
      if (m === "quote") {
        const { words: initWords, author } = getQuote(ql);
        setWords(initWords);
        setQuoteAuthor(author);
      } else {
        buildWords(wc, {
          punctuation: p,
          numbers: n,
          difficulty: d,
        }).then((w) => setWords(w));
      }
      if (m === "time") {
        setTimeLeft(to);
      }
      inputRef.current?.focus();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markTypingActive = useCallback(() => {
    setIsActivelyTyping(true);
    if (typingIdleRef.current) {
      clearTimeout(typingIdleRef.current);
    }
    typingIdleRef.current = setTimeout(() => setIsActivelyTyping(false), 1000);
  }, []);

  const handleMouseMove = useCallback(() => {
    if (!started || finished) {
      return;
    }
    setShowControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  }, [started, finished]);

  const recordWordSnapshot = useCallback(
    (
      snapshotWordInputs: string[],
      snapshotTyped: string,
      snapshotWordIndex: number,
    ) => {
      if (!startTime || mode === "time") {
        return;
      }
      const snapCounts = countWpm({
        targetWords: words,
        wordInputs: snapshotWordInputs,
        typed: snapshotTyped,
        wordIndex: snapshotWordIndex,
        mode,
        final: false,
      });
      const snapNum = wpmNumeratorFromCounts(snapCounts);
      const elapsedSec = (Date.now() - startTime) / 1000;
      elapsedSecondsRef.current = elapsedSec;
      const elapsedMin = elapsedSec / 60 || 1 / 60;
      const snapWpm = Math.round(snapNum / 5 / elapsedMin);
      const snapRaw = Math.max(
        Math.round(allTypedRef.current / 5 / elapsedMin),
        snapWpm,
      );
      setWpmHistory((prev) => [
        ...prev,
        {
          second: Math.round(elapsedSec),
          wpm: snapWpm,
          raw: snapRaw,
          errors: errorsThisSecondRef.current,
        },
      ]);
      errorsThisSecondRef.current = 0;
    },
    [startTime, mode, words],
  );

  const getLiveWpm = useCallback(
    (activeInputs: string[], activeTyped: string, activeIndex: number) => {
      if (!startTime) {
        return 0;
      }
      const elapsed = (Date.now() - startTime) / 1000;
      const counts = countWpm({
        targetWords: words,
        wordInputs: activeInputs,
        typed: activeTyped,
        wordIndex: activeIndex,
        mode,
        final: false,
      });
      const num = wpmNumeratorFromCounts(counts);
      return Math.round(num / 5 / Math.max(elapsed / 60, 1 / 60));
    },
    [startTime, words, mode],
  );

  const clearWordOrNavigateBack = useCallback(() => {
    if (typed.length > 0) {
      setTyped("");
      const cw = words[wordIndex];
      onKeyHighlight?.(cw && cw.length > 0 ? cw[0] : null);
      setWpm(getLiveWpm(wordInputs, "", wordIndex));
      return;
    }
    if (wordIndex <= 0) {
      return;
    }
    const prevInput = wordInputs[wordIndex - 1];
    const prevWord = words[wordIndex - 1];
    setWordIndex((prev) => prev - 1);
    setTyped(prevInput);
    const nextInputs = wordInputs.slice(0, -1);
    setWordInputs(nextInputs);
    if (prevInput.length < prevWord.length) {
      onKeyHighlight?.(prevWord[prevInput.length]);
    } else {
      onKeyHighlight?.(" ");
    }
    setWpm(getLiveWpm(nextInputs, prevInput, wordIndex - 1));
  }, [typed, wordIndex, wordInputs, words, onKeyHighlight, getLiveWpm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const isAltWordDelete =
        e.altKey &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        (e.key === "Backspace" || e.key === "Delete");
      const isCtrlBackspaceWordNav =
        e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.shiftKey &&
        e.key === "Backspace";

      if (isAltWordDelete || isCtrlBackspaceWordNav) {
        e.preventDefault();
        if (finished) {
          return;
        }
        if (!started) {
          setStarted(true);
          setStartTime(Date.now());
          setShowControls(false);
          onTypingActiveChange?.(true);
        }
        markTypingActive();
        clearWordOrNavigateBack();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        tabPressedRef.current = true;
        setTimeout(() => {
          tabPressedRef.current = false;
        }, 1000);
        return;
      }
      if (e.key === "Enter" && tabPressedRef.current) {
        e.preventDefault();
        tabPressedRef.current = false;
        resetTest();
        return;
      }
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        if (mode === "zen" && started && !finished) {
          finishTest();
        }
        return;
      }

      if (finished) {
        return;
      }

      if (e.key.length > 1 && e.key !== "Backspace") {
        return;
      }

      if (!started) {
        setStarted(true);
        setStartTime(Date.now());
        setShowControls(false);
        onTypingActiveChange?.(true);

        if (mode === "time") {
          let elapsedTicks = 0;
          timerRef.current = setInterval(() => {
            elapsedTicks += 1;
            elapsedSecondsRef.current = elapsedTicks;
            const elapsedMin = elapsedTicks / 60;
            const snapWpm =
              elapsedMin > 0
                ? Math.round(correctCharsRef.current / 5 / elapsedMin)
                : 0;
            const snapRaw =
              elapsedMin > 0
                ? Math.max(
                    Math.round(allTypedRef.current / 5 / elapsedMin),
                    snapWpm,
                  )
                : 0;
            setWpmHistory((prev) => [
              ...prev,
              {
                second: elapsedTicks,
                wpm: snapWpm,
                raw: snapRaw,
                errors: errorsThisSecondRef.current,
              },
            ]);
            errorsThisSecondRef.current = 0;
            if (elapsedTicks >= timeOption) {
              clearInterval(timerRef.current!);
              timerRef.current = null;
              finishTestRef.current?.();
            } else {
              setTimeLeft(timeOption - elapsedTicks);
            }
          }, 1000);
        }
      }

      markTypingActive();

      if (e.key === "Backspace") {
        if (typed.length === 0 && wordIndex > 0) {
          e.preventDefault();
          const prevInput = wordInputs[wordIndex - 1];
          const prevWord = words[wordIndex - 1];
          setWordIndex((prev) => prev - 1);
          setTyped(prevInput);
          const nextInputs = wordInputs.slice(0, -1);
          setWordInputs(nextInputs);
          if (prevInput.length < prevWord.length) {
            onKeyHighlight?.(prevWord[prevInput.length]);
          } else {
            onKeyHighlight?.(" ");
          }
          setWpm(getLiveWpm(nextInputs, prevInput, wordIndex - 1));
        }
        return;
      }
    },
    [
      finished,
      started,
      words,
      wordIndex,
      typed,
      wordInputs,
      mode,
      timeOption,
      resetTest,
      finishTest,
      onKeyHighlight,
      markTypingActive,
      onTypingActiveChange,
      clearWordOrNavigateBack,
      getLiveWpm,
    ],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (finished) {
        return;
      }

      const newValue = e.target.value;
      if (newValue === typed) {
        return;
      }

      if (!started) {
        setStarted(true);
        setStartTime(Date.now());
        setShowControls(false);
        onTypingActiveChange?.(true);

        if (mode === "time") {
          let elapsedTicks = 0;
          timerRef.current = setInterval(() => {
            elapsedTicks += 1;
            elapsedSecondsRef.current = elapsedTicks;
            const elapsedMin = elapsedTicks / 60;
            const snapWpm =
              elapsedMin > 0
                ? Math.round(correctCharsRef.current / 5 / elapsedMin)
                : 0;
            const snapRaw =
              elapsedMin > 0
                ? Math.max(
                    Math.round(allTypedRef.current / 5 / elapsedMin),
                    snapWpm,
                  )
                : 0;
            setWpmHistory((prev) => [
              ...prev,
              {
                second: elapsedTicks,
                wpm: snapWpm,
                raw: snapRaw,
                errors: errorsThisSecondRef.current,
              },
            ]);
            errorsThisSecondRef.current = 0;
            if (elapsedTicks >= timeOption) {
              clearInterval(timerRef.current!);
              timerRef.current = null;
              finishTestRef.current?.();
            } else {
              setTimeLeft(timeOption - elapsedTicks);
            }
          }, 1000);
        }
      }

      markTypingActive();

      const currentWord = words[wordIndex];

      if (newValue.includes(" ")) {
        const spaceIdx = newValue.indexOf(" ");
        const wordTyped = newValue.slice(0, spaceIdx);

        if (wordTyped.length === 0 && typed.length === 0) {
          setTyped("");
          if (inputRef.current) {
            inputRef.current.value = "";
          }
          return;
        }

        allTypedRef.current += 1;

        for (
          let i = 0;
          i < Math.min(wordTyped.length, currentWord.length);
          i++
        ) {
          if (wordTyped[i] !== currentWord[i]) {
            errorsThisSecondRef.current++;
          }
        }
        if (wordTyped.length > currentWord.length) {
          errorsThisSecondRef.current++;
        }

        const nextInputs = [...wordInputs, wordTyped];
        const nextIndex = wordIndex + 1;
        recordWordSnapshot(nextInputs, "", nextIndex);

        if (nextIndex >= words.length) {
          setWordInputs(nextInputs);
          setTyped("");
          if (inputRef.current) {
            inputRef.current.value = "";
          }
          finishTest(nextInputs, wordTyped);
          return;
        }

        setWordInputs(nextInputs);
        setWordIndex(nextIndex);
        setTyped("");
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        onKeyHighlight?.(null);

        requestAnimationFrame(() => {
          if (!activeWordRef.current) {
            return;
          }
          const word = activeWordRef.current;
          const lineH = word.offsetHeight + 4;
          const row = Math.round(word.offsetTop / lineH);
          setRowOffset(Math.max(0, row - 1) * lineH);
        });

        const remaining = newValue.slice(spaceIdx + 1);
        if (remaining.length > 0) {
          setTyped(remaining);
          if (inputRef.current) {
            inputRef.current.value = remaining;
          }
          setWpm(getLiveWpm(nextInputs, remaining, nextIndex));
        } else {
          setWpm(getLiveWpm(nextInputs, "", nextIndex));
        }
        return;
      }

      if (newValue.length > typed.length) {
        const added = newValue.slice(typed.length);
        let tempTyped = typed;

        for (let i = 0; i < added.length; i++) {
          const char = added[i];
          allTypedRef.current += 1;

          const charIndex = tempTyped.length;
          const isWrong =
            charIndex >= currentWord.length || char !== currentWord[charIndex];
          if (isWrong) {
            onWrongKey?.();
          }

          tempTyped += char;

          const isLastWord = wordIndex + 1 >= words.length;
          if (
            isLastWord &&
            tempTyped.length >= currentWord.length &&
            mode !== "time" &&
            mode !== "zen"
          ) {
            for (
              let j = 0;
              j < Math.min(tempTyped.length, currentWord.length);
              j++
            ) {
              if (tempTyped[j] !== currentWord[j]) {
                errorsThisSecondRef.current++;
              }
            }
            if (tempTyped.length > currentWord.length) {
              errorsThisSecondRef.current++;
            }
            const nextInputs = [...wordInputs, tempTyped];
            setWordInputs(nextInputs);
            recordWordSnapshot(nextInputs, "", wordIndex + 1);
            setTyped(tempTyped);
            finishTest(nextInputs, tempTyped);
            return;
          }
        }

        setTyped(newValue);

        const nextCharIndex = newValue.length;
        onKeyHighlight?.(
          nextCharIndex < currentWord.length ? currentWord[nextCharIndex] : " ",
        );
        setWpm(getLiveWpm(wordInputs, newValue, wordIndex));
      } else if (newValue.length < typed.length) {
        const deletedCount = typed.length - newValue.length;
        for (let i = 0; i < deletedCount; i++) {
          const lastIdx = typed.length - 1 - i;
          const isWrong =
            lastIdx >= currentWord.length ||
            typed[lastIdx] !== currentWord[lastIdx];
          if (isWrong) {
            correctedErrorsRef.current += 1;
          }
        }

        setTyped(newValue);

        const nextCharIndex = newValue.length;
        onKeyHighlight?.(
          nextCharIndex < currentWord.length ? currentWord[nextCharIndex] : " ",
        );
        setWpm(getLiveWpm(wordInputs, newValue, wordIndex));
      }
    },
    [
      finished,
      started,
      typed,
      words,
      wordIndex,
      mode,
      timeOption,
      wordInputs,
      onWrongKey,
      recordWordSnapshot,
      finishTest,
      onKeyHighlight,
      markTypingActive,
      onTypingActiveChange,
      getLiveWpm,
    ],
  );

  const handleFocus = () => {
    if (pauseRefocusRef.current) {
      return;
    }
    inputRef.current?.focus();
  };

  const handleInputBlur = useCallback(() => {
    if (pauseRefocusRef.current) {
      return;
    }
    setIsFocused(false);
    onFocusChange?.(false);
  }, [onFocusChange]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    onFocusChange?.(true);
  }, [onFocusChange]);

  const resetSameWords = useCallback(() => {
    setTyped("");
    setWordIndex(0);
    setStarted(false);
    setFinished(false);
    setStartTime(null);
    setWordInputs([]);
    setWpmHistory([]);
    setWpm(0);
    setFrozenStats(null);
    correctCharsRef.current = 0;
    allTypedRef.current = 0;
    errorsThisSecondRef.current = 0;
    elapsedSecondsRef.current = 0;
    correctedErrorsRef.current = 0;
    if (mode === "time") {
      setTimeLeft(timeOption);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRowOffset(0);
    setShowControls(true);
    setIsActivelyTyping(false);
    onFinished?.(false);
    onTypingActiveChange?.(false);
    inputRef.current?.focus();
  }, [mode, timeOption, onFinished, onTypingActiveChange]);

  const handleResultsRestart = useCallback(() => {
    setScreenFade(0);
    if (screenFadeRef.current) {
      clearTimeout(screenFadeRef.current);
    }
    screenFadeRef.current = setTimeout(() => {
      setResetting(true);
      resetSameWords();
      setTimeout(() => setResetting(false), 150);
      requestAnimationFrame(() => setScreenFade(1));
      screenFadeRef.current = null;
    }, 150);
  }, [resetSameWords]);

  const handleResultsNext = useCallback(() => {
    setScreenFade(0);
    if (screenFadeRef.current) {
      clearTimeout(screenFadeRef.current);
    }
    screenFadeRef.current = setTimeout(() => {
      void resetTestImmediate().then(() => {
        requestAnimationFrame(() => setScreenFade(1));
        screenFadeRef.current = null;
      });
    }, 150);
  }, [resetTestImmediate]);

  const onModeChange = useCallback(
    (next: TestMode) => {
      setMode(next);
      localStorage.setItem(TEST_MODE_STORAGE_KEY, next);
      resetTest({ mode: next });
    },
    [resetTest],
  );

  const onTimeOptionChange = useCallback(
    (next: TimeOption) => {
      setTimeOption(next);
      localStorage.setItem(TIME_OPTION_STORAGE_KEY, String(next));
      resetTest({ timeOption: next });
    },
    [resetTest],
  );

  const onWordOptionChange = useCallback(
    (next: WordOption) => {
      setWordOption(next);
      localStorage.setItem(WORD_OPTION_STORAGE_KEY, String(next));
      resetTest({ wordOption: next });
    },
    [resetTest],
  );

  const onQuoteLengthChange = useCallback(
    (next: QuoteLength) => {
      setQuoteLength(next);
      localStorage.setItem(QUOTE_LENGTH_STORAGE_KEY, next);
      resetTest({ quoteLength: next });
    },
    [resetTest],
  );

  const onPunctuationToggle = useCallback(() => {
    const next = !punctuation;
    setPunctuation(next);
    localStorage.setItem(PUNCTUATION_STORAGE_KEY, String(next));
    resetTest({ punctuation: next });
  }, [punctuation, resetTest]);

  const onNumbersToggle = useCallback(() => {
    const next = !numbers;
    setNumbers(next);
    localStorage.setItem(NUMBERS_STORAGE_KEY, String(next));
    resetTest({ numbers: next });
  }, [numbers, resetTest]);

  const onDifficultyToggle = useCallback(
    (d: Difficulty) => {
      const next = difficulty === d ? undefined : d;
      setDifficulty(next);
      if (next) {
        localStorage.setItem(DIFFICULTY_STORAGE_KEY, next);
      } else {
        localStorage.removeItem(DIFFICULTY_STORAGE_KEY);
      }
      resetTest({ difficulty: next });
    },
    [difficulty, resetTest],
  );

  const controlsVisible = !started || showControls;
  const showResults = finished && !!frozenStats;

  return {
    mode,
    timeOption,
    wordOption,
    quoteLength,
    quoteAuthor,
    punctuation,
    numbers,
    difficulty,
    words,
    typed,
    wordIndex,
    started,
    rowOffset,
    finished,
    timeLeft,
    wordInputs,
    showControls,
    isFocused,
    resetting,
    isActivelyTyping,
    screenFade,
    wpm,
    accuracy,
    controlsVisible,
    showResults,
    frozenStats,
    inputRef,
    wordsContainerRef,
    activeWordRef,
    handleKeyDown,
    handleInputChange,
    handleFocus,
    handleInputBlur,
    handleInputFocus,
    handleMouseMove,
    handleResultsRestart,
    handleResultsNext,
    onModeChange,
    onTimeOptionChange,
    onWordOptionChange,
    onQuoteLengthChange,
    onPunctuationToggle,
    onNumbersToggle,
    onDifficultyToggle,
    onRestart: () => resetTest(),
  };
}

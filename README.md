<a name="readme-top"></a>

<img width="1440" alt="TypeForge - typing test with mechanical keyboard sounds" src=".github/images/img_main.png" />

<p align="center">
  <h3 align="center">TypeForge</h3>
  <p align="center">
    A free typing test with realistic mechanical keyboard sounds
    <br />
    <a href="https://typeforge.vercel.app/"><strong>Try it live »</strong></a>
    <br />
    <br />
    <a href="https://typeforge.vercel.app/">Website</a>
    &middot;
    <a href="https://github.com/zas512/typeforge/issues">Issues</a>
    &middot;
    <a href="https://github.com/zas512/typeforge/issues/new?labels=enhancement&template=FEATURE_REQUEST_TEMPLATE.md">Request Feature</a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/zas512">
    <img src="https://custom-icon-badges.demolab.com/badge/made%20by%20-zas512-556bf2?logo=github&logoColor=white&labelColor=101827" alt="Made by zas512">
  </a>
  <a href="https://github.com/zas512/typeforge/stargazers">
    <img src="https://img.shields.io/github/stars/zas512/typeforge?style=flat&logo=github" alt="GitHub Stars">
  </a>
  <a href="https://github.com/zas512/typeforge/forks">
    <img src="https://img.shields.io/github/forks/zas512/typeforge?style=flat" alt="GitHub Forks">
  </a>
  <a href="https://github.com/zas512/typeforge/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/zas512/typeforge?color=dddddd&labelColor=000000" alt="License">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/github/languages/top/zas512/typeforge?&logoColor=%23007ACC&label=TypeScript" alt="Top Language">
  </a>
  <a href="https://github.com/zas512/typeforge/commits/main">
    <img src="https://img.shields.io/github/commit-activity/t/zas512/typeforge?style=flat&logo=github" alt="Commits">
  </a>
  <a href="https://github.com/zas512/typeforge/pulls">
    <img src="https://img.shields.io/github/issues-pr/zas512/typeforge?color=brightgreen&label=PRs" alt="Pull Requests">
  </a>
  <img src="https://img.shields.io/github/deployments/zas512/typeforge/Production?logo=vercel&label=Website" alt="Deployment Status">
</p>

<details>
<summary>Table of Contents</summary>

- [About](#about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [Follow Me](#-follow-me)
- [Deployment](#-deployment)
- [Give A Star](#-give-a-star)
- [Star History](#-star-history)


</details>

## About

**TypeForge** is a free online typing test with **realistic mechanical keyboard sounds** and real-time WPM tracking. Practice with timed tests, word counts, quotes, or zen mode - featuring an interactive on-screen keyboard, satisfying key sounds, and detailed accuracy stats.

## ✨ Features

| Area | What you get |
|------|----------------|
| **Test modes** | Time (15s–120s), word count, quotes (length presets), zen |
| **Mechanical key sounds** | Realistic per-key audio feedback via Web Audio; multiple keyboard themes |
| **Virtual keyboard** | Interactive on-screen keyboard that highlights keys as you type (desktop) |
| **Results** | WPM, raw speed, accuracy, character breakdown, consistency, elapsed time, WPM-over-time chart |
| **Keyboard themes** | 6 color schemes - Classic, Mint, Royal, Dolch, Sand, Scarlet - each tints the entire UI |
| **Typing fonts** | 9 fonts - Geist Mono, JetBrains Mono, Fira Code, IBM Plex Mono, Source Code Pro, Inter Tight, Space Grotesk, Nunito, Atkinson Hyperlegible |
| **Settings** | Theme (light/dark/system), accent color, font picker, show keyboard, sound volume, live WPM, ghost mode |
| **Haptics** | Optional vibration on supported hardware |

Settings persist in `localStorage`.

## 🛠 Tech Stack

<details><summary><b>TypeForge</b> is built using the following technologies:</summary>

- [TypeScript](https://www.typescriptlang.org/): Typed superset of JavaScript.
- [Next.js](https://nextjs.org/) 16: React framework with App Router.
- [React](https://react.dev/) 19: UI library.
- [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework.
- [Base UI](https://base-ui.com/): Unstyled, accessible component primitives from MUI.
- [shadcn/ui](https://ui.shadcn.com/): Pre-styled component recipes.
- [Motion](https://motion.dev/): Animation library for React.
- [Recharts](https://recharts.org/): Composable charting library.
- [Drizzle ORM](https://orm.drizzle.team/) + LibSQL: Type-safe database layer.
- [Biome](https://biomejs.dev/): Fast linter and formatter.
- [Serwist](https://serwist.pages.dev/): PWA / service worker toolkit.
- [Vercel](https://vercel.com/): Deployment platform.

</details><br/>

[![Technologies Used](https://go-skill-icons.vercel.app/api/icons?i=nextjs,react,ts,tailwind,shadcn,framer,drizzle,sqlite,bun,biome,vercel&theme=dark&titles=true)](https://zas512.in)

## 🧰 Getting Started

1. Make sure [Git](https://git-scm.com/downloads) and [Bun](https://bun.sh/) (or Node.js 20+) are installed.
2. Fork this repository and clone **your fork**:

   ```bash
   git clone https://github.com/<your-username>/typeforge.git
   cd typeforge
   ```

3. Install dependencies and start the dev server:

   ```bash
   bun install
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Scripts

| Command | Description |
|--------|-------------|
| `bun dev` | Development server |
| `bun run build` | Optimized production build |
| `bun start` | Serve the production build |
| `bun run lint` | Lint with Biome |
| `bun run lint:fix` | Lint and auto-fix with Biome |
| `bun run format` | Format with Biome |
| `bun run typecheck` | Type-check with TypeScript |

## 🔧 Contributing

[![contributors](https://contrib.rocks/image?repo=zas512/typeforge)](https://github.com/zas512/typeforge/graphs/contributors)

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the repo
2. Create a new branch (`git checkout -b improve-feature`)
3. Make the appropriate changes in the files
4. Commit your changes (`git commit -am 'Improve feature'`)
5. Push to the branch (`git push origin improve-feature`)
6. Create a Pull Request

## 🚀 Follow Me

[![Follow Me](https://img.shields.io/github/followers/zas512?style=social&label=Github&maxAge=2592000)](https://github.com/zas512 "Follow Me")
[![LinkedIn](https://img.shields.io/badge/LinkedIn-zas512-blue?style=flat&logo=linkedin&logoColor=b0c0c0&labelColor=363D44)](https://www.linkedin.com/in/izas512)
[![Tweet about this project](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2Fizas512)](https://twitter.com/intent/tweet?text=Check+out+TypeForge+-+a+typing+test+with+mechanical+keyboard+sounds:&url=https%3A%2F%2Fgithub.com%2Fzas512%2FTypeForge "Tweet about this project")

## 📃 Deployment

| Method                     | Description                              | Action                                                                                                                                                         |
| :------------------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🔧 Manual Build**        | Create an optimized production build.    | `bun run build`                                                                                                                                                |
| **▲ Vercel (Recommended)** | Deploy instantly on the Vercel platform. | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzas512%2FTypeForge)               |
| **🌐 Netlify**             | Deploy easily on Netlify.                | [![Deploy with Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/zas512/typeforge) |

For more details, check the [Next.js deployment docs](https://nextjs.org/docs/deployment).

## ⭐ Give A Star

If you found this project useful, give it a star to help more people discover it!

## 🌟 Star History

<a href="https://star-history.com/#zas512/typeforge&Timeline">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=zas512/typeforge&type=Timeline&theme=dark" />
  <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=zas512/typeforge&type=Timeline" />
  <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=zas512/typeforge&type=Timeline" />
</picture>
</a>

<br />
<p align="right">(<a href="#readme-top">back to top</a>)</p>



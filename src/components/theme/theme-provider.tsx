"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

function ThemeProvider({
  children,
  ...props
}: Readonly<ComponentProps<typeof NextThemesProvider>>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export { ThemeProvider };

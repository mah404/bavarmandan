"use client";

import { useRef } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

// Same page-flow theme transition as the main site's theme toggle (components/layout/toogle-theme.tsx).
export function useThemeFlow() {
  const { resolvedTheme, setTheme } = useTheme();
  const busy = useRef(false);

  const toggleTheme = () => {
    if (busy.current) return;
    const nextTheme = resolvedTheme === "light" ? "dark" : "light";
    const transitionDocument = document as ViewTransitionDocument;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !transitionDocument.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    busy.current = true;
    document.documentElement.classList.add("theme-flow");
    const transition = transitionDocument.startViewTransition(() => {
      flushSync(() => setTheme(nextTheme));
    });
    transition.finished.finally(() => {
      document.documentElement.classList.remove("theme-flow");
      window.setTimeout(() => {
        busy.current = false;
      }, 80);
    });
  };

  return { theme: resolvedTheme, toggleTheme };
}

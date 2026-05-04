"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "../ui/button";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export const ToggleTheme = () => {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  const handleThemeChange = () => {
    if (isTransitioning) return;

    const activeTheme = theme === "system" ? resolvedTheme : theme;
    const nextTheme = activeTheme === "light" ? "dark" : "light";
    const transitionDocument = document as ViewTransitionDocument;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !transitionDocument.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    setIsTransitioning(true);
    document.documentElement.classList.add("theme-flow");

    const transition = transitionDocument.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove("theme-flow");
      timer.current = window.setTimeout(() => {
        setIsTransitioning(false);
      }, 80);
    });
  };

  return (
    <Button
      onClick={handleThemeChange}
      size="sm"
      variant="ghost"
      disabled={isTransitioning}
      aria-label="تغییر حالت رنگ"
      className="w-full justify-start rounded-lg border border-primary/20 bg-background/15 px-4 transition-all duration-300 hover:border-primary/45 hover:bg-primary/10 disabled:opacity-100 lg:size-11 lg:justify-center lg:p-0"
    >
      <div className="flex gap-2 dark:hidden">
        <Moon className="size-5" />
        <span className="block lg:hidden">تاریک</span>
      </div>

      <div className="hidden gap-2 dark:flex">
        <Sun className="size-5" />
        <span className="block lg:hidden">روشن</span>
      </div>

      <span className="sr-only">تغییر حالت رنگ</span>
    </Button>
  );
};

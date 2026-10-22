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
      className="group h-12 w-full justify-center rounded-xl border border-primary/70 bg-card/30 px-4 text-base font-bold transition-all duration-300 hover:border-primary hover:bg-primary/10 dark:border-muted-foreground/60 dark:hover:border-muted-foreground hover:text-primary disabled:opacity-100 lg:size-11 lg:rounded-full lg:border-primary/20 dark:lg:border-primary/20 lg:bg-background/15 lg:p-0 lg:text-sm lg:font-normal lg:hover:border-primary/45"
    >
      <div className="flex items-center gap-2.5 dark:hidden">
        <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/25 transition-all duration-500 group-hover:rotate-[24deg] group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_14px_hsl(var(--primary)/0.45)] lg:size-auto lg:bg-transparent lg:text-inherit lg:ring-0 lg:group-hover:rotate-0 lg:group-hover:scale-100 lg:group-hover:bg-transparent lg:group-hover:text-inherit lg:group-hover:shadow-none">
          <Moon className="size-[18px] lg:size-5" />
        </span>
        <span className="block lg:hidden">تاریک</span>
      </div>

      <div className="hidden items-center gap-2.5 dark:flex">
        <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/25 transition-all duration-500 group-hover:rotate-90 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_14px_hsl(var(--primary)/0.45)] lg:size-auto lg:bg-transparent lg:text-inherit lg:ring-0 lg:group-hover:rotate-0 lg:group-hover:scale-100 lg:group-hover:bg-transparent lg:group-hover:text-inherit lg:group-hover:shadow-none">
          <Sun className="size-[18px] lg:size-5" />
        </span>
        <span className="block lg:hidden">روشن</span>
      </div>

      <span className="sr-only">تغییر حالت رنگ</span>
    </Button>
  );
};

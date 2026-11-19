"use client";

import { useEffect } from "react";

/** The background pattern fades out over the last stretch of the page, so it is gone before the end is reached. */
const FADE_START = 1100; // px from the end of the page where it starts to fade
const FADE_END = 500; // px from the end where it is completely gone

export function PatternFade() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const left = root.scrollHeight - window.innerHeight - window.scrollY;
      const value = Math.min(1, Math.max(0, (left - FADE_END) / (FADE_START - FADE_END)));
      root.style.setProperty("--pattern-o", value.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      root.style.removeProperty("--pattern-o");
    };
  }, []);
  return null;
}

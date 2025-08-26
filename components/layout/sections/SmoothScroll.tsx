"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Respect reduced motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const lenis = new Lenis({
      duration: prefersReduced ? 0.5 : 1.1, // seconds-ish, feel free to tweak
      easing: (t) => 1 - Math.pow(1 - t, 3), // cubic ease-out
      smoothWheel: !prefersReduced,
      touchMultiplier: 1.2,
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Disable native smooth since Lenis handles it
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      document.documentElement.style.scrollBehavior = prev || "";
    };
  }, []);

  return <>{children}</>;
}

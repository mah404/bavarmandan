"use client";

import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";

const SIZE = 34;
const GAP = 14;

/**
 * The page header's icon: a faded watermark in the card. On hover it flies, shrinking, to the spot just left of the
 * title text (the title keeps an empty slot there), so it is one continuous movement. The spot is measured here and
 * handed to the CSS as --ic-x / --ic-y.
 */
export function HeroIcon({ icon: Icon }: { icon: LucideIcon }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hero = ref.current?.closest<HTMLElement>(".ct-hero");
    if (!hero) return;

    const place = () => {
      const anchor = hero.querySelector<HTMLElement>(".ct-title-text");
      const rect = anchor?.getClientRects()[0];
      if (!anchor || !rect) return;
      const box = hero.getBoundingClientRect();
      hero.style.setProperty("--ic-x", `${Math.round(rect.left - box.left - SIZE - GAP)}px`);
      hero.style.setProperty("--ic-y", `${Math.round(rect.top - box.top + (rect.height - SIZE) / 2)}px`);
    };

    place();
    hero.addEventListener("mouseenter", place);
    window.addEventListener("resize", place);
    return () => {
      hero.removeEventListener("mouseenter", place);
      window.removeEventListener("resize", place);
    };
  }, []);

  return (
    <span ref={ref} className="ct-hero-ic" aria-hidden="true">
      <Icon strokeWidth={1.1} />
    </span>
  );
}

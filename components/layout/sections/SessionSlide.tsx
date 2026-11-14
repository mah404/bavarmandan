"use client";

import type { ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { X } from "lucide-react";
import { SheetClose, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MotionItem, MotionList } from "./reveal";

/**
 * The top of a lessons slide: a drifting pattern, the collection's title and subtitle. The close button is the
 * sheet's own (it is moved into place by the «sd-sheet» styles), so closing works exactly as before.
 */
export function SlideHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sd-head">
      <svg className="sd-pat" aria-hidden="true">
        <defs>
          <pattern id="sd-khatam" width="80" height="80" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="20" y="20" width="40" height="40" />
              <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
              <path d="M0 40h11.7M68.3 40H80M40 0v11.7M40 68.3V80" />
            </g>
          </pattern>
        </defs>
        <g>
          <rect width="100%" height="380" fill="url(#sd-khatam)" />
        </g>
      </svg>
      <div className="sd-head-row">
        <div>
          <SheetTitle className="sd-title">{title}</SheetTitle>
          <SheetDescription className="sd-sub">{subtitle ?? ""}</SheetDescription>
        </div>
        <SheetClose className="sd-close" aria-label="بستن">
          <X size={18} strokeWidth={2.2} aria-hidden="true" />
        </SheetClose>
      </div>
    </header>
  );
}

/** The sound-wave bars shown next to «صوت» while that lesson plays (the styles show them only then). */
export function SoundWave() {
  return (
    <span className="sd-eq" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

/** «data-playing» for a session: set while the player is playing the track that belongs to that item. */
export function playingAttr(
  current: { navTarget?: { itemDomId?: string } | null } | null | undefined,
  isPlaying: boolean,
  itemDomId: string
): "" | undefined {
  return isPlaying && current?.navTarget?.itemDomId === itemDomId ? "" : undefined;
}

/**
 * The lessons of one topic. With several lessons they are collapsible rows on a numbered timeline; a topic with a
 * single lesson shows it as one plain card, as before.
 */
export function SessionList({
  multi,
  value,
  onValueChange,
  children,
}: {
  multi: boolean;
  value: string[];
  onValueChange: (value: string[]) => void;
  children: ReactNode;
}) {
  return multi ? (
    <Accordion type="multiple" className="sd-list" value={value} onValueChange={onValueChange}>
      {children}
    </Accordion>
  ) : (
    <MotionList className="sd-list flex flex-col">{children}</MotionList>
  );
}

/** One lesson of a topic: its title and, inside, whatever the lesson holds (the audio card). */
export function SessionRow({
  multi,
  id,
  value,
  node,
  title,
  playing,
  className,
  children,
}: {
  multi: boolean;
  id: string;
  value: string;
  node: string;
  title: ReactNode;
  playing?: "" | undefined;
  className?: string;
  children: ReactNode;
}) {
  if (multi) {
    return (
      <AccordionItem id={id} value={value} className={cn("sd-item scroll-mt-24", className)} data-playing={playing}>
        <span className="sd-node" aria-hidden="true">
          {node}
        </span>
        <div className="sd-card">
          <AccordionTrigger className="sd-toggle">
            <span className="sd-name block flex-1 text-right">{title}</span>
          </AccordionTrigger>
          <AccordionContent className="sd-body">{children}</AccordionContent>
        </div>
      </AccordionItem>
    );
  }
  return (
    <MotionItem id={id} className={cn("sd-item sd-motion scroll-mt-24", className)} data-playing={playing}>
      <div className="sd-card sd-plain">
        <div className="mb-2 text-center font-semibold text-primary">{title}</div>
        {children}
      </div>
    </MotionItem>
  );
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

// A jump can be requested again while the first one is still running (the lists re-render as data arrives): once is enough.
const lastReveal = new Map<string, number>();

/**
 * After a jump from «جدیدترین محتواها»: waits until the item exists (the slide and the lists open one after the other,
 * and the data may still be loading), lets the accordions finish opening, scrolls to it and makes it glow.
 */
export async function revealItem(id: string, { tries = 150, interval = 100, settle = 650 } = {}) {
  const now = Date.now();
  if (now - (lastReveal.get(id) ?? 0) < 6000) return;
  lastReveal.set(id, now);

  for (let attempt = 0; attempt < tries; attempt++) {
    const found = document.getElementById(id);
    if (found) {
      // the glow goes round the whole session (some ids sit on something inside it)
      const target = found.closest<HTMLElement>(".sd-item") ?? found;
      // let the lists above finish opening, so the page is scrolled once, to the final place
      await wait(settle);
      // an open session is taller than the card: show its top (under the fixed header) rather than its middle
      const scroller = target.closest(".sd-sheet");
      const tall = scroller ? target.getBoundingClientRect().height > scroller.clientHeight * 0.6 : false;
      target.style.scrollMarginTop = "130px";
      target.scrollIntoView({ behavior: "smooth", block: tall ? "start" : "center" });
      // the glow starts when the scrolling is nearly done
      await wait(500);
      target.classList.remove("nav-highlight");
      void target.offsetWidth; // so the glow starts over when the same item is reached twice
      target.classList.add("nav-highlight");
      window.setTimeout(() => target.classList.remove("nav-highlight"), 2600);
      return;
    }
    await wait(interval);
  }
}

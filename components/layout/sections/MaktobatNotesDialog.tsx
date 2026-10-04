"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type TouchEvent,
  type WheelEvent,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { FileText, Sparkles } from "lucide-react";
import { highlightToParts, splitNotesParagraphs } from "@/lib/notes-highlight";

type NotesTab = "intro" | "summary";

export type MaktobatNotesDialogData = {
  intro?: string | null;
  summary?: string | null;
  documentTitle: string;
  sessionTitle: string;
};

type MaktobatNotesButtonProps = {
  notes: MaktobatNotesDialogData | null;
  onOpen: (notes: MaktobatNotesDialogData, trigger: HTMLButtonElement) => void;
};

type MaktobatNotesDialogProps = {
  notes: MaktobatNotesDialogData | null;
  trigger: HTMLButtonElement | null;
  onClose: () => void;
};

const isBrowser = typeof window !== "undefined";

function springEasing(stiffness = 240, damping = 22) {
  if (!isBrowser || !CSS.supports?.("animation-timing-function", "linear(0, 1)")) {
    return { easing: "cubic-bezier(.2,1.25,.4,1)", duration: 520 };
  }

  let x = 0;
  let v = 0;
  let t = 0;
  const dt = 1 / 240;
  const points = [0];

  while (t < 2.5) {
    const a = -stiffness * (x - 1) - damping * v;
    v += a * dt;
    x += v * dt;
    t += dt;
    points.push(x);
    if (t > 0.25 && Math.abs(x - 1) < 0.0008 && Math.abs(v) < 0.01) break;
  }

  const step = Math.max(1, Math.floor(points.length / 70));
  const out: number[] = [];
  for (let i = 0; i < points.length; i += step) out.push(Number(points[i].toFixed(4)));
  out.push(1);

  return { easing: `linear(${out.join(",")})`, duration: Math.round(t * 1000) };
}

export function hasMaktobatNotes(notes: MaktobatNotesDialogData | null | undefined) {
  return !!notes?.intro?.trim() || !!notes?.summary?.trim();
}

export function MaktobatNotesButton({ notes, onOpen }: MaktobatNotesButtonProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  if (!hasMaktobatNotes(notes)) return null;

  return (
    <div className="notes-trigger-wrap">
      <button
        ref={triggerRef}
        type="button"
        className="notes-trigger"
        aria-haspopup="dialog"
        onClick={() => {
          if (triggerRef.current && notes) onOpen(notes, triggerRef.current);
        }}
      >
        <span className="notes-trigger-icon">
          <FileText className="size-3.5" />
          <span className="notes-trigger-ping" />
        </span>
        <span className="notes-trigger-label">ملاحظات</span>
      </button>
    </div>
  );
}

export function MaktobatNotesDialog({ notes, trigger, onClose }: MaktobatNotesDialogProps) {
  const introText = (notes?.intro || "").trim();
  const summaryText = (notes?.summary || "").trim();
  const hasIntro = !!introText;
  const hasSummary = !!summaryText;
  const hasBoth = hasIntro && hasSummary;
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<NotesTab>(hasIntro ? "intro" : "summary");
  const [dragY, setDragY] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLElement | null>(null);
  const activeBeforeOpen = useRef<HTMLElement | null>(null);
  const dragStart = useRef({ y: 0, lastY: 0, lastT: 0, velocity: 0 });
  const touchScrollStart = useRef({ y: 0, scrollTop: 0 });

  const reducedMotion = useMemo(
    () =>
      isBrowser
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
    []
  );

  const currentText = activeTab === "intro" ? introText : summaryText;
  const paragraphs = splitNotesParagraphs(currentText);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!notes) return;
    setActiveTab(hasIntro ? "intro" : "summary");
  }, [notes, hasIntro]);

  useLayoutEffect(() => {
    if (!notes || !panelRef.current || !trigger || reducedMotion) return;

    const node = panelRef.current;
    requestAnimationFrame(() => {
      const panelRect = node.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const isSheet = window.matchMedia("(max-width: 600px)").matches;
      if (isSheet) {
        node.animate(
          [
            { transform: "translateY(105%)" },
            { transform: "none" },
          ],
          { ...springEasing(260, 28), fill: "both" }
        );
        return;
      }
      node.animate(
        [
          {
            transform: `translate(${
              triggerRect.left + triggerRect.width / 2 - (panelRect.left + panelRect.width / 2)
            }px,${
              triggerRect.top + triggerRect.height / 2 - (panelRect.top + panelRect.height / 2)
            }px) scale(${triggerRect.width / panelRect.width}, ${
              triggerRect.height / panelRect.height
            })`,
            opacity: 0.4,
            borderRadius: "40px",
          },
          { transform: "none", opacity: 1, borderRadius: "24px" },
        ],
        { ...springEasing(210, 22), fill: "both" }
      );
    });
  }, [notes, trigger, reducedMotion]);

  useEffect(() => {
    if (!notes) return;

    activeBeforeOpen.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLButtonElement>("[data-notes-ok]")?.focus({
        preventScroll: true,
      });
    }, 180);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
      }
      if (event.key === "Tab" && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>("button,[href],[tabindex]:not([tabindex='-1'])")
        ).filter((item) => !item.hasAttribute("disabled"));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  useEffect(() => {
    if (!notes || !panelRef.current) return;

    const items = panelRef.current.querySelectorAll<HTMLElement>("[data-notes-animate]");
    items.forEach((item, index) => {
      if (reducedMotion) return;
      const pop = item.dataset.notesAnimate === "pop";
      const grow = item.dataset.notesAnimate === "grow";
      const spring = springEasing(pop ? 300 : 240, pop ? 14 : 22);
      item.animate(
        pop
          ? [
              { opacity: 0, transform: "scale(.3) rotate(-90deg)" },
              { opacity: 1, transform: "none" },
            ]
          : grow
            ? [
                { opacity: 0, transform: "scaleX(0)" },
                { opacity: 1, transform: "none" },
              ]
            : [
                { opacity: 0, transform: "translateY(12px)", filter: "blur(5px)" },
                { opacity: 1, transform: "none", filter: "blur(0)" },
              ],
        {
          duration: spring.duration,
          easing: spring.easing,
          delay: index * 55,
          fill: "both",
        }
      );
    });
  }, [notes, reducedMotion]);

  useEffect(() => {
    if (!notes || !bodyRef.current || reducedMotion) return;

    const items = bodyRef.current.querySelectorAll<HTMLElement>("[data-notes-animate]");
    items.forEach((item, index) => {
      const spring = springEasing(220, 24);
      item.animate(
        [
          { opacity: 0, transform: "translateY(10px)", filter: "blur(4px)" },
          { opacity: 1, transform: "none", filter: "blur(0)" },
        ],
        {
          duration: Math.min(420, spring.duration),
          easing: spring.easing,
          delay: index * 35,
          fill: "both",
        }
      );
    });
  }, [activeTab, notes, reducedMotion]);

  if (!mounted || !notes || (!hasIntro && !hasSummary)) return null;

  function closeDialog() {
    const panel = panelRef.current;
    if (!panel || !trigger || reducedMotion) {
      onClose();
      window.setTimeout(() => {
        (trigger || activeBeforeOpen.current)?.focus?.({ preventScroll: true });
      }, 0);
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const isSheet = window.matchMedia("(max-width: 600px)").matches;
    const animation = isSheet
      ? panel.animate(
          [
            { transform: `translateY(${dragY || 0}px)`, opacity: 1 },
            { transform: "translateY(105%)", opacity: 1 },
          ],
          { duration: 280, easing: "cubic-bezier(.4,0,.8,.4)" }
        )
      : panel.animate(
          [
            { transform: "none", opacity: 1, borderRadius: "24px" },
            {
              transform: `translate(${
                triggerRect.left + triggerRect.width / 2 - (panelRect.left + panelRect.width / 2)
              }px,${
                triggerRect.top + triggerRect.height / 2 - (panelRect.top + panelRect.height / 2)
              }px) scale(${triggerRect.width / panelRect.width}, ${
                triggerRect.height / panelRect.height
              })`,
              opacity: 0,
              borderRadius: "40px",
            },
          ],
          { duration: 340, easing: "cubic-bezier(.5,0,.2,1)", fill: "both" }
        );

    animation.onfinish = () => {
      setDragY(null);
      onClose();
      window.setTimeout(() => {
        trigger.focus({ preventScroll: true });
        trigger.animate(
          [
            { transform: "scale(.94)" },
            { transform: "none" },
          ],
          springEasing(500, 18)
        );
      }, 0);
    };
  }

  const switchTab = (next: NotesTab) => {
    if (next === activeTab) return;
    const panel = panelRef.current;
    const body = bodyRef.current;
    const startHeight = panel?.offsetHeight;

    const changeTab = () => {
      if (body) body.scrollTop = 0;
      flushSync(() => setActiveTab(next));
      requestAnimationFrame(() => {
        if (!startHeight || !panel || reducedMotion) return;
        panel.animate(
          [
            { height: `${startHeight}px` },
            { height: `${panel.offsetHeight}px` },
          ],
          { duration: 360, easing: "cubic-bezier(.2,1,.4,1)", fill: "none" }
        );
      });
    };

    if (!body || reducedMotion) {
      changeTab();
      return;
    }

    const fadeOut = body.animate(
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "translateY(6px)" },
      ],
      { duration: 120, easing: "ease-out", fill: "both" }
    );

    fadeOut.onfinish = () => {
      changeTab();
      requestAnimationFrame(() => {
        body.animate(
          [
            { opacity: 0, transform: "translateY(10px)", filter: "blur(3px)" },
            { opacity: 1, transform: "none", filter: "blur(0)" },
          ],
          { duration: 280, easing: "cubic-bezier(.2,1,.4,1)", fill: "both" }
        );
      });
    };
  };

  const onPanelWheel = (event: WheelEvent<HTMLDivElement>) => {
    const body = bodyRef.current;
    if (!body) return;

    const maxScroll = body.scrollHeight - body.clientHeight;
    if (maxScroll <= 0) return;

    const nextScroll = Math.min(Math.max(body.scrollTop + event.deltaY, 0), maxScroll);
    if (nextScroll === body.scrollTop) return;

    event.preventDefault();
    body.scrollTop = nextScroll;
  };

  const onBodyTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    const body = bodyRef.current;
    if (!touch || !body) return;

    touchScrollStart.current = {
      y: touch.clientY,
      scrollTop: body.scrollTop,
    };
  };

  const onBodyTouchMove = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    const body = bodyRef.current;
    if (!touch || !body) return;

    const maxScroll = body.scrollHeight - body.clientHeight;
    if (maxScroll <= 0) return;

    const deltaY = touchScrollStart.current.y - touch.clientY;
    const nextScroll = Math.min(
      Math.max(touchScrollStart.current.scrollTop + deltaY, 0),
      maxScroll
    );

    if (nextScroll !== body.scrollTop) {
      event.preventDefault();
      body.scrollTop = nextScroll;
    }
  };

  const onDragStart = (event: PointerEvent<HTMLElement>) => {
    if (!window.matchMedia("(max-width: 600px)").matches) return;
    dragStart.current = {
      y: event.clientY,
      lastY: event.clientY,
      lastT: performance.now(),
      velocity: 0,
    };
    setDragY(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: PointerEvent<HTMLElement>) => {
    if (dragY === null) return;
    const raw = event.clientY - dragStart.current.y;
    const nextY = raw > 0 ? raw : raw / 6;
    const now = performance.now();
    dragStart.current.velocity =
      (event.clientY - dragStart.current.lastY) / Math.max(1, now - dragStart.current.lastT);
    dragStart.current.lastY = event.clientY;
    dragStart.current.lastT = now;
    setDragY(nextY);
  };

  const onDragEnd = () => {
    if (dragY === null) return;
    if (dragY > 120 || dragStart.current.velocity > 0.6) {
      closeDialog();
      return;
    }
    const y = dragY;
    setDragY(null);
    panelRef.current?.animate(
      [
        { transform: `translateY(${y}px)` },
        { transform: "none" },
      ],
      { ...springEasing(320, 24), fill: "both" }
    );
  };

  return createPortal(
    <div className="notes-overlay" role="presentation">
      <button
        type="button"
        className="notes-backdrop"
        aria-label="بستن ملاحظات"
        onClick={closeDialog}
      />
      <div
        ref={panelRef}
        className="notes-panel"
        style={dragY !== null ? { transform: `translateY(${dragY}px)` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="maktobat-notes-title"
        onWheel={onPanelWheel}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="notes-corner notes-corner-tl" aria-hidden="true" />
        <span className="notes-corner notes-corner-tr" aria-hidden="true" />
        <span className="notes-corner notes-corner-bl" aria-hidden="true" />
        <span className="notes-corner notes-corner-br" aria-hidden="true" />

        <svg className="notes-pattern" aria-hidden="true">
          <defs>
            <pattern id="notes-grid-pattern" width="44" height="44" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="13" y="13" width="18" height="18" />
                <rect x="13" y="13" width="18" height="18" transform="rotate(45 22 22)" />
                <path d="M0 22h5M39 22h5M22 0v5M22 39v5" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#notes-grid-pattern)" />
        </svg>

        <div
          className="notes-grab"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        />

        <header className="notes-header">
          <div className="notes-medal" data-notes-animate="pop">
            <Sparkles className="notes-medal-star" />
            <FileText className="notes-medal-icon" />
          </div>
          <h3 id="maktobat-notes-title" data-notes-animate>
            ملاحظات
          </h3>
          <p data-notes-animate>
            {notes.documentTitle} ـ {notes.sessionTitle}
          </p>
          <div className="notes-ornament" data-notes-animate="grow">
            <i />
            <span />
            <i />
          </div>
          {hasBoth ? (
            <div className="notes-tabs" role="tablist" data-notes-animate>
              <span className={`notes-tab-pill ${activeTab === "summary" ? "is-left" : ""}`} />
              <button
                type="button"
                className={`notes-tab ${activeTab === "intro" ? "is-active" : ""}`}
                role="tab"
                aria-selected={activeTab === "intro"}
                onClick={() => switchTab("intro")}
              >
                مقدمه
              </button>
              <button
                type="button"
                className={`notes-tab ${activeTab === "summary" ? "is-active" : ""}`}
                role="tab"
                aria-selected={activeTab === "summary"}
                onClick={() => switchTab("summary")}
              >
                خلاصه
              </button>
            </div>
          ) : null}
        </header>

        <article
          ref={bodyRef}
          className="notes-body"
          onTouchStart={onBodyTouchStart}
          onTouchMove={onBodyTouchMove}
        >
          {paragraphs.map((paragraph, paragraphIndex) => (
            <p key={`${activeTab}-${paragraphIndex}`} data-notes-animate>
              {highlightToParts(paragraph).map((part, index) =>
                part.highlighted ? (
                  <strong key={index} className="font-bold text-primary">
                    {part.text}
                  </strong>
                ) : (
                  <span key={index}>{part.text}</span>
                )
              )}
            </p>
          ))}
        </article>

        <footer className="notes-footer" data-notes-animate>
          <button type="button" className="notes-ok" data-notes-ok onClick={closeDialog}>
            بستن
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

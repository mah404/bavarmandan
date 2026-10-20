"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BellRing, Sparkles } from "lucide-react";

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
    const acceleration = -stiffness * (x - 1) - damping * v;
    v += acceleration * dt;
    x += v * dt;
    t += dt;
    points.push(x);
    if (t > 0.25 && Math.abs(x - 1) < 0.0008 && Math.abs(v) < 0.01) break;
  }

  const step = Math.max(1, Math.floor(points.length / 70));
  const output: number[] = [];
  for (let index = 0; index < points.length; index += step) {
    output.push(Number(points[index].toFixed(4)));
  }
  output.push(1);

  return { easing: `linear(${output.join(",")})`, duration: Math.round(t * 1000) };
}

export function AnnouncementsDialog() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useMemo(
    () =>
      isBrowser
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
    []
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLButtonElement>("[data-announcements-close]")?.focus({
        preventScroll: true,
      });
    }, 180);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!open || !panel || !trigger || reducedMotion) return;

    requestAnimationFrame(() => {
      const panelRect = panel.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const mobile = window.matchMedia("(max-width: 600px)").matches;

      panel.animate(
        mobile
          ? [{ transform: "translateY(105%)" }, { transform: "none" }]
          : [
              {
                transform: `translate(${triggerRect.left + triggerRect.width / 2 - (panelRect.left + panelRect.width / 2)}px,${triggerRect.top + triggerRect.height / 2 - (panelRect.top + panelRect.height / 2)}px) scale(${triggerRect.width / panelRect.width}, ${triggerRect.height / panelRect.height})`,
                opacity: 0.4,
                borderRadius: "40px",
              },
              { transform: "none", opacity: 1, borderRadius: "24px" },
            ],
        { ...springEasing(210, 22), fill: "both" }
      );

      panel.querySelectorAll<HTMLElement>("[data-announcements-animate]").forEach((item, index) => {
        const pop = item.dataset.announcementsAnimate === "pop";
        item.animate(
          pop
            ? [
                { opacity: 0, transform: "scale(.3) rotate(-90deg)" },
                { opacity: 1, transform: "none" },
              ]
            : [
                { opacity: 0, transform: "translateY(12px)", filter: "blur(5px)" },
                { opacity: 1, transform: "none", filter: "blur(0)" },
              ],
          {
            ...springEasing(pop ? 300 : 240, pop ? 14 : 22),
            delay: index * 55,
            fill: "both",
          }
        );
      });
    });
  }, [open, reducedMotion]);

  function closeDialog() {
    const panel = panelRef.current;
    const trigger = triggerRef.current;

    if (!panel || !trigger || reducedMotion) {
      setOpen(false);
      window.setTimeout(() => trigger?.focus({ preventScroll: true }), 0);
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const mobile = window.matchMedia("(max-width: 600px)").matches;
    const animation = panel.animate(
      mobile
        ? [
            { transform: "none", opacity: 1 },
            { transform: "translateY(105%)", opacity: 1 },
          ]
        : [
            { transform: "none", opacity: 1, borderRadius: "24px" },
            {
              transform: `translate(${triggerRect.left + triggerRect.width / 2 - (panelRect.left + panelRect.width / 2)}px,${triggerRect.top + triggerRect.height / 2 - (panelRect.top + panelRect.height / 2)}px) scale(${triggerRect.width / panelRect.width}, ${triggerRect.height / panelRect.height})`,
              opacity: 0,
              borderRadius: "40px",
            },
          ],
      { duration: mobile ? 280 : 340, easing: "cubic-bezier(.5,0,.2,1)", fill: "both" }
    );

    animation.onfinish = () => {
      setOpen(false);
      window.setTimeout(() => trigger.focus({ preventScroll: true }), 0);
    };
  }

  const dialog =
    mounted && open
      ? createPortal(
          <div className="notes-overlay" role="presentation">
            <button
              type="button"
              className="notes-backdrop"
              aria-label="بستن اعلانات و اشارات"
              onClick={closeDialog}
            />
            <div
              ref={panelRef}
              className="notes-panel announcements-panel"
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="announcements-title"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="notes-corner notes-corner-tl" aria-hidden="true" />
              <span className="notes-corner notes-corner-tr" aria-hidden="true" />
              <span className="notes-corner notes-corner-bl" aria-hidden="true" />
              <span className="notes-corner notes-corner-br" aria-hidden="true" />

              <svg className="notes-pattern" aria-hidden="true">
                <defs>
                  <pattern
                    id="announcements-grid-pattern"
                    width="44"
                    height="44"
                    patternUnits="userSpaceOnUse"
                  >
                    <g fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="13" y="13" width="18" height="18" />
                      <rect
                        x="13"
                        y="13"
                        width="18"
                        height="18"
                        transform="rotate(45 22 22)"
                      />
                      <path d="M0 22h5M39 22h5M22 0v5M22 39v5" />
                    </g>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#announcements-grid-pattern)" />
              </svg>

              <div className="notes-grab" aria-hidden="true" />

              <header className="notes-header announcements-header">
                <div className="notes-medal" data-announcements-animate="pop">
                  <Sparkles className="notes-medal-star" />
                  <BellRing className="notes-medal-icon" />
                </div>
                <h3 id="announcements-title" data-announcements-animate>
                  اعلانات و اشارات
                </h3>
                <p data-announcements-animate>اطلاعیه‌ها و مطالب تازه مجمع باورمندان</p>
                <div className="notes-ornament" data-announcements-animate>
                  <i />
                  <span />
                  <i />
                </div>
              </header>

              <article className="notes-body announcements-body">
                <div className="announcements-empty" data-announcements-animate>
                  <BellRing aria-hidden="true" />
                  <p>هنوز اعلانی منتشر نشده است.</p>
                </div>
              </article>

              <footer className="notes-footer" data-announcements-animate>
                <button
                  type="button"
                  className="notes-ok"
                  data-announcements-close
                  onClick={closeDialog}
                >
                  بستن
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="hero-announcements-row" dir="rtl">
        <span className="hero-announcements-line" aria-hidden="true" />
        <button
          ref={triggerRef}
          type="button"
          className="notes-trigger hero-announcements-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span className="notes-trigger-icon">
            <BellRing className="size-3.5" />
            <span className="notes-trigger-ping" />
          </span>
          <span className="notes-trigger-label">اعلانات و اشارات</span>
        </button>
        <span className="hero-announcements-line" aria-hidden="true" />
      </div>
      {dialog}
    </>
  );
}

"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type CalKind = "shamsi" | "gregory";
type EventItem = { title: string; description?: string };
type HijriMonth = { month_number: number; name: string; days: { day: number; events: EventItem[] }[] };

const DAY = 86400000;
// one gentle curve and one soft spring for everything that moves in the calendar
const EASE = [0.4, 0, 0.2, 1] as const;
const SPRING = { type: "spring", stiffness: 300, damping: 32, mass: 0.9 } as const;
const WEEK = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const WEEK_LONG = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const SHAMSI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const GREGORY_MONTHS = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];
const HIJRI_MONTHS = ["محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"];

const CAL_ID: Record<CalKind | "hijri", string> = { shamsi: "persian", gregory: "gregory", hijri: "islamic-civil" };
const formatters: Record<string, Intl.DateTimeFormat> = {};

/** Year, month and day of a date in the given calendar (dates are kept at noon UTC, so no time zone can move them). */
function parts(date: Date, cal: CalKind | "hijri") {
  const id = CAL_ID[cal];
  const fmt =
    formatters[id] ??
    (formatters[id] = new Intl.DateTimeFormat(`en-u-ca-${id}-nu-latn`, {
      timeZone: "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }));
  const out = { year: 0, month: 0, day: 0 };
  for (const part of fmt.formatToParts(date)) {
    if (part.type === "year") out.year = parseInt(part.value, 10);
    else if (part.type === "month") out.month = parseInt(part.value, 10);
    else if (part.type === "day") out.day = parseInt(part.value, 10);
  }
  return out;
}

const fa = (value: number) => value.toLocaleString("fa-IR", { useGrouping: false });
const monthName = (cal: CalKind | "hijri", month: number) =>
  (cal === "shamsi" ? SHAMSI_MONTHS : cal === "gregory" ? GREGORY_MONTHS : HIJRI_MONTHS)[month - 1] ?? "";
const weekday = (date: Date) => (date.getUTCDay() + 1) % 7; // Saturday first
const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime();

function todayNoon() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
}

/** Every day of the month that holds «anchor» in the given calendar. */
function monthDays(cal: CalKind, anchor: Date) {
  let first = anchor;
  for (let i = 0; i < 32 && parts(first, cal).day > 1; i++) first = new Date(first.getTime() - DAY);
  const month = parts(first, cal).month;
  const days: Date[] = [];
  for (let d = first, i = 0; i < 32 && parts(d, cal).month === month; i++, d = new Date(d.getTime() + DAY)) days.push(d);
  return days;
}

/**
 * The lunar date is counted by a fixed rule, which can differ from the sighting of the moon by a day. So the true date of today is
 * asked from persian-calendar.com (Tehran time); the number of days between its answer and the counted date is kept and used for
 * every day shown. The answer is renewed automatically every 3 days (it is kept in the browser until then). If the service does
 * not answer, the last answer (or, without one, the counted dates) is used and the next visit tries again.
 */
const TODAY_API = "https://www.persian-calendar.com/api/today?tz=Asia/Tehran";
const API_STORE_KEY = "shia-calendar-api";
const API_MAX_AGE = 3 * DAY;
let apiOffsetCache: number | null = null;
let apiOffsetAt = 0;
let apiOffsetPromise: Promise<number | null> | null = null;

function readStoredOffset(): { offset: number; at: number } | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(API_STORE_KEY) ?? "null");
    if (saved && Number.isInteger(saved.offset) && Math.abs(saved.offset) <= 3 && typeof saved.at === "number") return saved;
  } catch {}
  return null;
}

function loadApiOffset(): Promise<number | null> {
  const now = Date.now();
  if (apiOffsetCache === null) {
    const stored = readStoredOffset();
    if (stored) {
      apiOffsetCache = stored.offset;
      apiOffsetAt = stored.at;
    }
  }
  // fresh enough (younger than 3 days): no need to ask again
  if (apiOffsetCache !== null && now - apiOffsetAt < API_MAX_AGE) return Promise.resolve(apiOffsetCache);
  if (!apiOffsetPromise) {
    apiOffsetPromise = fetch(TODAY_API)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { gregorian?: { year: number; month: number; day: number }; hijri?: { year: number; month: number; day: number } }) => {
        const g = data.gregorian;
        const h = data.hijri;
        if (!g || !h) return null;
        const base = new Date(Date.UTC(g.year, g.month - 1, g.day, 12));
        for (let k = -3; k <= 3; k++) {
          const counted = parts(new Date(base.getTime() + k * DAY), "hijri");
          if (counted.year === h.year && counted.month === h.month && counted.day === h.day) return k;
        }
        return null;
      })
      .catch(() => null)
      .then((value) => {
        apiOffsetPromise = null;
        if (value === null) return apiOffsetCache; // no answer: keep the last one, ask again next time
        apiOffsetCache = value;
        apiOffsetAt = Date.now();
        try {
          window.localStorage.setItem(API_STORE_KEY, JSON.stringify({ offset: value, at: apiOffsetAt }));
        } catch {}
        return value;
      });
  }
  return apiOffsetPromise;
}

/** The slowly drifting khatam pattern of the lessons slides, as the background of the calendar and of the card of an occasion. */
function ScalPattern({ id }: { id: string }) {
  return (
    <div className="scal-patwrap" aria-hidden="true">
      <svg className="scal-pat">
        <defs>
          <pattern id={id} width="80" height="80" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="20" y="20" width="40" height="40" />
              <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
              <path d="M0 40h11.7M68.3 40H80M40 0v11.7M40 68.3V80" />
            </g>
          </pattern>
        </defs>
        <g>
          <rect width="100%" height="100%" fill={`url(#${id})`} />
        </g>
      </svg>
    </div>
  );
}

/** The text of the book comes with the line breaks of its columns: a blank line starts a new paragraph, a single break is only the end of a printed line. */
const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

/** One occasion: its title and, when the book has one, a faded preview of the description that opens with «بیشتر». */
function EventBlock({ event }: { event: EventItem }) {
  const [open, setOpen] = React.useState(false);
  const reduce = useReducedMotion();
  const description = event.description?.trim();
  const texts = description ? paragraphs(description) : [];
  const move = (delay = 0) => ({ duration: reduce ? 0 : 0.5, ease: EASE, delay: reduce ? 0 : delay });
  return (
    <section className={`scal-ev-item ${open ? "open" : ""}`}>
      <h4 className="scal-ev-title">{event.title}</h4>
      {texts.length ? (
        <>
          <AnimatePresence initial={false}>
            {open ? null : (
              <motion.p
                key="preview"
                className="scal-ev-preview"
                dir="rtl"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto", transition: move() }}
                exit={{ opacity: 0, height: 0, transition: move() }}
              >
                {texts[0]}
              </motion.p>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                key="body"
                className="scal-ev-body"
                style={{ overflow: "hidden" }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto", transition: move() }}
                exit={{ opacity: 0, height: 0, transition: move() }}
              >
                <div className="scal-ev-text" dir="rtl">
                  {texts.map((text, index) => (
                    <motion.p key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={move(0.12 + index * 0.08)}>
                      {text}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="scal-ev-morerow">
            <button type="button" className="scal-ev-more" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              {open ? "کمتر" : "بیشتر"}
              <motion.svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                initial={false}
                animate={{ rotate: open ? 180 : 0 }}
                transition={move()}
              >
                <path d="M2.5 4.5L6 8l3.5-3.5" />
              </motion.svg>
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ShiaCalendar() {
  const reduce = useReducedMotion();
  const [cal, setCal] = React.useState<CalKind>("shamsi");
  const [today, setToday] = React.useState<Date>(todayNoon);
  const [anchor, setAnchor] = React.useState<Date>(today);
  const [selected, setSelected] = React.useState<Date>(today);
  const [showEvents, setShowEvents] = React.useState(false);
  // the days of difference between the counted lunar date and the true one (from the service)
  const [apiOffset, setApiOffset] = React.useState<number>(apiOffsetCache ?? 0);
  const [months, setMonths] = React.useState<HijriMonth[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  // flips with every month / calendar change so that the days animate in again
  const [flip, setFlip] = React.useState(0);
  // the events of the selected day, shown in a small pop-up over the calendar
  const [evOpen, setEvOpen] = React.useState(false);
  React.useEffect(() => {
    const fresh = todayNoon();
    setToday(fresh);
    setAnchor(fresh);
    setSelected(fresh);
  }, []);

  React.useEffect(() => {
    if (!evOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      event.preventDefault();
      setEvOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [evOpen]);

  React.useEffect(() => {
    let alive = true;
    loadApiOffset().then((value) => {
      if (alive && value !== null) setApiOffset(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!showEvents || months || failed) return;
    fetch("/taghvim-shia-daily-events.json")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { months: HijriMonth[] }) => setMonths(data.months))
      .catch(() => setFailed(true));
  }, [showEvents, months, failed]);

  const hijriOf = React.useCallback(
    (date: Date) => parts(new Date(date.getTime() + apiOffset * DAY), "hijri"),
    [apiOffset]
  );
  const eventsOf = React.useCallback(
    (date: Date): EventItem[] => {
      if (!months) return [];
      const h = hijriOf(date);
      return months.find((m) => m.month_number === h.month)?.days.find((d) => d.day === h.day)?.events ?? [];
    },
    [months, hijriOf]
  );

  const days = React.useMemo(() => monthDays(cal, anchor), [cal, anchor]);
  const lead = weekday(days[0]);
  const head = parts(days[0], cal);
  const last = days[days.length - 1];

  const step = (direction: 1 | -1) => {
    setAnchor(direction === 1 ? new Date(last.getTime() + DAY) : new Date(days[0].getTime() - DAY));
    setFlip((value) => value + 1);
    setEvOpen(false);
  };
  const goToday = () => {
    setAnchor(today);
    setSelected(today);
    setFlip((value) => value + 1);
    setEvOpen(false);
  };

  const digits = (value: number) => (cal === "shamsi" ? fa(value) : String(value));
  const sel = { shamsi: parts(selected, "shamsi"), gregory: parts(selected, "gregory"), hijri: hijriOf(selected) };
  const selEvents = eventsOf(selected);

  const rangeOf = (kind: CalKind | "hijri") => {
    const a = kind === "hijri" ? hijriOf(days[0]) : parts(days[0], kind);
    const b = kind === "hijri" ? hijriOf(last) : parts(last, kind);
    const label = (p: { year: number; month: number }) => `${monthName(kind, p.month)} ${kind === "gregory" ? p.year : fa(p.year)}`;
    return a.month === b.month ? label(a) : `${label(a)} – ${label(b)}`;
  };

  return (
    <div className="scal-body" dir="rtl">
      <div className={`scal-seg ${cal === "gregory" ? "is-miladi" : ""}`} role="tablist" aria-label="نوع تقویم">
        {(["shamsi", "gregory"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={cal === kind}
            className={cal === kind ? "active" : ""}
            onClick={() => {
              setCal(kind);
              setAnchor(selected);
              setFlip((value) => value + 1);
              setEvOpen(false);
            }}
          >
            {cal === kind ? <motion.span layoutId="scal-seg-thumb" className="scal-thumb" transition={reduce ? { duration: 0 } : SPRING} aria-hidden="true" /> : null}
            <span className="scal-seg-label">{kind === "shamsi" ? "تقویم شمسی" : "تقویم میلادی"}</span>
          </button>
        ))}
      </div>

      <div className="scal-nav">
        <button type="button" className="scal-arrow prev" aria-label="ماه قبل" onClick={() => step(-1)}>
          <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        <div className="scal-month">
          <motion.strong
            key={`${cal}-${head.year}-${head.month}`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
          >
            {monthName(cal, head.month)} {digits(head.year)}
          </motion.strong>
          <span>
            {cal === "shamsi" ? "میلادی" : "شمسی"}: {rangeOf(cal === "shamsi" ? "gregory" : "shamsi")} · قمری: {rangeOf("hijri")}
          </span>
        </div>
        <button type="button" className="scal-arrow next" aria-label="ماه بعد" onClick={() => step(1)}>
          <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <div className="scal-rule" aria-hidden="true" />

      <motion.div
        key={flip}
        className="scal-grid"
        role="grid"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
      >
        {WEEK.map((name, index) => (
          <span key={name} className={`scal-wd ${index === 6 ? "friday" : ""}`}>
            {name}
          </span>
        ))}
        {Array.from({ length: lead }, (_, index) => (
          <span key={`e${index}`} className="scal-blank" aria-hidden="true" />
        ))}
        {days.map((date) => {
          const p = parts(date, cal);
          const hasEvent = showEvents && eventsOf(date).length > 0;
          return (
            <button
              key={date.getTime()}
              type="button"
              className={`scal-day ${weekday(date) === 6 ? "friday" : ""} ${sameDay(date, selected) ? "today" : ""} ${hasEvent ? "has-event" : ""}`}
              aria-label={`${digits(p.day)} ${monthName(cal, p.month)}`}
              aria-pressed={sameDay(date, selected)}
              onClick={() => {
                setSelected(date);
                setEvOpen(showEvents && (!months || eventsOf(date).length > 0));
              }}
            >
              {sameDay(date, selected) ? <motion.span layoutId="scal-pick" className="scal-pick" transition={reduce ? { duration: 0 } : SPRING} aria-hidden="true" /> : null}
              <span className="n">{digits(p.day)}</span>
              <span className="h">{fa(hijriOf(date).day)}</span>
            </button>
          );
        })}
      </motion.div>

      <div className="scal-bar">
        <button
          type="button"
          className={`scal-bt scal-gold ${showEvents ? "on" : ""}`}
          aria-pressed={showEvents}
          onClick={() => {
            setShowEvents((value) => !value);
            setEvOpen(false);
          }}
        >
          <span className="scal-dot" aria-hidden="true" />
          {showEvents ? "پنهان کردن مناسبت‌ها" : "نمایش مناسبت‌های شیعی"}
        </button>
        <button type="button" className="scal-bt scal-today" onClick={goToday}>
          امروز
        </button>
      </div>

      <AnimatePresence>
        {evOpen ? (
          <motion.div
            key="evlayer"
            className="scal-evlayer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setEvOpen(false);
            }}
          >
            <motion.div
              className="scal-ev"
              role="dialog"
              aria-label="مناسبت‌های این روز"
              initial={reduce ? false : { opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97, transition: { duration: reduce ? 0 : 0.35, ease: EASE } }}
              transition={reduce ? { duration: 0 } : SPRING}
            >
            <ScalPattern id="scal-khatam-ev" />
            <header className="scal-ev-head">
              <span className="scal-ev-med" aria-hidden="true">
                <svg viewBox="0 0 76 76">
                  <g fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1.4">
                    <rect x="15" y="15" width="46" height="46" rx="3" />
                    <rect x="15" y="15" width="46" height="46" rx="3" transform="rotate(45 38 38)" />
                  </g>
                </svg>
                <b>{fa(sel.hijri.day)}</b>
              </span>
              <div className="scal-ev-hd">
                <strong className="scal-ev-month scal-gt">{monthName("hijri", sel.hijri.month)}</strong>
                <small>مناسبت</small>
              </div>
              <button type="button" className="scal-ev-x" aria-label="بستن" onClick={() => setEvOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              </button>
            </header>
            <div className="scal-ev-rule" />
            <div className="scal-ev-list">
              {failed ? (
                <p className="scal-note">بارگذاری مناسبت‌ها ممکن نشد.</p>
              ) : !months ? (
                <p className="scal-note">در حال بارگذاری مناسبت‌ها…</p>
              ) : selEvents.length ? (
                selEvents.map((event, index) => <EventBlock key={`${selected.getTime()}-${index}`} event={event} />)
              ) : (
                <p className="scal-note">برای این روز مناسبتی ثبت نشده است.</p>
              )}
            </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.section
        key={selected.getTime()}
        className="scal-card"
        aria-live="polite"
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
      >
        <small style={{ visibility: sameDay(selected, today) ? "visible" : "hidden" }}>امروز</small>
        <h3>
          {WEEK_LONG[weekday(selected)]} {fa(sel.shamsi.day)} {monthName("shamsi", sel.shamsi.month)} {fa(sel.shamsi.year)}
        </h3>
        <p>
          {sel.gregory.day} {monthName("gregory", sel.gregory.month)} {sel.gregory.year} میلادی
          <span aria-hidden="true"> · </span>
          {fa(sel.hijri.day)} {monthName("hijri", sel.hijri.month)} {fa(sel.hijri.year)} قمری
        </p>
      </motion.section>
    </div>
  );
}

/** The «تقویم شیعی» button of the navigation bar and the pop-up it opens. */
export function ShiaCalendarButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const reduce = useReducedMotion();
  // on a phone the calendar is a sheet that comes from the bottom
  const sheet = open && typeof window !== "undefined" && window.matchMedia("(max-width: 520px)").matches;
  const [dayNumber, setDayNumber] = React.useState("");

  // the number of today (shamsi) is read in the browser, so the server and the browser never disagree
  React.useEffect(() => {
    setDayNumber(fa(parts(todayNoon(), "shamsi").day));
    void loadApiOffset();
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={`scal-nav-btn ${className}`} aria-label="تقویم شیعی">
          <span className="scal-nav-cal" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="4" y="6" width="22" height="20" rx="5" />
              <path d="M4 12h22M10 3v5M20 3v5" />
            </svg>
            <b>{dayNumber}</b>
          </span>
          تقویم شیعی
        </button>
      </Dialog.Trigger>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="scal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              // a click on the empty space around the panel closes it, like a click on the dark backdrop
              onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
            >
              <div className="scal-wrap">
                <motion.div
                  className="scal-panel"
                  initial={reduce ? false : sheet ? { y: "100%" } : { opacity: 0, y: 26, scale: 0.97 }}
                  animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={
                    sheet
                      ? { y: "100%", transition: { duration: reduce ? 0 : 0.5, ease: EASE } }
                      : { opacity: 0, y: 18, scale: 0.98, transition: { duration: reduce ? 0 : 0.4, ease: EASE } }
                  }
                  transition={reduce ? { duration: 0 } : sheet ? { duration: 0.55, ease: EASE } : SPRING}
                >
            <span className="scal-grab" aria-hidden="true" />
            <header className="scal-head" dir="rtl">
              <div className="scal-title">
                {/* an eight-pointed star that turns slowly, with a crescent (the new moon of the lunar months) and a twinkling star inside */}
                <svg width="36" height="36" viewBox="0 0 76 76" fill="none" aria-hidden="true" className="scal-star">
                  <defs>
                    <mask id="scal-moon-mask">
                      <rect width="76" height="76" fill="#fff" />
                      <circle cx="46" cy="33" r="11.5" fill="#000" />
                    </mask>
                  </defs>
                  <g className="scal-star-ring" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
                    <rect x="13" y="13" width="50" height="50" rx="4" />
                    <rect x="13" y="13" width="50" height="50" rx="4" transform="rotate(45 38 38)" />
                  </g>
                  <circle className="scal-star-moon" cx="37" cy="39" r="13.5" fill="currentColor" mask="url(#scal-moon-mask)" />
                  <path
                    className="scal-star-spark"
                    d="M50 22.5l1.5 4.2 4.2 1.5-4.2 1.5-1.5 4.2-1.5-4.2-4.2-1.5 4.2-1.5z"
                    fill="currentColor"
                  />
                </svg>
                <Dialog.Title className="scal-gt">تقویم شیعی</Dialog.Title>
              </div>
              <Dialog.Close className="scal-x" aria-label="بستن">
                <X size={18} aria-hidden="true" />
              </Dialog.Close>
            </header>
            <ShiaCalendar />
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

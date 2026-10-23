"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import "flag-icons/css/flag-icons.min.css";
import { TIME_ZONES, type TimeZoneName } from "@/lib/analytics-zones";
import { BarChart3 } from "lucide-react";
import { ContentShell } from "./ContentShell";
import { HeroIcon } from "./HeroIcon";
import { BarsChart, VisitsLine } from "./AnalyticsCharts";
import "./analytics.css";

const RANGES = [1, 7, 30, 90] as const;
// Saturday first, as the week starts in Iran.
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

interface Row {
  name: string;
  n: number;
}

interface EventRow {
  name: string;
  label: string;
  visitors: number;
  total: number;
}

interface Stats {
  range: number;
  /** Oldest first. */
  days: Array<{ day: string; visitors: number }>;
  /** True for the last 24 hours: each point of `days` is then an hour ("YYYY-MM-DD HH"), not a day. */
  hourly: boolean;
  hours: number[];
  /** First day the hourly numbers cover (they are recorded live only), or null when none is. */
  hoursFrom: string | null;
  pageViews: number;
  visitors: number;
  bounceRate: number;
  /** Visitors of the days before this range, or null when they are not known. */
  previousVisitors: number | null;
  /** How many days of this range come from the numbers saved from the hosting dashboard, and the last such day. */
  savedDays: number;
  /** How many hours of the last 24 come from the numbers saved from the hosting dashboard. */
  savedHours: number;
  savedUntil: string;
  pages: Row[];
  referrers: Row[];
  utm: Row[];
  countries: Row[];
  devices: Row[];
  browsers: Row[];
  systems: Row[];
  events: EventRow[];
}

const fa = (value: number) => Math.round(value).toLocaleString("fa-IR");
/** A point of the 24-hour chart ("2026-10-23 05") as an hour of the day. */
const hourLabel = (key: string) => `${Number(key.slice(11, 13)).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}:۰۰`;
/** "2026-10-23" as a date on the Persian calendar. Noon UTC keeps the day the same in any time zone. */
const atNoon = (day: string) => new Date(`${day}T12:00:00Z`).getTime();
type Calendar = "jalali" | "gregorian";
/** Persian month and weekday names on either calendar (digits stay Persian). */
const dateIn = (calendar: Calendar) => (day: string, options: Intl.DateTimeFormatOptions) =>
  new Date(atNoon(day)).toLocaleDateString(calendar === "jalali" ? "fa-IR" : "fa-IR-u-ca-gregory", { ...options, timeZone: "UTC" });

const remember = (key: string, fallback: string) => {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const DEVICES: Record<string, string> = { mobile: "موبایل", tablet: "تبلت", desktop: "دسکتاپ" };
const EVENTS: Array<[string, string]> = [
  ["audio_play", "پخش صوت"],
  ["pdf_download", "دانلود PDF"],
  ["pdf_view", "مشاهدهٔ PDF"],
  ["audio_download", "دانلود صوت"],
];

const countryNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["fa"], { type: "region" }) : null;
/** The country's flag (from the flag-icons package, so it also shows on Windows) and its Persian name. */
function countryLabel(code: string): ReactNode {
  let name = code;
  try {
    name = countryNames?.of(code) ?? code;
  } catch {
    /* an unknown code is shown as it is */
  }
  return (
    <>
      {/^[A-Z]{2}$/.test(code) ? <span className={`fi fi-${code.toLowerCase()} an-flag`} aria-hidden="true" /> : null}
      {name}
    </>
  );
}

function pageLabel(path: string) {
  if (path === "/") return "صفحهٔ اول";
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

interface Tab {
  id: string;
  title: string;
  rows: Array<{ key: string; name: ReactNode; value: number; shown: string }>;
}

/** One card with tabs and rows that have a bar behind them, like the lists on the hosting dashboard. */
function Breakdown({ title, unit, tabs }: { title: string; unit: string; tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((item) => item.id === active) ?? tabs[0];
  const max = Math.max(1, ...tab.rows.map((row) => row.value));

  return (
    <section className="an-box an-break">
      <header>
        <h2>{title}</h2>
        <div className="an-tabs" role="tablist">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={item.id === tab.id} className={item.id === tab.id ? "on" : ""} onClick={() => setActive(item.id)}>
              {item.title}
            </button>
          ))}
        </div>
        <span className="unit">{unit}</span>
      </header>
      {tab.rows.length ? (
        <ul className="an-rows">
          {tab.rows.map((row) => (
            <li key={row.key} style={{ ["--w" as string]: `${(row.value / max) * 100}%` }}>
              <span className="t">{row.name}</span>
              <b>{row.shown}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="an-none">هنوز چیزی ثبت نشده</p>
      )}
    </section>
  );
}

export function AnalyticsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [calendar, setCalendar] = useState<Calendar>("jalali");
  const [zone, setZone] = useState<TimeZoneName>("Asia/Tehran");
  const faDate = dateIn(calendar);
  const hourText = hourLabel;

  // What the viewer chose last time (read after the first render, so the page and the server agree).
  useEffect(() => {
    const savedCalendar = remember("an_calendar", "jalali");
    const savedZone = remember("an_zone", "Asia/Tehran");
    if (savedCalendar === "gregorian") setCalendar("gregorian");
    if (savedZone in TIME_ZONES) setZone(savedZone as TimeZoneName);
  }, []);
  const choose = <T extends string>(key: string, set: (value: T) => void, value: T) => {
    set(value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* the choice just is not remembered */
    }
  };
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    fetch(`/api/admin/analytics?range=${range}&tz=${encodeURIComponent(zone)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.href = "/api/admin/session-expired";
          return null;
        }
        if (!response.ok) throw new Error("unavailable");
        return (await response.json()) as Stats;
      })
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setError("آمار از پایگاه‌داده خوانده نشد. چند لحظه بعد دوباره امتحان کنید.");
      });
    return () => {
      cancelled = true;
    };
  }, [range, zone]);

  const derived = useMemo(() => {
    if (!stats) return null;
    const days = stats.days;
    const peak = days.reduce((best, day) => (day.visitors > best.visitors ? day : best), days[0]);
    const sum = days.reduce((total, day) => total + day.visitors, 0);
    const byWeekday = WEEKDAYS.map((_, weekday) => {
      if (stats.hourly) return 0;
      const same = days.filter((day) => (new Date(atNoon(day.day)).getUTCDay() + 1) % 7 === weekday);
      return same.length ? same.reduce((total, day) => total + day.visitors, 0) / same.length : 0;
    });
    return {
      peak,
      byWeekday,
      sum,
      byHour: stats.hours.map((value) => value / stats.range),
      change: stats.previousVisitors ? Math.round(((sum - stats.previousVisitors) / stats.previousVisitors) * 100) : null,
    };
  }, [stats]);

  // The texts of the charts. Kept in one place (and the same arrays while nothing changes) so the charts are not rebuilt for no reason.
  const charts = useMemo(() => {
    const format = dateIn(calendar);
    const hourly = Boolean(stats?.hourly);
    const days = stats?.days ?? [];
    const label = (key: string) => (hourly ? hourLabel(key) : format(key, { day: "numeric", month: "long" }));
    const title = (key: string) => (hourly ? `${hourLabel(key)} · ${format(key.slice(0, 10), { day: "numeric", month: "long" })}` : format(key, { weekday: "long", day: "numeric", month: "long" }));
    return {
      labels: days.map((day) => label(day.day)),
      titles: days.map((day) => title(day.day)),
      values: days.map((day) => day.visitors),
      hourLabels: Array.from({ length: 24 }, (_, hour) => fa(hour)),
      hourTitles: Array.from({ length: 24 }, (_, hour) => `ساعت ${fa(hour)} تا ${fa(hour + 1)}`),
      weekdayTitles: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"],
    };
  }, [stats, calendar]);

  const shell = (children: React.ReactNode) => (
    <ContentShell crumbs={[{ label: "پیشخوان", href: "/admin/dashboard" }, { label: "آمار بازدید سایت" }]}>{children}</ContentShell>
  );

  if (!stats || !derived) {
    return shell(<p className="an-state">{error || "در حال خواندن آمار…"}</p>);
  }

  const share = (n: number) => `${fa(stats.visitors ? (n / stats.visitors) * 100 : 0)}٪`;
  const visitorRows = (rows: Row[], label: (name: string) => ReactNode): Tab["rows"] => rows.map((row) => ({ key: row.name, name: label(row.name), value: row.n, shown: share(row.n) }));
  const countRows = (rows: Row[], label: (name: string) => string): Tab["rows"] => rows.map((row) => ({ key: row.name, name: label(row.name), value: row.n, shown: fa(row.n) }));
  const eventTabs: Tab[] = EVENTS.map(([id, title]) => ({
    id,
    title,
    rows: stats.events
      .filter((event) => event.name === id)
      .slice(0, 10)
      .map((event) => ({ key: `${event.name}:${event.label}`, name: event.label || "بدون نام", value: event.total, shown: `${fa(event.total)}` })),
  }));

  const count = stats.days.length;
  const bestWeekday = derived.byWeekday.indexOf(Math.max(...derived.byWeekday));
  const bestHour = derived.byHour.indexOf(Math.max(...derived.byHour));
  const empty = stats.pageViews === 0 && derived.sum === 0;
  const noHours = stats.hours.every((value) => value === 0);

  return shell(
    <>
      <section className="ct-hero rise">
        <HeroIcon icon={BarChart3} />
        <div className="ct-hero-txt">
          <h1>
            <span className="ct-title-text">آمار بازدید سایت</span>
            <span className="ct-title-gap" aria-hidden="true" />
          </h1>
          <p>
            {stats.hourly ? "۲۴ ساعت گذشته" : `بازهٔ ${fa(stats.range)} روز گذشته`} · تا {faDate(stats.days[stats.days.length - 1].day.slice(0, 10), { day: "numeric", month: "long" })}
          </p>
        </div>
        <span className="an-live">زنده · به وقت {TIME_ZONES[zone]}</span>
      </section>

      <div className="an-head">
        <div className="an-tools">
          <div className="an-range" role="tablist" aria-label="تقویم">
            <button type="button" role="tab" aria-selected={calendar === "jalali"} className={calendar === "jalali" ? "on" : ""} onClick={() => choose("an_calendar", setCalendar, "jalali")}>
              شمسی
            </button>
            <button type="button" role="tab" aria-selected={calendar === "gregorian"} className={calendar === "gregorian" ? "on" : ""} onClick={() => choose("an_calendar", setCalendar, "gregorian")}>
              میلادی
            </button>
          </div>
          <label className="an-zone">
            <span>ساعت</span>
            <select value={zone} onChange={(event) => choose("an_zone", setZone, event.target.value as TimeZoneName)}>
              {(Object.keys(TIME_ZONES) as TimeZoneName[]).map((name) => (
                <option key={name} value={name}>
                  {TIME_ZONES[name]}
                </option>
              ))}
            </select>
          </label>
        <div className="an-range" role="tablist" aria-label="بازهٔ زمانی">
          {RANGES.map((value) => (
            <button key={value} type="button" role="tab" aria-selected={range === value} className={range === value ? "on" : ""} onClick={() => setRange(value)}>
              {value === 1 ? "۲۴ ساعت" : `${fa(value)} روز`}
            </button>
          ))}
        </div>
        </div>
      </div>

      {error ? <p className="an-state warn">{error}</p> : null}
      {stats.savedHours ? (
        <p className="an-state">{fa(stats.savedHours)} ساعت از این بازه از آمار قبلی هاست آمده (خوانده‌شده از روی نمودار) و ساعت‌های بعد از آن از ثبت زنده می‌آیند.</p>
      ) : null}
      {stats.savedDays ? (
        <p className="an-state">
          {fa(stats.savedDays)} روز از این بازه از آمار قبلی هاست (تا {faDate(stats.savedUntil, { day: "numeric", month: "long" })}) آمده که از روی نمودار آن خوانده شده و ممکن است یکی‌دو عدد اختلاف داشته باشد. ساعت‌ها فقط از ثبت زنده می‌آیند.
        </p>
      ) : null}
      {empty ? <p className="an-state">هنوز بازدیدی در این بازه ثبت نشده است. بازدیدها از لحظهٔ انتشار این نسخه روی سایت اصلی ثبت می‌شوند (روی رایانهٔ توسعه ثبت نمی‌شوند).</p> : null}

      <div className="an-stats">
        <div className="an-stat">
          <span>بازدیدکننده</span>
          <b>{fa(stats.visitors)}</b>
          {derived.change === null ? (
            <small>بازهٔ قبل داده‌ای ندارد</small>
          ) : (
            <small className={derived.change >= 0 ? "up" : "down"}>
              {derived.change >= 0 ? "▲" : "▼"} {fa(Math.abs(derived.change))}٪ نسبت به بازهٔ قبل
            </small>
          )}
        </div>
        <div className="an-stat">
          <span>بازدید صفحه</span>
          <b>{fa(stats.pageViews)}</b>
          <small>هر صفحه‌ای که باز شده</small>
        </div>
        <div className="an-stat">
          <span>نرخ پرش</span>
          <b>{fa(stats.bounceRate)}٪</b>
          <small>فقط یک صفحه دیده‌اند</small>
        </div>
        <div className="an-stat">
          <span>{stats.hourly ? "پربازدیدترین ساعت" : "پربازدیدترین روز"}</span>
          <b>{fa(derived.peak.visitors)}</b>
          <small className="gold">{stats.hourly ? `${hourText(derived.peak.day)} · ${faDate(derived.peak.day.slice(0, 10), { day: "numeric", month: "long" })}` : faDate(derived.peak.day, { weekday: "long", day: "numeric", month: "long" })}</small>
        </div>
      </div>

      <section className="an-box">
        <header>
          <h2>{stats.hourly ? "بازدید ساعتی" : "بازدید روزانه"}</h2>
          <span>{stats.hourly ? "بازدیدکننده در هر ساعت" : "بازدیدکننده در هر روز"} · میانگین {(derived.sum / Math.max(1, count)).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}</span>
        </header>
        <div className="an-chart">
          <VisitsLine labels={charts.labels} titles={charts.titles} values={charts.values} unit={stats.hourly ? "بازدیدکننده در این ساعت" : "بازدیدکننده"} tone="blue" />
        </div>
      </section>

      {stats.hourly ? null : (
      <div className="an-two">
        <section className="an-box">
          <header>
            <h2>ساعت‌های بازدید</h2>
            <span>{noHours ? "هنوز ساعتی ثبت نشده" : `بیشترین بازدید حدود ساعت ${fa(bestHour)} تا ${fa(bestHour + 1)}`}</span>
          </header>
          <div className="an-bars">
            <BarsChart labels={charts.hourLabels} titles={charts.hourTitles} values={derived.byHour} unit="بازدید در این ساعت (میانگین روزانه)" peak={noHours ? -1 : bestHour} labelEvery={3} tone="violet" />
          </div>
        </section>

        <section className="an-box">
          <header>
            <h2>روزهای هفته</h2>
            <span>میانگین بازدیدکننده</span>
          </header>
          <div className="an-bars">
            <BarsChart labels={WEEKDAYS} titles={charts.weekdayTitles} values={derived.byWeekday} unit="بازدیدکننده (میانگین)" peak={empty ? -1 : bestWeekday} tone="green" />
          </div>
        </section>
      </div>
      )}

      <div className="an-grid3">
        <Breakdown
          title="صفحه‌ها و منابع"
          unit="بازدید"
          tabs={[
            { id: "pages", title: "صفحه‌ها", rows: countRows(stats.pages, pageLabel) },
            { id: "ref", title: "منبع ورود", rows: countRows(stats.referrers, (name) => name || "مستقیم") },
            { id: "utm", title: "UTM", rows: countRows(stats.utm, (name) => name) },
          ]}
        />
        <Breakdown title="کشورها" unit="بازدیدکننده" tabs={[{ id: "country", title: "کشورها", rows: visitorRows(stats.countries, countryLabel) }]} />
        <Breakdown
          title="دستگاه‌ها"
          unit="بازدیدکننده"
          tabs={[
            { id: "device", title: "دستگاه", rows: visitorRows(stats.devices, (name) => DEVICES[name] ?? name) },
            { id: "browser", title: "مرورگر", rows: visitorRows(stats.browsers, (name) => name) },
            { id: "os", title: "سیستم‌عامل", rows: visitorRows(stats.systems, (name) => name) },
          ]}
        />
      </div>

      <Breakdown title="رویدادها" unit="تعداد" tabs={eventTabs} />
    </>
  );
}

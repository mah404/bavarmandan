/*
 * Numbers from before visits were recorded here, copied by hand from screenshots of the hosting dashboard's own
 * analytics (taken on 23 Oct 2026). They are shown together with the live numbers:
 *   - the days up to HISTORY_UNTIL come from here, the days after it from the live records, so nothing is counted twice;
 *   - the daily numbers were read off the chart line, so they can be off by one or so;
 *   - the lists (pages, countries, …) exist only as totals for a whole period, so a range gets a share of them
 *     in proportion to the visitors of the days it covers.
 * Visitors are counted per day, as the hosting dashboard does.
 */

/** The last day taken from here. Later days are live. */
export const HISTORY_UNTIL = "2026-10-22";

/** Visitors per day, 23 Sep – 22 Oct 2026 (Iran/Berlin day, they differ by at most a few hours). */
export const HISTORY_DAILY: Record<string, number> = {
  "2026-09-23": 4,
  "2026-09-24": 8,
  "2026-09-25": 16,
  "2026-09-26": 9,
  "2026-09-27": 9,
  "2026-09-28": 4,
  "2026-09-29": 11,
  "2026-09-30": 7,
  "2026-10-01": 13,
  "2026-10-02": 13,
  "2026-10-03": 7,
  "2026-10-04": 10,
  "2026-10-05": 13,
  "2026-10-06": 7,
  "2026-10-07": 7,
  "2026-10-08": 11,
  "2026-10-09": 6,
  "2026-10-10": 3,
  "2026-10-11": 4,
  "2026-10-12": 5,
  "2026-10-13": 5,
  "2026-10-14": 2,
  "2026-10-15": 4,
  "2026-10-16": 6,
  "2026-10-17": 6,
  "2026-10-18": 5,
  "2026-10-19": 6,
  "2026-10-20": 7,
  "2026-10-21": 11,
  "2026-10-22": 12,
};

type Pairs = Array<[string, number]>;

export interface HistorySnapshot {
  /** The first and last day it describes. */
  from: string;
  to: string;
  visitors: number;
  pageViews: number;
  bounceRate: number;
  /** Counts. Where the dashboard gave a percentage, it is turned into a count of the period's visitors. */
  pages: Pairs;
  referrers: Pairs;
  countries: Pairs;
  devices: Pairs;
  systems: Pairs;
}

/** 23 Sep – 22 Oct. Dashboard pages and the hosting site itself ("vercel.com", the owner's own clicks) are left out. */
export const SNAPSHOT_30: HistorySnapshot = {
  from: "2026-09-23",
  to: "2026-10-22",
  visitors: 221,
  pageViews: 704,
  bounceRate: 48,
  pages: [
    ["/", 208],
    ["/taghvim-shia", 14],
  ],
  referrers: [
    ["google.com", 24],
    ["youtube.com", 8],
    ["virasty.com", 3],
    ["com.google.android.googlequicksearchbox", 2],
    ["facebook.com", 2],
    ["instagram.com", 1],
  ],
  countries: [
    ["US", 93],
    ["DE", 53],
    ["IR", 46],
    ["TR", 7],
    ["FR", 4],
  ],
  devices: [
    ["mobile", 157],
    ["desktop", 64],
  ],
  systems: [
    ["Android", 126],
    ["Windows", 62],
    ["iOS", 31],
  ],
};

/** 16 – 22 Oct, a closer look at the last week. */
export const SNAPSHOT_7: HistorySnapshot = {
  from: "2026-10-16",
  to: "2026-10-22",
  visitors: 51,
  pageViews: 303,
  bounceRate: 35,
  pages: [
    ["/", 44],
    ["/taghvim-shia", 7],
  ],
  referrers: [["google.com", 7]],
  countries: [
    ["DE", 19],
    ["US", 17],
    ["IR", 12],
    ["FR", 2],
    ["NZ", 1],
  ],
  devices: [
    ["mobile", 35],
    ["desktop", 16],
  ],
  systems: [
    ["Android", 24],
    ["Windows", 16],
    ["iOS", 11],
  ],
};

/**
 * What the saved numbers add to a range whose days are `days` (oldest first): the daily visitors of the days that fall
 * in the saved period, and a share of the period's totals for the other numbers. `null` when no day is covered.
 */
export function historyFor(days: string[]) {
  const covered = days.filter((day) => day in HISTORY_DAILY);
  if (!covered.length) return null;

  const sum = (list: string[]) => list.reduce((total, day) => total + (HISTORY_DAILY[day] ?? 0), 0);
  const inLastWeek = covered.every((day) => day >= SNAPSHOT_7.from && day <= SNAPSHOT_7.to);
  const snapshot = inLastWeek ? SNAPSHOT_7 : SNAPSHOT_30;
  const periodDays = Object.keys(HISTORY_DAILY).filter((day) => day >= snapshot.from && day <= snapshot.to);
  const share = sum(covered) / Math.max(1, sum(periodDays));

  const scale = (pairs: Pairs): Pairs => pairs.map(([name, n]) => [name, Math.round(n * share)] as [string, number]).filter(([, n]) => n > 0);
  return {
    covered,
    visitors: Math.round(snapshot.visitors * share),
    pageViews: Math.round(snapshot.pageViews * share),
    bounceRate: snapshot.bounceRate,
    pages: scale(snapshot.pages),
    referrers: scale(snapshot.referrers),
    countries: scale(snapshot.countries),
    devices: scale(snapshot.devices),
    systems: scale(snapshot.systems),
  };
}

/*
 * The last 24 hours as the hosting dashboard showed them on 23 Oct 2026 (the chart's hours are on the Berlin clock,
 * which is the clock of the browser it was read in). Visitors per hour, read off the chart line.
 */
/** The start of the first hour in the list. */
const HOURLY_START = Date.parse("2026-10-22T12:00:00Z"); // 14:00 in Berlin
const HOURLY = [0, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0];
/** The last hour of the list was still going on when the picture was taken, so it is left to the live records. */
const HOURLY_COUNTED = HOURLY.length - 1;
/** From this instant on, hours come from the live records. */
export const HOURLY_UNTIL = HOURLY_START + HOURLY_COUNTED * 3_600_000;

const SNAPSHOT_24H: HistorySnapshot = {
  from: "2026-10-22",
  to: "2026-10-23",
  visitors: 9,
  pageViews: 87,
  bounceRate: 22,
  pages: [["/", 8]],
  referrers: [],
  countries: [
    ["DE", 5],
    ["IR", 2],
    ["US", 2],
  ],
  devices: [
    ["mobile", 5],
    ["desktop", 4],
  ],
  systems: [
    ["Windows", 4],
    ["Android", 3],
    ["iOS", 2],
  ],
};

/**
 * What the saved last-24-hours add to the hours `keys` ("YYYY-MM-DD HH" on the clock of `zone`, oldest first): the
 * visitors of each hour that was saved, and a share of the totals in proportion to the saved hours covered.
 */
export function historyForHours(keys: string[], zone: string) {
  const byKey = new Map<string, number>();
  const wanted = new Set(keys);
  let covered = 0;
  for (let index = 0; index < HOURLY_COUNTED; index++) {
    const instant = new Date(HOURLY_START + index * 3_600_000);
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(instant);
    const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
    const key = `${pick("year")}-${pick("month")}-${pick("day")} ${String(Number(pick("hour")) % 24).padStart(2, "0")}`;
    if (!wanted.has(key)) continue;
    byKey.set(key, HOURLY[index]);
    covered += HOURLY[index];
  }
  if (!byKey.size) return null;

  const share = covered / Math.max(1, HOURLY.slice(0, HOURLY_COUNTED).reduce((total, value) => total + value, 0));
  const scale = (pairs: Array<[string, number]>): Array<[string, number]> => pairs.map(([name, n]) => [name, Math.round(n * share)] as [string, number]).filter(([, n]) => n > 0);
  return {
    byKey,
    visitors: Math.round(SNAPSHOT_24H.visitors * share),
    pageViews: Math.round(SNAPSHOT_24H.pageViews * share),
    bounceRate: SNAPSHOT_24H.bounceRate,
    pages: scale(SNAPSHOT_24H.pages),
    referrers: [] as Array<[string, number]>,
    countries: scale(SNAPSHOT_24H.countries),
    devices: scale(SNAPSHOT_24H.devices),
    systems: scale(SNAPSHOT_24H.systems),
  };
}

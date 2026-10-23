/*
 * Visit statistics: what is stored for one visit, and how a browser's request is turned into it.
 * No address is stored: a visit keeps a random id the browser made up, the country the host reported,
 * and the device, browser and system read from the User-Agent.
 */

export const ANALYTICS_COLLECTION = "site_analytics";
/** Records older than this are removed by the database itself. */
export const ANALYTICS_RETENTION_DAYS = 400;

const TIME_ZONE = "Asia/Tehran";
const OWN_HOSTS = ["bavarmandan.com", "www.bavarmandan.com"];
/** Parts of the site that are not counted: the dashboard, the API and private pages. */
const IGNORED_PATHS = ["/admin", "/bavarmandan-control-110", "/api", "/private-catalog", "/_next"];

export const EVENT_NAMES = ["audio_play", "pdf_view", "pdf_download", "audio_download"] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export type Device = "mobile" | "tablet" | "desktop";

export interface Agent {
  device: Device;
  browser: string;
  os: string;
}

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|monitor|uptime|curl|wget|python|axios|node-fetch|go-http|java\//i;

/** Null for robots and anything that is not a browser. */
export function parseAgent(userAgent: string | null | undefined): Agent | null {
  const ua = (userAgent ?? "").slice(0, 400);
  if (!ua || BOT.test(ua)) return null;

  const device: Device = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? "tablet" : /Mobi|iPhone|iPod|Android/i.test(ua) ? "mobile" : "desktop";

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /SamsungBrowser/.test(ua)
        ? "Samsung Internet"
        : /Firefox\/|FxiOS/.test(ua)
          ? "Firefox"
          : /Chrome\/|CriOS/.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : /MSIE|Trident/.test(ua)
                ? "Internet Explorer"
                : "سایر";

  const os = /Windows/i.test(ua)
    ? "Windows"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /Android/i.test(ua)
        ? "Android"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /CrOS/.test(ua)
            ? "ChromeOS"
            : /Linux/i.test(ua)
              ? "Linux"
              : "سایر";

  return { device, browser, os };
}

/** "/audio?x=1#top" → "/audio". Null when the page is not one that is counted. */
export function cleanPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let path = value.split("#")[0].split("?")[0].trim().slice(0, 200);
  if (!path.startsWith("/")) return null;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (IGNORED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return null;
  return path || "/";
}

/** The site a visitor came from ("google.com"), or "" for a direct visit or a visit from this site itself. */
export function referrerHost(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  try {
    const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase().slice(0, 100);
    return OWN_HOSTS.includes(host) || OWN_HOSTS.includes(`www.${host}`) || host === "localhost" ? "" : host;
  } catch {
    return "";
  }
}

export const shortText = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** An id the browser made up: letters and digits only, so it can be stored and grouped safely. */
export function cleanId(value: unknown): string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,40}$/.test(value) ? value : "";
}

/** The country code the host (Vercel) sent, or "" when unknown. */
export function cleanCountry(value: string | null | undefined): string {
  const code = (value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1" ? code : "";
}

import { TIME_ZONES, toTimeZone } from "./analytics-zones";
export { TIME_ZONES, toTimeZone };
export type { TimeZoneName } from "./analytics-zones";

const formats = new Map<string, Intl.DateTimeFormat>();
function formatFor(zone: string) {
  let format = formats.get(zone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    formats.set(zone, format);
  }
  return format;
}

/** The day ("2026-10-23") and hour (0-23) of an instant on the clock of `zone` (Iran by default). */
export function zoneParts(date: Date, zone: string = TIME_ZONE) {
  const parts = formatFor(zone).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return { day: `${pick("year")}-${pick("month")}-${pick("day")}`, hour: Number(pick("hour")) % 24 };
}
export const tehranParts = (date: Date) => zoneParts(date, TIME_ZONE);

/** How far the clock of `zone` is ahead of UTC at that instant, in milliseconds. */
function offsetAt(instant: number, zone: string) {
  const parts = formatFor(zone).formatToParts(new Date(instant));
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const local = Date.UTC(pick("year"), pick("month") - 1, pick("day"), pick("hour") % 24, pick("minute"), pick("second"));
  return local - Math.floor(instant / 1000) * 1000;
}

/** The instant at which `day` ("YYYY-MM-DD") begins on the clock of `zone`. */
export function startOfDay(day: string, zone: string = TIME_ZONE): Date {
  const guess = Date.parse(`${day}T00:00:00Z`);
  let instant = guess - offsetAt(guess, zone);
  instant = guess - offsetAt(instant, zone); // once more, in case the first guess fell on the other side of a clock change
  return new Date(instant);
}

/** The last 24 clock hours up to the current one on the clock of `zone`, oldest first ("YYYY-MM-DD HH"). */
export function lastHours(now = new Date(), zone: string = TIME_ZONE): string[] {
  const { day, hour } = zoneParts(now, zone);
  const current = Date.parse(`${day}T${String(hour).padStart(2, "0")}:00:00Z`);
  const keys: string[] = [];
  for (let back = 23; back >= 0; back--) keys.push(new Date(current - back * 3_600_000).toISOString().slice(0, 13).replace("T", " "));
  return keys;
}

/** The last `count` days up to today on the clock of `zone`, oldest first ("YYYY-MM-DD"). */
export function lastDays(count: number, now = new Date(), zone: string = TIME_ZONE): string[] {
  const today = zoneParts(now, zone).day;
  const noon = Date.parse(`${today}T12:00:00Z`);
  const days: string[] = [];
  // Counting back from noon UTC of the local date keeps every step one calendar day, whatever the clock changes do.
  for (let back = count - 1; back >= 0; back--) days.push(new Date(noon - back * 86_400_000).toISOString().slice(0, 10));
  return days;
}

/** 1 stands for the last 24 hours, shown hour by hour; the others are numbers of days. */
export const RANGES = [1, 7, 30, 90] as const;
export type Range = (typeof RANGES)[number];
export const toRange = (value: unknown): Range => (RANGES as readonly number[]).includes(Number(value)) ? (Number(value) as Range) : 30;

/** One visit or one event, as it is stored. */
export interface AnalyticsRecord {
  type: "pageview" | "event";
  t: Date;
  day: string;
  hour: number;
  vid: string;
  sid: string;
  path: string;
  ref: string;
  utm: string;
  country: string;
  device: Device;
  browser: string;
  os: string;
  name?: string;
  label?: string;
}

/** Collection access with the indexes created once per server instance. Never throws to the caller of a visitor. */
let indexed: Promise<void> | null = null;
export async function analyticsCollection() {
  const { default: clientPromise } = await import("@/lib/mongodb");
  const collection = (await clientPromise).db().collection<AnalyticsRecord>(ANALYTICS_COLLECTION);
  indexed ??= Promise.all([
    collection.createIndex({ t: 1 }, { expireAfterSeconds: ANALYTICS_RETENTION_DAYS * 86_400 }),
    collection.createIndex({ type: 1, day: 1 }),
  ])
    .then(() => undefined)
    .catch((error) => {
      indexed = null;
      console.error("[analytics] could not create indexes", error instanceof Error ? error.message : error);
    });
  await indexed;
  return collection;
}

// The clocks the visits page can show. Kept apart from the server code so the page (a browser bundle) can import it.

/** The clocks the dashboard can show, by the name the page sends. Iran, Germany and the US are always there. */
export const TIME_ZONES = {
  "Asia/Tehran": "ایران",
  "Europe/Berlin": "آلمان",
  "America/New_York": "آمریکا (شرق)",
  "America/Chicago": "آمریکا (مرکز)",
  "America/Los_Angeles": "آمریکا (غرب)",
  "Europe/London": "بریتانیا",
  "Europe/Paris": "فرانسه",
  "Europe/Istanbul": "ترکیه",
  "Asia/Dubai": "امارات",
  "Asia/Baghdad": "عراق",
  "America/Toronto": "کانادا (تورنتو)",
  "Australia/Sydney": "استرالیا (سیدنی)",
} as const;
export type TimeZoneName = keyof typeof TIME_ZONES;
export const toTimeZone = (value: unknown): TimeZoneName => (typeof value === "string" && value in TIME_ZONES ? (value as TimeZoneName) : "Asia/Tehran");

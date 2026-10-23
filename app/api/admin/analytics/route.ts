import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { HISTORY_DAILY, HISTORY_UNTIL, HOURLY_UNTIL, historyFor, historyForHours } from "@/lib/analytics-history";
import { analyticsCollection, lastDays, lastHours, startOfDay, toRange, toTimeZone } from "@/lib/site-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Count {
  _id: string | null;
  n: number;
}

interface Row {
  name: string;
  n: number;
}

/** Visitors per value of one field (a visitor counts once however many pages they opened). */
const visitorsBy = (field: string) => [
  { $match: { [field]: { $nin: ["", null] } } },
  { $group: { _id: { value: `$${field}`, vid: "$vid" } } },
  { $group: { _id: "$_id.value", n: { $sum: 1 } } },
  { $sort: { n: -1 as const, _id: 1 as const } },
  { $limit: 10 },
];

const rows = (list: Count[]): Row[] => list.map((row) => ({ name: String(row._id ?? ""), n: row.n }));

/** Live rows plus the saved ones of the same name, biggest first. */
function merge(live: Row[], saved: Array<[string, number]> = []): Row[] {
  const total = new Map<string, number>();
  for (const row of live) total.set(row.name, (total.get(row.name) ?? 0) + row.n);
  for (const [name, n] of saved) total.set(name, (total.get(name) ?? 0) + n);
  return Array.from(total.entries())
    .map(([name, n]) => ({ name, n }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))
    .slice(0, 10);
}

/**
 * Everything the visits page shows, for the last 7, 30 or 90 Iranian days. Days up to HISTORY_UNTIL come from the numbers
 * saved from the hosting dashboard, later days from the live records. Only for a signed-in admin.
 */
export async function GET(request: NextRequest) {
  if (!hasAdminSession()) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const range = toRange(request.nextUrl.searchParams.get("range"));
  const zone = toTimeZone(request.nextUrl.searchParams.get("tz"));
  const now = new Date();
  const hourly = range === 1;
  const days = lastDays(range * 2, now, zone);
  const previousDays = days.slice(0, range);
  const currentDays = days.slice(range);
  const to = currentDays[currentDays.length - 1];
  const hourKeys = hourly ? lastHours(now, zone) : [];
  const savedHours = hourly ? historyForHours(hourKeys, zone) : null;
  const saved = hourly ? savedHours : historyFor(currentDays);
  const liveDays = currentDays.filter((day) => day > HISTORY_UNTIL);
  // The live records are cut by the instant, so any clock can be used: from the start of the first live day on that clock.
  // Nothing is live yet when the whole range lies in the saved period.
  const liveStart = hourly ? new Date(Math.max(now.getTime() - 24 * 3_600_000, HOURLY_UNTIL)) : liveDays[0] ? startOfDay(liveDays[0], zone) : new Date(8.64e15);

  try {
    const collection = await analyticsCollection();

    const [result] = await collection
      .aggregate([
        { $match: { type: { $in: ["pageview", "event"] }, t: { $gte: liveStart } } },
        { $addFields: { d: { $dateToString: { format: hourly ? "%Y-%m-%d %H" : "%Y-%m-%d", date: "$t", timezone: zone } }, h: { $hour: { date: "$t", timezone: zone } } } },
        {
          $facet: {
            perDay: [
              { $match: { type: "pageview" } },
              { $group: { _id: { day: "$d", vid: "$vid" } } },
              { $group: { _id: "$_id.day", n: { $sum: 1 } } },
            ],
            pageViews: [{ $match: { type: "pageview" } }, { $count: "n" }],
            perHour: [{ $match: { type: "pageview" } }, { $group: { _id: "$h", n: { $sum: 1 } } }],
            visitors: [{ $match: { type: "pageview" } }, { $group: { _id: "$vid" } }, { $count: "n" }],
            sessions: [
              { $match: { type: "pageview" } },
              { $group: { _id: "$sid", pages: { $sum: 1 } } },
              { $group: { _id: null, total: { $sum: 1 }, single: { $sum: { $cond: [{ $eq: ["$pages", 1] }, 1, 0] } } } },
            ],
            pages: [{ $match: { type: "pageview" } }, { $group: { _id: "$path", n: { $sum: 1 } } }, { $sort: { n: -1, _id: 1 } }, { $limit: 10 }],
            // A visit's source is only recorded at the start of a visit, so this counts visits, not page views.
            referrers: [
              { $match: { type: "pageview", ref: { $ne: "" } } },
              { $group: { _id: "$ref", n: { $sum: 1 } } },
              { $sort: { n: -1, _id: 1 } },
              { $limit: 10 },
            ],
            utm: [{ $match: { type: "pageview", utm: { $ne: "" } } }, { $group: { _id: "$utm", n: { $sum: 1 } } }, { $sort: { n: -1, _id: 1 } }, { $limit: 10 }],
            direct: [{ $match: { type: "pageview", ref: "" } }, { $group: { _id: "$sid" } }, { $count: "n" }],
            countries: [{ $match: { type: "pageview" } }, ...visitorsBy("country")],
            devices: [{ $match: { type: "pageview" } }, ...visitorsBy("device")],
            browsers: [{ $match: { type: "pageview" } }, ...visitorsBy("browser")],
            systems: [{ $match: { type: "pageview" } }, ...visitorsBy("os")],
            events: [
              { $match: { type: "event" } },
              { $group: { _id: { name: "$name", label: "$label", vid: "$vid" }, n: { $sum: 1 } } },
              { $group: { _id: { name: "$_id.name", label: "$_id.label" }, visitors: { $sum: 1 }, total: { $sum: "$n" } } },
              { $sort: { total: -1, visitors: -1 } },
              { $limit: 60 },
            ],
          },
        },
      ])
      .toArray();

    const count = (list: Array<{ n: number }> | undefined) => list?.[0]?.n ?? 0;
    const perDay = new Map((result.perDay as Count[]).map((row) => [row._id, row.n]));
    const perHour = new Map((result.perHour as Count[]).map((row) => [Number(row._id), row.n]));
    const sessions = (result.sessions as Array<{ total: number; single: number }>)[0] ?? { total: 0, single: 0 };

    // Days with a number: saved days from the saved list, later days from the live records (zero when nobody came).
    const series = hourly
      ? hourKeys.map((key) => ({ day: key, visitors: savedHours?.byKey.get(key) ?? perDay.get(key) ?? 0 }))
      : currentDays
          .map((day) => ({ day, visitors: day <= HISTORY_UNTIL ? HISTORY_DAILY[day] : (perDay.get(day) ?? 0) }))
          .filter((entry): entry is { day: string; visitors: number } => entry.visitors !== undefined);
    const previousKnown = !hourly && previousDays.every((day) => day in HISTORY_DAILY);
    const liveVisitors = count(result.visitors);
    const livePageViews = count(result.pageViews);
    const visitors = liveVisitors + (saved?.visitors ?? 0);
    // The saved bounce rate stands for the saved visitors, the live one for the live sessions.
    const weightSaved = saved?.visitors ?? 0;
    const bounceRate = Math.round(
      ((saved?.bounceRate ?? 0) * weightSaved + (sessions.total ? (sessions.single / sessions.total) * 100 : 0) * sessions.total) / Math.max(1, weightSaved + sessions.total)
    );

    return NextResponse.json(
      {
        range,
        zone,
        hourly,
        days: series,
        hours: Array.from({ length: 24 }, (_, hour) => perHour.get(hour) ?? 0),
        hoursFrom: liveDays[0] ?? null,
        pageViews: livePageViews + (saved?.pageViews ?? 0),
        visitors,
        bounceRate: weightSaved + sessions.total ? bounceRate : 0,
        previousVisitors: previousKnown ? previousDays.reduce((sum, day) => sum + HISTORY_DAILY[day], 0) : null,
        savedDays: hourly ? 0 : (saved as { covered?: string[] } | null)?.covered?.length ?? 0,
        savedHours: savedHours?.byKey.size ?? 0,
        savedUntil: HISTORY_UNTIL,
        pages: merge(rows(result.pages), saved?.pages),
        referrers: merge([...(count(result.direct) ? [{ name: "", n: count(result.direct) }] : []), ...rows(result.referrers)], saved?.referrers),
        utm: rows(result.utm),
        countries: merge(rows(result.countries), saved?.countries),
        devices: merge(rows(result.devices), saved?.devices),
        browsers: rows(result.browsers),
        systems: merge(rows(result.systems), saved?.systems),
        events: (result.events as Array<{ _id: { name: string; label: string }; visitors: number; total: number }>).map((row) => ({
          name: row._id.name,
          label: row._id.label,
          visitors: row.visitors,
          total: row.total,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[analytics] could not read the statistics:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

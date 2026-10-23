import { NextRequest, NextResponse } from "next/server";
import {
  EVENT_NAMES,
  analyticsCollection,
  cleanCountry,
  cleanId,
  cleanPath,
  parseAgent,
  referrerHost,
  shortText,
  tehranParts,
  type AnalyticsRecord,
} from "@/lib/site-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A visitor's browser calls this on every page it shows. It always answers 204: a counting problem must never be
// visible to the visitor, and the answer tells a bad caller nothing.
const empty = () => new NextResponse(null, { status: 204 });

// Best-effort limit per address and per server instance, against someone filling the database.
const hits = new Map<string, { count: number; since: number }>();
function tooMany(key: string) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.since > 60_000) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { count: 1, since: now });
    return false;
  }
  entry.count += 1;
  return entry.count > 90;
}

export async function POST(request: NextRequest) {
  try {
    // A developer's machine must not fill the real database, unless that is asked for on purpose.
    if (process.env.NODE_ENV !== "production" && process.env.ANALYTICS_DEV !== "1") return empty();

    const agent = parseAgent(request.headers.get("user-agent"));
    if (!agent) return empty();

    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    if (tooMany(address)) return empty();

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return empty();

    const path = cleanPath(body.path);
    const vid = cleanId(body.vid);
    const sid = cleanId(body.sid);
    if (!path || !vid || !sid) return empty();

    const type = body.type === "event" ? "event" : "pageview";
    const name = shortText(body.name, 40);
    if (type === "event" && !(EVENT_NAMES as readonly string[]).includes(name)) return empty();

    const now = new Date();
    const { day, hour } = tehranParts(now);
    const record: AnalyticsRecord = {
      type,
      t: now,
      day,
      hour,
      vid,
      sid,
      path,
      ref: type === "pageview" ? referrerHost(body.ref) : "",
      utm: type === "pageview" ? shortText(body.utm, 60).toLowerCase() : "",
      country: cleanCountry(request.headers.get("x-vercel-ip-country")),
      ...agent,
    };
    if (type === "event") {
      record.name = name;
      record.label = shortText(body.label, 120);
    }

    const collection = await analyticsCollection();
    await collection.insertOne(record);
  } catch (error) {
    console.error("[analytics] could not record a visit:", error instanceof Error ? error.message : error);
  }
  return empty();
}

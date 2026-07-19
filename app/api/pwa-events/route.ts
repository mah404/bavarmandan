import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const allowedEvents = new Set([
  "site_link_opened",
  "pwa_install_button_clicked",
  "pwa_install_link_opened",
]);

const berlinTimeZone = "Europe/Berlin";

const getBerlinParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: berlinTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    dayBerlin: `${value("year")}-${value("month")}-${value("day")}`,
    timeBerlin: `${value("hour")}:${value("minute")}:${value("second")}`,
  };
};

const getClientIp = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  request.headers.get("x-real-ip") ??
  "unknown";

const hashValue = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const recordEvent = async (
  request: NextRequest,
  event: string,
  data: Record<string, unknown>
) => {
  if (!allowedEvents.has(event)) {
    return { ok: false, status: 400, error: "Invalid event" };
  }

  const now = new Date();
  const client = await clientPromise;
  const db = client.db();
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const ip = getClientIp(request);
  const berlin = getBerlinParts(now);

  await db.collection("pwa_events").insertOne({
    event,
    payload: data.payload && typeof data.payload === "object" ? data.payload : {},
    visitorId:
      typeof data.visitorId === "string" ? data.visitorId.slice(0, 80) : null,
    url: typeof data.url === "string" ? data.url.slice(0, 500) : null,
    path: typeof data.path === "string" ? data.path.slice(0, 200) : null,
    referrer:
      typeof data.referrer === "string" ? data.referrer.slice(0, 500) : null,
    displayMode:
      typeof data.displayMode === "string" ? data.displayMode.slice(0, 40) : null,
    language:
      typeof data.language === "string" ? data.language.slice(0, 40) : null,
    timezone:
      typeof data.timezone === "string" ? data.timezone.slice(0, 80) : null,
    userAgent,
    ipAddress: ip,
    ipHash: hashValue(`${ip}:${process.env.PWA_ANALYTICS_SALT ?? ""}`),
    createdAt: now,
    createdAtUtc: now.toISOString(),
    createdAtBerlin: `${berlin.dayBerlin} ${berlin.timeBerlin}`,
    day: berlin.dayBerlin,
    dayBerlin: berlin.dayBerlin,
    timeBerlin: berlin.timeBerlin,
    timezoneServer: berlinTimeZone,
  });

  return { ok: true, status: 200 };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = typeof body.event === "string" ? body.event : "";
    const result = await recordEvent(request, event, body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to record PWA event", error);
    return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const event = request.nextUrl.searchParams.get("event");

  if (event) {
    try {
      const payload = {
        source: request.nextUrl.searchParams.get("source"),
      };
      const result = await recordEvent(request, event, {
        payload,
        visitorId: request.nextUrl.searchParams.get("visitorId"),
        url: request.nextUrl.searchParams.get("url"),
        path: request.nextUrl.searchParams.get("path"),
        referrer: request.nextUrl.searchParams.get("referrer"),
        displayMode: request.nextUrl.searchParams.get("displayMode"),
        language: request.nextUrl.searchParams.get("language"),
        timezone: request.nextUrl.searchParams.get("timezone"),
      });

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status }
        );
      }

      return new NextResponse(
        Buffer.from(
          "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
          "base64"
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    } catch (error) {
      console.error("Unable to record PWA event pixel", error);
      return NextResponse.json(
        { error: "Unable to record event" },
        { status: 500 }
      );
    }
  }

  const token = process.env.PWA_ANALYTICS_TOKEN;
  const providedToken = request.nextUrl.searchParams.get("token");

  if (!token || providedToken !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection("pwa_events");

  const [total, byEvent, byDay, recent] = await Promise.all([
    collection.countDocuments(),
    collection
      .aggregate([
        { $group: { _id: "$event", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray(),
    collection
      .aggregate([
        { $group: { _id: { day: "$day", event: "$event" }, count: { $sum: 1 } } },
        { $sort: { "_id.day": -1, count: -1 } },
        { $limit: 60 },
      ])
      .toArray(),
    collection
      .find(
        {},
        {
          projection: {
            _id: 0,
            event: 1,
            payload: 1,
            visitorId: 1,
            path: 1,
            referrer: 1,
            displayMode: 1,
            language: 1,
            timezone: 1,
            ipAddress: 1,
            ipHash: 1,
            createdAt: 1,
            createdAtUtc: 1,
            createdAtBerlin: 1,
            dayBerlin: 1,
            timeBerlin: 1,
            timezoneServer: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
  ]);

  return NextResponse.json({
    total,
    byEvent: byEvent.map((item) => ({
      event: item._id,
      count: item.count,
    })),
    byDay: byDay.map((item) => ({
      day: item._id.day,
      event: item._id.event,
      count: item.count,
    })),
    recent,
  });
}

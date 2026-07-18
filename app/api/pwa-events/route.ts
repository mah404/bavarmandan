import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const allowedEvents = new Set([
  "pwa_install_button_clicked",
  "pwa_install_prompt_unavailable",
  "pwa_install_prompt_result",
  "pwa_installed",
  "pwa_opened_standalone",
  "pwa_install_link_opened",
  "pwa_install_link_button_clicked",
  "pwa_install_link_prompt_unavailable",
  "pwa_install_link_prompt_result",
  "pwa_installed_from_install_link",
]);

const getClientIp = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  request.headers.get("x-real-ip") ??
  "unknown";

const hashValue = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = typeof body.event === "string" ? body.event : "";

    if (!allowedEvents.has(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const now = new Date();
    const client = await clientPromise;
    const db = client.db();
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    const ip = getClientIp(request);

    await db.collection("pwa_events").insertOne({
      event,
      payload:
        body.payload && typeof body.payload === "object" ? body.payload : {},
      visitorId:
        typeof body.visitorId === "string" ? body.visitorId.slice(0, 80) : null,
      url: typeof body.url === "string" ? body.url.slice(0, 500) : null,
      path: typeof body.path === "string" ? body.path.slice(0, 200) : null,
      referrer:
        typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null,
      displayMode:
        typeof body.displayMode === "string"
          ? body.displayMode.slice(0, 40)
          : null,
      language:
        typeof body.language === "string" ? body.language.slice(0, 40) : null,
      timezone:
        typeof body.timezone === "string" ? body.timezone.slice(0, 80) : null,
      userAgent,
      ipHash: hashValue(`${ip}:${process.env.PWA_ANALYTICS_SALT ?? ""}`),
      createdAt: now,
      day: now.toISOString().slice(0, 10),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
            createdAt: 1,
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

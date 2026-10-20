import { NextResponse } from "next/server";
import type { Announcement } from "@/lib/announcements";
import { isVisibleNow, parseAnnouncementContent } from "@/lib/announcement-meta";
import { callAnnouncementsApi } from "@/lib/announcements-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The announcements server is in Germany (Hetzner Falkenstein): run these routes close to it.
export const preferredRegion = "fra1";

// Public: published announcements only. Announcements scheduled for later are held back until their time.
export async function GET() {
  const response = await callAnnouncementsApi("/api/announcements");
  if (!response.ok) return response;

  const data = (await response.json().catch(() => null)) as { announcements?: Announcement[] } | null;
  if (!data || !Array.isArray(data.announcements)) return response;

  const now = Date.now();
  const announcements = data.announcements.filter(
    (item) => item.published && isVisibleNow(parseAnnouncementContent(item.content).meta, now)
  );

  return NextResponse.json({ ...data, announcements }, { headers: { "Cache-Control": "no-store" } });
}

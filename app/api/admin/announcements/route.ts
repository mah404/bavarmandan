import { NextRequest } from "next/server";
import { parseAnnouncementInput } from "@/lib/announcements";
import {
  announcementsError,
  callAnnouncementsApi,
  requireAdmin,
} from "@/lib/announcements-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The announcements server is in Germany (Hetzner Falkenstein): run these routes close to it.
export const preferredRegion = "fra1";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  return callAnnouncementsApi("/api/admin/announcements", { admin: true });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return announcementsError(400, "درخواست نامعتبر است.");
  }

  const parsed = parseAnnouncementInput(raw, { partial: false });
  if ("error" in parsed) return announcementsError(400, parsed.error);

  return callAnnouncementsApi("/api/admin/announcements", {
    admin: true,
    method: "POST",
    body: parsed.value,
  });
}

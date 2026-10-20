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

type Context = { params: { id: string } };

function announcementPath(id: string) {
  return `/api/admin/announcements/${encodeURIComponent(id)}`;
}

export async function PUT(request: NextRequest, { params }: Context) {
  const denied = requireAdmin();
  if (denied) return denied;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return announcementsError(400, "درخواست نامعتبر است.");
  }

  const parsed = parseAnnouncementInput(raw, { partial: true });
  if ("error" in parsed) return announcementsError(400, parsed.error);

  return callAnnouncementsApi(announcementPath(params.id), {
    admin: true,
    method: "PUT",
    body: parsed.value,
  });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const denied = requireAdmin();
  if (denied) return denied;

  return callAnnouncementsApi(announcementPath(params.id), {
    admin: true,
    method: "DELETE",
  });
}

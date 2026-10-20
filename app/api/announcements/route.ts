import { callAnnouncementsApi } from "@/lib/announcements-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The announcements server is in Germany (Hetzner Falkenstein): run these routes close to it.
export const preferredRegion = "fra1";

// Public: published announcements only (the standalone API filters them). No token is sent.
export async function GET() {
  return callAnnouncementsApi("/api/announcements");
}

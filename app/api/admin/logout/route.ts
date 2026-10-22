import { NextResponse } from "next/server";
import { expiredAdminCookieHeaders } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Clears the admin session on every path it may have been issued for:
// "/" (current) and "/admin" (sessions created before the path changed).
// Two Set-Cookie headers are needed, which the cookies() helpers cannot send for one cookie name.
export async function POST() {
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  for (const header of expiredAdminCookieHeaders()) response.headers.append("Set-Cookie", header);
  return response;
}

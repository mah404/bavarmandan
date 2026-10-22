import { NextRequest, NextResponse } from "next/server";
import { expiredAdminCookieHeaders } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A dashboard page that finds the session missing or invalid sends the visitor here: the old cookie is removed
// (so it is not sent again and again) and the sign-in page opens.
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.headers.set("Cache-Control", "no-store");
  for (const header of expiredAdminCookieHeaders()) response.headers.append("Set-Cookie", header);
  return response;
}

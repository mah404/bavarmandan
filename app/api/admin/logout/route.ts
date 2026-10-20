import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Clears the admin session on every path it may have been issued for:
// "/" (current) and "/admin" (sessions created before the path changed).
// Two Set-Cookie headers are needed, which the cookies() helpers cannot send for one cookie name.
export async function POST() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });

  for (const path of ["/", "/admin"]) {
    response.headers.append(
      "Set-Cookie",
      `${ADMIN_SESSION_COOKIE}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Strict${secure}`
    );
  }

  return response;
}

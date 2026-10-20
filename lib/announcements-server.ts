import "server-only";

import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";

type Message = { success: false; message: string };

function fail(status: number, message: string) {
  return NextResponse.json<Message>({ success: false, message }, { status });
}

/** Returns a 401 response when the request has no valid admin session, otherwise null. */
export function requireAdmin() {
  if (!hasAdminSession()) {
    return fail(401, "برای این کار باید وارد پنل مدیریت شوید.");
  }
  return null;
}

/**
 * Server-side call to the standalone announcements API.
 * The admin token is added here and never leaves the server.
 */
export async function callAnnouncementsApi(
  path: string,
  options: { admin?: boolean; method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown } = {}
) {
  const baseUrl = process.env.ANNOUNCEMENTS_API_URL?.trim().replace(/\/+$/, "");
  const token = process.env.ANNOUNCEMENTS_ADMIN_TOKEN?.trim();

  if (!baseUrl || (options.admin && !token)) {
    return fail(503, "سرویس اعلانات هنوز پیکربندی نشده است.");
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.admin) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    // 401/403 from the upstream API means the server token was rejected, not that the admin's session ended.
    // Only requireAdmin() may answer 401, otherwise the dashboard would log the admin out.
    if (options.admin && (response.status === 401 || response.status === 403)) {
      return fail(502, "سرور اعلانات توکن مدیریت را نپذیرفت. تنظیمات توکن روی سرور و Vercel را بررسی کنید.");
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (data === null || typeof data !== "object") {
      return response.ok
        ? NextResponse.json({ success: true }, { status: response.status })
        : fail(response.status, "پاسخ نامعتبر از سرور اعلانات دریافت شد.");
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return fail(502, "ارتباط با سرور اعلانات برقرار نشد. کمی بعد دوباره تلاش کنید.");
  }
}

export { fail as announcementsError };

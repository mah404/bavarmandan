import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionLifetime,
  adminPasswordHash,
  createAdminSessionToken,
  isAdminAuthConfigured,
  missingAdminAuthSettings,
} from "@/lib/admin-auth";
import {
  clearLoginFailures,
  readLoginLock,
  recordLoginFailure,
} from "@/lib/admin-login-limiter";

export const runtime = "nodejs";

function requestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function lockedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: "به خاطر چند تلاش ناموفق، ورود تا ۱۵ دقیقه بسته شد.",
      locked: true,
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      {
        error: `ورود مدیریت در سرور پیکربندی نشده است: ${missingAdminAuthSettings().join("، ") || "نامشخص"}`,
      },
      { status: 503 }
    );
  }

  const ip = requestIp(request);
  const retryAfterSeconds = await readLoginLock(ip);
  if (retryAfterSeconds > 0) return lockedResponse(retryAfterSeconds);

  let body: { password?: unknown; remember?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const remember = body.remember === true;
  const passwordHash = adminPasswordHash();
  const valid = password.length > 0 && (await compare(password, passwordHash));

  if (!valid) {
    const result = await recordLoginFailure(ip);
    if (result.locked) return lockedResponse(result.retryAfterSeconds);

    return NextResponse.json(
      { error: "رمز درست نیست.", remainingAttempts: result.remainingAttempts },
      { status: 401 }
    );
  }

  await clearLoginFailures(ip);
  const response = NextResponse.json({
    success: true,
    redirectTo: "/admin/dashboard",
  });

  const lifetime = adminSessionLifetime(remember);
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(lifetime), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    ...(remember ? { maxAge: lifetime } : {}),
  });

  return response;
}

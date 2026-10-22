import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  adminPasswordHash,
  adminSessionLifetime,
  createAdminSessionToken,
  expiredAdminCookieHeaders,
  isAdminAuthConfigured,
  missingAdminAuthSettings,
} from "@/lib/admin-auth";
import { performLogin } from "@/lib/admin-login-core";
import { mongoAttemptStore, visitorKey } from "@/lib/admin-login-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  let body: { password?: unknown; remember?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است.", code: "bad_request" }, { status: 400 });
  }

  const result = await performLogin(
    { password: body.password, remember: body.remember, key: visitorKey(requestIp(request)) },
    {
      store: mongoAttemptStore,
      configured: isAdminAuthConfigured(),
      problems: missingAdminAuthSettings(),
      passwordHash: adminPasswordHash(),
      compare,
      makeToken: createAdminSessionToken,
      lifetime: adminSessionLifetime,
      // One line per attempt with only safe facts (outcome, hash shape, counts): never the password or the hash.
      log: (entry) => console.info("[admin-login]", JSON.stringify(entry)),
    }
  );

  const response = NextResponse.json(result.body, {
    status: result.status,
    headers: {
      "Cache-Control": "no-store",
      ...(result.retryAfterSeconds ? { "Retry-After": String(result.retryAfterSeconds) } : {}),
    },
  });

  if (result.session) {
    response.cookies.set(ADMIN_SESSION_COOKIE, result.session.token, adminCookieOptions(result.session.maxAge));
    // An older cookie on the "/admin" path would shadow the new one: remove it too (appended after, as cookies.set rewrites the header).
    response.headers.append("Set-Cookie", expiredAdminCookieHeaders()[1]);
  }

  return response;
}

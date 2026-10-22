import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "bavarmandan_admin_session";
// A normal sign-in lasts 8 hours; "stay signed in on this device" lasts 7 days. Never longer.
const shortSessionSeconds = 60 * 60 * 8;
const rememberSessionSeconds = 60 * 60 * 24 * 7;

function sessionSecret() {
  return process.env.ADMIN_DASHBOARD_SESSION_SECRET?.trim() || "";
}

/**
 * Change ADMIN_SESSION_VERSION (any new text) to sign every admin out at once, without touching the password hash
 * or the session secret. Sessions issued under another version are refused.
 */
function sessionVersion() {
  return process.env.ADMIN_SESSION_VERSION?.trim() || "1";
}

/**
 * The bcrypt hash exactly as intended: surrounding quotes and the backslashes people copy from
 * .env files ("\$2b\$12\$...") are removed, so a pasted value works on Vercel as well.
 * (A bcrypt hash never contains a quote or a backslash, so a real hash is never altered.)
 */
export function adminPasswordHash() {
  return (process.env.ADMIN_DASHBOARD_PASSWORD_HASH || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\/g, "")
    .trim();
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminAuthConfigured() {
  return Boolean(
    adminPasswordHash() &&
      sessionSecret().length >= 32
  );
}

/** Names (never values) of the admin settings that are missing or invalid. Used for the setup message. */
export function missingAdminAuthSettings() {
  const problems: string[] = [];
  const hash = adminPasswordHash();
  const secret = sessionSecret();

  if (!hash) problems.push("ADMIN_DASHBOARD_PASSWORD_HASH (خالی یا تنظیم‌نشده)");
  else if (!/^\$2[aby]\$/.test(hash)) problems.push("ADMIN_DASHBOARD_PASSWORD_HASH (مقدارش هش bcrypt نیست)");

  if (!secret) problems.push("ADMIN_DASHBOARD_SESSION_SECRET (خالی یا تنظیم‌نشده)");
  else if (secret.length < 32) problems.push("ADMIN_DASHBOARD_SESSION_SECRET (کوتاه‌تر از ۳۲ نویسه)");

  return problems;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function adminSessionLifetime(remember: boolean) {
  return remember ? rememberSessionSeconds : shortSessionSeconds;
}

export function createAdminSessionToken(lifetimeSeconds: number) {
  const seconds = Math.min(lifetimeSeconds, rememberSessionSeconds);
  const payload = Buffer.from(
    JSON.stringify({ expiresAt: Date.now() + seconds * 1000, v: sessionVersion() })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

/** The session cookie's settings. Always limited by maxAge, never a permanent cookie. */
export function adminCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.min(maxAgeSeconds, rememberSessionSeconds),
  };
}

/**
 * Set-Cookie headers that remove the session cookie on every path it may ever have been issued for
 * ("/" now, "/admin" in older versions). Two headers are needed because one cookie name cannot be set twice
 * with cookies().
 */
export function expiredAdminCookieHeaders() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return ["/", "/admin"].map(
    (path) => `${ADMIN_SESSION_COOKIE}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${secure}`
  );
}

export function hasAdminSession() {
  if (!isAdminAuthConfigured()) return false;

  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value || "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed.expiresAt !== "number") return false;
    // Signed out on purpose by changing ADMIN_SESSION_VERSION (sessions from before the version existed count as "1").
    if ((typeof parsed.v === "string" ? parsed.v : "1") !== sessionVersion()) return false;
    const remaining = parsed.expiresAt - Date.now();
    // Expired, or issued with a longer lifetime than allowed (older 30-day sessions): sign in again.
    return remaining > 0 && remaining <= (rememberSessionSeconds + 60) * 1000;
  } catch {
    return false;
  }
}

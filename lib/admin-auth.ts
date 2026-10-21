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
 * The bcrypt hash exactly as intended: surrounding quotes and the backslashes people copy from
 * .env files ("\$2b\$12\$...") are removed, so a pasted value works on Vercel as well.
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

/** Names (never values) of the admin settings that are missing or invalid. Used for a temporary setup hint. */
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
    JSON.stringify({ expiresAt: Date.now() + seconds * 1000 })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function hasAdminSession() {
  if (!isAdminAuthConfigured()) return false;

  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value || "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed.expiresAt !== "number") return false;
    const remaining = parsed.expiresAt - Date.now();
    // Expired, or issued with a longer lifetime than allowed (older 30-day sessions): sign in again.
    return remaining > 0 && remaining <= (rememberSessionSeconds + 60) * 1000;
  } catch {
    return false;
  }
}


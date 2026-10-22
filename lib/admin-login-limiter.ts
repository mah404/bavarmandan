import "server-only";

import { createHmac } from "node:crypto";
import { LOGIN_LIMITS, type AttemptStore } from "@/lib/admin-login-core";

/*
 * The wrong-password counter lives in MongoDB, collection `admin_login_attempts`, one record per visitor address
 * (the address is stored only as an HMAC, never as text). It is not in a cookie, localStorage or server memory.
 *
 * Rules: at most 5 wrong passwords in a 15-minute window; the fifth locks sign-in for 15 minutes; the lock ends by
 * itself and a correct password clears the counter. The database can never block a sign-in: if it is slow or down,
 * the counter is skipped (and logged) and only the password decides.
 */
const COLLECTION = "admin_login_attempts";
const DB_TIMEOUT_MS = 2500;

type AttemptRecord = {
  _id: string;
  failures: number;
  windowStart: Date;
  lockedUntil?: Date;
  expiresAt: Date;
};

let indexesReady: Promise<unknown> | null = null;

/** The opaque id used for a visitor address. */
export function visitorKey(ip: string) {
  const secret = process.env.ADMIN_DASHBOARD_SESSION_SECRET || "missing-secret";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

function withTimeout<T>(work: Promise<T>): Promise<T> {
  return Promise.race([
    work,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("database timeout")), DB_TIMEOUT_MS)),
  ]);
}

async function attempts() {
  // Loaded here, not at the top: a missing MONGODB_URI makes that module throw when it is imported, and that must
  // only switch the counter off, not break the whole login route.
  const { default: clientPromise } = await import("@/lib/mongodb");
  const client = await clientPromise;
  const collection = client.db().collection<AttemptRecord>(COLLECTION);
  indexesReady ??= collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expire_admin_login_attempts" }).catch(() => null);
  await indexesReady;
  return collection;
}

function unavailable(action: string, error: unknown) {
  console.error(`[admin-login] attempt counter unavailable (${action}); sign-in continues without it:`, error instanceof Error ? error.message : error);
}

export const mongoAttemptStore: AttemptStore = {
  async lockedSeconds(key) {
    try {
      return await withTimeout(
        (async () => {
          const collection = await attempts();
          const record = await collection.findOne({ _id: key });
          const now = Date.now();
          if (record?.lockedUntil && record.lockedUntil.getTime() > now) return Math.ceil((record.lockedUntil.getTime() - now) / 1000);
          if (record?.lockedUntil) await collection.deleteOne({ _id: key });
          return 0;
        })()
      );
    } catch (error) {
      unavailable("read", error);
      return 0;
    }
  },

  async recordFailure(key) {
    try {
      return await withTimeout(
        (async () => {
          const collection = await attempts();
          const now = Date.now();
          const old = await collection.findOne({ _id: key });
          const fresh = !old?.windowStart || now - old.windowStart.getTime() >= LOGIN_LIMITS.windowMs;
          const failures = fresh ? 1 : old.failures + 1;
          const windowStart = fresh ? new Date(now) : old.windowStart;
          const locked = failures >= LOGIN_LIMITS.maxFailures;
          const lockedUntil = locked ? new Date(now + LOGIN_LIMITS.lockMs) : undefined;
          const expiresAt = new Date(Math.max(windowStart.getTime() + LOGIN_LIMITS.windowMs, lockedUntil?.getTime() ?? 0));

          await collection.updateOne(
            { _id: key },
            lockedUntil
              ? { $set: { failures, windowStart, lockedUntil, expiresAt } }
              : { $set: { failures, windowStart, expiresAt }, $unset: { lockedUntil: "" } },
            { upsert: true }
          );
          return {
            locked,
            remaining: Math.max(0, LOGIN_LIMITS.maxFailures - failures),
            retryAfterSeconds: locked ? Math.ceil(LOGIN_LIMITS.lockMs / 1000) : 0,
          };
        })()
      );
    } catch (error) {
      unavailable("write", error);
      return { locked: false, remaining: LOGIN_LIMITS.maxFailures, retryAfterSeconds: 0 };
    }
  },

  async clear(key) {
    try {
      await withTimeout((async () => (await attempts()).deleteOne({ _id: key }))());
    } catch (error) {
      unavailable("clear", error);
    }
  },
};

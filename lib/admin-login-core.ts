/*
 * The dashboard sign-in logic, with no framework and no database inside: everything it needs (the password check,
 * the attempt counter, the session token) is passed in, so the same code runs in the login route and in the tests.
 */

const BCRYPT_SHAPE = /^\$2[aby]\$\d{2}\$.{53}$/;

export const LOGIN_LIMITS = {
  /** Wrong passwords allowed inside one window. */
  maxFailures: 5,
  /** The counting window. A new window starts after it ends. */
  windowMs: 15 * 60 * 1000,
  /** How long a lock lasts. It ends by itself. */
  lockMs: 15 * 60 * 1000,
} as const;

/** Where the wrong-password counter is kept. `key` is an opaque, already-hashed id of the visitor. */
export interface AttemptStore {
  /** Seconds left of an active lock, or 0. */
  lockedSeconds(key: string): Promise<number>;
  /** Counts one wrong password. */
  recordFailure(key: string): Promise<{ locked: boolean; remaining: number; retryAfterSeconds: number }>;
  /** A correct password forgets all earlier mistakes. */
  clear(key: string): Promise<void>;
}

/** Same rules as the database store, kept in memory. Used by the tests. */
export function createMemoryStore(now: () => number = Date.now): AttemptStore {
  const records = new Map<string, { failures: number; windowStart: number; lockedUntil: number }>();

  return {
    async lockedSeconds(key) {
      const record = records.get(key);
      if (!record) return 0;
      if (record.lockedUntil > now()) return Math.ceil((record.lockedUntil - now()) / 1000);
      if (record.lockedUntil) records.delete(key);
      return 0;
    },
    async recordFailure(key) {
      const time = now();
      const old = records.get(key);
      const fresh = !old || time - old.windowStart >= LOGIN_LIMITS.windowMs;
      const failures = fresh ? 1 : old.failures + 1;
      const windowStart = fresh ? time : old.windowStart;
      const locked = failures >= LOGIN_LIMITS.maxFailures;
      records.set(key, { failures, windowStart, lockedUntil: locked ? time + LOGIN_LIMITS.lockMs : 0 });
      return {
        locked,
        remaining: Math.max(0, LOGIN_LIMITS.maxFailures - failures),
        retryAfterSeconds: locked ? Math.ceil(LOGIN_LIMITS.lockMs / 1000) : 0,
      };
    },
    async clear(key) {
      records.delete(key);
    },
  };
}

/** What happened, in words that are safe to log or send to the browser (never a password or hash). */
export type LoginCode = "ok" | "invalid_password" | "locked" | "bad_request" | "not_configured" | "hash_invalid";

export interface LoginDeps {
  store: AttemptStore;
  /** True when both the password hash and the session secret are set. */
  configured: boolean;
  /** Names (never values) of what is missing, for the 503 message. */
  problems: string[];
  passwordHash: string;
  compare: (password: string, hash: string) => Promise<boolean>;
  makeToken: (lifetimeSeconds: number) => string;
  lifetime: (remember: boolean) => number;
  /** Receives one safe diagnostic object per attempt. */
  log?: (entry: Record<string, unknown>) => void;
}

export interface LoginResult {
  status: number;
  body: Record<string, unknown>;
  /** Set only on success. */
  session?: { token: string; maxAge: number };
  retryAfterSeconds?: number;
}

const lockedBody = (retryAfterSeconds: number) => ({
  error: "به خاطر چند تلاش ناموفق، ورود تا ۱۵ دقیقه بسته شد.",
  code: "locked" satisfies LoginCode,
  locked: true,
  retryAfterSeconds,
});

/** Runs one sign-in attempt for the visitor `key` and says what to answer. */
export async function performLogin(input: { password: unknown; remember: unknown; key: string }, deps: LoginDeps): Promise<LoginResult> {
  const note = (code: LoginCode, extra: Record<string, unknown> = {}) =>
    deps.log?.({
      code,
      configured: deps.configured,
      hashFormat: BCRYPT_SHAPE.test(deps.passwordHash) ? "bcrypt" : deps.passwordHash ? "unexpected" : "missing",
      ...extra,
    });

  if (!deps.configured) {
    note("not_configured", { problems: deps.problems });
    return {
      status: 503,
      body: { error: `ورود مدیریت در سرور پیکربندی نشده است: ${deps.problems.join("، ") || "نامشخص"}`, code: "not_configured" satisfies LoginCode },
    };
  }

  const locked = await deps.store.lockedSeconds(input.key);
  if (locked > 0) {
    note("locked", { retryAfterSeconds: locked });
    return { status: 429, body: lockedBody(locked), retryAfterSeconds: locked };
  }

  const password = typeof input.password === "string" ? input.password : "";
  if (!password) {
    note("bad_request");
    return { status: 400, body: { error: "رمز عبور را وارد کنید.", code: "bad_request" satisfies LoginCode } };
  }

  // A stored value that is not shaped like a bcrypt hash can never match. This is a setup problem (typically a "$"
  // eaten when the value was expanded as a variable), so it is reported as one and does not count as a wrong password.
  if (!BCRYPT_SHAPE.test(deps.passwordHash)) {
    note("hash_invalid", { compared: null });
    return {
      status: 503,
      body: {
        error: "هش رمز روی سرور سالم نیست (احتمالاً علامت $ در متغیر محیطی خراب شده). ADMIN_DASHBOARD_PASSWORD_HASH را بررسی کنید.",
        code: "hash_invalid" satisfies LoginCode,
      },
    };
  }

  let matches = false;
  try {
    matches = await deps.compare(password, deps.passwordHash);
  } catch {
    // A stored value that is not a usable bcrypt hash is a setup problem, not a wrong password: it must not count as one.
    note("hash_invalid", { compared: null });
    return {
      status: 503,
      body: { error: "مقدار ADMIN_DASHBOARD_PASSWORD_HASH روی سرور هش معتبر bcrypt نیست.", code: "hash_invalid" satisfies LoginCode },
    };
  }

  if (!matches) {
    const result = await deps.store.recordFailure(input.key);
    note(result.locked ? "locked" : "invalid_password", { compared: false, remaining: result.remaining });
    if (result.locked) return { status: 429, body: lockedBody(result.retryAfterSeconds), retryAfterSeconds: result.retryAfterSeconds };
    return {
      status: 401,
      body: { error: "رمز درست نیست.", code: "invalid_password" satisfies LoginCode, remainingAttempts: result.remaining },
    };
  }

  await deps.store.clear(input.key);
  const maxAge = deps.lifetime(input.remember === true);
  note("ok", { compared: true });
  return {
    status: 200,
    body: { success: true, code: "ok" satisfies LoginCode, redirectTo: "/admin/dashboard" },
    session: { token: deps.makeToken(maxAge), maxAge },
  };
}

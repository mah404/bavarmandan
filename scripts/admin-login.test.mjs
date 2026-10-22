// Tests of the dashboard sign-in rules, with a throw-away password and hash (nothing real is used).
//   npm run test:auth
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const bcrypt = require("bcryptjs");

// Load the TypeScript core as it is (it has no framework or database imports).
const source = readFileSync(new URL("../lib/admin-login-core.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
const module_ = { exports: {} };
new Function("module", "exports", "require", js)(module_, module_.exports, require);
const { performLogin, createMemoryStore, LOGIN_LIMITS } = module_.exports;

const PASSWORD = "test-password-not-real";
const HASH = bcrypt.hashSync(PASSWORD, 4);
const KEY = "visitor-1";

function setup() {
  let time = 1_000_000;
  const store = createMemoryStore(() => time);
  const logs = [];
  const deps = {
    store,
    configured: true,
    problems: [],
    passwordHash: HASH,
    compare: bcrypt.compare,
    makeToken: (seconds) => `token-for-${seconds}`,
    lifetime: (remember) => (remember ? 604800 : 28800),
    log: (entry) => logs.push(entry),
  };
  return { deps, logs, advance: (ms) => (time += ms) };
}

const attempt = (deps, password, extra = {}) => performLogin({ password, remember: false, key: KEY, ...extra }, deps);

test("the right password gives 200 and a session", async () => {
  const { deps } = setup();
  const result = await attempt(deps, PASSWORD);
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.session.token, "token-for-28800");
  assert.equal((await attempt(deps, PASSWORD, { remember: true })).session.maxAge, 604800);
});

test("a wrong password gives 401 and counts down", async () => {
  const { deps } = setup();
  const result = await attempt(deps, "wrong");
  assert.equal(result.status, 401);
  assert.equal(result.body.code, "invalid_password");
  assert.equal(result.body.remainingAttempts, LOGIN_LIMITS.maxFailures - 1);
  assert.equal(result.session, undefined);
});

test("the fifth wrong password locks (429), even the right password is refused while locked", async () => {
  const { deps } = setup();
  for (let i = 0; i < LOGIN_LIMITS.maxFailures - 1; i++) assert.equal((await attempt(deps, "wrong")).status, 401);
  const fifth = await attempt(deps, "wrong");
  assert.equal(fifth.status, 429);
  assert.equal(fifth.body.locked, true);
  assert.ok(fifth.retryAfterSeconds > 0);
  const whileLocked = await attempt(deps, PASSWORD);
  assert.equal(whileLocked.status, 429);
  assert.equal(whileLocked.session, undefined);
});

test("the lock ends by itself and the right password works again", async () => {
  const { deps, advance } = setup();
  for (let i = 0; i < LOGIN_LIMITS.maxFailures; i++) await attempt(deps, "wrong");
  assert.equal((await attempt(deps, PASSWORD)).status, 429);
  advance(LOGIN_LIMITS.lockMs + 1000);
  assert.equal((await attempt(deps, PASSWORD)).status, 200);
});

test("a lock is released by a reset of the counter too", async () => {
  const { deps } = setup();
  for (let i = 0; i < LOGIN_LIMITS.maxFailures; i++) await attempt(deps, "wrong");
  await deps.store.clear(KEY);
  assert.equal((await attempt(deps, PASSWORD)).status, 200);
});

test("a correct password clears earlier mistakes", async () => {
  const { deps } = setup();
  for (let i = 0; i < LOGIN_LIMITS.maxFailures - 1; i++) await attempt(deps, "wrong");
  assert.equal((await attempt(deps, PASSWORD)).status, 200);
  // four more mistakes are allowed again: the counter started over
  for (let i = 0; i < LOGIN_LIMITS.maxFailures - 1; i++) assert.equal((await attempt(deps, "wrong")).status, 401);
});

test("mistakes older than the window are forgotten (no permanent counting)", async () => {
  const { deps, advance } = setup();
  for (let i = 0; i < LOGIN_LIMITS.maxFailures - 1; i++) await attempt(deps, "wrong");
  advance(LOGIN_LIMITS.windowMs + 1000);
  const result = await attempt(deps, "wrong");
  assert.equal(result.status, 401);
  assert.equal(result.body.remainingAttempts, LOGIN_LIMITS.maxFailures - 1);
});

test("a missing password is a bad request and is not counted", async () => {
  const { deps } = setup();
  assert.equal((await attempt(deps, "")).status, 400);
  assert.equal((await attempt(deps, undefined)).status, 400);
  assert.equal((await attempt(deps, "wrong")).body.remainingAttempts, LOGIN_LIMITS.maxFailures - 1);
});

test("missing settings answer 503 with the names, never a wrong-password result", async () => {
  const { deps } = setup();
  const result = await attempt({ ...deps, configured: false, problems: ["ADMIN_DASHBOARD_PASSWORD_HASH (خالی یا تنظیم‌نشده)"] }, PASSWORD);
  assert.equal(result.status, 503);
  assert.equal(result.body.code, "not_configured");
});

test("a stored value that is not a bcrypt hash answers 503 and does not count as a wrong password", async () => {
  const { deps } = setup();
  // the damage seen in practice: a "$" expanded as a variable removes pieces of the hash
  const damaged = HASH.replace(/^\$2[aby]\$\d{2}\$/, "");
  for (const bad of ["not-a-hash", damaged, HASH.slice(0, 30)]) {
    const result = await attempt({ ...deps, passwordHash: bad }, PASSWORD);
    assert.equal(result.status, 503, bad.slice(0, 12));
    assert.equal(result.body.code, "hash_invalid");
  }
  assert.equal((await attempt(deps, "wrong")).body.remainingAttempts, LOGIN_LIMITS.maxFailures - 1);
});

test("a compare that throws is also a setup problem, not a wrong password", async () => {
  const { deps } = setup();
  const result = await attempt({ ...deps, compare: async () => { throw new Error("Illegal hash"); } }, PASSWORD);
  assert.equal(result.status, 503);
  assert.equal(result.body.code, "hash_invalid");
});

test("the diagnostics never contain the password or the hash", async () => {
  const { deps, logs } = setup();
  await attempt(deps, "wrong");
  await attempt(deps, PASSWORD);
  const text = JSON.stringify(logs);
  assert.ok(!text.includes(PASSWORD));
  assert.ok(!text.includes("wrong"));
  assert.ok(!text.includes(HASH));
  assert.deepEqual(logs.map((entry) => entry.code), ["invalid_password", "ok"]);
  assert.equal(logs[0].hashFormat, "bcrypt");
});

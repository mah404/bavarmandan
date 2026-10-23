// Tests of the visit-statistics helpers (what is kept, what is ignored).
//   npm run test:analytics
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const source = readFileSync(new URL("../lib/site-analytics.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
const module_ = { exports: {} };
const zonesText = readFileSync(new URL("../lib/analytics-zones.ts", import.meta.url), "utf8");
const zones = { exports: {} };
new Function("module", "exports", "require", ts.transpileModule(zonesText, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText)(zones, zones.exports, require);
new Function("module", "exports", "require", js)(module_, module_.exports, (name) => (name === "./analytics-zones" ? zones.exports : require(name)));
const { parseAgent, cleanPath, referrerHost, cleanId, cleanCountry, tehranParts, lastDays, toRange, zoneParts, lastHours, startOfDay, toTimeZone, TIME_ZONES } = module_.exports;

const CHROME_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const SAFARI_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const CHROME_ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

test("devices, browsers and systems are read from the User-Agent", () => {
  assert.deepEqual(parseAgent(CHROME_WIN), { device: "desktop", browser: "Chrome", os: "Windows" });
  assert.deepEqual(parseAgent(SAFARI_IOS), { device: "mobile", browser: "Safari", os: "iOS" });
  assert.deepEqual(parseAgent(CHROME_ANDROID), { device: "mobile", browser: "Chrome", os: "Android" });
  assert.equal(parseAgent(`${CHROME_WIN} Edg/126.0`).browser, "Edge");
  assert.equal(parseAgent("Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit Safari/604.1").device, "tablet");
});

test("robots and non-browsers are not counted", () => {
  for (const ua of ["Googlebot/2.1", "curl/8.4.0", "python-requests/2.31", "Mozilla/5.0 HeadlessChrome/120", "Lighthouse", "", null, undefined]) {
    assert.equal(parseAgent(ua), null, String(ua));
  }
});

test("only counted pages are kept, without query or hash", () => {
  assert.equal(cleanPath("/"), "/");
  assert.equal(cleanPath("/taghvim-shia/?x=1#top"), "/taghvim-shia");
  for (const path of ["/admin", "/admin/dashboard/latest", "/bavarmandan-control-110/dashboard", "/api/audios", "/private-catalog", "no-slash", "", 5, null]) {
    assert.equal(cleanPath(path), null, String(path));
  }
  assert.equal(cleanPath(`/${"a".repeat(500)}`).length, 200);
});

test("the referrer is the bare host, and the site itself is not a referrer", () => {
  assert.equal(referrerHost("https://www.google.com/search?q=x"), "google.com");
  assert.equal(referrerHost("https://t.me/channel"), "t.me");
  assert.equal(referrerHost("https://www.bavarmandan.com/"), "");
  assert.equal(referrerHost("http://localhost:3000/"), "");
  assert.equal(referrerHost(""), "");
  assert.equal(referrerHost("not a url"), "");
});

test("ids and country codes are validated", () => {
  assert.equal(cleanId("a1b2c3d4e5f6a7b8c9d0e1f2"), "a1b2c3d4e5f6a7b8c9d0e1f2");
  for (const bad of ["", "short", "has space in it 12345", "x".repeat(41), "$where:1234567", null, 5]) assert.equal(cleanId(bad), "", String(bad));
  assert.equal(cleanCountry("ir"), "IR");
  for (const bad of ["", "XX", "T1", "IRN", "1A", null, undefined]) assert.equal(cleanCountry(bad), "", String(bad));
});

test("the day and hour follow the Iranian clock", () => {
  // 20:45 UTC on 22 Oct is 00:15 on 23 Oct in Iran (UTC+3:30, no summer time after 2022).
  assert.deepEqual(tehranParts(new Date("2026-10-22T20:45:00Z")), { day: "2026-10-23", hour: 0 });
  assert.deepEqual(tehranParts(new Date("2026-10-22T20:15:00Z")), { day: "2026-10-22", hour: 23 });
});

test("the list of days is consecutive, oldest first, and ends today", () => {
  const days = lastDays(7, new Date("2026-10-23T09:00:00Z"));
  assert.equal(days.length, 7);
  assert.equal(days[6], "2026-10-23");
  assert.equal(days[0], "2026-10-17");
  assert.equal(new Set(lastDays(90, new Date("2026-10-23T09:00:00Z"))).size, 90);
});

test("only 1 (24 hours), 7, 30 and 90 are accepted as a range", () => {
  assert.equal(toRange("1"), 1); // the last 24 hours
  assert.equal(toRange("7"), 7);
  assert.equal(toRange("90"), 90);
  for (const bad of ["2", "abc", null, undefined, "30; drop"]) assert.equal(toRange(bad), 30, String(bad));
});

// ---- numbers saved from the hosting dashboard ----
const history = (() => {
  const text = readFileSync(new URL("../lib/analytics-history.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(text, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
  const holder = { exports: {} };
  new Function("module", "exports", "require", code)(holder, holder.exports, require);
  return holder.exports;
})();

test("the saved daily numbers cover 23 Sep – 22 Oct without a gap", () => {
  const days = Object.keys(history.HISTORY_DAILY);
  assert.equal(days.length, 30);
  assert.equal(days[0], "2026-09-23");
  assert.equal(days[29], history.HISTORY_UNTIL);
  for (let i = 1; i < days.length; i++) assert.equal((Date.parse(days[i]) - Date.parse(days[i - 1])) / 86_400_000, 1, days[i]);
});

test("a range with no saved day gets nothing from the saved numbers", () => {
  assert.equal(history.historyFor(["2026-11-20", "2026-11-21"]), null);
  assert.equal(history.historyFor([]), null);
});

test("the last week uses the week's own totals, in proportion to the days it covers", () => {
  const all = ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"];
  const whole = history.historyFor(all);
  assert.equal(whole.visitors, 51);
  assert.equal(whole.pageViews, 303);
  assert.deepEqual(whole.countries[0], ["DE", 19]);
  // without the first day (6 of 53 visitors) a little less is counted
  const part = history.historyFor(all.slice(1));
  assert.ok(part.visitors < 51 && part.visitors > 40);
  assert.ok(part.pageViews < 303);
});

test("a month uses the month's totals, and later days (live ones) are not part of it", () => {
  const month = Object.keys(history.HISTORY_DAILY);
  assert.equal(history.historyFor(month).visitors, 221);
  assert.equal(history.historyFor(month).countries[0][0], "US");
  const withLive = history.historyFor([...month.slice(1), "2026-10-23"]);
  assert.equal(withLive.covered.length, 29);
  assert.ok(withLive.visitors < 221);
});

// ---- clocks ----
test("the same instant is a different day and hour on different clocks", () => {
  const instant = new Date("2026-10-22T22:00:00Z");
  assert.deepEqual(zoneParts(instant, "Asia/Tehran"), { day: "2026-10-23", hour: 1 }); // UTC+3:30
  assert.deepEqual(zoneParts(instant, "Europe/Berlin"), { day: "2026-10-23", hour: 0 }); // UTC+2 until 25 Oct
  assert.deepEqual(zoneParts(instant, "America/New_York"), { day: "2026-10-22", hour: 18 }); // UTC-4
  assert.deepEqual(zoneParts(instant, "America/Los_Angeles"), { day: "2026-10-22", hour: 15 }); // UTC-7
});

test("a day begins at the right instant on each clock, also across a clock change", () => {
  assert.equal(startOfDay("2026-10-23", "Asia/Tehran").toISOString(), "2026-10-22T20:30:00.000Z");
  assert.equal(startOfDay("2026-10-23", "Europe/Berlin").toISOString(), "2026-10-22T22:00:00.000Z");
  assert.equal(startOfDay("2026-10-23", "America/New_York").toISOString(), "2026-10-23T04:00:00.000Z");
  // Germany goes back to winter time on 25 Oct 2026 at 03:00: that day has 25 hours
  assert.equal(startOfDay("2026-10-26", "Europe/Berlin").toISOString(), "2026-10-25T23:00:00.000Z");
  assert.equal(startOfDay("2026-10-25", "Europe/Berlin").toISOString(), "2026-10-24T22:00:00.000Z");
});

test("the days of a range follow the clock: late evening in Iran is still yesterday in America", () => {
  const now = new Date("2026-10-23T02:00:00Z"); // 05:30 in Iran, 22:00 the day before in New York
  assert.equal(lastDays(3, now, "Asia/Tehran")[2], "2026-10-23");
  assert.equal(lastDays(3, now, "America/New_York")[2], "2026-10-22");
  assert.equal(new Set(lastDays(90, now, "Europe/Berlin")).size, 90);
});

test("only known clocks are accepted, and Iran, Germany and the US are among them", () => {
  for (const zone of ["Asia/Tehran", "Europe/Berlin", "America/New_York", "America/Los_Angeles"]) assert.ok(zone in TIME_ZONES, zone);
  assert.equal(toTimeZone("Europe/Berlin"), "Europe/Berlin");
  for (const bad of ["Mars/Base", "", null, undefined, "$where"]) assert.equal(toTimeZone(bad), "Asia/Tehran", String(bad));
});

test("the last 24 hours are 24 consecutive clock hours that end with the current one", () => {
  const now = new Date("2026-10-23T02:20:00Z"); // 05:50 in Iran
  const keys = lastHours(now, "Asia/Tehran");
  assert.equal(keys.length, 24);
  assert.equal(keys[23], "2026-10-23 05");
  assert.equal(keys[0], "2026-10-22 06");
  assert.equal(lastHours(now, "America/New_York")[23], "2026-10-22 22");
  assert.equal(new Set(keys).size, 24);
});

test("the saved last-24-hours are placed on whichever clock is chosen, and only hours that were saved", () => {
  // the picture covered 14:00 Berlin on 22 Oct to the following 13:00; its last hour was still running
  const berlin = [];
  for (let h = 14; h < 24; h++) berlin.push(`2026-10-22 ${h}`);
  for (let h = 0; h < 14; h++) berlin.push(`2026-10-23 ${String(h).padStart(2, "0")}`);
  const result = history.historyForHours(berlin, "Europe/Berlin");
  assert.equal(result.byKey.size, 23);
  assert.equal(result.byKey.get("2026-10-23 10"), 3);
  assert.equal(result.byKey.has("2026-10-23 13"), false); // the unfinished hour is left to the live records
  assert.equal(result.visitors, 9);
  assert.equal(result.pageViews, 87);
  // on the Iranian clock (1.5 h ahead) the same hours get other labels
  const tehran = history.historyForHours(["2026-10-23 12", "2026-10-23 11"], "Asia/Tehran");
  assert.equal(tehran.byKey.size, 2);
  assert.ok(tehran.byKey.get("2026-10-23 12") === 3 || tehran.byKey.get("2026-10-23 11") === 3);
  assert.equal(history.historyForHours(["2026-11-20 10"], "Europe/Berlin"), null);
  assert.ok(history.HOURLY_UNTIL > Date.parse("2026-10-23T09:00:00Z"));
});

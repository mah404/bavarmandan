"use client";

/*
 * Sends visit statistics from the visitor's browser. Nothing here can break the page: every failure is swallowed.
 * The visitor is a random id kept in this browser (no name, no address); a visit "session" is a random id kept
 * until the tab is closed.
 */

const ENDPOINT = "/api/analytics/collect";

function randomId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function keep(storage: Storage | undefined, key: string): string {
  try {
    let value = storage?.getItem(key) ?? "";
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(value)) {
      value = randomId();
      storage?.setItem(key, value);
    }
    return value;
  } catch {
    return randomId();
  }
}

/** A browser that asks not to be tracked is not counted. */
const optedOut = () => typeof navigator !== "undefined" && (navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1");

function send(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
    void fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
  } catch {
    /* counting is optional */
  }
}

function ids() {
  const vid = keep(window.localStorage, "bv_vid");
  let fresh = false;
  let sid = "";
  try {
    sid = window.sessionStorage.getItem("bv_sid") ?? "";
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(sid)) {
      sid = randomId();
      window.sessionStorage.setItem("bv_sid", sid);
      fresh = true;
    }
  } catch {
    sid = randomId();
    fresh = true;
  }
  return { vid, sid, fresh };
}

/** The dashboard is not part of the audience. */
const isPrivate = (path: string) => /^\/(admin|bavarmandan-control-110)(\/|$)/.test(path);

let last = { path: "", time: 0 };

export function trackPageview(path: string) {
  if (typeof window === "undefined" || optedOut() || isPrivate(path)) return;
  // The same page twice in a moment (a development double render, a quick re-render) is one visit.
  if (last.path === path && Date.now() - last.time < 1500) return;
  last = { path, time: Date.now() };

  const { vid, sid, fresh } = ids();
  const query = new URLSearchParams(window.location.search);
  send({
    type: "pageview",
    path,
    vid,
    sid,
    // Where the visitor came from only counts at the start of a visit.
    ref: fresh ? document.referrer : "",
    utm: fresh ? query.get("utm_source") || "" : "",
  });
}

/** One counted action: playing a lesson, opening or downloading a PDF. */
export function trackEvent(name: "audio_play" | "pdf_view" | "pdf_download" | "audio_download", label: string) {
  if (typeof window === "undefined" || optedOut() || isPrivate(window.location.pathname)) return;
  const { vid, sid } = ids();
  send({ type: "event", name, label, path: window.location.pathname, vid, sid });
}

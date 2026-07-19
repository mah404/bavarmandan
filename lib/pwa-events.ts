"use client";

type PwaEventPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

const getVisitorId = () => {
  const storageKey = "bavarmandan_pwa_visitor_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const id =
    window.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(storageKey, id);
  return id;
};

const getDisplayMode = () => {
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return "standalone";
  }
  if (window.matchMedia("(display-mode: fullscreen)").matches) {
    return "fullscreen";
  }
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone) {
    return "ios-standalone";
  }
  return "browser";
};

export function recordPwaEvent(
  event: string,
  payload: PwaEventPayload = {}
) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    event,
    payload,
    visitorId: getVisitorId(),
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || null,
    displayMode: getDisplayMode(),
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  fetch("/api/pwa-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    cache: "no-store",
  }).catch(() => {
    if (!navigator.sendBeacon) return;
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/pwa-events", blob);
  });
}

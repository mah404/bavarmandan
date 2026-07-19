"use client";

type PwaEventPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    __bavarmandanTrackingPixels?: HTMLImageElement[];
  }
}

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

  const params = new URLSearchParams({
    event,
    visitorId: getVisitorId(),
    url: window.location.href,
    path: window.location.pathname,
    displayMode: getDisplayMode(),
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    t: String(Date.now()),
  });

  if (document.referrer) {
    params.set("referrer", document.referrer);
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const image = new Image();
  window.__bavarmandanTrackingPixels ??= [];
  window.__bavarmandanTrackingPixels.push(image);
  image.onload = image.onerror = () => {
    window.__bavarmandanTrackingPixels =
      window.__bavarmandanTrackingPixels?.filter((item) => item !== image);
  };
  image.decoding = "async";
  image.src = `/api/pwa-events?${params.toString()}`;
}

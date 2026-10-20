"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

import { recordPwaEvent } from "@/lib/pwa-events";

export function PWARegister() {
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) {
      track("pwa_opened_standalone");
    }

    recordPwaEvent("site_link_opened", {
      source: isStandalone ? "standalone_app" : "browser",
    });

    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // Development: a worker left over from an earlier production build would serve stale files forever.
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => ("caches" in window ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))) : null))
        .catch(() => {});
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA support is progressive; the site still works if registration fails.
      });
    });
  }, []);

  return null;
}

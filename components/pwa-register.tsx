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
      recordPwaEvent("pwa_opened_standalone");
    }

    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA support is progressive; the site still works if registration fails.
      });
    });
  }, []);

  return null;
}

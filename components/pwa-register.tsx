"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
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

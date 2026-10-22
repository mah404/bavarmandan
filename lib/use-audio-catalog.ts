"use client";

import { useCallback, useEffect, useState } from "react";
import type { AudioCatalog } from "@/lib/media-api";

let cachedCatalog: AudioCatalog | null = null;
let inFlight: Promise<AudioCatalog> | null = null;
// Bumped so catalogs cached from the old source are dropped.
const storageKey = "bavarmandan-audio-catalog-v8";
let refreshedThisVisit = false;

// Every mounted hook gets the new catalog when a background refresh finds a change.
const listeners = new Set<(catalog: AudioCatalog) => void>();

function readStoredCatalog() {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as AudioCatalog) : null;
  } catch {
    return null;
  }
}

function storeCatalog(catalog: AudioCatalog) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(catalog));
  } catch {
    // Ignore storage quota/private mode issues.
  }
}

/*
 * Changes made in the dashboard show up without a reload: the dashboard announces each change (same browser,
 * instantly), and every open page also checks again when it regains focus and every 30 seconds while visible.
 */
let autoRefreshStarted = false;
let lastRefresh = 0;

function refreshNow(ignoreVisibility = false) {
  if (!ignoreVisibility && document.visibilityState === "hidden") return;
  const now = Date.now();
  if (!ignoreVisibility && now - lastRefresh < 3000) return;
  lastRefresh = now;
  void fetchCatalog(true, ignoreVisibility).catch(() => undefined);
}

function startAutoRefresh() {
  if (autoRefreshStarted || typeof window === "undefined") return;
  autoRefreshStarted = true;

  window.addEventListener("focus", () => refreshNow());
  document.addEventListener("visibilitychange", () => refreshNow());
  window.setInterval(() => refreshNow(), 30_000);

  try {
    new BroadcastChannel("bv-content").onmessage = () => refreshNow(true);
  } catch {
    // Older browsers: the storage event below covers the same case.
  }
  window.addEventListener("storage", (event) => {
    if (event.key === "bv-content-changed") refreshNow(true);
  });
}

async function fetchCatalog(force = false, fresh = false): Promise<AudioCatalog> {
  if (cachedCatalog && !force) return cachedCatalog;
  if (!force) {
    const stored = readStoredCatalog();
    if (stored) {
      cachedCatalog = stored;
      return stored;
    }
  }
  // A change announced while a request is already running must not be answered by that older request.
  if (inFlight) return force ? inFlight.then(() => fetchCatalog(true, fresh)) : inFlight;

  inFlight = fetch(fresh ? "/api/audios?fresh=1" : "/api/audios", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await response.text());
      }
      // The built-in emergency copy must never replace a real catalog we already have.
      if (response.headers.get("X-Catalog-Source") === "fallback" && cachedCatalog) return cachedCatalog;
      return response.json() as Promise<AudioCatalog>;
    })
    .then((catalog) => {
      const changed = JSON.stringify(cachedCatalog) !== JSON.stringify(catalog);
      cachedCatalog = catalog;
      storeCatalog(catalog);
      if (changed) listeners.forEach((listener) => listener(catalog));
      return catalog;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function useAudioCatalog() {
  const [catalog, setCatalog] = useState<AudioCatalog | null>(cachedCatalog);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startAutoRefresh();
    listeners.add(setCatalog);
    return () => {
      listeners.delete(setCatalog);
    };
  }, []);

  const load = useCallback(async (force = false) => {
    // The saved copy is only for a fast first paint: the first load of every visit fetches fresh data,
    // so what the dashboard just changed is what visitors see.
    if (!refreshedThisVisit) {
      refreshedThisVisit = true;
      force = true;
    }

    if (cachedCatalog && !force) {
      setCatalog(cachedCatalog);
      return cachedCatalog;
    }

    if (cachedCatalog && force) {
      setCatalog(cachedCatalog);
    } else {
      const stored = readStoredCatalog();
      if (stored) {
        cachedCatalog = stored;
        setCatalog(stored);
      }
    }

    setLoading(true);
    setError(null);

    try {
      const next = await fetchCatalog(force);
      setCatalog(next);
      return next;
    } catch (err) {
      console.error("Audio catalog fetch failed:", err);

      const stored = readStoredCatalog();
      if (stored) {
        cachedCatalog = stored;
        setCatalog(stored);
        return stored;
      }

      setError("خطا در دریافت فهرست فایل‌ها. لطفاً دوباره تلاش کنید.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { catalog, loading, error, load };
}

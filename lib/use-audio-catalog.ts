"use client";

import { useCallback, useState } from "react";
import type { AudioCatalog } from "@/lib/media-api";

let cachedCatalog: AudioCatalog | null = null;
let inFlight: Promise<AudioCatalog> | null = null;

async function fetchCatalog(force = false) {
  if (cachedCatalog && !force) return cachedCatalog;
  if (inFlight) return inFlight;

  inFlight = fetch("/api/audios", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json() as Promise<AudioCatalog>;
    })
    .then((catalog) => {
      cachedCatalog = catalog;
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

  const load = useCallback(async (force = false) => {
    if (cachedCatalog && !force) {
      setCatalog(cachedCatalog);
      return cachedCatalog;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await fetchCatalog(force);
      setCatalog(next);
      return next;
    } catch (err) {
      console.error("Audio catalog fetch failed:", err);
      setError("خطا در دریافت فهرست فایل‌ها. لطفاً دوباره تلاش کنید.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { catalog, loading, error, load };
}

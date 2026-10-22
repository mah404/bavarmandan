"use client";

import { useCallback, useEffect, useRef } from "react";

/** Same as the site's navbar: pressing the logo plays /sout.mp3, pressing it again stops it. */
export function toggleAudioOn(ref: { current: HTMLAudioElement | null }) {
  if (!ref.current) ref.current = new Audio("/sout.mp3");
  const audio = ref.current;
  if (!audio.paused) {
    audio.pause();
    audio.currentTime = 0;
    return;
  }
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function useLogoAudio() {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      ref.current?.pause();
      if (ref.current) ref.current.currentTime = 0;
    };
  }, []);

  return useCallback(() => toggleAudioOn(ref), []);
}

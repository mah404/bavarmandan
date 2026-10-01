"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, X, Music2 } from "lucide-react";

const RAW_MUSIC_URL = "http://167.233.60.102:3001/assets/music/backmusic.mp3";
const MUSIC_URL = `/api/stream?url=${encodeURIComponent(RAW_MUSIC_URL)}`;
const DEFAULT_VOLUME = 0.6;
const BAR_COUNT = 4;
const WAVE_COUNT = 24;

type AudioMode = "live" | "idle";

function fadeAudio(audio: HTMLAudioElement, to: number, duration = 400) {
  const from = audio.volume;
  const startedAt = performance.now();

  return new Promise<void>((resolve) => {
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      audio.volume = from + (to - from) * eased;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        audio.volume = to;
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

export function BackgroundMusicBubble() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [mode, setMode] = useState<AudioMode>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const sourceCreatedRef = useRef(false);
  const closedByUserRef = useRef(false);
  const suspendedBySessionRef = useRef(false);
  const wasPlayingBeforeSessionRef = useRef(false);
  const wasVisibleBeforeSessionRef = useRef(false);
  const wasOpenBeforeSessionRef = useRef(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const volRef = useRef<HTMLDivElement | null>(null);
  const barRefs = useRef<Array<HTMLElement | null>>([]);
  const waveRefs = useRef<Array<HTMLElement | null>>([]);
  const rafRef = useRef<number | null>(null);
  const draggingVolumeRef = useRef(false);
  const introCollapseTimerRef = useRef<number | null>(null);
  const autoCollapseTimerRef = useRef<number | null>(null);

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
    []
  );

  useEffect(() => {
    const audio = new Audio();
    audio.src = MUSIC_URL;
    audio.loop = true;
    audio.preload = "none";
    audio.crossOrigin = "anonymous";
    audio.volume = 0;
    audioRef.current = audio;

    return () => {
      if (introCollapseTimerRef.current) {
        window.clearTimeout(introCollapseTimerRef.current);
      }
      if (autoCollapseTimerRef.current) {
        window.clearTimeout(autoCollapseTimerRef.current);
      }
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      if (contextRef.current && contextRef.current.state !== "closed") {
        contextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const measure = () => {
    const bubble = bubbleRef.current;
    const body = bodyRef.current;
    if (!bubble || !body) return;
    const width = Math.min(63 + body.offsetWidth + 4, window.innerWidth - 24);
    bubble.style.setProperty("--w", `${width}px`);
  };

  const clearAutoCollapse = () => {
    if (autoCollapseTimerRef.current) {
      window.clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
  };

  const scheduleAutoCollapse = () => {
    clearAutoCollapse();
    autoCollapseTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      autoCollapseTimerRef.current = null;
    }, 4000);
  };

  const setupAnalyser = async () => {
    const audio = audioRef.current;
    if (!audio || sourceCreatedRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = contextRef.current || new AudioContextClass();
      contextRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      sourceCreatedRef.current = true;
      setMode("live");
    } catch (error) {
      console.warn("Background music analyser fallback:", error);
      analyserRef.current = null;
      dataRef.current = null;
      setMode("idle");
    }
  };

  const startMusic = async ({ reveal = true } = {}) => {
    const audio = audioRef.current;
    if (!audio) return;
    closedByUserRef.current = false;
    if (reveal) {
      setVisible(true);
      setOpen(true);
      window.setTimeout(measure, 0);
      window.setTimeout(() => {
        bubbleRef.current?.animate(
          [
            { opacity: 0, transform: "scale(.6)" },
            { opacity: 1, transform: "none" },
          ],
          reducedMotion
            ? { duration: 1 }
            : { duration: 560, easing: "cubic-bezier(.2,1.5,.35,1)", fill: "both" }
        );
      }, 0);
      if (introCollapseTimerRef.current) {
        window.clearTimeout(introCollapseTimerRef.current);
      }
      introCollapseTimerRef.current = window.setTimeout(
        () => {
          setOpen(false);
          introCollapseTimerRef.current = null;
        },
        reducedMotion ? 500 : 1500
      );
    }

    await setupAnalyser();
    try {
      audio.volume = 0;
      await audio.play();
      setPlaying(true);
      await fadeAudio(audio, volume, 450);
    } catch (error) {
      setPlaying(false);
      console.warn("Background music play failed:", error);
    }
  };

  const pauseMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    await fadeAudio(audio, 0, 250);
    audio.pause();
    setPlaying(false);
  };

  const closeMusic = async () => {
    const audio = audioRef.current;
    closedByUserRef.current = true;
    suspendedBySessionRef.current = false;
    clearAutoCollapse();
    if (introCollapseTimerRef.current) {
      window.clearTimeout(introCollapseTimerRef.current);
      introCollapseTimerRef.current = null;
    }
    if (audio) {
      await fadeAudio(audio, 0, 400);
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    const animation = bubbleRef.current?.animate(
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "scale(.6)" },
      ],
      reducedMotion
        ? { duration: 1 }
        : { duration: 300, easing: "cubic-bezier(.45,0,.8,.4)", fill: "both" }
    );
    if (animation) {
      animation.onfinish = () => {
        setVisible(false);
        setOpen(false);
      };
    } else {
      setVisible(false);
      setOpen(false);
    }
  };

  const hideForSessionAudio = async () => {
    const audio = audioRef.current;
    clearAutoCollapse();
    if (introCollapseTimerRef.current) {
      window.clearTimeout(introCollapseTimerRef.current);
      introCollapseTimerRef.current = null;
    }
    wasVisibleBeforeSessionRef.current = visible;
    wasOpenBeforeSessionRef.current = open;
    wasPlayingBeforeSessionRef.current = !!audio && !audio.paused && !closedByUserRef.current;
    if (!audio || closedByUserRef.current || !visible) return;

    suspendedBySessionRef.current = true;
    const animation = bubbleRef.current?.animate(
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "scale(.6)" },
      ],
      reducedMotion
        ? { duration: 1 }
        : { duration: 260, easing: "cubic-bezier(.45,0,.8,.4)", fill: "both" }
    );

    const animationDone = animation
      ? new Promise<void>((resolve) => {
          animation.onfinish = () => resolve();
          animation.oncancel = () => resolve();
        })
      : Promise.resolve();

    await Promise.all([fadeAudio(audio, 0, 260), animationDone]);
    if (suspendedBySessionRef.current) {
      audio.pause();
      setPlaying(false);
      setOpen(false);
      setVisible(false);
    }
  };

  const restoreAfterSessionAudio = () => {
    if (
      closedByUserRef.current ||
      !suspendedBySessionRef.current ||
      !wasVisibleBeforeSessionRef.current
    ) {
      return;
    }

    suspendedBySessionRef.current = false;
    setVisible(true);
    setOpen(wasOpenBeforeSessionRef.current);
    window.setTimeout(measure, 0);
    window.setTimeout(() => {
      bubbleRef.current?.animate(
        [
          { opacity: 0, transform: "scale(.6)" },
          { opacity: 1, transform: "none" },
        ],
        reducedMotion
          ? { duration: 1 }
          : { duration: 420, easing: "cubic-bezier(.2,1.5,.35,1)", fill: "both" }
      );
    }, 0);

    if (wasPlayingBeforeSessionRef.current) {
      startMusic({ reveal: false });
    }
  };

  useEffect(() => {
    const onTrigger = () => {
      if (playing) {
        setVisible(true);
        setOpen(true);
        window.setTimeout(measure, 0);
        scheduleAutoCollapse();
        return;
      }
      startMusic({ reveal: true });
    };

    const onSessionPlay = () => {
      hideForSessionAudio();
    };

    const onSessionClose = () => {
      restoreAfterSessionAudio();
    };

    window.addEventListener("bavarmandan:background-music-trigger", onTrigger);
    window.addEventListener("bavarmandan:session-audio-play", onSessionPlay);
    window.addEventListener("bavarmandan:session-audio-close", onSessionClose);
    return () => {
      window.removeEventListener("bavarmandan:background-music-trigger", onTrigger);
      window.removeEventListener("bavarmandan:session-audio-play", onSessionPlay);
      window.removeEventListener("bavarmandan:session-audio-close", onSessionClose);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, reducedMotion, volume, visible, open]);

  useEffect(() => {
    const frame = (now: number) => {
      const analyser = analyserRef.current;
      const data = dataRef.current;
      const levels: number[] = [];
      if (mode === "live" && analyser && data && playing) {
        analyser.getByteFrequencyData(data);
        for (let i = 0; i < 26; i += 1) levels.push((data[2 + i] || 0) / 255);
      }

      barRefs.current.forEach((bar, index) => {
        if (!bar) return;
        const live = levels.length ? levels[2 + index * 4] || 0 : 0;
        const idle = playing ? 0.25 + 0.15 * Math.sin(now / 260 + index) : 0;
        bar.style.height = `${(6 + Math.max(live, idle) * 16).toFixed(1)}px`;
      });

      waveRefs.current.forEach((bar, index) => {
        if (!bar) return;
        const live = levels.length ? levels[index + 1] || 0 : 0;
        const idle = playing ? 0.12 + 0.08 * Math.sin(now / 300 + index * 0.6) : 0;
        bar.style.height = `${(3 + Math.max(live, idle) * 13).toFixed(1)}px`;
      });

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
    if (!open || !bubbleRef.current) return;
      if (bubbleRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("click", onDocumentClick);
    window.addEventListener("resize", measure);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      scheduleAutoCollapse();
    } else {
      clearAutoCollapse();
    }

    return clearAutoCollapse;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateVolumeFromClientX = (x: number) => {
    const slider = volRef.current;
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const next = Math.min(1, Math.max(0, (x - rect.left) / rect.width));
    setVolume(next);
  };

  if (!visible) return null;

  return (
    <div
      ref={bubbleRef}
      className={`music-bubble ${open ? "open" : ""} ${playing ? "playing" : "idle"}`}
      role="region"
      aria-label="نوای پس‌زمینه"
      dir="ltr"
      onPointerDown={() => {
        if (open) scheduleAutoCollapse();
      }}
      onFocusCapture={() => {
        if (open) scheduleAutoCollapse();
      }}
    >
      <button
        type="button"
        className="music-orb"
        aria-label={open ? "توقف یا پخش نوای پس‌زمینه" : "باز کردن نوای پس‌زمینه"}
        aria-expanded={open}
        onClick={() => {
          if (!open) {
            setOpen(true);
            window.setTimeout(measure, 0);
            scheduleAutoCollapse();
            return;
          }
          if (playing) {
            pauseMusic();
          } else {
            startMusic({ reveal: false });
          }
        }}
      >
        <span className="music-ring" />
        <span className="music-core">
          {Array.from({ length: BAR_COUNT }).map((_, index) => (
            <i key={index} ref={(node) => { barRefs.current[index] = node; }} />
          ))}
          <Music2 aria-hidden="true" />
        </span>
      </button>

      <div ref={bodyRef} className="music-body">
        <div className="music-meta">
          <b>نوای پس‌زمینه</b>
          <span className="sr-only">{playing ? "در حال پخش" : "متوقف"}</span>
          <div className="music-wave" aria-hidden="true">
            {Array.from({ length: WAVE_COUNT }).map((_, index) => (
              <i key={index} ref={(node) => { waveRefs.current[index] = node; }} />
            ))}
          </div>
        </div>

        <div
          ref={volRef}
          className="music-vol"
          role="slider"
          aria-label="بلندی صدا"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(volume * 100)}
          onPointerDown={(event) => {
            draggingVolumeRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            updateVolumeFromClientX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (draggingVolumeRef.current) updateVolumeFromClientX(event.clientX);
          }}
          onPointerUp={() => {
            draggingVolumeRef.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") setVolume((v) => Math.min(1, v + 0.1));
            if (event.key === "ArrowLeft") setVolume((v) => Math.max(0, v - 0.1));
          }}
        >
          <b style={{ width: `${volume * 100}%` }} />
          <span style={{ left: `${volume * 100}%` }} />
        </div>

        <button
          type="button"
          className="music-ctl music-pp"
          aria-label={playing ? "توقف نوای پس‌زمینه" : "پخش نوای پس‌زمینه"}
          onClick={() => {
            if (playing) pauseMusic();
            else startMusic({ reveal: false });
          }}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>

        <button
          type="button"
          className="music-ctl"
          aria-label="بستن نوای پس‌زمینه"
          onClick={closeMusic}
        >
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

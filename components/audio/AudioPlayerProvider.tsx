"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/media-api";
import {
  useSheetNav,
  type SheetNavTarget,
} from "@/components/layout/sections/SheetNavProvider";
import {
  ChevronUp,
  FastForward,
  Minus,
  Pause,
  Play,
  Rewind,
  Repeat2,
  Share2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

type Track = {
  title: string;
  url: string;
  description?: string;
  cover?: string;
  lessonStart?: number | null;
  lessonEnd?: number | null;
  segmentMode?: "lesson" | "full";
  navTarget?: SheetNavTarget | null;
};

type SavedState = {
  track: Track;
  progress: number;
  volume: number;
  muted: boolean;
  playbackRate?: number;
  // (legacy fields kept for compatibility)
  pos?: { x: number; y: number } | null;
  width?: number;
};

type PlayerPosition = { x: number; y: number };
type DragTarget = "expanded" | "minimized";
type PlayerSize = { width: number; height: number };
type ResizeEdge = "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

type AudioCtx = {
  current: Track | null;
  isPlaying: boolean;
  duration: number;
  progress: number;
  volume: number;
  muted: boolean;
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  close: () => void;
  notifyLessonSoon: () => void;
};

const AudioPlayerContext = createContext<AudioCtx | null>(null);
export const useAudioPlayer = () => {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within provider");
  return ctx;
};

const STORAGE_KEY = "globalAudioState_v1";
const LESSON_SOON_MESSAGE = "امکان پخش بخش‌های منتخب به‌زودی فراهم می‌شود.";
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.5, 2] as const;

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { goTo } = useSheetNav();

  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const toastExitTimerRef = useRef<number | null>(null);

  // Docked visibility + minimize
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition | null>(
    null
  );
  const [playerSize, setPlayerSize] = useState<PlayerSize | null>(null);
  const [minimizedPosition, setMinimizedPosition] =
    useState<PlayerPosition | null>(null);
  const dragRef = useRef<{
    target: DragTarget;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
    moved: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const segmentFrameRef = useRef<number | null>(null);

  // Scrub
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  // Portal mount flag
  const [mounted, setMounted] = useState(false);

  // Resume prompt
  const savedStateRef = useRef<SavedState | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const latestStateRef = useRef<{
    current: Track | null;
    progress: number;
    volume: number;
    muted: boolean;
    playbackRate: number;
  }>({ current: null, progress: 0, volume: 1, muted: false, playbackRate: 1 });

  // Create audio element once
  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
  }

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setProgress(audio.currentTime || 0);
    const onPlay = () => {
      setIsPlaying(true);
      window.dispatchEvent(new CustomEvent("bavarmandan:session-audio-play"));
    };
    const onPause = () => {
      setIsPlaying(false);
      window.dispatchEvent(new CustomEvent("bavarmandan:session-audio-pause"));
    };
    const onEnd = () => {
      setIsPlaying(false);
      window.dispatchEvent(new CustomEvent("bavarmandan:session-audio-pause"));
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  // Volume/mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    if (segmentFrameRef.current) {
      cancelAnimationFrame(segmentFrameRef.current);
      segmentFrameRef.current = null;
    }

    const audio = audioRef.current;
    const lessonStart = current?.lessonStart ?? null;
    const lessonEnd = current?.lessonEnd ?? null;
    const hasLessonSegment =
      current?.segmentMode === "lesson" &&
      typeof lessonStart === "number" &&
      typeof lessonEnd === "number" &&
      lessonEnd > lessonStart;

    if (!audio || !isPlaying || !hasLessonSegment) return;

    const tick = () => {
      if (audio.currentTime >= lessonEnd) {
        audio.pause();
        audio.currentTime = lessonEnd;
        setProgress(lessonEnd);
        segmentFrameRef.current = null;
        return;
      }

      segmentFrameRef.current = requestAnimationFrame(tick);
    };

    segmentFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (segmentFrameRef.current) {
        cancelAnimationFrame(segmentFrameRef.current);
        segmentFrameRef.current = null;
      }
    };
  }, [current, isPlaying]);

  // Mount + load saved state
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedState;
        if (parsed?.track?.url) {
          savedStateRef.current = parsed;
      setShowResumePrompt(true);
        }
      }
    } catch {}

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (toastExitTimerRef.current) {
        window.clearTimeout(toastExitTimerRef.current);
      }
    };
  }, []);

  // Save periodically (throttled)
  const saveTimer = useRef<number | null>(null);
  const clearSavedState = () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    savedStateRef.current = null;
    setShowResumePrompt(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const saveState = (immediate = false) => {
    const latest = latestStateRef.current;
    if (!latest.current) return;
    const snapshot: SavedState = {
      track: latest.current,
      progress: latest.progress,
      volume: latest.volume,
      muted: latest.muted,
      playbackRate: latest.playbackRate,
    };
    const doSave = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {}
    };
    if (immediate) return doSave();
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(doSave, 800);
  };

  useEffect(() => {
    latestStateRef.current = { current, progress, volume, muted, playbackRate };
    if (current) saveState(); // on progress / volume / mute changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, progress, volume, muted, playbackRate]);

  // Save on unload/pagehide
  useEffect(() => {
    const handler = () => saveState(true);
    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("pagehide", handler);
    };
  }, []);

  // Playback API
  const play = async (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    const lessonStart = track.lessonStart ?? null;
    const lessonEnd = track.lessonEnd ?? null;
    const hasLessonSegment =
      track.segmentMode === "lesson" &&
      typeof lessonStart === "number" &&
      typeof lessonEnd === "number" &&
      lessonEnd > lessonStart;
    const same =
      current?.url === track.url &&
      current?.segmentMode === track.segmentMode &&
      current?.lessonStart === track.lessonStart &&
      current?.lessonEnd === track.lessonEnd;

    if (!same) {
      setCurrent(track);
      audio.preload = "auto";
      audio.src = track.url;
      audio.playbackRate = playbackRate;
      audio.load();
      setProgress(hasLessonSegment ? lessonStart : 0);
    }

    if (hasLessonSegment) {
      const seekToLessonStart = () => {
        audio.currentTime = lessonStart;
        setProgress(lessonStart);
      };

      if (audio.readyState >= 1) {
        seekToLessonStart();
      } else {
        audio.addEventListener("loadedmetadata", seekToLessonStart, {
          once: true,
        });
      }
    }

    setIsPlaying(true);
    setIsPlayerVisible(true); // show docked bar
    setIsMinimized(false); // ensure expanded on new play

    try {
      await audio.play();
    } catch (e) {
      setIsPlaying(false);
      console.error("Audio play failed:", e);
    }
  };
  const pause = () => {
    audioRef.current?.pause();
    saveState(true);
  };
  const resume = () => {
    setIsPlayerVisible(true);
    setIsMinimized(false);
    return audioRef.current?.play();
  };
  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };
  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const knownDuration =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : duration;
    const target =
      knownDuration > 0
        ? Math.max(0, Math.min(seconds, knownDuration))
        : Math.max(0, seconds);
    audio.currentTime = target;
    setProgress(target);
  };
  const setVolume = (v: number) => setVolumeState(Math.max(0, Math.min(v, 1)));
  const toggleMute = () => setMuted((m) => !m);
  const skipBy = (seconds: number) => seek(progress + seconds);
  const showToast = (message: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (toastExitTimerRef.current) {
      window.clearTimeout(toastExitTimerRef.current);
    }

    setToastLeaving(false);
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastLeaving(true);
      toastTimerRef.current = null;
      toastExitTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
        setToastLeaving(false);
        toastExitTimerRef.current = null;
      }, 620);
    }, 2350);
  };
  const notifyLessonSoon = () => showToast(LESSON_SOON_MESSAGE);
  const shareCurrent = async () => {
    if (!current) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: current.title,
          text: current.description || current.title,
          url: current.url,
        });
        return;
      }
      await navigator.clipboard?.writeText(current.url);
    } catch {}
  };

  const goToCurrentSource = () => {
    if (!current?.navTarget) return;

    document.getElementById("mohtava")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    goTo(current.navTarget);
  };

  const close = () => {
    setIsSpeedMenuOpen(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load?.();
    }
    setIsPlaying(false);
    setDuration(0);
    setProgress(0);
    setCurrent(null);
    setIsPlayerVisible(false);
    setIsMinimized(false);
    latestStateRef.current = {
      current: null,
      progress: 0,
      volume,
      muted,
      playbackRate,
    };
    clearSavedState();
    window.dispatchEvent(new CustomEvent("bavarmandan:session-audio-close"));
  };

  const ctxValue = useMemo<AudioCtx>(
    () => ({
      current,
      isPlaying,
      duration,
      progress,
      volume,
      muted,
      play,
      pause,
      resume,
      stop,
      seek,
      setVolume,
      toggleMute,
      close,
      notifyLessonSoon,
    }),
    [current, isPlaying, duration, progress, volume, muted, playbackRate]
  );

  const fmt = (s: number) => {
    if (!isFinite(s)) return "۰۰:۰۰";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    if (h > 0) return toPersianDigits(`${h}:${m}:${ss}`);
    return toPersianDigits(`${m}:${ss}`);
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0;
  const lessonStart = current?.lessonStart ?? null;
  const lessonEnd = current?.lessonEnd ?? null;
  const hasLessonInfo =
    typeof lessonStart === "number" &&
    typeof lessonEnd === "number" &&
    lessonEnd > lessonStart;
  const lessonStartPercent =
    hasLessonInfo && duration > 0
      ? Math.min(100, Math.max(0, (lessonStart / duration) * 100))
      : 0;
  const lessonEndPercent =
    hasLessonInfo && duration > 0
      ? Math.min(100, Math.max(0, (lessonEnd / duration) * 100))
      : 0;
  const lessonPlaybackPercent =
    hasLessonInfo && lessonEnd > lessonStart
      ? Math.min(
          100,
          Math.max(0, ((progress - lessonStart) / (lessonEnd - lessonStart)) * 100)
        )
      : 0;
  const isLessonMode = current?.segmentMode === "lesson";

  const clampPosition = (x: number, y: number, width: number, height: number) => {
    if (typeof window === "undefined") return { x, y };
    const padding = 12;
    return {
      x: Math.min(Math.max(padding, x), window.innerWidth - width - padding),
      y: Math.min(Math.max(padding, y), window.innerHeight - height - padding),
    };
  };

  const startDragging = (
    event: React.PointerEvent<HTMLElement>,
    target: DragTarget
  ) => {
    if (event.button !== 0) return;
    const eventTarget = event.target as HTMLElement;
    const interactiveTarget = eventTarget.closest(
      "button, input, a, [role='button'], [data-no-drag], [data-resize-handle]"
    );
    if (interactiveTarget && interactiveTarget !== event.currentTarget) return;

    const rect = event.currentTarget.closest(
      "[data-audio-player-shell]"
    )?.getBoundingClientRect();
    if (!rect) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      target,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
    };
  };

  const dragPlayer = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    event.preventDefault();
    if (
      Math.abs(event.clientX - drag.startX) > 4 ||
      Math.abs(event.clientY - drag.startY) > 4
    ) {
      drag.moved = true;
    }

    const next = clampPosition(
      drag.originX + event.clientX - drag.startX,
      drag.originY + event.clientY - drag.startY,
      drag.width,
      drag.height
    );

    if (drag.target === "expanded") {
      setPlayerPosition(next);
    } else {
      setMinimizedPosition(next);
    }
  };

  const stopDragging = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    dragRef.current = null;
  };

  const startResizing = (
    event: React.PointerEvent<HTMLElement>,
    edge: ResizeEdge
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.closest(
      "[data-audio-player-shell]"
    )?.getBoundingClientRect();
    if (!rect) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      edge,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const resizePlayer = (event: React.PointerEvent<HTMLElement>) => {
    const resize = resizeRef.current;
    if (!resize) return;
    event.preventDefault();
    event.stopPropagation();

    const minWidth = typeof window !== "undefined" && window.innerWidth < 640 ? 300 : 420;
    const maxWidth =
      typeof window !== "undefined" ? window.innerWidth - 24 : 900;
    const minHeight = 124;
    const maxHeight =
      typeof window !== "undefined" ? window.innerHeight - 24 : 420;
    const deltaX = event.clientX - resize.startX;
    const deltaY = event.clientY - resize.startY;

    let nextX = resize.originX;
    let nextY = resize.originY;
    let nextWidth = resize.width;
    let nextHeight = resize.height;

    if (resize.edge.includes("right")) nextWidth = resize.width + deltaX;
    if (resize.edge.includes("left")) {
      nextWidth = resize.width - deltaX;
      nextX = resize.originX + deltaX;
    }
    if (resize.edge.includes("bottom")) nextHeight = resize.height + deltaY;
    if (resize.edge.includes("top")) {
      nextHeight = resize.height - deltaY;
      nextY = resize.originY + deltaY;
    }

    nextWidth = Math.min(Math.max(minWidth, nextWidth), maxWidth);
    nextHeight = Math.min(Math.max(minHeight, nextHeight), maxHeight);

    if (resize.edge.includes("left")) {
      nextX = resize.originX + resize.width - nextWidth;
    }
    if (resize.edge.includes("top")) {
      nextY = resize.originY + resize.height - nextHeight;
    }

    const nextPosition = clampPosition(nextX, nextY, nextWidth, nextHeight);
    setPlayerPosition(nextPosition);
    setPlayerSize({ width: nextWidth, height: nextHeight });
  };

  const stopResizing = (event: React.PointerEvent<HTMLElement>) => {
    if (!resizeRef.current) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    resizeRef.current = null;
  };

  const playCurrentSegment = (segmentMode: "lesson" | "full") => {
    if (!current) return;
    if (segmentMode === "lesson" && !hasLessonInfo) {
      notifyLessonSoon();
      return;
    }

    const sameSegment =
      (segmentMode === "lesson" && isLessonMode) ||
      (segmentMode === "full" && !isLessonMode);

    if (sameSegment && isPlaying) {
      pause();
      return;
    }

    if (sameSegment && !isPlaying) {
      resume();
      return;
    }

    play({
      ...current,
      lessonStart: hasLessonInfo ? lessonStart : null,
      lessonEnd: hasLessonInfo ? lessonEnd : null,
      segmentMode,
    });
  };

  // Docked bottom player (expanded)
  const playerNode = current && isPlayerVisible && !isMinimized ? (
    <div
      className={`
        fixed z-[10000]
        transition-transform duration-300
        ${playerPosition ? "" : "inset-x-0 bottom-0"}
        pointer-events-none px-3 pb-3
      `}
      style={
        playerPosition
          ? ({
              left: playerPosition.x,
              top: playerPosition.y,
              width: playerSize
                ? `${playerSize.width}px`
                : "min(56rem, calc(100vw - 1.5rem))",
              paddingBottom: 0,
            } as React.CSSProperties)
          : { paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 0.5rem)" }
      }
      role="region"
      aria-label="Global audio player"
    >
      <div
        data-audio-player-shell
        className="audio-player-shell group/audio-player pointer-events-auto relative mx-auto w-full max-w-4xl touch-none select-none overflow-hidden rounded-xl border cursor-grab active:cursor-grabbing sm:rounded-2xl"
        style={
          playerSize
            ? ({
                width: `${playerSize.width}px`,
                height: `${playerSize.height}px`,
                maxWidth: "calc(100vw - 1.5rem)",
              } as React.CSSProperties)
            : undefined
        }
        onPointerDownCapture={(e) => startDragging(e, "expanded")}
        onPointerMove={dragPlayer}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <span
          aria-hidden
          data-resize-handle
          className="absolute inset-x-4 top-0 z-20 h-2 cursor-ns-resize"
          onPointerDown={(e) => startResizing(e, "top")}
          onPointerMove={resizePlayer}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
        />
        <span
          aria-hidden
          data-resize-handle
          className="absolute inset-x-4 bottom-0 z-20 h-2 cursor-ns-resize"
          onPointerDown={(e) => startResizing(e, "bottom")}
          onPointerMove={resizePlayer}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
        />
        <span
          aria-hidden
          data-resize-handle
          className="absolute inset-y-4 left-0 z-20 w-2 cursor-ew-resize"
          onPointerDown={(e) => startResizing(e, "left")}
          onPointerMove={resizePlayer}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
        />
        <span
          aria-hidden
          data-resize-handle
          className="absolute inset-y-4 right-0 z-20 w-2 cursor-ew-resize"
          onPointerDown={(e) => startResizing(e, "right")}
          onPointerMove={resizePlayer}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
        />
        <span
          aria-hidden
          data-resize-handle
          className="absolute left-0 top-0 z-30 size-4 cursor-nwse-resize"
          onPointerDown={(e) => startResizing(e, "top-left")}
          onPointerMove={resizePlayer}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
        />
        <span
          aria-hidden
          data-resize-handle
          className="absolute right-0 top-0 z-30 size-4 cursor-nesw-resize"
          onPointerDown={(e) => startResizing(e, "top-right")}
          onPointerMove={resizePlayer}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
        />
        <span
          aria-hidden
          data-resize-handle
          className="absolute bottom-0 left-0 z-30 size-4 cursor-nesw-resize"
          onPointerDown={(e) => startResizing(e, "bottom-left")}
          onPointerMove={resizePlayer}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
        />
        <span
          aria-hidden
          data-resize-handle
          className="absolute bottom-0 right-0 z-30 size-4 cursor-nwse-resize"
          onPointerDown={(e) => startResizing(e, "bottom-right")}
          onPointerMove={resizePlayer}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
        />
        <div className="audio-player-grab" title="Drag player">
          <span />
        </div>
        <div className="audio-player-content">
          <div className="audio-player-head" dir="rtl">
            <div className="audio-player-brand">
              <img
                src={current.cover || "/mainicon.jpg"}
                alt=""
                draggable={false}
              />
            </div>

            <button
              type="button"
              className="audio-player-copy"
              onClick={goToCurrentSource}
              disabled={!current.navTarget}
              aria-label="رفتن به محل این فایل"
              data-no-drag
            >
              <h3>{current.title}</h3>
              {current.description ? <p>{current.description}</p> : null}
            </button>

            <div className="audio-player-time" dir="ltr">
              <span>{fmt(isScrubbing ? scrubValue : progress)}</span>
              <span className="audio-time-slash">/</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          <div className="audio-progress-wrap">
            {hasLessonInfo ? (
              <>
                <span
                  className="audio-lesson-range"
                  style={{
                    left: `${lessonStartPercent}%`,
                    width: `${Math.max(0, lessonEndPercent - lessonStartPercent)}%`,
                  }}
                />
                <span
                  className="audio-lesson-marker"
                  style={{ left: `${lessonStartPercent}%` }}
                />
                <span
                  className="audio-lesson-marker"
                  style={{ left: `${lessonEndPercent}%` }}
                />
              </>
            ) : null}
            <input
              className="audio-progress-range"
              dir="ltr"
              style={{
                background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progressPercent}%, hsl(var(--muted) / 0.42) ${progressPercent}%, hsl(var(--muted) / 0.42) 100%)`,
              }}
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(isScrubbing ? scrubValue : progress, duration || 0)}
              onPointerDown={(e) => {
                setIsScrubbing(true);
                setScrubValue(Number(e.currentTarget.value));
              }}
              onChange={(e) => {
                const next = Number(e.target.value);
                setScrubValue(next);
                seek(next);
              }}
              onPointerUp={(e) => {
                seek(Number(e.currentTarget.value));
                setIsScrubbing(false);
              }}
              onPointerCancel={() => setIsScrubbing(false)}
              aria-label="جابه‌جایی در صوت"
              data-no-drag
            />
          </div>

          <div className="audio-sections">
            <div className="audio-sections-title">
              <span />
              <i />
              <b>بخش‌های جلسه</b>
              <i />
              <span />
            </div>

            <div className="audio-section-items" dir="rtl">
              <button
                type="button"
                className={`audio-section-item ${
                  hasLessonInfo && isLessonMode ? "is-active" : ""
                }`}
                onClick={() => playCurrentSegment("lesson")}
                data-no-drag
              >
                <span className="audio-section-play">
                  {hasLessonInfo && isLessonMode && isPlaying ? (
                    <Pause aria-hidden="true" />
                  ) : (
                    <Play aria-hidden="true" />
                  )}
                </span>
                <span className="audio-section-text">
                  <strong>درس</strong>
                  <small dir={hasLessonInfo ? "ltr" : "rtl"}>
                    {hasLessonInfo
                      ? `${fmt(lessonStart || 0)} - ${fmt(lessonEnd || 0)}`
                      : "به‌زودی"}
                  </small>
                </span>
                <span
                  className="audio-section-progress"
                  style={{
                    "--segment-progress": `${
                      hasLessonInfo && isLessonMode ? lessonPlaybackPercent : 0
                    }%`,
                  } as React.CSSProperties}
                />
              </button>

              <span className="audio-section-separator" aria-hidden="true" />

              <button
                type="button"
                className={`audio-section-item ${!isLessonMode ? "is-active" : ""}`}
                onClick={() => playCurrentSegment("full")}
                data-no-drag
              >
                <span className="audio-section-play">
                  {!isLessonMode && isPlaying ? (
                    <Pause aria-hidden="true" />
                  ) : (
                    <Play aria-hidden="true" />
                  )}
                </span>
                <span className="audio-section-text">
                  <strong>کامل</strong>
                  <small dir="ltr">۰۰:۰۰ - {fmt(duration)}</small>
                </span>
                <span
                  className="audio-section-progress"
                  style={{
                    "--segment-progress": `${!isLessonMode ? progressPercent : 0}%`,
                  } as React.CSSProperties}
                />
              </button>
            </div>
          </div>

          <div className="audio-player-divider" />

          <div className="audio-player-controls">
            <div className="audio-transport-controls">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skipBy(-10)}
                aria-label="ده ثانیه عقب"
                title="ده ثانیه عقب"
                data-no-drag
              >
                <Rewind />
              </Button>

              {isPlaying ? (
                <Button
                  size="icon"
                  onClick={pause}
                  aria-label="توقف پخش"
                  data-no-drag
                  className="audio-main-play"
                >
                  <Pause />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={resume}
                  aria-label="ادامه پخش"
                  data-no-drag
                  className="audio-main-play"
                >
                  <Play />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => skipBy(10)}
                aria-label="ده ثانیه جلو"
                title="ده ثانیه جلو"
                data-no-drag
              >
                <FastForward />
              </Button>
            </div>

            <div className="audio-utility-controls">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted || volume === 0 ? "باز کردن صدا" : "بی‌صدا کردن"}
                data-no-drag
              >
                {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
              </Button>

              <input
                className="audio-volume-range"
                dir="ltr"
                style={{
                  background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                    (muted ? 0 : volume) * 100
                  }%, hsl(var(--muted) / 0.42) ${
                    (muted ? 0 : volume) * 100
                  }%, hsl(var(--muted) / 0.42) 100%)`,
                }}
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="تنظیم صدا"
                data-no-drag
              />

              <div className="audio-speed-control" data-no-drag>
                <button
                  type="button"
                  className="audio-speed-trigger"
                  onClick={() => setIsSpeedMenuOpen((value) => !value)}
                  aria-label="تغییر سرعت پخش"
                  aria-haspopup="listbox"
                  aria-expanded={isSpeedMenuOpen}
                >
                  <span className="audio-speed-mark" aria-hidden="true" />
                  <span dir="ltr">{playbackRate}x</span>
                </button>

                {isSpeedMenuOpen ? (
                  <div
                    className="audio-speed-menu"
                    role="listbox"
                    aria-label="سرعت پخش"
                    dir="ltr"
                  >
                    {PLAYBACK_RATES.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        role="option"
                        aria-selected={playbackRate === rate}
                        className={playbackRate === rate ? "is-active" : ""}
                        onClick={() => {
                          setPlaybackRate(rate);
                          setIsSpeedMenuOpen(false);
                        }}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSpeedMenuOpen(false);
                  setIsLooping((value) => !value);
                }}
                aria-label={isLooping ? "خاموش کردن تکرار" : "روشن کردن تکرار"}
                className={isLooping ? "is-active" : ""}
                title="تکرار"
                data-no-drag
              >
                <Repeat2 />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSpeedMenuOpen(false);
                  void shareCurrent();
                }}
                aria-label="اشتراک‌گذاری"
                title="اشتراک‌گذاری"
                data-no-drag
              >
                <Share2 />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSpeedMenuOpen(false);
                  setIsMinimized(true);
                }}
                aria-label="جمع کردن پلیر"
                title="جمع کردن"
                data-no-drag
              >
                <Minus />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                aria-label="بستن پلیر"
                data-no-drag
              >
                <X />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Minimized pill (shows when minimized & visible & has current track)
  const minimizedNode =
    current && isPlayerVisible && isMinimized ? (
      <div
        data-audio-player-shell
        className={`
          audio-player-mini
          fixed z-[10001]
          ${minimizedPosition ? "" : "bottom-4 left-4"}
          audio-player-shell touch-none select-none overflow-visible
          cursor-grab transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 active:cursor-grabbing
        `}
        style={
          minimizedPosition
            ? ({
                left: minimizedPosition.x,
                top: minimizedPosition.y,
              } as React.CSSProperties)
            : undefined
        }
        onPointerDown={(e) => startDragging(e, "minimized")}
        onPointerMove={dragPlayer}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <button
          type="button"
          className="audio-mini-icon"
          onClick={(event) => {
            event.stopPropagation();
            close();
          }}
          aria-label="بستن پلیر"
          data-no-drag
        >
          <X />
        </button>

        <button
          type="button"
          className="audio-mini-icon"
          onClick={(event) => {
            event.stopPropagation();
            setIsMinimized(false);
          }}
          aria-label="باز کردن پلیر"
          data-no-drag
        >
          <ChevronUp />
        </button>

        <button
          type="button"
          className="audio-mini-play"
          onClick={(event) => {
            event.stopPropagation();
            if (isPlaying) {
              pause();
            } else {
              resume();
            }
          }}
          aria-label={isPlaying ? "توقف پخش" : "ادامه پخش"}
          data-no-drag
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>

        <button
          type="button"
          className="audio-mini-copy"
          dir="rtl"
          onClick={(event) => {
            event.stopPropagation();
            goToCurrentSource();
          }}
          disabled={!current.navTarget}
          aria-label="رفتن به محل این فایل"
          data-no-drag
        >
          <strong>{current.title}</strong>
          <small dir="ltr">
            {fmt(progress)}
            <span>/</span>
            {fmt(duration)}
          </small>
        </button>

        <span className="audio-mini-brand">
          <img
            src={current.cover || "/mainicon.jpg"}
            alt=""
            draggable={false}
          />
        </span>
      </div>
    ) : null;

  // Resume prompt (unchanged)
  const resumeBar =
    showResumePrompt && savedStateRef.current ? (
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10002] bg-card border shadow-lg rounded-md px-3 py-2 flex items-center gap-3"
        style={{ pointerEvents: "auto" }}
      >
        <Button
          size="sm"
          aria-label="Resume"
          onClick={async () => {
            const saved = savedStateRef.current!;
            setVolumeState(saved.volume);
            setMuted(saved.muted);
            setPlaybackRate(saved.playbackRate ?? 1);
            // set current & resume
            setCurrent(saved.track);
            if (audioRef.current) {
              audioRef.current.src = saved.track.url;
              audioRef.current.playbackRate = saved.playbackRate ?? 1;
              audioRef.current.load();
              const onLoaded = () => {
                const d = audioRef.current!.duration || 0;
                const target = Math.max(0, Math.min(saved.progress, d));
                audioRef.current!.currentTime = target;
                audioRef.current!.play().catch(() => {});
                audioRef.current!.removeEventListener(
                  "loadedmetadata",
                  onLoaded
                );
              };
              audioRef.current.addEventListener("loadedmetadata", onLoaded);
            }
            setIsPlayerVisible(true);
            setIsMinimized(false);
            setShowResumePrompt(false);
          }}
        >
          <Play className="h-4 w-4 text-card" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={clearSavedState}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    ) : null;

  const toastNode = toastMessage ? (
    <div
      className={`audio-player-toast ${toastLeaving ? "is-leaving" : ""}`}
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      {toastMessage}
    </div>
  ) : null;

  return (
    <AudioPlayerContext.Provider value={ctxValue}>
      {children}
      {mounted && playerNode ? createPortal(playerNode, document.body) : null}
      {mounted && minimizedNode
        ? createPortal(minimizedNode, document.body)
        : null}
      {mounted && resumeBar ? createPortal(resumeBar, document.body) : null}
      {mounted && toastNode ? createPortal(toastNode, document.body) : null}
    </AudioPlayerContext.Provider>
  );
};

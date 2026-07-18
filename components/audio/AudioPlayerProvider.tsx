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
import {
  FastForward,
  Minus,
  Pause,
  Play,
  Rewind,
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
};

type SavedState = {
  track: Track;
  progress: number;
  volume: number;
  muted: boolean;
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
};

const AudioPlayerContext = createContext<AudioCtx | null>(null);
export const useAudioPlayer = () => {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within provider");
  return ctx;
};

const STORAGE_KEY = "globalAudioState_v1";

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

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

  // Scrub
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  // Portal mount flag
  const [mounted, setMounted] = useState(false);

  // Resume prompt
  const savedStateRef = useRef<SavedState | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Create audio element once
  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setProgress(audio.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = () => setIsPlaying(false);

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
  }, []);

  // Save periodically (throttled)
  const saveTimer = useRef<number | null>(null);
  const saveState = (immediate = false) => {
    if (!current) return;
    const snapshot: SavedState = {
      track: current,
      progress,
      volume,
      muted,
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
    if (current) saveState(); // on progress / volume / mute changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, progress, volume, muted]);

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
    if (!audioRef.current) return;
    const same = current?.url === track.url;
    if (!same) {
      setCurrent(track);
      audioRef.current.src = track.url;
      audioRef.current.load();
      setProgress(0);
    }
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setIsPlayerVisible(true); // show docked bar
      setIsMinimized(false); // ensure expanded on new play
    } catch (e) {
      console.error("Audio play failed:", e);
    }
  };
  const pause = () => audioRef.current?.pause();
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

  const close = () => {
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
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
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
    }),
    [current, isPlaying, duration, progress, volume, muted]
  );

  const fmt = (s: number) => {
    if (!isFinite(s)) return "00:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    if (h > 0) return `${h}:${m}:${ss}`;
    return `${m}:${ss}`;
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0;

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
        <div
          className="flex h-5 touch-none items-center justify-center"
          title="Drag player"
        >
          <span className="h-1 w-10 rounded-full bg-primary/45" />
        </div>
        <div className="px-2 pb-2 sm:px-3 sm:pb-3 md:px-4 md:pb-4">
          <div className="grid grid-cols-[2.75rem_1fr] items-center gap-2 sm:grid-cols-[3.5rem_1fr] sm:gap-3 md:grid-cols-[5rem_1fr] md:gap-4">
            <div className="grid size-11 place-items-center overflow-hidden rounded-xl border border-primary/25 bg-primary/10 p-0.5 shadow-[0_10px_22px_rgba(0,0,0,0.16)] sm:size-14 md:size-20">
              <img
                src={current.cover || "/mainicon.jpg"}
                alt=""
                draggable={false}
                className="size-full rounded-lg object-cover"
              />
            </div>

            <div className="min-w-0" dir="rtl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-right">
                  <div className="truncate text-sm font-extrabold leading-6 text-foreground sm:text-base sm:leading-7 md:text-xl">
                    {current.title}
                  </div>
                  {current.description && (
                    <div className="hidden truncate text-sm font-bold text-primary/85 sm:block md:text-base">
                      {current.description}
                    </div>
                  )}
                </div>
                <div className="audio-player-muted shrink-0 text-left text-[11px] font-bold tabular-nums sm:text-xs md:text-sm">
                  <span>{fmt(isScrubbing ? scrubValue : progress)}</span>
                  <span className="mx-1 text-primary/70">/</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              <input
                className="audio-progress-range mt-2 w-full sm:mt-3"
                dir="ltr"
                style={{
                  background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                    duration > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            ((isScrubbing ? scrubValue : progress) /
                              duration) *
                              100
                          )
                        )
                      : 0
                  }%, hsl(var(--muted) / 0.42) ${
                    duration > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            ((isScrubbing ? scrubValue : progress) /
                              duration) *
                              100
                          )
                        )
                      : 0
                  }%, hsl(var(--muted) / 0.42) 100%)`,
                }}
                type="range"
                min={0}
                max={duration || 0}
                step={1}
                value={Math.min(
                  isScrubbing ? scrubValue : progress,
                  duration || 0
                )}
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
                aria-label="Seek"
                data-no-drag
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3">
            <div className="flex items-center justify-center gap-1 sm:gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skipBy(-40)}
                aria-label="Back 40 seconds"
                className="h-8 w-8 rounded-full text-primary hover:bg-primary/10 hover:text-primary sm:h-10 sm:w-10"
                title="40 seconds back"
              >
                <Rewind className="h-5 w-5" />
              </Button>

              {isPlaying ? (
                <Button
                  size="icon"
                  onClick={pause}
                  aria-label="Pause"
                  className="size-10 rounded-xl shadow-[0_10px_22px_hsl(var(--primary)/0.18)] sm:size-12"
                >
                  <Pause className="h-6 w-6 text-card" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={resume}
                  aria-label="Resume"
                  className="size-10 rounded-xl shadow-[0_10px_22px_hsl(var(--primary)/0.18)] sm:size-12"
                >
                  <Play className="h-6 w-6 text-card" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => skipBy(40)}
                aria-label="Forward 40 seconds"
                className="h-8 w-8 rounded-full text-primary hover:bg-primary/10 hover:text-primary sm:h-10 sm:w-10"
                title="40 seconds forward"
              >
                <FastForward className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1 sm:gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
                className="hidden h-9 w-9 rounded-full text-primary hover:bg-primary/10 hover:text-primary sm:inline-flex"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>

              <input
                className="audio-volume-range hidden w-20 sm:block md:w-24"
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
                aria-label="Volume"
                data-no-drag
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={shareCurrent}
                aria-label="Share"
                className="h-8 w-8 rounded-full text-primary hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-9"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                aria-label="Minimize"
                className="h-8 w-8 rounded-full text-primary hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-9"
                title="Minimize"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                aria-label="Close"
                className="h-8 w-8 rounded-full text-primary hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" />
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
      <button
        data-audio-player-shell
        className={`
          fixed z-[10001]
          ${minimizedPosition ? "" : "bottom-4 right-4"}
          flex h-14 max-w-[calc(100vw-2rem)] items-center gap-2
          audio-player-shell touch-none select-none overflow-hidden rounded-2xl border p-1.5 pr-2
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
        aria-label="Expand audio player"
        title={
          isPlaying ? "Playing... (tap to expand)" : "Paused (tap to expand)"
        }
        onPointerDown={(e) => startDragging(e, "minimized")}
        onPointerMove={dragPlayer}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onClick={() => {
          if (suppressClickRef.current) return;
          setIsMinimized(false);
        }}
      >
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-primary/30 bg-primary/10 p-0.5">
          <img
            src={current.cover || "/mainicon.jpg"}
            alt=""
            draggable={false}
            className="size-full rounded-lg object-cover"
          />
        </span>

        <span className="hidden min-w-0 text-right sm:block" dir="rtl">
          <span className="block max-w-40 truncate text-sm font-bold text-foreground md:max-w-56">
            {current.title}
          </span>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted/50">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${progressPercent}%` }}
            />
          </span>
        </span>

        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-card">
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </span>
      </button>
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
            // set current & resume
            setCurrent(saved.track);
            if (audioRef.current) {
              audioRef.current.src = saved.track.url;
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
          onClick={() => setShowResumePrompt(false)}
        >
          <X className="h-4 w-4" />
        </Button>
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
    </AudioPlayerContext.Provider>
  );
};

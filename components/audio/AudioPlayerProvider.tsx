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
import { Pause, Play, Volume2, VolumeX, X, Minus } from "lucide-react";

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
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(seconds, duration || 0));
    audioRef.current.currentTime = target;
    setProgress(target);
  };
  const setVolume = (v: number) => setVolumeState(Math.max(0, Math.min(v, 1)));
  const toggleMute = () => setMuted((m) => !m);

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
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${ss}`;
  };

  // Docked bottom player (expanded)
  const playerNode = current ? (
    <div
      className={`
        fixed inset-x-0 bottom-0 z-[10000]
        transition-transform duration-300
        ${
          isPlayerVisible && !isMinimized ? "translate-y-0" : "translate-y-full"
        }
        backdrop-blur supports-[backdrop-filter]:bg-background/70
        border-t bg-card text-card-foreground
      `}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 0.5rem)" }}
      role="region"
      aria-label="Global audio player"
    >
      <div className="mx-auto max-w-screen-lg px-3 py-2">
        {/* header */}
        {/* header */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          {/* Left: controls */}
          <div className="flex items-center gap-1 justify-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize"
              className="h-8 w-8"
              title="Minimize"
            >
              <Minus className="h-4 w-4" />
            </Button>

            {isPlaying ? (
              <Button size="sm" onClick={pause} aria-label="Pause">
                <Pause className="h-4 w-4 text-card" />
              </Button>
            ) : (
              <Button size="sm" onClick={resume} aria-label="Resume">
                <Play className="h-4 w-4 text-card" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label="Close"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: title + description */}
          <div className="min-w-0 text-right justify-self-end">
            <div className="text-sm font-medium truncate max-w-[60vw] md:max-w-[480px]">
              {current.title}
            </div>
            {current.description && (
              <div className="text-xs text-muted-foreground truncate max-w-[65vw] md:max-w-[520px]">
                {current.description}
              </div>
            )}
          </div>
        </div>

        {/* progress + volume */}
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums">
              {fmt(isScrubbing ? scrubValue : progress)}
            </span>
            <input
              className="w-full accent-primary"
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(
                isScrubbing ? scrubValue : progress,
                duration || 0
              )}
              onPointerDown={() => setIsScrubbing(true)}
              onChange={(e) => setScrubValue(Number(e.target.value))}
              onPointerUp={() => {
                seek(scrubValue);
                setIsScrubbing(false);
              }}
              aria-label="Seek"
            />
            <span className="text-xs tabular-nums">{fmt(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
              className="h-8 w-8"
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <input
              className="w-24 accent-primary"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Minimized cube (shows when minimized & visible & has current track)
  const minimizedNode =
    current && isPlayerVisible && isMinimized ? (
      <button
        className={`
          fixed bottom-4 right-4 z-[10001]
          h-12 w-12 rounded-lg border bg-primary text-card-foreground
          shadow-lg flex items-center justify-center
          transition-transform duration-200 active:scale-95
        `}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
        aria-label="Expand audio player"
        title={
          isPlaying ? "Playing… (tap to expand)" : "Paused (tap to expand)"
        }
        onClick={() => setIsMinimized(false)}
      >
        {/* little status: play/pause icon */}
        {isPlaying ? (
          <Pause className="h-5 w-5 text-card" />
        ) : (
          <Play className="h-5 w-5 text-card" />
        )}
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

"use client";
import { useEffect, useRef } from "react";

export const GlobalAudioPlayer = ({ src }: { src: string | null }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (src && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {}); // avoid autoplay warning
    }
  }, [src]);

  return (
    <div className="fixed bottom-0 w-full z-50 bg-background border-t shadow-lg px-4 py-2">
      {src ? (
        <audio ref={audioRef} controls className="w-full">
          <source src={src} type="audio/mpeg" />
          مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
        </audio>
      ) : (
        <div className="text-center text-muted-foreground text-sm">
          هیچ صوتی در حال پخش نیست
        </div>
      )}
    </div>
  );
};

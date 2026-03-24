"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

type LivePlayerProps = {
  title?: string;
  streamUrl?: string;
};

export default function LivePlayer({
  title = "شبکه خبر ایران 🇮🇷",
  streamUrl = "/api/stream?url=https%3A%2F%2Fgg.hls2.xyz%2Flive%2Firib-khabar%2Fchunks.m3u8",
}: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState("Loading stream...");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus("Live");
        video.play().catch(() => {
          setStatus("Ready - press play");
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) {
          console.log("Non-fatal HLS warning:", data);
          return;
        }

        console.log("Fatal HLS error:", data);

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            setStatus("Network error - retrying...");
            hls?.startLoad();
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            setStatus("Media error - recovering...");
            hls?.recoverMediaError();
            break;

          default:
            setStatus("Stream failed");
            hls?.destroy();
            break;
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      setStatus("Live");
    } else {
      setStatus("HLS is not supported in this browser");
    }

    return () => {
      hls?.destroy();
    };
  }, [streamUrl]);

  return (
    <section className="w-full flex justify-center px-4 pt-28 md:pt-32">
      <div className="w-full max-w-3xl">
        <Card className="overflow-hidden border-2 border-primary shadow-lg">
          <div className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-center text-xl">{title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full bg-black"
                />
              </div>

            
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  );
}
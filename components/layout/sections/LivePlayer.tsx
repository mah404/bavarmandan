"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type LivePlayerProps = {
  streamUrl?: string;
};

export default function LivePlayer({
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
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <p>{status}</p>
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        style={{ width: "100%", borderRadius: "12px", background: "black" }}
      />
    </div>
  );
}
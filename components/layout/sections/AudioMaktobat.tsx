// components/ui/AudioPlayer.tsx

"use client";

interface AudioPlayerProps {
  src?: string;
}

export const AudioPlayer = ({ src }: AudioPlayerProps) => {
  if (!src) return null;

  // Ensure Dropbox links work by forcing raw mode
  const rawUrl = src.replace("&dl=0", "&raw=1");

  return (
    <div className="bg-white p-3 rounded shadow">
      <p className="mb-2 font-semibold">Audio</p>
      <audio controls className="w-full">
        <source src={rawUrl} type="audio/mpeg" />
        مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
      </audio>
    </div>
  );
};

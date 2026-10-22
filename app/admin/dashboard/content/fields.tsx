"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Headphones, X } from "lucide-react";
import { checkTags, PUBLISHER_URL, readTags, writeTags, type AudioTags } from "./id3";

/** A single-file picker tile (PDF only here). The demo keeps only the file name. */
export function FileField({
  label,
  hint = "فقط PDF",
  value,
  onChange,
  onError,
}: {
  label: string;
  hint?: string;
  value: string | null;
  /** The picked file (the page uploads it on save), or null when the admin removed it. */
  onChange: (file: File | null) => void;
  onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={`ct-drop${value ? " has" : ""}`}>
      <button type="button" onClick={() => input.current?.click()}>
        <FileText size={22} aria-hidden="true" />
        <b>{label}</b>
        <small>{value ?? hint}</small>
      </button>
      {value ? (
        <button type="button" className="ct-drop-x" aria-label={`حذف ${label}`} onClick={() => onChange(null)}>
          <X size={14} />
        </button>
      ) : null}
      <input
        ref={input}
        type="file"
        accept=".pdf,application/pdf"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (!/\.pdf$/i.test(file.name)) return onError(`${label} فقط باید PDF باشد.`);
          onError("");
          onChange(file);
        }}
      />
    </div>
  );
}

interface TagFix {
  bytes: Uint8Array;
  fileName: string;
  tags: AudioTags;
  open: boolean;
}

/** MP3 picker that checks the ID3 tags and lets the admin fix them before the audio is accepted. */
export function AudioField({
  value,
  artist,
  defaultTitle,
  onChange,
  onError,
}: {
  value: string | null;
  /** Required artist for this section; unset = any non-empty artist. */
  artist?: string;
  defaultTitle: string;
  /** The audio to upload: the picked file, or the re-tagged copy once the admin fixed its metadata. */
  onChange: (file: File | null) => void;
  onError: (message: string) => void;
}) {
  const audioInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [fix, setFix] = useState<TagFix | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const cover = fix?.tags.cover ?? null;

  useEffect(() => {
    if (!cover) return setCoverUrl("");
    const url = URL.createObjectURL(new Blob([cover.data], { type: cover.mime }));
    setCoverUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.mp3$/i.test(file.name)) return onError("فایل صوت فقط باید MP3 باشد.");
    onError("");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const tags = readTags(bytes);
    const problems = checkTags(tags, artist);
    if (!problems.length) {
      setFix(null);
      return onChange(file);
    }
    setFix({
      bytes,
      fileName: file.name,
      open: false,
      tags: { title: tags.title || defaultTitle, artist: artist ?? tags.artist, publisher: PUBLISHER_URL, cover: tags.cover },
    });
    onError(`صوت متادیتای درستی ندارد (ناقص یا نادرست: ${problems.join("، ")}).`);
  };

  const pickCover = async (file: File | undefined) => {
    if (!file || !fix) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) return onError("لوگو باید JPG یا PNG باشد.");
    onError("");
    setFix({ ...fix, tags: { ...fix.tags, cover: { mime: file.type, data: new Uint8Array(await file.arrayBuffer()) } } });
  };

  const apply = () => {
    if (!fix) return;
    const { title, artist: a, publisher, cover: c } = fix.tags;
    if (!title.trim() || !a.trim() || !publisher.trim() || !c) return onError("لوگو، artist، publisher و title همه لازم‌اند.");
    if (artist && a.trim() !== artist) return onError(`artist این بخش باید «${artist}» باشد.`);
    if (!/bavarmandan\.com/i.test(publisher)) return onError("publisher باید نشانی سایت باورمندان باشد.");
    const tagged = writeTags(fix.bytes, { title: title.trim(), artist: a.trim(), publisher: publisher.trim(), cover: c });
    onChange(new File([tagged], fix.fileName, { type: "audio/mpeg" }));
    setFix(null);
    onError("");
  };

  return (
    <>
      <div className={`ct-drop${value ? " has" : ""}`}>
        <button type="button" onClick={() => audioInput.current?.click()}>
          <Headphones size={22} aria-hidden="true" />
          <b>صوت</b>
          <small>{value ?? "فقط MP3"}</small>
        </button>
        {value ? (
          <button type="button" className="ct-drop-x" aria-label="حذف فایل صوت" onClick={() => onChange(null)}>
            <X size={14} />
          </button>
        ) : null}
        <input
          ref={audioInput}
          type="file"
          accept=".mp3,audio/mpeg"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void pick(file);
          }}
        />
      </div>

      {fix ? (
        <div className="ct-tags ct-tags-wide">
          {!fix.open ? (
            <button type="button" className="ct-outline" onClick={() => setFix({ ...fix, open: true })}>
              وارد کردن متادیتای صوت
            </button>
          ) : (
            <>
              <b>متادیتای صوت</b>
              <div className="ct-cover">
                <button type="button" className="ct-ghost" onClick={() => coverInput.current?.click()}>
                  {fix.tags.cover ? "تغییر لوگو" : "آپلود لوگو"}
                </button>
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="لوگوی صوت" />
                ) : null}
                <input
                  ref={coverInput}
                  type="file"
                  accept="image/jpeg,image/png"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void pickCover(file);
                  }}
                />
              </div>
              {(["artist", "publisher", "title"] as const).map((field) => (
                <label key={field}>
                  {field}
                  <input
                    className="ct-input"
                    dir="auto"
                    value={fix.tags[field]}
                    onChange={(event) => setFix({ ...fix, tags: { ...fix.tags, [field]: event.target.value } })}
                  />
                </label>
              ))}
              <button type="button" className="ct-primary" onClick={apply}>
                ثبت متادیتا و آپلود صوت
              </button>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

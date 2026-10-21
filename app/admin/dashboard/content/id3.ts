// Minimal ID3v2 reader/writer for the audio uploads (no packages): reads title / artist / publisher / cover
// and rewrites the tag as ID3v2.3 (UTF-16), replacing any existing ID3v2 tag at the start of the file.

export const PUBLISHER_URL = "https://www.bavarmandan.com";

export interface AudioTags {
  title: string;
  artist: string;
  publisher: string;
  cover: { mime: string; data: Uint8Array } | null;
}

const syncsafe = (b: Uint8Array, o: number) => ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f);
const plain = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

function decode(bytes: Uint8Array, encoding: number) {
  const label = encoding === 1 ? "utf-16" : encoding === 2 ? "utf-16be" : encoding === 3 ? "utf-8" : "windows-1252";
  return new TextDecoder(label).decode(bytes).replace(/\0+$/g, "").replace(/^﻿/, "").trim();
}

/** Length in bytes of the ID3v2 tag at the start of the file (0 when there is none). */
function tagLength(b: Uint8Array) {
  if (b.length < 10 || b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return 0;
  return 10 + syncsafe(b, 6) + (b[3] === 4 && b[5] & 0x10 ? 10 : 0);
}

export function readTags(b: Uint8Array): AudioTags {
  const tags: AudioTags = { title: "", artist: "", publisher: "", cover: null };
  const total = tagLength(b);
  if (!total) return tags;
  const major = b[3];
  let pos = 10;
  if (b[5] & 0x40 && b.length > pos + 4) pos += major === 4 ? syncsafe(b, pos) : plain(b, pos) + 4;

  while (pos + 10 <= Math.min(total, b.length)) {
    const id = String.fromCharCode(b[pos], b[pos + 1], b[pos + 2], b[pos + 3]);
    if (!/^[A-Z0-9]{4}$/.test(id)) break;
    const size = major === 4 ? syncsafe(b, pos + 4) : plain(b, pos + 4);
    const start = pos + 10;
    const body = b.subarray(start, start + size);
    pos = start + size;
    if (!body.length) continue;

    if (id === "TIT2" || id === "TPE1" || id === "TPUB") {
      const text = decode(body.subarray(1), body[0]).split("\0")[0];
      if (id === "TIT2") tags.title = text;
      else if (id === "TPE1") tags.artist = text;
      else tags.publisher = text;
    } else if (id === "APIC" && !tags.cover) {
      const enc = body[0];
      let i = 1;
      while (i < body.length && body[i] !== 0) i++;
      const mime = Array.from(body.subarray(1, i), (c) => String.fromCharCode(c)).join("") || "image/jpeg";
      i += 2; // null + picture type
      const wide = enc === 1 || enc === 2;
      while (i < body.length && !(body[i] === 0 && (!wide || body[i + 1] === 0))) i += wide ? 2 : 1;
      i += wide ? 2 : 1;
      if (i < body.length) tags.cover = { mime, data: body.slice(i) };
    }
  }
  return tags;
}

/** The rule: a title, the section's artist, the Bavarmandan site as publisher, and a cover image. */
export function checkTags(tags: AudioTags, artist?: string): string[] {
  const problems: string[] = [];
  if (!tags.title) problems.push("عنوان (title)");
  if (!tags.artist || (artist && tags.artist !== artist)) problems.push("خواننده/گوینده (artist)");
  if (!/bavarmandan\.com/i.test(tags.publisher)) problems.push("ناشر (publisher)");
  if (!tags.cover) problems.push("لوگو");
  return problems;
}

const utf16 = (text: string) => {
  const out = new Uint8Array(5 + text.length * 2);
  out.set([1, 0xff, 0xfe]);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    out[3 + i * 2] = c & 0xff;
    out[4 + i * 2] = c >> 8;
  }
  return out; // last two bytes stay 0 = terminator
};

function frame(id: string, body: Uint8Array) {
  const out = new Uint8Array(10 + body.length);
  for (let i = 0; i < 4; i++) out[i] = id.charCodeAt(i);
  out.set([(body.length >>> 24) & 255, (body.length >>> 16) & 255, (body.length >>> 8) & 255, body.length & 255], 4);
  out.set(body, 10);
  return out;
}

export function writeTags(audio: Uint8Array, tags: AudioTags): Blob {
  const frames: Uint8Array[] = [frame("TIT2", utf16(tags.title)), frame("TPE1", utf16(tags.artist)), frame("TPUB", utf16(tags.publisher))];
  if (tags.cover) {
    const mime = Array.from(tags.cover.mime, (c) => c.charCodeAt(0));
    const head = new Uint8Array([0, ...mime, 0, 3, 0]);
    const body = new Uint8Array(head.length + tags.cover.data.length);
    body.set(head);
    body.set(tags.cover.data, head.length);
    frames.push(frame("APIC", body));
  }
  const size = frames.reduce((sum, f) => sum + f.length, 0);
  const header = new Uint8Array([0x49, 0x44, 0x33, 3, 0, 0, (size >> 21) & 0x7f, (size >> 14) & 0x7f, (size >> 7) & 0x7f, size & 0x7f]);
  return new Blob([header, ...frames, audio.subarray(tagLength(audio))], { type: "audio/mpeg" });
}

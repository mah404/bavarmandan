import "server-only";

import { normalizePersianText } from "@/lib/akhlagh-order";
import type { AudioCatalog, CatalogFile, LatestCatalogItem, MaktubatSession, MediaTopic } from "@/lib/media-api";

/*
 * The site's single source of managed content: the media server's public content API
 *   GET /api/content, /api/latest, /api/content/burhan, /api/content/tajrid
 * (the same data the dashboard edits through /api/admin/content/*). This file turns those answers into the
 * catalog shape the site's components already read, so only published sessions of visible courses ever appear.
 */

const DEFAULT_BASE = "http://167.233.60.102:3001";
const TIMEOUT = 15_000;

export function contentSource(): "admin" | "legacy" {
  return process.env.CONTENT_SOURCE?.trim().toLowerCase() === "legacy" ? "legacy" : "admin";
}

function baseUrl() {
  return (process.env.MEDIA_API_URL || process.env.MEDIA_API_BASE || DEFAULT_BASE).trim().replace(/\/+$/, "");
}

/* ---------- raw shapes of the content API ---------- */

interface RawSession {
  id: string;
  title?: string;
  subtitle?: string | null;
  audioName?: string | null;
  textName?: string | null;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  lessonStart?: string | null;
  lessonEnd?: string | null;
  createdAt?: string;
  files?: Array<{ id?: string; name?: string; url?: string }>;
}
interface RawCourse {
  id: string;
  title: string;
  order?: number;
  sessions?: RawSession[];
}
interface RawLatest {
  id: string;
  title?: string;
  subtitle?: string | null;
  courseId?: string;
  courseTitle?: string;
  section?: string;
  createdAt?: string;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  lesson?: { start?: string | null; end?: string | null } | null;
}
export interface RawContent {
  content?: { akhlagh?: RawCourse[]; aghayed?: RawCourse[]; tafsir?: RawCourse[] };
  latest?: { items?: RawLatest[] };
  burhan?: { title?: string; sessions?: RawSession[] };
  tajrid?: { sessions?: Array<RawSession & { n?: number; sharhUrl?: string | null; handoutUrl?: string | null }>; books?: Array<{ title?: string; name?: string; url?: string }> };
}

/* ---------- helpers ---------- */

// The site's components look some topics up by their old fixed names; courses are matched by title.
const akhlaghKeys: Record<string, string> = {
  "نشآت وجودی انسان": "nashaatvojoodi",
  "لذت در عبادت": "lezat-dar-ebadat",
  "تاملاتی در من": "tamolati-dar-man",
  "تکبر": "takabbor",
  "حب دنیا": "hobbe-donya",
  "بخل": "bokhl",
  "غضب": "ghadab",
  "غیبت": "gheibat",
  "نفاق": "nefagh",
  "تعصب": "taassob",
  "حسد": "hasad",
  "عجب": "ojbe",
  "ریا": "riya",
  "دعا": "doa",
};
const aghayedKeys: Record<string, string> = {
  "باورداشت": "bavardasht",
  "مع الصادقین": "maa-al-sadeghin",
  "کنکاش در عقاید": "konkash-dar-aghayed",
  "شیعه و میراث فاطمی": "shia-va-miras-fatemi",
  "گفتگوهای قرآنی": "goftogooha-ye-qorani",
  "مباحث متفرقه": "motafarreghe",
};

const keyFor = (table: Record<string, string>, course: RawCourse) => {
  const title = normalizePersianText(course.title);
  const hit = Object.entries(table).find(([name]) => normalizePersianText(name) === title);
  return hit ? hit[1] : `c-${course.id}`;
};

/** The معاد course of the قرآن section is shown as «تفسیر موضوعی»; the other one as «تفسیر ترتیبی». */
const isMozooei = (course: RawCourse) => /معاد|واقعه|موضوعی|احسن/.test(course.title);

/**
 * Media links come back relative ("/api/media/ID/audio"). They are made absolute here, and a harmless
 * "?name=…mp3|pdf" is added because parts of the site decide audio-or-PDF from the file extension of the link.
 */
function media(url: string | null | undefined, name: string | null | undefined, ext: "mp3" | "pdf") {
  if (!url) return undefined;
  const full = /^https?:\/\//i.test(url) ? url : `${baseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
  const clean = name && new RegExp(`\\.${ext}$`, "i").test(name) ? name : `file.${ext}`;
  return `${full}${full.includes("?") ? "&" : "?"}name=${encodeURIComponent(clean)}`;
}

/**
 * The site shows every PDF it finds in `pdfs` AND the one in `pdfUrl`, so a session must carry its main PDF in one place only:
 * course sessions (the old catalog's shape) in `pdfs`, burhan sessions (the old maktubat shape) in `pdfUrl`.
 */
function session(raw: RawSession, mode: "course" | "burhan" = "course"): MaktubatSession {
  const audioUrl = media(raw.audioUrl, raw.audioName, "mp3");
  const pdfUrl = media(raw.pdfUrl, raw.textName, "pdf");
  const related = (raw.files ?? [])
    .map((file) => ({ title: file.name || "فایل", url: media(file.url, file.name, "pdf") }))
    .filter((file): file is { title: string; url: string } => Boolean(file.url));
  const pdfs = [...(mode === "course" && pdfUrl ? [{ title: "قسمت 1", url: pdfUrl }] : []), ...related];

  return {
    id: raw.id,
    title: raw.title ?? "",
    subtitle: raw.subtitle ?? "",
    audioUrl,
    pdfUrl: mode === "burhan" ? pdfUrl : undefined,
    pdfs,
    lesson: raw.lessonStart && raw.lessonEnd ? { start: raw.lessonStart, end: raw.lessonEnd } : undefined,
    createdAt: raw.createdAt,
  };
}

const audioFile = (s: MaktubatSession): CatalogFile | null =>
  s.audioUrl
    ? { id: s.id, title: s.title, subtitle: typeof s.subtitle === "string" ? s.subtitle : "", url: s.audioUrl, audioUrl: s.audioUrl, type: "audio/mpeg", createdAt: s.createdAt, lesson: s.lesson ?? null }
    : null;

function topic(course: RawCourse): MediaTopic {
  const sessions = (course.sessions ?? []).map((item) => session(item));
  return {
    title: course.title,
    description: "",
    sessions,
    files: sessions.map(audioFile).filter((file): file is CatalogFile => file !== null),
  };
}

const sorted = (courses: RawCourse[] = []) => [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/* ---------- the catalog ---------- */

export function adaptCatalog(raw: RawContent): AudioCatalog {
  const akhlagh: Record<string, MediaTopic> = {};
  for (const course of sorted(raw.content?.akhlagh)) akhlagh[keyFor(akhlaghKeys, course)] = topic(course);

  const aghayed: Record<string, MediaTopic> = {};
  for (const course of sorted(raw.content?.aghayed)) aghayed[keyFor(aghayedKeys, course)] = topic(course);

  let tafsir: MediaTopic | undefined;
  const tafsirmozooei: Record<string, MediaTopic> = {};
  for (const course of sorted(raw.content?.tafsir)) {
    if (isMozooei(course)) tafsirmozooei.maad ??= topic(course);
    else tafsir ??= topic(course);
  }

  const burhan = raw.burhan?.sessions ?? [];
  const tajridSessions = [...(raw.tajrid?.sessions ?? [])].sort((a, b) => (a.n ?? 0) - (b.n ?? 0));

  // Where a latest item lives in the catalog above (the components find it by section + collection).
  const where = (item: RawLatest) => {
    const course = (item.section === "tafsir" ? raw.content?.tafsir : item.section === "akhlagh" ? raw.content?.akhlagh : raw.content?.aghayed)?.find((c) => c.id === item.courseId);
    if (item.section === "tafsir") return { section: course && isMozooei(course) ? "tafsirmozooei" : "tafsir", collection: course && isMozooei(course) ? "maad" : "tafsir" };
    if (item.section === "akhlagh") return { section: "akhlagh", collection: course ? keyFor(akhlaghKeys, course) : item.courseId ?? "" };
    return { section: "aghayed", collection: course ? keyFor(aghayedKeys, course) : item.courseId ?? "" };
  };

  const latest: LatestCatalogItem[] = (raw.latest?.items ?? []).map((item) => {
    const place = where(item);
    const audioUrl = media(item.audioUrl, null, "mp3");
    const pdfUrl = media(item.pdfUrl, null, "pdf");
    return {
      id: item.id,
      title: item.title ?? "",
      subtitle: item.subtitle ?? "",
      audioUrl,
      lesson: item.lesson?.start && item.lesson?.end ? { start: item.lesson.start, end: item.lesson.end } : null,
      addedAt: item.createdAt,
      pdfs: pdfUrl ? [{ title: "قسمت 1", url: pdfUrl }] : [],
      key: `${place.section}:${place.collection}:${item.id}`,
      section: place.section,
      collection: place.collection,
      collectionTitle: item.courseTitle ?? "",
    };
  });

  return {
    latest,
    maktubat: {
      title: raw.burhan?.title || "برهان امکان و وجوب",
      description: "لیست کامل مکتوبات",
      sessions: burhan.map((item) => session(item, "burhan")),
      motafarreghe: [],
    },
    tajrid: {
      audios: tajridSessions
        .map((s) => audioFile(session(s)))
        .filter((file): file is CatalogFile => file !== null),
      pdfs: (raw.tajrid?.books ?? [])
        .map((book) => ({ title: book.title || book.name || "کتاب", url: media(book.url, book.name, "pdf") }))
        .filter((book): book is { title: string; url: string } => Boolean(book.url)),
    },
    akhlagh,
    aghayed,
    ...(tafsir ? { tafsir } : {}),
    tafsirmozooei,
  };
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT) });
  if (!response.ok) throw new Error(`${path} → ${response.status}`);
  return (await response.json()) as T;
}

/** Reads the four public endpoints and builds the catalog. Throws when any of them is unreachable. */
async function buildAdminCatalog(): Promise<AudioCatalog> {
  const [content, latest, burhan, tajrid] = await Promise.all([
    getJson<{ content?: RawContent["content"] }>("/api/content"),
    getJson<RawContent["latest"]>("/api/latest"),
    getJson<RawContent["burhan"]>("/api/content/burhan"),
    getJson<RawContent["tajrid"]>("/api/content/tajrid"),
  ]);
  return adaptCatalog({ content: content.content, latest, burhan, tajrid });
}

/*
 * Every catalog request costs four calls to the media server, and the server limits how many calls one address
 * may make. All visitors share this server's address, so the catalog is kept in memory for a few seconds, requests
 * that arrive together share one build, and when the media server fails (or says "too many requests") the last
 * good catalog is served for a while instead of an empty site.
 */
const FRESH_MS = 5_000;
const STALE_MS = 15 * 60_000;
let cached: { at: number; catalog: AudioCatalog } | null = null;
let building: Promise<AudioCatalog> | null = null;

export async function getAdminCatalog(options: { fresh?: boolean } = {}): Promise<{ catalog: AudioCatalog; stale: boolean }> {
  const now = Date.now();
  if (!options.fresh && cached && now - cached.at < FRESH_MS) return { catalog: cached.catalog, stale: false };

  if (!building) {
    building = buildAdminCatalog()
      .then((catalog) => {
        cached = { at: Date.now(), catalog };
        return catalog;
      })
      .finally(() => {
        building = null;
      });
  }

  try {
    return { catalog: await building, stale: false };
  } catch (error) {
    if (cached && Date.now() - cached.at < STALE_MS) return { catalog: cached.catalog, stale: true };
    throw error;
  }
}

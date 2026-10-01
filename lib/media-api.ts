export const MEDIA_API_BASE = process.env.MEDIA_API_BASE || "";

export const AUDIO_CATALOG_URL = MEDIA_API_BASE
  ? `${MEDIA_API_BASE.replace(/\/$/, "")}/api/audios`
  : "";

export const MEDIA_BROWSE_URL = MEDIA_API_BASE
  ? `${MEDIA_API_BASE.replace(/\/$/, "")}/api/browse`
  : "";

export function mediaBrowseUrlWithKey(secretKey?: string) {
  if (!MEDIA_BROWSE_URL || !secretKey) return MEDIA_BROWSE_URL;

  const url = new URL(MEDIA_BROWSE_URL);
  url.searchParams.set("key", secretKey);
  return url.toString();
}

export type CatalogFile = {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  url?: string | null;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  downloadUrl?: string | null;
  file?: string;
  folder?: string;
  createdAt?: string;
  type?: string;
};

export type CatalogFileWithUrl = CatalogFile & { url: string };

export type MaktubatSession = {
  id?: string;
  title?: string;
  subtitle?: string | string[];
  content?: string;
  notesIntro?: string | null;
  notesSummary?: string | null;
  notesIntroduction?: string | null;
  notes?: {
    intro?: string | null;
    summary?: string | null;
  };
  url?: string | null;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  downloadUrl?: string | null;
  pdfs?: CatalogFile[];
  files?: CatalogFile[];
  createdAt?: string;
};

export type LatestCatalogItem = {
  id?: string;
  title?: string;
  subtitle?: string | string[] | null;
  audioUrl?: string | null;
  pdfs?: CatalogFile[];
  key?: string;
  section?: string;
  collection?: string;
  collectionTitle?: string;
  addedAt?: string;
};

export type MediaTopic = {
  title?: string;
  description?: string;
  folder?: string;
  files?: CatalogFile[];
  sessions?: MaktubatSession[];
};

export type AudioCatalog = {
  latest?: LatestCatalogItem[];
  maktubat?: {
    title?: string;
    description?: string;
    sessions?: MaktubatSession[];
    motafarreghe?: CatalogFile[];
  };
  tajrid?: {
    audios?: CatalogFile[];
    pdfs?: CatalogFile[];
  };
  aghayed?: Record<string, MediaTopic | undefined>;
  tafsir?: MediaTopic;
  tafsirmozooei?: Record<string, MediaTopic | undefined>;
  akhlagh?: Record<string, MediaTopic | undefined> | MediaTopic[] | { topics?: MediaTopic[] };
};

export type BeliefSession = {
  title: string;
  description: string;
  url: string;
  points: string[];
  summaries: { title: string; url: string }[];
  createdAt?: string;
};

const persianNumberWords: Record<string, number> = {
  اول: 1,
  یک: 1,
  دوم: 2,
  دو: 2,
  سوم: 3,
  سه: 3,
  چهارم: 4,
  چهار: 4,
  پنجم: 5,
  پنج: 5,
  ششم: 6,
  شش: 6,
  هفتم: 7,
  هفت: 7,
  هشتم: 8,
  هشت: 8,
  نهم: 9,
  نه: 9,
  دهم: 10,
  ده: 10,
  یازدهم: 11,
  دوازدهم: 12,
  سیزدهم: 13,
  چهاردهم: 14,
  پانزدهم: 15,
  شانزدهم: 16,
  هفدهم: 17,
  هجدهم: 18,
  نوزدهم: 19,
  بیستم: 20,
  بیست: 20,
  "سی‌ام": 30,
  سی: 30,
  چهلم: 40,
  چهل: 40,
  پنجاهم: 50,
  پنجاه: 50,
  شصتم: 60,
  شصت: 60,
  هفتادم: 70,
  هفتاد: 70,
  هشتادم: 80,
  هشتاد: 80,
  نودم: 90,
  نود: 90,
};

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

const persianOrdinalNumbers: Record<number, string> = {
  1: "اول",
  2: "دوم",
  3: "سوم",
  4: "چهارم",
  5: "پنجم",
  6: "ششم",
  7: "هفتم",
  8: "هشتم",
  9: "نهم",
  10: "دهم",
  11: "یازدهم",
  12: "دوازدهم",
  13: "سیزدهم",
  14: "چهاردهم",
  15: "پانزدهم",
  16: "شانزدهم",
  17: "هفدهم",
  18: "هجدهم",
  19: "نوزدهم",
  20: "بیستم",
  30: "سی‌ام",
  40: "چهلم",
  50: "پنجاهم",
  60: "شصتم",
  70: "هفتادم",
  80: "هشتادم",
  90: "نودم",
};

const persianCardinalTens: Record<number, string> = {
  20: "بیست",
  30: "سی",
  40: "چهل",
  50: "پنجاه",
  60: "شصت",
  70: "هفتاد",
  80: "هشتاد",
  90: "نود",
};

export function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    return String(arabicDigits.indexOf(digit));
  });
}

export function toPersianDigits(value: string | number) {
  return String(value)
    .replace(/[0-9]/g, (digit) => persianDigits[Number(digit)])
    .replace(/[٠-٩]/g, (digit) => persianDigits[arabicDigits.indexOf(digit)]);
}

export function persianOrdinal(value: number) {
  if (persianOrdinalNumbers[value]) return persianOrdinalNumbers[value];

  if (value > 20 && value < 100) {
    const tens = Math.floor(value / 10) * 10;
    const ones = value % 10;
    if (persianCardinalTens[tens] && persianOrdinalNumbers[ones]) {
      return `${persianCardinalTens[tens]} و ${persianOrdinalNumbers[ones]}`;
    }
  }

  return toPersianDigits(value);
}

export function formatSessionTitle(sessionNumber: number) {
  return `جلسه ${persianOrdinal(sessionNumber)}`;
}

function sessionNumberFromPersianWords(text = "") {
  const normalized = text.replace(/\s+/g, " ").trim();
  const phrase = normalized.match(
    /(?:جلسه|session|قسمت|part|مکتوب)\s*[-:]?\s*([آ-ی‌ ]+)/
  )?.[1];
  const target = phrase || normalized;

  const entries = Object.entries(persianNumberWords).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [tensWord, tens] of entries) {
    if (tens < 20 || tens % 10 !== 0) continue;

    for (const [onesWord, ones] of entries) {
      if (ones < 1 || ones > 9) continue;
      if (target.includes(`${tensWord} و ${onesWord}`)) return tens + ones;
    }
  }

  for (const [word, number] of entries) {
    if (target.includes(word)) return number;
  }

  return null;
}

export function normalizeSessionTitle(title = "", fallbackNumber?: number) {
  const sessionNumber =
    sessionNumberFromText(title) ||
    (typeof fallbackNumber === "number" ? fallbackNumber : null);

  if (!sessionNumber) return title;

  return title.replace(
    /جلسه\s*[-:]?\s*(?:[0-9۰-۹٠-٩]+|[آ-ی‌]+(?:\s+و\s+[آ-ی‌]+)?)/,
    formatSessionTitle(sessionNumber)
  );
}

export function fileUrl(file: CatalogFile | MaktubatSession) {
  return (
    ("url" in file ? file.url : undefined) ||
    file.audioUrl ||
    file.pdfUrl ||
    file.downloadUrl ||
    ""
  );
}

export function isPdfUrl(url = "", type = "") {
  return type.toLowerCase().includes("pdf") || /\.pdf(?:[?#]|$)/i.test(url);
}

export function isAudioUrl(url = "", type = "") {
  return (
    type.toLowerCase().includes("audio") ||
    /\.(mp3|m4a|wav|ogg|aac|mp4)(?:[?#]|$)/i.test(url)
  );
}

export function toDownloadUrl(url: string) {
  return url;
}

export function toStreamableUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return `/api/stream?url=${encodeURIComponent(url)}`;
  }

  return url;
}

export function toPdfViewUrl(url: string) {
  return `/api/pdf-view?url=${encodeURIComponent(url)}`;
}

export function sessionNumberFromText(text = "") {
  const normalized = normalizeDigits(text);
  const numeric = normalized.match(/(?:جلسه|session|قسمت|part|مکتوب)\s*[-:]?\s*(\d+)/i);
  if (numeric) return Number(numeric[1]);

  return sessionNumberFromPersianWords(text);
}

export function normalizeBeliefSessions(files: CatalogFile[] = []): BeliefSession[] {
  const grouped = new Map<number, BeliefSession>();
  let currentSession = 0;

  files.forEach((file, index) => {
    const url = fileUrl(file);
    if (!url) return;

    const label = file.title || file.description || file.subtitle || "";
    const explicitSession = sessionNumberFromText(`${label} ${url}`);
    const isPdf = isPdfUrl(url, file.type);
    const isAudio = isAudioUrl(url, file.type) && !isPdf;

    if (isAudio) {
      currentSession = explicitSession || currentSession + 1 || index + 1;
      grouped.set(currentSession, {
        title: normalizeSessionTitle(file.title || "", currentSession) || formatSessionTitle(currentSession),
        description: file.description || file.subtitle || file.title || "",
        url,
        points: [],
        summaries: [],
        createdAt: file.createdAt,
      });
      return;
    }

    const targetSession = explicitSession || currentSession || 1;
    const existing = grouped.get(targetSession) || {
      title: formatSessionTitle(targetSession),
      description: "",
      url: "",
      points: [],
      summaries: [],
      createdAt: file.createdAt,
    };

    if (isPdf) {
      existing.summaries.push({
        title: file.title || `قسمت ${toPersianDigits(existing.summaries.length + 1)}`,
        url,
      });
    }

    grouped.set(targetSession, existing);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([, session], index) => ({
      ...session,
      title: normalizeSessionTitle(session.title, index + 1) || formatSessionTitle(index + 1),
      description: session.description || "اصول عقاید شیعه",
    }));
}

function subtitlePoints(subtitle: string | string[] = "") {
  const text = Array.isArray(subtitle) ? subtitle.join("  ") : subtitle;

  return normalizeDigits(text)
    .split(/\s+(?=\d+\s*[-ـ])/)
    .map((part) => part.replace(/^\d+\s*[-ـ]\s*/, "").trim())
    .filter(Boolean);
}

function textValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join("  ") : value || "";
}

export function normalizeBeliefTopic(topic?: MediaTopic): BeliefSession[] {
  if (topic?.sessions?.length) {
    return topic.sessions
      .map((session, index) => ({
        title: normalizeSessionTitle(session.title, index + 1) || formatSessionTitle(index + 1),
        description:
          topic.description ||
          session.content ||
          textValue(session.subtitle) ||
          topic.title ||
          "",
        url: session.audioUrl || "",
        points: subtitlePoints(session.subtitle),
        summaries:
          session.pdfs
            ?.map((pdf, pdfIndex) => ({
              title: pdf.title || `قسمت ${toPersianDigits(pdfIndex + 1)}`,
              url: fileUrl(pdf),
            }))
            .filter((pdf) => !!pdf.url) || [],
        createdAt: session.createdAt,
      }))
      .filter((session) => !!session.url || session.summaries.length > 0);
  }

  return normalizeBeliefSessions(catalogFiles(topic));
}

export function catalogFiles(topic?: MediaTopic): CatalogFileWithUrl[] {
  return (
    topic?.files
      ?.map((file) => ({ ...file, url: fileUrl(file) }))
      .filter((file): file is CatalogFileWithUrl => !!file.url) || []
  );
}

export const MEDIA_API_BASE = process.env.MEDIA_API_BASE || "";

export const AUDIO_CATALOG_URL = MEDIA_API_BASE
  ? `${MEDIA_API_BASE.replace(/\/$/, "")}/api/audios`
  : "";

export type CatalogFile = {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  url?: string | null;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  createdAt?: string;
  type?: string;
};

export type CatalogFileWithUrl = CatalogFile & { url: string };

export type MaktubatSession = {
  id?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  pdfs?: CatalogFile[];
  createdAt?: string;
};

export type MediaTopic = {
  title?: string;
  description?: string;
  files?: CatalogFile[];
  sessions?: MaktubatSession[];
};

export type AudioCatalog = {
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
  akhlagh?: Record<string, MediaTopic | undefined>;
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
};

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    return String(arabicDigits.indexOf(digit));
  });
}

export function fileUrl(file: CatalogFile | MaktubatSession) {
  return ("url" in file ? file.url : undefined) || file.audioUrl || file.pdfUrl || "";
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
  return url;
}

export function toPdfViewUrl(url: string) {
  return `/api/pdf-view?url=${encodeURIComponent(url)}`;
}

export function sessionNumberFromText(text = "") {
  const normalized = normalizeDigits(text);
  const numeric = normalized.match(/(?:جلسه|session|قسمت|part)\s*[-:]?\s*(\d+)/i);
  if (numeric) return Number(numeric[1]);

  for (const [word, number] of Object.entries(persianNumberWords)) {
    if (text.includes(word)) return number;
  }

  return null;
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
        title: file.title || `جلسه ${currentSession}`,
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
      title: `جلسه ${targetSession}`,
      description: "",
      url: "",
      points: [],
      summaries: [],
      createdAt: file.createdAt,
    };

    if (isPdf) {
      existing.summaries.push({
        title: file.title || `قسمت ${existing.summaries.length + 1}`,
        url,
      });
    }

    grouped.set(targetSession, existing);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([, session], index) => ({
      ...session,
      title: session.title || `جلسه ${index + 1}`,
      description: session.description || "اصول عقاید شیعه",
    }));
}

function subtitlePoints(subtitle = "") {
  return normalizeDigits(subtitle)
    .split(/\s+(?=\d+\s*[-ـ])/)
    .map((part) => part.replace(/^\d+\s*[-ـ]\s*/, "").trim())
    .filter(Boolean);
}

export function normalizeBeliefTopic(topic?: MediaTopic): BeliefSession[] {
  if (topic?.sessions?.length) {
    return topic.sessions
      .map((session, index) => ({
        title: session.title || `جلسه ${index + 1}`,
        description: topic.description || session.content || session.subtitle || topic.title || "",
        url: session.audioUrl || "",
        points: subtitlePoints(session.subtitle),
        summaries:
          session.pdfs
            ?.map((pdf, pdfIndex) => ({
              title: pdf.title || `قسمت ${pdfIndex + 1}`,
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

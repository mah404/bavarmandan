import { AUDIO_CATALOG_URL, MEDIA_API_BASE } from "@/lib/media-api";
import { fallbackAudioCatalog } from "@/lib/fallback-audio-catalog";
import {
  fileUrl,
  isAudioUrl,
  isPdfUrl,
  sessionNumberFromText,
} from "@/lib/media-api";
import type { AudioCatalog, CatalogFile, MediaTopic, MaktubatSession } from "@/lib/media-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fallbackResponse() {
  return Response.json(fallbackAudioCatalog, {
    headers: {
      "Cache-Control": "no-store",
      "X-Catalog-Source": "fallback",
    },
  });
}

function mergeFilesTopic(
  liveTopic: MediaTopic | undefined,
  fallbackTopic: MediaTopic | undefined
): MediaTopic | undefined {
  if (!liveTopic && !fallbackTopic) return undefined;

  const liveFiles = liveTopic?.files || [];
  const fallbackFiles = fallbackTopic?.files || [];
  const seen = new Set<string>();
  const files = [...liveFiles, ...fallbackFiles].filter((file) => {
    const key = file.url || file.audioUrl || file.pdfUrl || file.title || "";
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    ...fallbackTopic,
    ...liveTopic,
    files,
  };
}

function absoluteMediaUrl(path = "") {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const base = MEDIA_API_BASE.replace(/\/$/, "");
  return base ? `${base}/${path.replace(/^\//, "")}` : path;
}

function normalizeText(value: unknown) {
  return Array.isArray(value) ? value.filter(Boolean).join("  ") : String(value || "");
}

function normalizeFile(file: CatalogFile, fallbackFolder = "", rootFolder = ""): CatalogFile {
  const rawUrl = fileUrl(file);
  const filePath = file.file
    ? [rootFolder, file.folder || fallbackFolder, file.file]
        .filter(Boolean)
        .join("/")
    : "";
  const url =
    rawUrl ||
    (filePath ? absoluteMediaUrl(filePath) : "");

  return {
    ...file,
    url: url ? absoluteMediaUrl(url) : null,
  };
}

function normalizeFilesTopic(
  topic?: MediaTopic,
  rootFolder = ""
): MediaTopic | undefined {
  if (!topic) return undefined;

  return {
    ...topic,
    files: (topic.files || []).map((file) =>
      normalizeFile(file, topic.folder, rootFolder)
    ),
  };
}

function normalizeAkhlagh(
  source: AudioCatalog["akhlagh"]
): Record<string, MediaTopic | undefined> {
  if (!source) return {};

  const sourceAsTopics = source as { topics?: MediaTopic[] };
  const topics = Array.isArray(source)
    ? source
    : Array.isArray(sourceAsTopics.topics)
      ? sourceAsTopics.topics
      : Object.entries(source).map(([key, topic]) => ({
          folder: topic?.folder || key,
          ...topic,
        }));

  return topics.reduce<Record<string, MediaTopic | undefined>>((acc, topic, index) => {
    const key = topic.folder || topic.title || `topic-${index}`;
    acc[key] = normalizeFilesTopic(topic, "akhlagh");
    return acc;
  }, {});
}

function normalizeAghayed(
  source: AudioCatalog["aghayed"]
): Record<string, MediaTopic | undefined> {
  if (!source) return {};

  return Object.fromEntries(
    Object.entries(source).map(([key, topic]) => [key, normalizeFilesTopic(topic)])
  );
}

function mergeSessions(
  liveSessions: MaktubatSession[] = [],
  fallbackSessions: MaktubatSession[] = []
) {
  const byKey = new Map<string, MaktubatSession>();

  const sessionKey = (session: MaktubatSession, index: number, prefix: string) => {
    const number =
      session.id ||
      sessionNumberFromText(`${session.title || ""} ${normalizeText(session.subtitle)}`);

    return number ? String(number) : `${prefix}-${index}`;
  };

  const normalizeSession = (session: MaktubatSession) => {
    const files = session.files || session.pdfs || [];
    const directUrl = fileUrl(session);
    const directAudioUrl = isAudioUrl(directUrl) ? directUrl : "";
    const directPdfUrl = isPdfUrl(directUrl) ? directUrl : "";
    const audioFile = files.find((file) => isAudioUrl(fileUrl(file), file.type));
    const pdfFile = files.find((file) => isPdfUrl(fileUrl(file), file.type));

    return {
      ...session,
      subtitle: normalizeText(session.subtitle),
      audioUrl: session.audioUrl || directAudioUrl || (audioFile ? fileUrl(audioFile) : null),
      pdfUrl: session.pdfUrl || directPdfUrl || (pdfFile ? fileUrl(pdfFile) : null),
      pdfs:
        session.pdfs ||
        files.filter((file): file is CatalogFile =>
          isPdfUrl(fileUrl(file), file.type)
        ),
    };
  };

  fallbackSessions.forEach((session, index) => {
    byKey.set(sessionKey(session, index, "fallback"), normalizeSession(session));
  });

  liveSessions.forEach((session, index) => {
    const key = sessionKey(session, index, "live");
    const existing = byKey.get(key);
    const normalized = normalizeSession(session);
    byKey.set(
      key,
      existing
        ? {
            ...existing,
            ...normalized,
            audioUrl: normalized.audioUrl || existing.audioUrl || null,
            pdfUrl: normalized.pdfUrl || existing.pdfUrl || null,
            pdfs: normalized.pdfs?.length ? normalized.pdfs : existing.pdfs,
          }
        : normalized
    );
  });

  return Array.from(byKey.values());
}

function mergeCatalog(liveCatalog: AudioCatalog): AudioCatalog {
  const fallbackAghayed = fallbackAudioCatalog.aghayed || {};
  const liveAghayed = normalizeAghayed(liveCatalog.aghayed);
  const aghayedKeys = new Set([
    ...Object.keys(fallbackAghayed),
    ...Object.keys(liveAghayed),
  ]);

  const aghayed: AudioCatalog["aghayed"] = {};
  aghayedKeys.forEach((key) => {
    if (key === "bavardasht") {
      const liveTopic = liveAghayed[key];
      const fallbackTopic = fallbackAghayed[key];
      aghayed[key] = {
        ...fallbackTopic,
        ...liveTopic,
        sessions: mergeSessions(
          liveTopic?.sessions || [],
          fallbackTopic?.sessions || []
        ),
      };
      return;
    }

    aghayed[key] = mergeFilesTopic(liveAghayed[key], fallbackAghayed[key]);
  });

  const fallbackAkhlagh = normalizeAkhlagh(fallbackAudioCatalog.akhlagh);
  const liveAkhlagh = normalizeAkhlagh(liveCatalog.akhlagh);
  const akhlaghKeys = new Set([
    ...Object.keys(fallbackAkhlagh),
    ...Object.keys(liveAkhlagh),
  ]);

  const akhlagh: Record<string, MediaTopic | undefined> = {};
  akhlaghKeys.forEach((key) => {
    akhlagh[key] = mergeFilesTopic(liveAkhlagh[key], fallbackAkhlagh[key]);
  });

  return {
    ...fallbackAudioCatalog,
    ...liveCatalog,
    aghayed,
    akhlagh,
    maktubat: {
      ...fallbackAudioCatalog.maktubat,
      ...liveCatalog.maktubat,
      sessions: mergeSessions(
        liveCatalog.maktubat?.sessions || [],
        fallbackAudioCatalog.maktubat?.sessions || []
      ),
      motafarreghe: [
        ...(liveCatalog.maktubat?.motafarreghe || []),
        ...(fallbackAudioCatalog.maktubat?.motafarreghe || []),
      ].filter((file, index, files) => {
        const key = file.url || file.audioUrl || file.pdfUrl || file.title || "";
        return key && files.findIndex((item) => (
          item.url || item.audioUrl || item.pdfUrl || item.title || ""
        ) === key) === index;
      }),
    },
    tajrid: {
      ...fallbackAudioCatalog.tajrid,
      ...liveCatalog.tajrid,
      audios: liveCatalog.tajrid?.audios || fallbackAudioCatalog.tajrid?.audios,
      pdfs: liveCatalog.tajrid?.pdfs || fallbackAudioCatalog.tajrid?.pdfs,
    },
  };
}

export async function GET() {
  if (!AUDIO_CATALOG_URL) {
    return fallbackResponse();
  }

  try {
    const response = await fetch(AUDIO_CATALOG_URL, { cache: "no-store" });

    if (!response.ok) {
      return fallbackResponse();
    }

    const catalog = mergeCatalog(await response.json());
    return Response.json(catalog, {
      headers: {
        "Cache-Control": "no-store",
        "X-Catalog-Source": "live",
      },
    });
  } catch (error) {
    console.error("GET /api/audios error:", error);
    return fallbackResponse();
  }
}

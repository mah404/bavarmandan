import {
  AudioCatalog,
  CatalogFile,
  MaktubatSession,
  catalogFiles,
  fileUrl,
  isAudioUrl,
  normalizeBeliefTopic,
  sessionNumberFromText,
} from "@/lib/media-api";
import { akhlaghOrderIndex } from "@/lib/akhlagh-order";

export type LatestAudio = {
  title: string;
  url: string;
  createdAt?: string;
  description?: string;
  sheetId?: string;
  accordionValue?: string;
  itemDomId?: string;
};

type LatestCandidate = LatestAudio & {
  fallbackRank: number;
  order: number;
  sortTime: number;
};

const dateKeys = [
  "createdAt",
  "updatedAt",
  "uploadedAt",
  "publishedAt",
  "date",
] as const;

function firstDate(item?: Record<string, unknown> | null) {
  if (!item) return "";

  for (const key of dateKeys) {
    const value = item[key];
    if (typeof value === "string" && Number.isFinite(new Date(value).getTime())) {
      return value;
    }
  }

  return "";
}

function safeTime(iso = "") {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : -Infinity;
}

function sessionRank(session: MaktubatSession | undefined, index: number) {
  const idNumber = Number(session?.id);
  const textNumber = sessionNumberFromText(session?.title || "");
  return Number.isFinite(idNumber) && idNumber > 0
    ? idNumber
    : textNumber || index + 1;
}

function displayText(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join(" | ") : value;
}

const aghayedTargets: Record<
  string,
  { accordionValue: string; itemDomIdPrefix?: string; fallbackBase: number }
> = {
  "maa-al-sadeghin": {
    accordionValue: "group-1",
    itemDomIdPrefix: "audio-akhlagh-audioFilessadeghin",
    fallbackBase: 650_000,
  },
  "konkash-dar-aghayed": {
    accordionValue: "group-2",
    itemDomIdPrefix: "audio-akhlagh-audioFilesnew",
    fallbackBase: 640_000,
  },
  "shia-va-miras-fatemi": {
    accordionValue: "group-3",
    fallbackBase: 630_000,
  },
  "goftogooha-ye-qorani": {
    accordionValue: "group-4",
    fallbackBase: 620_000,
  },
  motafarreghe: {
    accordionValue: "group-5",
    fallbackBase: 610_000,
  },
};

function pushCandidate(
  candidates: LatestCandidate[],
  order: number,
  fallbackRank: number,
  audio: LatestAudio
) {
  if (!audio.url) return order;

  candidates.push({
    ...audio,
    fallbackRank,
    order,
    sortTime: safeTime(audio.createdAt),
  });

  return order + 1;
}

export function getLatestAudios(
  catalog: AudioCatalog | null | undefined,
  limit = 5
): LatestAudio[] {
  if (!catalog) return [];

  const candidates: LatestCandidate[] = [];
  let order = 0;

  const bavardashtTopic = catalog.aghayed?.bavardasht;
  const beliefSessions = normalizeBeliefTopic(bavardashtTopic);
  beliefSessions.forEach((session, index) => {
    const rawSession = bavardashtTopic?.sessions?.[index];
    const rank = sessionRank(rawSession, index);

    order = pushCandidate(candidates, order, 1_000_000 + rank, {
      title: session.title,
      url: session.url,
      createdAt: firstDate(rawSession) || session.createdAt,
      description: `اصول عقاید شیعه - ${session.title}`,
      sheetId: "akhlagh",
      accordionValue: "belief",
      itemDomId: `audio-akhlagh-belief-${index}`,
    });
  });

  (catalog.tafsir?.sessions || []).forEach((session, index) => {
    const url = fileUrl(session);
    if (!isAudioUrl(url)) return;

    const rank = sessionRank(session, index);

    order = pushCandidate(candidates, order, 1_100_000 + rank, {
      title: session.title || "",
      url,
      createdAt: firstDate(session),
      description: `تفسیر قرآن - ${session.title || `جلسه ${index + 1}`}`,
      sheetId: "tafsir",
      accordionValue: "tafsir-tartibi",
      itemDomId: `tafsir-session-${session.id || index}`,
    });
  });

  Object.entries(catalog.akhlagh || {})
    .map(([key, topic], originalIndex) => ({
      key,
      topic,
      originalIndex,
      subject: topic?.title || key,
    }))
    .sort((a, b) => {
      const byTitle = akhlaghOrderIndex(a.subject) - akhlaghOrderIndex(b.subject);
      return byTitle || a.originalIndex - b.originalIndex;
    })
    .forEach(({ key, topic, subject }, groupIndex) => {
      catalogFiles(topic).forEach((file, fileIndex) => {
        const url = fileUrl(file);
        if (!isAudioUrl(url, file.type)) return;

        order = pushCandidate(
          candidates,
          order,
          900_000 - groupIndex * 100 - fileIndex,
          {
            title: file.title || subject,
            url,
            createdAt: firstDate(file as CatalogFile),
            description: subject || file.description || file.title || key,
            sheetId: "benefitsCard",
            accordionValue: `group-${groupIndex}`,
            itemDomId: `audio-benefitsCard-${groupIndex}-${fileIndex}`,
          }
        );
      });
    });

  Object.entries(catalog.aghayed || {}).forEach(([key, topic]) => {
    if (key === "bavardasht") return;

    const target = aghayedTargets[key] || {
      accordionValue: key,
      fallbackBase: 600_000,
    };

    catalogFiles(topic).forEach((file, fileIndex) => {
      const url = fileUrl(file);
      if (!isAudioUrl(url, file.type)) return;

      order = pushCandidate(
        candidates,
        order,
        target.fallbackBase - fileIndex,
        {
          title: file.title || topic?.title || key,
          url,
          createdAt: firstDate(file),
          description: topic?.title || file.description || file.title || key,
          sheetId: "akhlagh",
          accordionValue: target.accordionValue,
          itemDomId: target.itemDomIdPrefix
            ? `${target.itemDomIdPrefix}-${fileIndex}`
            : undefined,
        }
      );
    });
  });

  (catalog.maktubat?.sessions || []).forEach((session, index) => {
    const url = fileUrl(session);
    if (!isAudioUrl(url)) return;

    order = pushCandidate(candidates, order, 800_000 + sessionRank(session, index), {
      title: session.title || "",
      url,
      createdAt: firstDate(session),
      description: displayText(session.subtitle) || session.content || session.title,
      sheetId: "maktobat",
      accordionValue: session.id,
      itemDomId: session.id ? `maktobat-item-${session.id}` : undefined,
    });
  });

  (catalog.tajrid?.audios || []).forEach((file, index) => {
    const url = fileUrl(file);
    if (!isAudioUrl(url, file.type)) return;
    const session = sessionRank(file, index);

    order = pushCandidate(candidates, order, 700_000 - index, {
      title: file.title || `فایل ${index + 1}`,
      url,
      createdAt: firstDate(file),
      description: file.description || file.title,
      sheetId: "tajrid",
      accordionValue: `audio-${session}`,
      itemDomId: `tajrid-audio-${session}`,
    });
  });

  return candidates
    .sort((a, b) => {
      const aHasDate = Number.isFinite(a.sortTime);
      const bHasDate = Number.isFinite(b.sortTime);

      if (aHasDate || bHasDate) {
        if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;
        if (a.sortTime !== b.sortTime) return b.sortTime - a.sortTime;
      }

      if (a.fallbackRank !== b.fallbackRank) {
        return b.fallbackRank - a.fallbackRank;
      }

      return b.order - a.order;
    })
    .slice(0, limit)
    .map(({ fallbackRank, order, sortTime, ...audio }) => audio);
}

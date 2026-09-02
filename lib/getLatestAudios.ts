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

const latestSectionRankBase = 1_600_000;

// Newest session in each of these sections gets its own top tier (higher
// number = higher priority), so freshly added content always leads the
// list regardless of which section it's in. Older sessions in the same
// section fall back to a low tier further down.
function tafsirNewestRank(rank: number) {
  return latestSectionRankBase + 1_100 + rank;
}

function tafsirLatestRank(rank: number) {
  return latestSectionRankBase + rank * 100;
}

function thematicTafsirLatestRank(rank: number) {
  return latestSectionRankBase + 1_050 + rank;
}

function thematicTafsirOldRank(rank: number) {
  return 940_000 + rank;
}

function nashaatLatestRank(rank: number) {
  return latestSectionRankBase + 700 + rank;
}

function beliefLatestRank(rank: number) {
  return latestSectionRankBase + 1_300 + rank;
}

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

function maxSessionRank(sessions: MaktubatSession[] = []) {
  return sessions.reduce(
    (max, session, index) => Math.max(max, sessionRank(session, index)),
    0
  );
}

function displayText(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join(" | ") : value;
}

function akhlaghSessionTitle(session: MaktubatSession, index: number) {
  return session.title || `جلسه ${sessionRank(session, index) || index + 1}`;
}

function akhlaghDisplaySubject(key: string, subject: string) {
  return key === "nashaatvojoodi"
    ? "نشآت وجودی انسان: درجات و درکات"
    : subject;
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

// Persisted "have we ever seen this URL before" ledger, on top of the
// section ranking above. This is what actually detects new additions
// generically, from any API/section, without per-section rules: whatever
// wasn't here on a previous visit gets boosted above everything else. On
// the very first run ever (nothing recorded yet) it only records what's
// currently there and changes nothing, so today's ordering is untouched;
// from the next catalog fetch on, brand-new URLs jump to the top.
const SEEN_URLS_KEY = "bavarmandan-latest-seen-urls-v1";
const NEW_CONTENT_RANK_BOOST = 10_000_000;

function readSeenUrls(): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = window.localStorage.getItem(SEEN_URLS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeenUrls(urls: Set<string>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SEEN_URLS_KEY, JSON.stringify(Array.from(urls)));
  } catch {
    // Storage quota/private mode — just re-detects as "new" next call.
  }
}

function promoteNewlyAddedCandidates(candidates: LatestCandidate[]) {
  const seenUrls = readSeenUrls();
  const isBootstrap = seenUrls.size === 0;
  let changed = false;

  candidates.forEach((candidate) => {
    if (seenUrls.has(candidate.url)) return;

    if (!isBootstrap) {
      candidate.fallbackRank += NEW_CONTENT_RANK_BOOST;
    }

    seenUrls.add(candidate.url);
    changed = true;
  });

  if (changed) writeSeenUrls(seenUrls);
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
  const maxBeliefRank = maxSessionRank(bavardashtTopic?.sessions || []);
  beliefSessions.forEach((session, index) => {
    const rawSession = bavardashtTopic?.sessions?.[index];
    const rank = sessionRank(rawSession, index);
    const isNewestBeliefSession = rank === maxBeliefRank;

    order = pushCandidate(
      candidates,
      order,
      isNewestBeliefSession ? beliefLatestRank(rank) : 950_000 + rank,
      {
        title: session.title,
        url: session.url,
        createdAt: firstDate(rawSession) || session.createdAt,
        description: `اصول عقاید شیعه - ${session.title}`,
        sheetId: "akhlagh",
        accordionValue: "belief",
        itemDomId: `audio-akhlagh-belief-${index}`,
      }
    );
  });

  const tafsirSessions = catalog.tafsir?.sessions || [];
  const maxTafsirRank = maxSessionRank(tafsirSessions);
  tafsirSessions.forEach((session, index) => {
    const url = fileUrl(session);
    if (!isAudioUrl(url)) return;

    const rank = sessionRank(session, index);
    const isNewestTafsirSession = rank === maxTafsirRank;

    order = pushCandidate(
      candidates,
      order,
      isNewestTafsirSession ? tafsirNewestRank(rank) : tafsirLatestRank(rank),
      {
        title: session.title || "",
        url,
        createdAt: firstDate(session),
        description: `تفسیر ترتیبی - سوره حمد - ${session.title || `جلسه ${index + 1}`}`,
        sheetId: "tafsir",
        accordionValue: "tafsir-tartibi",
        itemDomId: `tafsir-session-${session.id || index}`,
      }
    );
  });

  const thematicTafsirSessions = catalog.tafsirmozooei?.maad?.sessions || [];
  const maxThematicTafsirRank = maxSessionRank(thematicTafsirSessions);
  thematicTafsirSessions.forEach((session, index) => {
    const url = fileUrl(session);
    if (!isAudioUrl(url)) return;

    const rank = sessionRank(session, index);
    const isNewestThematicSession = rank === maxThematicTafsirRank;

    order = pushCandidate(
      candidates,
      order,
      isNewestThematicSession
        ? thematicTafsirLatestRank(rank)
        : thematicTafsirOldRank(rank),
      {
        title: session.title || "",
        url,
        createdAt: firstDate(session),
        description: `تفسیر موضوعی - احسن الحدیث - ${
          session.title || `جلسه ${index + 1}`
        }`,
        sheetId: "tafsir",
        accordionValue: "tafsir-mozooei",
        itemDomId: `tafsir-mozooei-session-${session.id || index}`,
      }
    );
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
      topic?.sessions?.forEach((session: MaktubatSession, sessionIndex: number) => {
        const url = fileUrl(session);
        if (!isAudioUrl(url)) return;

        const displaySubject = akhlaghDisplaySubject(key, subject);
        const sessionTitle = akhlaghSessionTitle(session, sessionIndex);
        const latestTitle = `${displaySubject} - ${sessionTitle}`;

        order = pushCandidate(
          candidates,
          order,
          key === "nashaatvojoodi"
            ? nashaatLatestRank(sessionRank(session, sessionIndex))
            : 900_000 - groupIndex * 100 - sessionIndex,
          {
            title: latestTitle,
            url,
            createdAt: firstDate(session),
            description: latestTitle,
            sheetId: "benefitsCard",
            accordionValue: `group-${groupIndex}`,
            itemDomId: `audio-benefitsCard-${groupIndex}-${sessionIndex}`,
          }
        );
      });

      catalogFiles(topic).forEach((file, fileIndex) => {
        const url = fileUrl(file);
        if (!isAudioUrl(url, file.type)) return;

        const displaySubject = akhlaghDisplaySubject(key, subject);

        order = pushCandidate(
          candidates,
          order,
          900_000 - groupIndex * 100 - fileIndex,
          {
            title: file.title || subject,
            url,
            createdAt: firstDate(file as CatalogFile),
            description: displaySubject || file.description || file.title || key,
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

  promoteNewlyAddedCandidates(candidates);

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

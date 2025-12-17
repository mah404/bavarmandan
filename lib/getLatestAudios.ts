import {
  audioGroups,
  audioFilessadeghin,
  audioFilesnew,
  audioFiles,
  miscFiles,
  tajridAudios,
} from "@/data/content";

export type LatestAudio = {
  title: string;
  url: string;
  createdAt: string;
  description?: string;

  source:
    | "audioGroups"
    | "audioFilessadeghin"
    | "audioFilesnew"
    | "audioFiles"
    | "miscFiles"
    | "tajridAudios";

  groupSubject?: string;

  // ✅ add these
  sheetId?: "akhlagh" | "akhlaq" | "eteghadat" | string;
  accordionValue?: string;
  itemDomId?: string;
};



function safeTime(iso: string) {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : -Infinity;
}

export function getLatestAudios(limit = 5): LatestAudio[] {
  const merged: LatestAudio[] = [
    // 1) audioGroups (nested)
    ...audioGroups.flatMap((group) =>
      group.files
        .filter((f) => !!f.createdAt)
        .map((f) => ({
          title: f.title,
          url: f.url,
          createdAt: f.createdAt!,
          source: "audioGroups" as const,
          groupSubject: group.subject,
        }))
    ),

// 2) مع الصادقین
...audioFilessadeghin
  .filter((x) => !!x.createdAt)
  .map((x) => ({
    title: x.title,
    url: x.url,
    createdAt: x.createdAt!,
    description: x.description,
    source: "audioFilessadeghin" as const,

    sheetId: "eteghadat" as const,
    accordionValue: "group-0",
    itemDomId: `audio-eteghadat-audioFilessadeghin-0`,
  })),

// 3) audioFilesnew (کنکاش در عقاید)
...audioFilesnew
  .filter((x) => !!x.createdAt)
  .map((x, i) => ({
    title: x.title,
    url: x.url,
    createdAt: x.createdAt!,
    description: x.description,
    source: "audioFilesnew" as const,

    sheetId: "eteghadat" as const,
    accordionValue: "group-1",
    itemDomId: `audio-eteghadat-audioFilesnew-${i}`,
  })),

// 4) audioFiles (میراث فاطمی + گفتگوها)
// (if later you add createdAt)
...audioFiles
  .filter((x) => !!x.createdAt)
  .map((x, i) => ({
    title: x.title,
    url: x.url,
    createdAt: x.createdAt!,
    description: x.description,
    source: "audioFiles" as const,

    sheetId: "eteghadat" as const,
    accordionValue: i < 4 ? "group-2" : "group-3",
    itemDomId: `audio-eteghadat-audioFiles-${i}`,
  })),

// 5) miscFiles
...miscFiles
  .filter((x) => !!x.createdAt)
  .map((x, i) => ({
    title: x.title,
    url: x.url,
    createdAt: x.createdAt!,
    description: x.description,
    source: "miscFiles" as const,

    sheetId: "eteghadat" as const,
    accordionValue: "group-4",
    itemDomId: `audio-eteghadat-miscFiles-${i}`,
  })),

    // 6) tajridAudios (currently no createdAt in your data, but helper supports it if you add later)
    ...tajridAudios
      .filter((x) => !!x.createdAt)
      .map((x) => ({
        title: x.DescriptionOne || "تجرید",
        url: x.url,
        createdAt: x.createdAt!,
        description: [x.DescriptionTwo, x.DescriptionThree, x.DescriptionFour]
          .filter(Boolean)
          .join(" | "),
        source: "tajridAudios" as const,
      })),
  ];

  return merged
    .sort((a, b) => safeTime(b.createdAt) - safeTime(a.createdAt))
    .slice(0, limit);
}

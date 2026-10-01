export type MaktubatDetailsTextBlock = {
  title?: string | null;
  content?: string[] | string | null;
  sections?: Array<{
    title?: string | null;
    content?: string[] | string | null;
  }> | null;
};

export type MaktubatDetailsSession = {
  id?: string | number | null;
  title?: string | null;
  topic?: string | null;
  introduction?: MaktubatDetailsTextBlock | null;
  summary?: MaktubatDetailsTextBlock | null;
};

export type MaktubatDetailsResponse = {
  schemaVersion?: number;
  collection?: string;
  title?: string;
  description?: string;
  sessions?: MaktubatDetailsSession[];
};

export type MaktubatNotes = {
  id: string;
  documentTitle: string;
  sessionTitle: string;
  intro: string | null;
  summary: string | null;
};

function normalizeId(id: string | number | null | undefined) {
  return String(id || "").replace(/^0+/, "") || String(id || "");
}

function contentToParagraphs(content: string[] | string | null | undefined) {
  if (!content) return [];
  return Array.isArray(content) ? content : [content];
}

function blockToText(block: MaktubatDetailsTextBlock | null | undefined) {
  if (!block) return null;

  const lines: string[] = [];
  if (block.content) lines.push(...contentToParagraphs(block.content));

  if (block.sections?.length) {
    block.sections.forEach((section) => {
      if (section.title) lines.push(section.title);
      lines.push(...contentToParagraphs(section.content));
    });
  }

  const text = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");

  return text || null;
}

export function buildMaktubatNotesMap(response: MaktubatDetailsResponse | null | undefined) {
  const map = new Map<string, MaktubatNotes>();

  response?.sessions?.forEach((session) => {
    const id = normalizeId(session.id);
    if (!id) return;

    const intro = blockToText(session.introduction);
    const summary = blockToText(session.summary);
    if (!intro && !summary) return;

    map.set(id, {
      id,
      documentTitle: session.title?.trim() || "",
      sessionTitle: session.topic?.trim() || "",
      intro,
      summary,
    });
  });

  return map;
}

export function maktubatNotesToCache(notes: Map<string, MaktubatNotes>) {
  return Array.from(notes.values());
}

export function maktubatNotesFromCache(items: MaktubatNotes[] | null | undefined) {
  const map = new Map<string, MaktubatNotes>();
  items?.forEach((item) => {
    if (item.id) map.set(normalizeId(item.id), item);
  });
  return map;
}

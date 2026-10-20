/**
 * Extra per-announcement settings (show date, scheduled publish time, manual order) travel inside `content`
 * as a leading HTML comment, because the announcements API only stores title / content / published.
 * Visitors never see it: it is stripped before rendering.
 */
export interface AnnouncementMeta {
  showDate: boolean;
  /** ISO time (UTC) from which the announcement becomes visible; null = visible as soon as it is published. */
  publishAt: string | null;
  /** Position chosen by the admin (ascending); null = not ordered yet. */
  order: number | null;
  /** Cover image: a small compressed data URI (made in the dashboard) or an https URL. */
  cover: string | null;
}

const SAFE_COVER = /^(data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+|https:\/\/[^\s"'<>]+)$/;
const META_PATTERN = /^\s*<!--bv:(\{[\s\S]*?\})-->\s*/;

export const defaultAnnouncementMeta = (): AnnouncementMeta => ({ showDate: false, publishAt: null, order: null, cover: null });

export function parseAnnouncementContent(content: string): { meta: AnnouncementMeta; body: string } {
  const meta = defaultAnnouncementMeta();
  const match = META_PATTERN.exec(content || "");
  if (!match) return { meta, body: content || "" };

  try {
    const raw = JSON.parse(match[1]) as { d?: unknown; p?: unknown; o?: unknown; c?: unknown };
    meta.showDate = raw.d === 1;
    meta.publishAt = typeof raw.p === "string" && !Number.isNaN(Date.parse(raw.p)) ? raw.p : null;
    meta.order = typeof raw.o === "number" && Number.isFinite(raw.o) ? raw.o : null;
    meta.cover = typeof raw.c === "string" && SAFE_COVER.test(raw.c) ? raw.c : null;
  } catch {
    // Unreadable meta: show the announcement with defaults.
  }

  return { meta, body: (content || "").slice(match[0].length) };
}

export function buildAnnouncementContent(body: string, meta: Partial<AnnouncementMeta>) {
  const raw: Record<string, unknown> = {};
  if (meta.showDate) raw.d = 1;
  if (meta.publishAt) raw.p = meta.publishAt;
  if (typeof meta.order === "number") raw.o = meta.order;
  if (meta.cover) raw.c = meta.cover;
  return Object.keys(raw).length ? `<!--bv:${JSON.stringify(raw)}-->${body}` : body;
}

export function isVisibleNow(meta: AnnouncementMeta, now = Date.now()) {
  return !meta.publishAt || new Date(meta.publishAt).getTime() <= now;
}

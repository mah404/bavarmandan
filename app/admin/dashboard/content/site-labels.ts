import { formatSessionTitle, normalizeSessionTitle } from "@/lib/media-api";

/**
 * The name a session has on the public site (the reference): «مکتوب اول» / «جلسه 1» become «جلسه اول»,
 * and a session without a title gets «جلسه <ordinal>» from its position. Uses the site's own helpers.
 */
export function siteLabel(title: string | null | undefined, index: number) {
  const clean = (title ?? "").trim();
  if (!clean) return formatSessionTitle(index + 1);
  return normalizeSessionTitle(clean.replace(/^مکتوب\s+/, "جلسه "), index + 1);
}

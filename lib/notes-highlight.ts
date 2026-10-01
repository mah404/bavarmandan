import {
  DEFAULT_HIGHLIGHT_LIMIT_PER_PARAGRAPH,
  maktobatHighlightTerms,
} from "@/lib/highlight-terms";

export type HighlightPart = {
  text: string;
  highlighted: boolean;
};

type Range = {
  start: number;
  end: number;
};

const persianLetterMap: Record<string, string> = {
  ي: "ی",
  ى: "ی",
  ك: "ک",
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeForMatch(value: string) {
  return value.replace(/[يىك]/g, (char) => persianLetterMap[char] || char);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termPattern(term: string) {
  return escapeRegex(normalizeForMatch(term.trim())).replace(/[\s\u200C]+/g, "[\\s\\u200C]+");
}

function overlaps(range: Range, ranges: Range[]) {
  return ranges.some((item) => range.start < item.end && range.end > item.start);
}

function addManualRanges(text: string) {
  const source = normalizeForMatch(text);
  const ranges: Range[] = [];
  const markerRanges: Range[] = [];
  const regex = /\*\*([\s\S]+?)\*\*/gu;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source))) {
    const innerStart = match.index + 2;
    const innerEnd = regex.lastIndex - 2;
    if (innerStart < innerEnd) ranges.push({ start: innerStart, end: innerEnd });
    markerRanges.push({ start: match.index, end: match.index + 2 });
    markerRanges.push({ start: innerEnd, end: regex.lastIndex });
  }

  return { ranges, markerRanges };
}

function addTermRanges(
  text: string,
  terms: readonly string[],
  existingRanges: Range[],
  maxHighlights: number
) {
  const source = normalizeForMatch(text);
  const ranges = [...existingRanges];
  let count = ranges.length;
  const sortedTerms = [...terms]
    .map((term) => term.trim())
    .filter(Boolean)
    .sort((a, b) => normalizeForMatch(b).length - normalizeForMatch(a).length);

  for (const term of sortedTerms) {
    if (count >= maxHighlights) break;
    const regex = new RegExp(
      `(?<![\\p{L}\\p{N}\\u200C])${termPattern(term)}(?![\\p{L}\\p{N}\\u200C])`,
      "u"
    );
    const match = regex.exec(source);
    if (!match) continue;

    const range = { start: match.index, end: match.index + match[0].length };
    if (overlaps(range, ranges)) continue;
    ranges.push(range);
    count += 1;
  }

  return ranges.sort((a, b) => a.start - b.start);
}

export function highlightToParts(
  text: string,
  terms: readonly string[] = maktobatHighlightTerms,
  maxHighlights = DEFAULT_HIGHLIGHT_LIMIT_PER_PARAGRAPH
): HighlightPart[] {
  const { ranges: manualRanges, markerRanges } = addManualRanges(text);
  const ranges = addTermRanges(text, terms, manualRanges, Math.max(0, maxHighlights));
  const parts: HighlightPart[] = [];
  let index = 0;

  const pushText = (value: string, highlighted: boolean) => {
    if (value) parts.push({ text: value, highlighted });
  };

  ranges.forEach((range) => {
    const before = text.slice(index, range.start);
    pushText(
      markerRanges.reduce(
        (value, marker) =>
          value.replace(text.slice(marker.start, marker.end), ""),
        before
      ),
      false
    );
    pushText(text.slice(range.start, range.end), true);
    index = range.end;
  });

  const after = text.slice(index);
  let cleanedAfter = after;
  markerRanges.forEach((marker) => {
    cleanedAfter = cleanedAfter.replace(text.slice(marker.start, marker.end), "");
  });
  pushText(cleanedAfter, false);

  return parts;
}

export function highlight(
  text: string,
  terms: readonly string[] = maktobatHighlightTerms,
  maxHighlights = DEFAULT_HIGHLIGHT_LIMIT_PER_PARAGRAPH
) {
  return highlightToParts(text, terms, maxHighlights)
    .map((part) =>
      part.highlighted ? `<b>${escapeHtml(part.text)}</b>` : escapeHtml(part.text)
    )
    .join("");
}

export function splitNotesParagraphs(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const separator = /\n\s*\n/.test(trimmed) ? /\n\s*\n/ : /\n+/;
  return trimmed
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);
}

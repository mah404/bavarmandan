const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export type AudioSegmentMode = "lesson" | "full";

export type AudioLessonSegment = {
  start: number;
  end: number;
};

export type AudioSegmentInput = {
  lesson_start?: number | string | null;
  lesson_end?: number | string | null;
  lessonStart?: number | string | null;
  lessonEnd?: number | string | null;
  lesson?: {
    start?: number | string | null;
    end?: number | string | null;
  } | null;
};

export function parseTimecode(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
  }

  const text = String(value || "").trim();
  if (!text) return null;

  if (/^\d+$/.test(text)) {
    const seconds = Number(text);
    return Number.isFinite(seconds) ? seconds : null;
  }

  const parts = text.split(":").map((part) => Number(part.trim()));
  if (!parts.length || parts.length > 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const [hours, minutes, seconds] =
    parts.length === 3 ? parts : parts.length === 2 ? [0, parts[0], parts[1]] : [0, 0, parts[0]];

  if (minutes < 0 || seconds < 0 || minutes > 59 || seconds > 59) return null;

  return Math.floor(hours * 3600 + minutes * 60 + seconds);
}

export function resolveLessonSegment(input: AudioSegmentInput, duration?: number | null) {
  const start = parseTimecode(
    input.lesson_start ?? input.lessonStart ?? input.lesson?.start
  );
  const end = parseTimecode(input.lesson_end ?? input.lessonEnd ?? input.lesson?.end);

  if (start === null || end === null) return null;
  if (end <= start) return null;
  if (typeof duration === "number" && Number.isFinite(duration) && duration > 0 && end > duration) {
    return null;
  }

  return { start, end } satisfies AudioLessonSegment;
}

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)] || digit);
}

export function formatTimecode(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const two = (value: number) => String(value).padStart(2, "0");

  const formatted = hours > 0
    ? `${hours}:${two(minutes)}:${two(seconds)}`
    : `${two(minutes)}:${two(seconds)}`;

  return toPersianDigits(formatted);
}

export function formatSegmentRange(segment: AudioLessonSegment) {
  return `${formatTimecode(segment.start)} – ${formatTimecode(segment.end)}`;
}

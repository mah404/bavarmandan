import * as cheerio from "cheerio";

const COURSE_URL =
  "https://dinefetri.com/wp-json/wp/v2/product?slug=dinefetri-omoomi&_fields=content";
const AUDIO_HOST = "dl.dinefetri.com";
const AUDIO_PATH = "/dl/DineFetri26Jalase/";
const PUBLISHED_SESSION_COUNT = 1;

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

function toLatinDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
}

function cleanText(value: string) {
  return value.replace(/فایل صوتی/g, "").replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    const response = await fetch(COURSE_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (compatible; BavarmandanCourseReader/1.0; +https://dinefetri.com)",
      },
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return Response.json(
        { error: "دریافت جلسات دین فطری ممکن نشد." },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as Array<{
      content?: { rendered?: string };
    }>;
    const renderedContent = payload[0]?.content?.rendered;
    if (!renderedContent) {
      return Response.json(
        { error: "محتوای جلسات در منبع رسمی پیدا نشد." },
        { status: 502 }
      );
    }

    const $ = cheerio.load(renderedContent);
    const lessonTitles = new Map<number, string>();

    $("h4").each((_index, heading) => {
      const text = cleanText($(heading).text());
      const match = toLatinDigits(text).match(/^درس\s*(\d+)\s*[-–—]\s*(.+)$/);
      if (match) lessonTitles.set(Number(match[1]), match[2].trim());
    });

    const sessions = new Map<
      number,
      {
        id: string;
        number: number;
        title: string;
        audios: Array<{ id: string; title: string; url: string }>;
      }
    >();
    const seen = new Set<string>();

    $('audio source[type="audio/mpeg"], audio source[src*=".mp3"], audio source[src*=".MP3"]')
      .each((_index, source) => {
        const rawUrl = $(source).attr("src");
        if (!rawUrl || seen.has(rawUrl)) return;

        let parsed: URL;
        try {
          parsed = new URL(rawUrl);
        } catch {
          return;
        }

        if (parsed.hostname !== AUDIO_HOST || !parsed.pathname.startsWith(AUDIO_PATH)) {
          return;
        }

        const fileMatch = parsed.pathname.match(/\/(\d{2})(\d{2})\.[^/]+\.mp3$/i);
        if (!fileMatch) return;

        seen.add(rawUrl);
        const sessionNumber = Number(fileMatch[1]);
        const partNumber = Number(fileMatch[2]);
        const session = sessions.get(sessionNumber) || {
          id: sessionNumber === 0 ? "intro" : String(sessionNumber),
          number: sessionNumber,
          title:
            sessionNumber === 0
              ? "مقدمه"
              : lessonTitles.get(sessionNumber) || `درس ${sessionNumber}`,
          audios: [],
        };

        session.audios.push({
          id: `${sessionNumber}-${partNumber}`,
          title:
            sessionNumber === 0
              ? "صوت"
              : partNumber === 0
                ? "صوت جلسه"
                : `قسمت ${partNumber}`,
          url: rawUrl,
        });
        sessions.set(sessionNumber, session);
      });

    const result = Array.from(sessions.values())
      .filter(
        (session) =>
          session.number >= 0 && session.number < PUBLISHED_SESSION_COUNT
      )
      .sort((a, b) => a.number - b.number)
      .map((session) => ({
        ...session,
        id: String(session.number + 1),
        number: session.number + 1,
        audios: session.audios.sort((a, b) => {
          const aPart = Number(a.id.split("-")[1]);
          const bPart = Number(b.id.split("-")[1]);
          return aPart - bPart;
        }),
      }));

    if (result.length === 0) {
      return Response.json(
        { error: "ساختار جلسات در منبع رسمی قابل تشخیص نبود." },
        { status: 502 }
      );
    }

    return Response.json(
      {
        teacher: "حجت‌الاسلام والمسلمین سید هادی عظیمی",
        sessions: result,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Dine Fetri scraper error:", error);
    return Response.json(
      { error: "دریافت جلسات دین فطری ممکن نشد." },
      { status: 502 }
    );
  }
}

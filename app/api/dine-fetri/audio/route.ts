import * as cheerio from "cheerio";
import { NextRequest } from "next/server";

const COURSE_API =
  "https://dinefetri.com/wp-json/wp/v2/product?slug=dinefetri-omoomi&_fields=content";
const AUDIO_HOST = "dl.dinefetri.com";
const AUDIO_PATH = "/dl/DineFetri26Jalase/";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const audioUrlCache = new Map<string, { url: string; expiresAt: number }>();

export async function GET(request: NextRequest) {
  const session = request.nextUrl.searchParams.get("session");
  const part = request.nextUrl.searchParams.get("part");
  const wantsDownload = request.nextUrl.searchParams.get("download") === "1";

  if (!/^\d{1,2}$/.test(session || "") || !/^\d{1,2}$/.test(part || "")) {
    return new Response("Invalid audio id", { status: 400 });
  }

  const filePrefix = `${session!.padStart(2, "0")}${part!.padStart(2, "0")}.`;
  const cacheKey = `${session}-${part}`;

  try {
    const cached = audioUrlCache.get(cacheKey);
    let audioUrl =
      cached && cached.expiresAt > Date.now() + 60_000 ? cached.url : "";

    if (!audioUrl) {
      // The download signature is bound to the requesting IP. Fetching the page
      // and the MP3 in this server instance keeps both calls on the same egress.
      const courseResponse = await fetch(COURSE_API, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (compatible; BavarmandanCourseReader/1.0; +https://dinefetri.com)",
        },
        cache: "no-store",
      });

      if (!courseResponse.ok) {
        return new Response("Course source unavailable", { status: 502 });
      }

      const payload = (await courseResponse.json()) as Array<{
        content?: { rendered?: string };
      }>;
      const html = payload[0]?.content?.rendered;
      if (!html) return new Response("Course audio unavailable", { status: 502 });

      const $ = cheerio.load(html);

      $('audio source[type="audio/mpeg"], audio source[src*=".mp3"], audio source[src*=".MP3"]')
        .each((_index, source) => {
          if (audioUrl) return;
          const rawUrl = $(source).attr("src");
          if (!rawUrl) return;

          try {
            const parsed = new URL(rawUrl);
            const fileName = parsed.pathname.split("/").pop() || "";
            if (
              parsed.hostname === AUDIO_HOST &&
              parsed.pathname.startsWith(AUDIO_PATH) &&
              fileName.toLowerCase().startsWith(filePrefix.toLowerCase())
            ) {
              audioUrl = rawUrl;
            }
          } catch {
            // Ignore malformed source URLs from the upstream page.
          }
        });

      if (audioUrl) {
        const expires = Number(new URL(audioUrl).searchParams.get("expires"));
        audioUrlCache.set(cacheKey, {
          url: audioUrl,
          expiresAt: Number.isFinite(expires) ? expires * 1000 : Date.now() + 300_000,
        });
      }
    }

    if (!audioUrl) return new Response("Course audio not found", { status: 404 });

    const range = request.headers.get("range");
    const audioResponse = await fetch(audioUrl, {
      headers: {
        Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
        Referer: "https://dinefetri.com/",
        "User-Agent":
          "Mozilla/5.0 (compatible; BavarmandanCourseReader/1.0; +https://dinefetri.com)",
        ...(range ? { Range: range } : {}),
      },
      cache: "no-store",
    });

    if (!audioResponse.ok) {
      return new Response(`Audio source error: ${audioResponse.status}`, {
        status: audioResponse.status,
      });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      audioResponse.headers.get("content-type") || "audio/mpeg"
    );
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, no-store");

    for (const name of ["content-length", "content-range", "etag", "last-modified"]) {
      const value = audioResponse.headers.get(name);
      if (value) headers.set(name, value);
    }

    if (wantsDownload) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="dine-fetri-${session}-${part}.mp3"`
      );
    }

    return new Response(audioResponse.body, {
      status: audioResponse.status,
      headers,
    });
  } catch (error) {
    console.error("Dine Fetri audio proxy error:", error);
    return new Response("Audio proxy failed", { status: 502 });
  }
}

import { NextRequest } from "next/server";

function absolutizeUrl(baseUrl: string, value: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");

  if (!target) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(target);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        Referer: "https://www.aparatchi.com/",
        Origin: "https://www.aparatchi.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    const isPlaylist =
      contentType.includes("application/vnd.apple.mpegurl") ||
      contentType.includes("application/x-mpegURL") ||
      parsedUrl.pathname.endsWith(".m3u8");

    if (isPlaylist) {
      const playlistText = await upstream.text();

      const rewritten = playlistText
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();

          if (!trimmed) return line;
          if (trimmed.startsWith("#EXT-X-KEY:")) {
            return line.replace(/URI="([^"]+)"/, (_match, uri) => {
              const absoluteKeyUrl = absolutizeUrl(parsedUrl.toString(), uri);
              return `URI="/api/stream?url=${encodeURIComponent(
                absoluteKeyUrl
              )}"`;
            });
          }

          if (trimmed.startsWith("#")) return line;

          const absoluteUrl = absolutizeUrl(parsedUrl.toString(), trimmed);
          return `/api/stream?url=${encodeURIComponent(absoluteUrl)}`;
        })
        .join("\n");

      return new Response(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Proxy route error:", error);
    return new Response("Proxy request failed", { status: 500 });
  }
}
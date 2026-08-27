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
  const range = req.headers.get("range");

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
        ...(range ? { Range: range } : {}),
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

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set(
      "Accept-Ranges",
      upstream.headers.get("accept-ranges") || "bytes"
    );

    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    const etag = upstream.headers.get("etag");
    const lastModified = upstream.headers.get("last-modified");

    if (contentLength) responseHeaders.set("Content-Length", contentLength);
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
    if (etag) responseHeaders.set("ETag", etag);
    if (lastModified) responseHeaders.set("Last-Modified", lastModified);

    responseHeaders.set(
      "Cache-Control",
      contentRange
        ? "no-store, no-cache, must-revalidate"
        : "public, max-age=3600, s-maxage=86400"
    );

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy route error:", error);
    return new Response("Proxy request failed", { status: 500 });
  }
}

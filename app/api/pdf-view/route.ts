import { NextRequest } from "next/server";
import { MEDIA_API_BASE } from "@/lib/media-api";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");
  const range = request.headers.get("range");

  if (!source) {
    return new Response("Missing PDF url", { status: 400 });
  }

  let url: URL;

  try {
    url = new URL(source);
  } catch {
    return new Response("Invalid PDF url", { status: 400 });
  }

  if (!MEDIA_API_BASE) {
    return new Response("MEDIA_API_BASE is not configured", { status: 500 });
  }

  const mediaHost = new URL(MEDIA_API_BASE).hostname;
  const allowedHosts = new Set([mediaHost]);

  if (!allowedHosts.has(url.hostname)) {
    return new Response("Unsupported PDF host", { status: 400 });
  }

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/pdf,*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        ...(range ? { Range: range } : {}),
      },
    });

    if (!response.ok || !response.body) {
      return Response.redirect(url.toString(), 302);
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("content-type") || "application/pdf");
    headers.set("Content-Disposition", 'inline; filename="document.pdf"');
    headers.set(
      "Accept-Ranges",
      response.headers.get("accept-ranges") || "bytes"
    );
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");

    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");
    const etag = response.headers.get("etag");
    const lastModified = response.headers.get("last-modified");

    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);
    if (etag) headers.set("ETag", etag);
    if (lastModified) headers.set("Last-Modified", lastModified);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("PDF proxy route error:", error);
    return Response.redirect(url.toString(), 302);
  }
}

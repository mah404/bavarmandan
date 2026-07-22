import { NextRequest } from "next/server";
import { MEDIA_API_BASE } from "@/lib/media-api";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");

  if (!source) {
    return new Response("Missing PDF url", { status: 400 });
  }

  let url: URL;

  try {
    url = new URL(source);
  } catch {
    return new Response("Invalid PDF url", { status: 400 });
  }

  const mediaHost = new URL(MEDIA_API_BASE).hostname;
  const allowedHosts = new Set([mediaHost]);

  if (!allowedHosts.has(url.hostname)) {
    return new Response("Unsupported PDF host", { status: 400 });
  }

  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok || !response.body) {
    return new Response("Could not load PDF", { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="document.pdf"',
      "Cache-Control": "no-store",
    },
  });
}

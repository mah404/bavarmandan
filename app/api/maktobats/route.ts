import { AUDIO_CATALOG_URL } from "@/lib/media-api";
import { fallbackAudioCatalog } from "@/lib/fallback-audio-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!AUDIO_CATALOG_URL) {
    return Response.json(fallbackAudioCatalog.maktubat?.sessions || []);
  }

  try {
    const response = await fetch(AUDIO_CATALOG_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(await response.text());

    const catalog = await response.json();
    return Response.json(catalog?.maktubat?.sessions || []);
  } catch (error) {
    console.error("GET /api/maktobats compatibility error:", error);
    return Response.json(fallbackAudioCatalog.maktubat?.sessions || []);
  }
}

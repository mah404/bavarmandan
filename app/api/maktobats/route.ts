import { AUDIO_CATALOG_URL } from "@/lib/media-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!AUDIO_CATALOG_URL) {
    return Response.json(
      { error: "MEDIA_API_BASE is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(AUDIO_CATALOG_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(await response.text());

    const catalog = await response.json();
    return Response.json(catalog?.maktubat?.sessions || []);
  } catch (error) {
    console.error("GET /api/maktobats compatibility error:", error);
    return Response.json(
      { error: "Failed to fetch maktobats" },
      { status: 502 }
    );
  }
}

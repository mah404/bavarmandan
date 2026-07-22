import { AUDIO_CATALOG_URL } from "@/lib/media-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const response = await fetch(AUDIO_CATALOG_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(await response.text());

    const catalog = await response.json();
    return Response.json(catalog?.tajrid || { audios: [], pdfs: [] });
  } catch (error) {
    console.error("GET /api/tajrid compatibility error:", error);
    return Response.json(
      { error: "Failed to load Tajrid data." },
      { status: 502 }
    );
  }
}

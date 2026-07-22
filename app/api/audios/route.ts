import { AUDIO_CATALOG_URL } from "@/lib/media-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const response = await fetch(AUDIO_CATALOG_URL, { cache: "no-store" });

    if (!response.ok) {
      return Response.json(
        { error: "Audio catalog is unavailable" },
        { status: response.status }
      );
    }

    const catalog = await response.json();
    return Response.json(catalog, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/audios error:", error);
    return Response.json(
      { error: "خطا در دریافت فهرست فایل‌ها" },
      { status: 502 }
    );
  }
}

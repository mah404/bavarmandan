import { NextResponse } from "next/server";

export const revalidate = 60;

type Course = { id?: string; title?: string; [key: string]: unknown };

/** Only the course of سوره نور, taken from the media API on the server (the browser never calls the media server itself). */
export async function GET() {
  const base = (process.env.MEDIA_API_URL || process.env.MEDIA_API_BASE || "").trim().replace(/\/+$/, "");
  if (!base) return NextResponse.json({ success: false, message: "خطا در دریافت تفسیر سوره نور" }, { status: 502 });

  try {
    const response = await fetch(`${base}/api/content`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    const content = data.content ?? data;
    const course = (content.tafsir as Course[] | undefined)?.find(
      (item) => item.title === "تفسیر سوره نور" || item.title === "سوره نور" || item.title?.includes("نور")
    );
    if (!course) return NextResponse.json({ success: false, message: "دوره تفسیر سوره نور پیدا نشد" }, { status: 404 });
    return NextResponse.json({ success: true, course });
  } catch {
    return NextResponse.json({ success: false, message: "خطا در دریافت تفسیر سوره نور" }, { status: 502 });
  }
}

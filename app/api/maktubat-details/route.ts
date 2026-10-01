import { NextResponse } from "next/server";

const MAKTUBAT_DETAILS_URL =
  process.env.MAKTUBAT_DETAILS_URL ||
  "http://167.233.60.102:3001/api/maktubat-details";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(MAKTUBAT_DETAILS_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ sessions: [] }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/maktubat-details error:", error);
    return NextResponse.json({ sessions: [] }, { status: 200 });
  }
}

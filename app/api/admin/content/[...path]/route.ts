import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/announcements-server";
import { forwardToMediaAdmin } from "@/lib/media-admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The media server is in Germany (Hetzner Falkenstein): run these routes close to it.
export const preferredRegion = "fra1";
export const maxDuration = 60;

const ID = "[A-Za-z0-9_-]{1,80}";
const SECTION = "(?:akhlagh|aghayed|tafsir)";

// Only these paths and methods are forwarded to the content API; everything else is refused here.
const routes: Array<{ pattern: RegExp; methods: string[] }> = [
  { pattern: /^latest$/, methods: ["GET", "PUT"] },
  { pattern: new RegExp(`^${SECTION}/courses$`), methods: ["GET", "POST"] },
  { pattern: new RegExp(`^${SECTION}/courses/order$`), methods: ["PUT"] },
  { pattern: new RegExp(`^${SECTION}/courses/${ID}$`), methods: ["PATCH", "DELETE"] },
  { pattern: new RegExp(`^${SECTION}/courses/${ID}/sessions$`), methods: ["GET", "POST"] },
  { pattern: new RegExp(`^${SECTION}/courses/${ID}/sessions/${ID}$`), methods: ["PATCH", "DELETE"] },
  { pattern: new RegExp(`^${SECTION}/courses/${ID}/sessions/${ID}/(?:audio|text)$`), methods: ["POST", "DELETE"] },
  { pattern: /^burhan$/, methods: ["GET"] },
  { pattern: new RegExp(`^burhan/sessions/${ID}$`), methods: ["PATCH"] },
  { pattern: new RegExp(`^burhan/sessions/${ID}/(?:audio|text)$`), methods: ["POST", "DELETE"] },
  { pattern: new RegExp(`^burhan/sessions/${ID}/files$`), methods: ["POST"] },
  { pattern: new RegExp(`^burhan/sessions/${ID}/files/${ID}$`), methods: ["DELETE"] },
  { pattern: /^tajrid$/, methods: ["GET"] },
  { pattern: new RegExp(`^tajrid/sessions/${ID}$`), methods: ["PATCH"] },
  { pattern: new RegExp(`^tajrid/sessions/${ID}/(?:audio|sharh|jozve)$`), methods: ["POST", "DELETE"] },
];

const isUpload = (path: string) => /\/(?:audio|text|files|sharh|jozve)$/.test(path);

async function handle(request: NextRequest, { params }: { params: { path: string[] } }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const path = params.path.join("/");
  const matches = routes.filter((route) => route.pattern.test(path));
  if (matches.length === 0) return NextResponse.json({ success: false, message: "مسیر پیدا نشد." }, { status: 404 });
  if (!matches.some((route) => route.methods.includes(request.method))) {
    return NextResponse.json({ success: false, message: "این روش برای این مسیر مجاز نیست." }, { status: 405 });
  }

  return forwardToMediaAdmin(request, `/api/admin/content/${path}`, {
    upload: request.method === "POST" && isUpload(path),
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };

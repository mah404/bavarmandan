import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/announcements-server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * The dashboard's shared note: one document that every signed-in admin reads and writes.
 * `rev` grows with each save and `by` is the random id of the browser that saved, so other admins can be told
 * "the note changed" without the server knowing who anyone is.
 */
const COLLECTION = "admin_notes";
const ID = "main";
const MAX_LENGTH = 20_000;

interface NoteDoc {
  _id: string;
  text: string;
  rev: number;
  by: string;
  updatedAt: string;
}

const publicNote = (doc: NoteDoc | null) => ({
  text: doc?.text ?? "",
  rev: doc?.rev ?? 0,
  by: doc?.by ?? "",
  updatedAt: doc?.updatedAt ?? null,
});

const fail = (status: number, message: string) =>
  NextResponse.json({ success: false, message }, { status, headers: { "Cache-Control": "no-store" } });

async function notes() {
  const client = await clientPromise;
  return client.db().collection<NoteDoc>(COLLECTION);
}

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const doc = await (await notes()).findOne({ _id: ID });
    return NextResponse.json({ success: true, note: publicNote(doc) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/admin/notes failed:", error);
    return fail(503, "یادداشت‌ها در دسترس نیست.");
  }
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;

  let body: { text?: unknown; by?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail(400, "درخواست نامعتبر است.");
  }

  const text = typeof body.text === "string" ? body.text : null;
  const by = typeof body.by === "string" ? body.by.slice(0, 64) : "";
  if (text === null) return fail(400, "متن یادداشت نامعتبر است.");
  if (text.length > MAX_LENGTH) return fail(413, "یادداشت خیلی طولانی است.");

  try {
    const doc = await (await notes()).findOneAndUpdate(
      { _id: ID },
      { $set: { text, by, updatedAt: new Date().toISOString() }, $inc: { rev: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    return NextResponse.json({ success: true, note: publicNote(doc) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("PUT /api/admin/notes failed:", error);
    return fail(503, "ذخیره‌ی یادداشت انجام نشد.");
  }
}

"use client";

import { initialContent, isSectionSlug } from "./data";
import { initialBurhan, initialTajrid, tajridChapters } from "./solo-data";
import type { LatestSettings } from "./api";

/*
 * Offline stand-in for the content API: the same paths and answers as /api/admin/content/*, kept in this
 * browser's localStorage. Used while the dashboard is not connected to the media server (see DEMO_MODE in api.ts).
 */

interface DemoSession {
  id: string;
  title: string;
  subtitle?: string | null;
  status: "published" | "draft";
  audioName: string | null;
  textName: string | null;
  lessonStart: string | null;
  lessonEnd: string | null;
  createdAt: string;
}
interface DemoCourse {
  id: string;
  title: string;
  visible: boolean;
  sessions: DemoSession[];
}
interface Db {
  content: Record<string, DemoCourse[]>;
  burhan: Array<{ id: string; title: string; subtitle?: string | null; audioName: string | null; textName: string | null; files: { id: string; name: string }[]; createdAt: string }>;
  tajrid: Array<{ id: string; n: number; title: string; subtitle?: string | null; audioName: string | null; textName: string | null; handoutName: string | null; createdAt: string }>;
  latest: LatestSettings;
}

const KEY = "bv-admin-demo-v2";
const uid = () => Math.random().toString(36).slice(2, 9);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fresh(): Db {
  return {
    content: structuredClone(initialContent) as Record<string, DemoCourse[]>,
    burhan: initialBurhan.map((s) => ({
      id: s.id,
      title: s.title,
      audioName: s.audioName,
      textName: s.textName,
      files: s.files.map((name) => ({ id: `f-${uid()}`, name })),
      createdAt: s.createdAt,
    })),
    tajrid: initialTajrid.map((s) => ({ ...s })),
    latest: { mode: "auto", count: 5, pinned: [], hidden: [], picked: [], order: [] },
  };
}

let db: Db | null = null;

function load(): Db {
  if (!db) {
    try {
      const raw = window.localStorage.getItem(KEY);
      db = raw ? { ...fresh(), ...(JSON.parse(raw) as Partial<Db>) } : fresh();
    } catch {
      db = fresh();
    }
  }
  return db;
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Blocked storage: the change stays in memory for this visit.
  }
}

const fail = (message: string): never => {
  throw new Error(message);
};

const nameOf = (body: unknown) => {
  const file = body instanceof FormData ? body.get("file") : null;
  return file instanceof File ? file.name : fail("فایلی ارسال نشد.");
};

function latestResponse(state: Db) {
  const s = state.latest;
  const all = Object.entries(state.content)
    .flatMap(([section, courses]) =>
      courses
        .filter((course) => course.visible)
        .flatMap((course) =>
          course.sessions
            .filter((session) => session.status === "published")
            .map((session) => ({
              key: `${section}/${course.id}/${session.id}`,
              section,
              courseId: course.id,
              courseTitle: course.title,
              sessionId: session.id,
              title: session.title,
              createdAt: session.createdAt,
              audioName: session.audioName,
              textName: session.textName,
              lessonStart: session.lessonStart,
              lessonEnd: session.lessonEnd,
            }))
        )
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const byKey = new Map(all.map((item) => [item.key, item]));
  const find = (keys: string[]) => keys.map((key) => byKey.get(key)).filter((item): item is (typeof all)[number] => Boolean(item));
  const pinned = find(s.pinned);
  let shown: typeof all;
  if (s.mode === "manual") {
    const picked = find(s.picked);
    shown = [...pinned.filter((item) => picked.includes(item)), ...picked.filter((item) => !pinned.includes(item))];
  } else {
    shown = [...pinned, ...all.filter((item) => !s.pinned.includes(item.key) && !s.hidden.includes(item.key))];
  }
  const ordered = find(s.order).filter((item) => shown.includes(item));
  shown = [...ordered, ...shown.filter((item) => !ordered.includes(item))].slice(0, s.count);
  return { success: true, settings: s, current: shown, recent: all.slice(0, 30) };
}

export async function demoCall(method: string, path: string, body?: unknown): Promise<unknown> {
  await sleep(120);
  const state = load();
  const seg = path.split("/");
  const ok = (extra: object = {}) => {
    save();
    return { success: true, ...extra };
  };

  /* ---------- جدیدترین محتواها ---------- */
  if (seg[0] === "latest") {
    if (method === "PUT") {
      state.latest = body as LatestSettings;
      return ok();
    }
    return latestResponse(state);
  }

  /* ---------- برهان امکان و وجوب ---------- */
  if (seg[0] === "burhan") {
    if (seg.length === 1) return { success: true, title: "برهان امکان و وجوب", books: [], sessions: state.burhan };
    const session = state.burhan.find((item) => item.id === seg[2]) ?? fail("جلسه پیدا نشد.");
    const kind = seg[3];
    if (!kind) {
      const patch = body as { title?: string; subtitle?: string };
      session.title = String(patch.title ?? session.title);
      if (patch.subtitle !== undefined) session.subtitle = patch.subtitle;
      return ok();
    }
    if (kind === "files") {
      if (method === "POST") session.files.push({ id: `f-${uid()}`, name: nameOf(body) });
      else session.files = session.files.filter((file) => file.id !== seg[4]);
      return ok();
    }
    const field = kind === "audio" ? "audioName" : "textName";
    session[field] = method === "POST" ? nameOf(body) : null;
    return ok();
  }

  /* ---------- دروس شرح تجرید ---------- */
  if (seg[0] === "tajrid") {
    if (seg.length === 1) return { success: true, title: "دروس شرح کتاب تجرید الاعتقاد", chapters: tajridChapters, books: [], sessions: state.tajrid };
    const session = state.tajrid.find((item) => item.id === seg[2]) ?? fail("جلسه پیدا نشد.");
    const kind = seg[3];
    if (!kind) {
      const patch = body as { title?: string; subtitle?: string };
      session.title = String(patch.title ?? session.title);
      if (patch.subtitle !== undefined) session.subtitle = patch.subtitle;
      return ok();
    }
    const field = kind === "audio" ? "audioName" : kind === "sharh" ? "textName" : "handoutName";
    session[field] = method === "POST" ? nameOf(body) : null;
    return ok();
  }

  /* ---------- the three course-based sections ---------- */
  if (!isSectionSlug(seg[0]) || seg[1] !== "courses") return fail("مسیر پیدا نشد.");
  const courses = (state.content[seg[0]] ??= []);

  if (seg.length === 2) {
    if (method === "POST") {
      const title = String((body as { title?: string }).title ?? "").trim();
      if (!title) return fail("عنوان دوره را بنویسید.");
      courses.push({ id: `c-${uid()}`, title, visible: false, sessions: [] });
      return ok();
    }
    return {
      success: true,
      courses: courses.map((course, index) => ({
        id: course.id,
        section: seg[0],
        title: course.title,
        visible: course.visible,
        order: index + 1,
        sessionCount: course.sessions.length,
        lastSessionAt: course.sessions.reduce<string | null>((last, s) => (!last || s.createdAt > last ? s.createdAt : last), null),
        createdAt: course.sessions[0]?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };
  }

  if (seg[2] === "order") {
    const ids = (body as { ids: string[] }).ids;
    state.content[seg[0]] = ids.map((id) => courses.find((course) => course.id === id)).filter((course): course is DemoCourse => Boolean(course));
    return ok();
  }

  const course = courses.find((item) => item.id === seg[2]) ?? fail("دوره پیدا نشد.");

  if (seg.length === 3) {
    if (method === "DELETE") {
      state.content[seg[0]] = courses.filter((item) => item !== course);
      return ok();
    }
    const patch = body as { title?: string; visible?: boolean };
    if (patch.title !== undefined) course.title = patch.title.trim();
    if (patch.visible !== undefined) course.visible = patch.visible;
    return ok();
  }

  if (seg[3] !== "sessions") return fail("مسیر پیدا نشد.");

  if (seg.length === 4) {
    if (method === "POST") {
      const input = body as Partial<DemoSession>;
      const session: DemoSession = {
        id: `s-${uid()}`,
        title: String(input.title ?? "").trim(),
        subtitle: input.subtitle ?? null,
        status: "draft",
        audioName: null,
        textName: null,
        lessonStart: input.lessonStart ?? null,
        lessonEnd: input.lessonEnd ?? null,
        createdAt: new Date().toISOString(),
      };
      course.sessions.push(session);
      return ok({ session: { ...session, courseId: course.id, order: course.sessions.length } });
    }
    return { success: true, sessions: course.sessions.map((s, index) => ({ ...s, courseId: course.id, order: index + 1, updatedAt: s.createdAt })) };
  }

  const session = course.sessions.find((item) => item.id === seg[4]) ?? fail("جلسه پیدا نشد.");

  if (seg.length === 5) {
    if (method === "DELETE") {
      course.sessions = course.sessions.filter((item) => item !== session);
      return ok();
    }
    const patch = body as Partial<DemoSession>;
    const next = { ...session, ...patch };
    if (next.status === "published" && !next.audioName && !next.textName) return fail("برای انتشار حداقل یک فایل صوت یا مکتوب لازم است.");
    Object.assign(session, next);
    return ok();
  }

  const field = seg[5] === "audio" ? "audioName" : "textName";
  session[field] = method === "POST" ? nameOf(body) : null;
  return ok();
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { demoCall } from "./api-demo";
import type { SectionSlug } from "./data";

/*
 * Client of the dashboard's internal routes (/api/admin/content/*). The browser never talks to the media
 * server and never sees the admin token; the Next route handlers add it on the server.
 */

export class ApiError extends Error {}

/**
 * The dashboard is NOT connected to the media server unless NEXT_PUBLIC_CONTENT_MODE=live.
 * Without it, every call below is answered by the offline demo data in api-demo.ts (this browser only).
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_CONTENT_MODE !== "live";

const BASE = "/api/admin/content";

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (DEMO_MODE) return (await demoCall(method, path, body)) as T;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${BASE}/${path}`, {
      method,
      headers: body !== undefined && !isForm ? { "Content-Type": "application/json" } : undefined,
      // FormData is sent as it is: the browser adds the multipart boundary itself.
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("اتصال برقرار نشد. اینترنت را بررسی کنید و دوباره تلاش کنید.");
  }

  let data: { success?: boolean; message?: string } | null = null;
  try {
    data = response.status === 204 ? null : await response.json();
  } catch {
    data = null;
  }
  if (!response.ok || data?.success === false) {
    throw new ApiError(data?.message || (response.status === 401 ? "نشست مدیریت پایان یافته است؛ دوباره وارد شوید." : "درخواست انجام نشد."));
  }
  if (method !== "GET") announceChange();
  return data as T;
}

/** Tells open site pages (same browser) that content changed, so they refresh at once. */
function announceChange() {
  try {
    const channel = new BroadcastChannel("bv-content");
    channel.postMessage("changed");
    channel.close();
  } catch {
    // No BroadcastChannel: the storage event below still reaches other tabs.
  }
  try {
    window.localStorage.setItem("bv-content-changed", String(Date.now()));
  } catch {
    // Blocked storage: pages still refresh on focus and every 30 seconds.
  }
}

const enc = encodeURIComponent;
const form = (file: Blob, name: string) => {
  const data = new FormData();
  data.append("file", file, name);
  return data;
};

/* ---------- types (what the server returns) ---------- */

export interface Course {
  id: string;
  section: string;
  title: string;
  visible: boolean;
  order: number;
  sessionCount: number;
  lastSessionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  courseId: string;
  title: string;
  /** Short description shown under the session title on the site (optional; needs server support). */
  subtitle?: string | null;
  status: "published" | "draft";
  audioName: string | null;
  textName: string | null;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  lessonStart: string | null;
  lessonEnd: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  key?: string;
}

export interface SessionPatch {
  title?: string;
  subtitle?: string;
  status?: "published" | "draft";
  lessonStart?: string | null;
  lessonEnd?: string | null;
  order?: number;
}

export interface LatestSettings {
  mode: "auto" | "manual";
  count: 3 | 5 | 8;
  pinned: string[];
  hidden: string[];
  picked: string[];
  order: string[];
}

export interface LatestEntry {
  key: string;
  section: string;
  courseTitle: string;
  title: string;
  createdAt: string;
  hasAudio: boolean;
  hasText: boolean;
  hasLesson: boolean;
  /** Why an item may not show on the site: still a draft, or its course is hidden. */
  draft: boolean;
  courseHidden: boolean;
}

export interface LatestData {
  settings: LatestSettings;
  current: LatestEntry[];
  recent: LatestEntry[];
}

export interface RelatedFile {
  id: string;
  name: string;
  url?: string;
}

export interface BurhanSession {
  id: string;
  title: string;
  subtitle?: string | null;
  audioName: string | null;
  textName: string | null;
  files: RelatedFile[];
  createdAt: string;
  updatedAt: string;
}

export interface TajridChapter {
  id: string;
  title: string;
  from: number;
  to: number;
}

export interface TajridSession {
  id: string;
  n: number;
  title: string;
  subtitle?: string | null;
  audioName: string | null;
  textName: string | null;
  handoutName: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ---------- the three course-based sections ---------- */

export const listCourses = (section: SectionSlug) => call<{ courses: Course[] }>("GET", `${section}/courses`).then((r) => r.courses ?? []);
export const createCourse = (section: SectionSlug, title: string) => call("POST", `${section}/courses`, { title: title.trim() });
export const patchCourse = (section: SectionSlug, id: string, patch: { title?: string; visible?: boolean; order?: number }) =>
  call("PATCH", `${section}/courses/${enc(id)}`, patch);
export const saveCourseOrder = (section: SectionSlug, ids: string[]) => call("PUT", `${section}/courses/order`, { ids });
export const removeCourse = (section: SectionSlug, id: string) => call("DELETE", `${section}/courses/${enc(id)}`);

const sessionsPath = (section: SectionSlug, courseId: string) => `${section}/courses/${enc(courseId)}/sessions`;

export const listSessions = (section: SectionSlug, courseId: string) =>
  call<{ sessions: Session[] }>("GET", sessionsPath(section, courseId)).then((r) => r.sessions ?? []);
export const createSession = (section: SectionSlug, courseId: string, body: SessionPatch & { title: string }) =>
  call<{ session: Session }>("POST", sessionsPath(section, courseId), body).then((r) => r.session);
export const patchSession = (section: SectionSlug, courseId: string, id: string, patch: SessionPatch) =>
  call("PATCH", `${sessionsPath(section, courseId)}/${enc(id)}`, patch);
export const removeSession = (section: SectionSlug, courseId: string, id: string) =>
  call("DELETE", `${sessionsPath(section, courseId)}/${enc(id)}`);
export const uploadSessionFile = (section: SectionSlug, courseId: string, id: string, kind: "audio" | "text", file: Blob, name: string) =>
  call("POST", `${sessionsPath(section, courseId)}/${enc(id)}/${kind}`, form(file, name));
export const removeSessionFile = (section: SectionSlug, courseId: string, id: string, kind: "audio" | "text") =>
  call("DELETE", `${sessionsPath(section, courseId)}/${enc(id)}/${kind}`);

/* ---------- جدیدترین محتواها ---------- */

// The server's item shape is read tolerantly: a key ("section/courseId/sessionId"), titles, a date and which files exist.
type Loose = Record<string, any>;

function entry(raw: unknown): LatestEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Loose;
  const s: Loose = o.session && typeof o.session === "object" ? o.session : o;
  const c: Loose = o.course && typeof o.course === "object" ? o.course : {};
  const key: string =
    o.key ?? s.key ?? [o.section ?? o.slug, o.courseId ?? c.id ?? s.courseId, o.sessionId ?? s.id ?? o.id].filter(Boolean).join("/");
  if (!key) return null;
  return {
    key,
    section: String(o.section ?? o.slug ?? key.split("/")[0] ?? ""),
    courseTitle: String(o.courseTitle ?? o.collectionTitle ?? c.title ?? ""),
    title: String(s.title ?? o.title ?? ""),
    createdAt: String(o.createdAt ?? o.addedAt ?? s.createdAt ?? ""),
    hasAudio: Boolean(s.audioUrl ?? s.audioName ?? o.audioUrl ?? o.audioName),
    hasText: Boolean(s.pdfUrl ?? s.textName ?? o.pdfUrl ?? o.textName ?? (Array.isArray(o.pdfs) && o.pdfs.length)),
    draft: (s.status ?? o.status) === "draft",
    courseHidden: (o.courseVisible ?? c.visible) === false,
    hasLesson: Boolean(((s.lessonStart ?? o.lessonStart) && (s.lessonEnd ?? o.lessonEnd)) || ((o.lesson ?? s.lesson)?.start && (o.lesson ?? s.lesson)?.end)),
  };
}

const entries = (list: unknown) => (Array.isArray(list) ? list.map(entry).filter((item): item is LatestEntry => item !== null) : []);

export async function getLatest(): Promise<LatestData> {
  const r = await call<{ settings?: Partial<LatestSettings>; current?: unknown; recent?: unknown }>("GET", "latest");
  return {
    settings: { mode: "auto", count: 5, pinned: [], hidden: [], picked: [], order: [], ...(r.settings ?? {}) },
    current: entries(r.current),
    recent: entries(r.recent),
  };
}

export const putLatest = (settings: LatestSettings) => call("PUT", "latest", settings);

/* ---------- برهان امکان و وجوب ---------- */

export const getBurhan = () => call<{ sessions: BurhanSession[] }>("GET", "burhan").then((r) => (r.sessions ?? []).map((s) => ({ ...s, files: s.files ?? [] })));
export const patchBurhanSession = (id: string, patch: { title?: string; subtitle?: string }) => call("PATCH", `burhan/sessions/${enc(id)}`, patch);
export const uploadBurhanFile = (id: string, kind: "audio" | "text" | "files", file: Blob, name: string) =>
  call("POST", `burhan/sessions/${enc(id)}/${kind}`, form(file, name));
export const removeBurhanFile = (id: string, kind: "audio" | "text") => call("DELETE", `burhan/sessions/${enc(id)}/${kind}`);
export const removeBurhanRelated = (id: string, fileId: string) => call("DELETE", `burhan/sessions/${enc(id)}/files/${enc(fileId)}`);

/* ---------- دروس شرح تجرید الاعتقاد ---------- */

export const getTajrid = () =>
  call<{ chapters?: TajridChapter[]; sessions: TajridSession[] }>("GET", "tajrid").then((r) => ({
    chapters: r.chapters ?? [],
    sessions: [...(r.sessions ?? [])].sort((a, b) => a.n - b.n),
  }));
export const patchTajridSession = (id: string, patch: { title?: string; subtitle?: string }) => call("PATCH", `tajrid/sessions/${enc(id)}`, patch);
export const uploadTajridFile = (id: string, kind: "audio" | "sharh" | "jozve", file: Blob, name: string) =>
  call("POST", `tajrid/sessions/${enc(id)}/${kind}`, form(file, name));
export const removeTajridFile = (id: string, kind: "audio" | "sharh" | "jozve") => call("DELETE", `tajrid/sessions/${enc(id)}/${kind}`);

/* ---------- loading hook ---------- */

/** Loads data from the server; `reload()` fetches again (used after every change), `setData` is for optimistic updates. */
export function useRemote<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async (): Promise<T | null> => {
    try {
      const next = await loaderRef.current();
      setData(next);
      setError("");
      return next;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "بارگذاری انجام نشد.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, ...deps]);

  return { data, setData, loading, error, reload };
}

"use client";

import { useSyncExternalStore } from "react";
import { initialContent, type ContentState, type Course, type Session, type SessionStatus } from "./data";

/*
 * Demo store: the content lives in this browser only (localStorage) until the real API exists.
 * Every page reads and writes through the functions below, so connecting the API later means
 * rewriting only this file.
 */
const STORAGE_KEY = "bv-admin-content-demo-v1";

let state: ContentState | null = null;
const listeners = new Set<() => void>();

function load(): ContentState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ContentState;
      // New sections added to the demo data later still show up for people who saved an older copy.
      return { ...structuredClone(initialContent), ...parsed };
    }
  } catch {
    // Unreadable copy: start again from the demo data.
  }
  return structuredClone(initialContent);
}

function current(): ContentState {
  if (!state) state = load();
  return state;
}

function commit(next: ContentState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the change stays in memory for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useContent(): ContentState {
  return useSyncExternalStore(subscribe, current, () => initialContent);
}

const uid = () => Math.random().toString(36).slice(2, 9);

function mapCourses(slug: string, change: (courses: Course[]) => Course[]) {
  const content = current();
  commit({ ...content, [slug]: change(content[slug] ?? []) });
}

/* ---------- courses ---------- */

export function addCourse(slug: string, title: string) {
  mapCourses(slug, (courses) => [{ id: `c-${uid()}`, title: title.trim(), visible: true, sessions: [] }, ...courses]);
}

export function renameCourse(slug: string, id: string, title: string) {
  mapCourses(slug, (courses) => courses.map((course) => (course.id === id ? { ...course, title: title.trim() } : course)));
}

export function setCourseVisible(slug: string, id: string, visible: boolean) {
  mapCourses(slug, (courses) => courses.map((course) => (course.id === id ? { ...course, visible } : course)));
}

export function deleteCourse(slug: string, id: string) {
  mapCourses(slug, (courses) => courses.filter((course) => course.id !== id));
}

/** Moves a course to a new position (used by the arrows and by drag and drop). */
export function moveCourse(slug: string, id: string, toIndex: number) {
  mapCourses(slug, (courses) => {
    const from = courses.findIndex((course) => course.id === id);
    if (from < 0) return courses;
    const next = courses.slice();
    const [moved] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, moved);
    return next;
  });
}

/* ---------- sessions ---------- */

export interface SessionInput {
  title: string;
  audioName: string | null;
  textName: string | null;
  lessonStart: string | null;
  lessonEnd: string | null;
  status: SessionStatus;
}

function mapSessions(slug: string, courseId: string, change: (sessions: Session[]) => Session[]) {
  mapCourses(slug, (courses) =>
    courses.map((course) => (course.id === courseId ? { ...course, sessions: change(course.sessions) } : course))
  );
}

export function addSession(slug: string, courseId: string, input: SessionInput) {
  mapSessions(slug, courseId, (sessions) => [
    ...sessions,
    { id: `s-${uid()}`, ...input, title: input.title.trim(), createdAt: new Date().toISOString() },
  ]);
}

export function updateSession(slug: string, courseId: string, id: string, input: SessionInput) {
  mapSessions(slug, courseId, (sessions) =>
    sessions.map((session) => (session.id === id ? { ...session, ...input, title: input.title.trim() } : session))
  );
}

export function deleteSession(slug: string, courseId: string, id: string) {
  mapSessions(slug, courseId, (sessions) => sessions.filter((session) => session.id !== id));
}

/** Goes back to the demo data. */
export function resetDemoContent() {
  commit(structuredClone(initialContent));
}

"use client";

import { useMemo, useSyncExternalStore } from "react";
import { SECTION_SLUGS, type Course, type Session } from "./data";
import { useContent } from "./store";

/*
 * Demo store for the "جدیدترین محتواها" settings of the site's first page (localStorage only, like store.ts).
 * Replace the persistence here when the real API exists.
 */
export interface LatestSettings {
  mode: "auto" | "manual";
  count: 3 | 5 | 8;
  /** Kept at the top of the list (newest pin first). */
  pinned: string[];
  /** Auto mode: removed from the first page. */
  hidden: string[];
  /** Manual mode: the picked sessions, in order. */
  picked: string[];
  /** Order set by dragging; these come first, in this order. */
  order: string[];
}

export interface LatestItem {
  key: string;
  slug: (typeof SECTION_SLUGS)[number];
  course: Course;
  session: Session;
}

const STORAGE_KEY = "bv-admin-latest-demo-v1";
const defaults: LatestSettings = { mode: "auto", count: 5, pinned: [], hidden: [], picked: [], order: [] };

let state: LatestSettings | null = null;
const listeners = new Set<() => void>();

function current(): LatestSettings {
  if (!state) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      state = raw ? { ...defaults, ...(JSON.parse(raw) as Partial<LatestSettings>) } : defaults;
    } catch {
      state = defaults;
    }
  }
  return state;
}

export function updateLatest(change: (settings: LatestSettings) => LatestSettings) {
  state = change(current());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Blocked storage: the change stays in memory for this visit.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Newest published sessions of visible courses, with what the first page shows right now. */
export function useLatest() {
  const content = useContent();
  const settings = useSyncExternalStore(subscribe, current, () => defaults);

  return useMemo(() => {
    const all: LatestItem[] = SECTION_SLUGS.flatMap((slug) =>
      (content[slug] ?? [])
        .filter((course) => course.visible)
        .flatMap((course) =>
          course.sessions
            .filter((session) => session.status === "published")
            .map((session) => ({ key: `${slug}/${course.id}/${session.id}`, slug, course, session }))
        )
    ).sort((a, b) => b.session.createdAt.localeCompare(a.session.createdAt));

    const byKey = new Map(all.map((item) => [item.key, item]));
    const find = (keys: string[]) => keys.map((key) => byKey.get(key)).filter((item): item is LatestItem => Boolean(item));
    const pinned = find(settings.pinned);

    let shown: LatestItem[];
    if (settings.mode === "manual") {
      const picked = find(settings.picked);
      shown = [...pinned.filter((item) => picked.includes(item)), ...picked.filter((item) => !pinned.includes(item))];
    } else {
      const rest = all.filter((item) => !settings.pinned.includes(item.key) && !settings.hidden.includes(item.key));
      shown = [...pinned, ...rest];
    }
    const ordered = find(settings.order).filter((item) => shown.includes(item));
    shown = [...ordered, ...shown.filter((item) => !ordered.includes(item))];
    return { settings, all, shown: shown.slice(0, settings.count) };
  }, [content, settings]);
}

export const togglePin = (key: string) =>
  updateLatest((s) => ({ ...s, pinned: s.pinned.includes(key) ? s.pinned.filter((k) => k !== key) : [key, ...s.pinned] }));

export const removeFromHome = (key: string) =>
  updateLatest((s) => ({
    ...s,
    hidden: s.hidden.includes(key) ? s.hidden : [...s.hidden, key],
    picked: s.picked.filter((k) => k !== key),
    pinned: s.pinned.filter((k) => k !== key),
  }));

export const addToHome = (key: string) =>
  updateLatest((s) => ({
    ...s,
    hidden: s.hidden.filter((k) => k !== key),
    picked: s.picked.includes(key) ? s.picked : [key, ...s.picked],
  }));

/** Drag and drop: the visible list becomes the custom order, with `key` moved to `toIndex`. */
export function moveShown(visibleKeys: string[], key: string, toIndex: number) {
  const next = visibleKeys.filter((k) => k !== key);
  next.splice(toIndex, 0, key);
  updateLatest((s) => ({ ...s, order: next }));
}

export const resetOrder = () => updateLatest((s) => ({ ...s, order: [] }));

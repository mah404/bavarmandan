"use client";

import { useSyncExternalStore } from "react";
import { initialBurhan, initialTajrid, type BurhanSession, type TajridSession } from "./solo-data";

/* Demo store (localStorage only), like store.ts: the pages use these functions, the API replaces them later. */
interface SoloState {
  burhan: BurhanSession[];
  tajrid: TajridSession[];
}

const STORAGE_KEY = "bv-admin-solo-demo-v1";
const initial: SoloState = { burhan: initialBurhan, tajrid: initialTajrid };

let state: SoloState | null = null;
const listeners = new Set<() => void>();

function current(): SoloState {
  if (!state) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      state = raw ? { ...initial, ...(JSON.parse(raw) as Partial<SoloState>) } : initial;
    } catch {
      state = initial;
    }
  }
  return state;
}

function commit(next: SoloState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Blocked storage: the change stays in memory for this visit.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSolo = () => useSyncExternalStore(subscribe, current, () => initial);

export type BurhanPatch = Partial<Omit<BurhanSession, "id" | "createdAt">>;
export type TajridPatch = Partial<Omit<TajridSession, "id" | "n" | "createdAt">>;

export function updateBurhanSession(id: string, patch: BurhanPatch) {
  const s = current();
  commit({ ...s, burhan: s.burhan.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
}

export function updateTajridSession(id: string, patch: TajridPatch) {
  const s = current();
  commit({ ...s, tajrid: s.tajrid.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
}

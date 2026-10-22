"use client";

/*
 * Client side of the shared admin note (/api/admin/notes). The note is kept on the server so every admin sees
 * the same text; a copy stays in this browser so it still works when the server cannot be reached.
 */
export interface Note {
  text: string;
  rev: number;
  /** Random id of the browser that saved this version. */
  by: string;
  updatedAt: string | null;
}

const LOCAL_KEY = "bv-admin-notes";
const CLIENT_KEY = "bv-admin-client";
const SEEN_KEY = "bv-admin-notes-seen";
const CHANNEL = "bv-notes";

function safeGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Blocked storage: everything keeps working for this visit.
  }
}

/** A random id for this browser, so a note saved here is not reported to us as someone else's edit. */
export function clientId() {
  let id = safeGet(CLIENT_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    safeSet(CLIENT_KEY, id);
  }
  return id;
}

export const localText = () => safeGet(LOCAL_KEY) ?? "";
export const seenRev = () => Number(safeGet(SEEN_KEY) ?? 0) || 0;
export const markSeen = (rev: number) => safeSet(SEEN_KEY, String(rev));

/** How many saves by other admins this browser has not looked at yet. */
export function unseenCount(note: Note | null) {
  if (!note || note.rev <= seenRev()) return 0;
  return note.by === clientId() ? 0 : note.rev - seenRev();
}

export async function fetchNote(): Promise<Note | null> {
  try {
    const response = await fetch("/api/admin/notes", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) return null;
    return ((await response.json()) as { note: Note }).note;
  } catch {
    return null;
  }
}

/** Saves the text on the server; returns null when that failed (the text is still kept in this browser). */
export async function putNote(text: string): Promise<Note | null> {
  safeSet(LOCAL_KEY, text);
  try {
    const response = await fetch("/api/admin/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, by: clientId() }),
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    const note = ((await response.json()) as { note: Note }).note;
    markSeen(note.rev);
    announceNoteChange();
    return note;
  } catch {
    return null;
  }
}

/** Other tabs of this browser refresh their badge right away. */
function announceNoteChange() {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage("changed");
    channel.close();
  } catch {
    // No BroadcastChannel: those tabs catch up on their next refresh.
  }
}

export function onNoteBroadcast(listener: () => void) {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = listener;
    return () => channel.close();
  } catch {
    return () => undefined;
  }
}

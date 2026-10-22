"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, Globe, LogOut, Moon, NotebookPen, Sun, Trash2, X } from "lucide-react";
import { logoutAdminSession } from "./logout-client";
import { clientId, fetchNote, localText, markSeen, onNoteBroadcast, putNote, unseenCount, type Note } from "./notes-client";
import "./top-menu.css";
import { useThemeFlow } from "./use-theme-flow";

const POLL_MS = 30_000;
const fa = (value: number) => value.toLocaleString("fa-IR");

/** The top bar's one menu: switch the theme, go back to the site, keep a shared note, sign out. */
export function TopMenu() {
  const { theme, toggleTheme } = useThemeFlow();
  const [open, setOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [unseen, setUnseen] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const notesOpenRef = useRef(false);
  const dark = theme === "dark";
  notesOpenRef.current = notesOpen;

  // The note is checked now, when the page regains focus, every 30 seconds, and when another tab of this browser saves.
  const refresh = useCallback(async () => {
    const next = await fetchNote();
    if (!next) return;
    setNote(next);
    if (notesOpenRef.current) markSeen(next.rev);
    setUnseen(notesOpenRef.current ? 0 : unseenCount(next));
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => document.visibilityState === "visible" && void refresh(), POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const stopListening = onNoteBroadcast(() => void refresh());
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      stopListening();
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The notes window is drawn inside the dashboard's own root so it gets the same colours.
  const dialogRoot = notesOpen ? (wrapRef.current?.closest<HTMLElement>(".bv-home, .bv-admin") ?? null) : null;

  const openNotes = () => {
    if (note) markSeen(note.rev);
    setUnseen(0);
    setOpen(false);
    setNotesOpen(true);
  };

  return (
    <div className="tm" ref={wrapRef}>
      <button
        type="button"
        className={`icon-btn tm-btn${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unseen ? `منوی پیشخوان، ${fa(unseen)} یادداشت تازه` : "منوی پیشخوان"}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="tm-lines" aria-hidden="true">
          <i />
          <i />
        </span>
        {unseen ? (
          <span className="tm-badge" aria-hidden="true">
            {unseen > 9 ? "+۹" : fa(unseen)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="tm-panel" role="menu">
          <button type="button" role="menuitemcheckbox" aria-checked={!dark} className="tm-item" onClick={toggleTheme}>
            <span className="tm-ic">{dark ? <Moon size={17} strokeWidth={1.8} /> : <Sun size={17} strokeWidth={1.8} />}</span>
            <span className="tm-tx">
              <b>تم روشن</b>
            </span>
            <span className={`tm-switch${dark ? "" : " on"}`} aria-hidden="true">
              <i />
            </span>
          </button>

          <div className="tm-sep" aria-hidden="true">
            <i />
          </div>

          <Link href="/" role="menuitem" className="tm-item" onClick={() => setOpen(false)}>
            <span className="tm-ic">
              <Globe size={17} strokeWidth={1.8} />
            </span>
            <span className="tm-tx">
              <b>بازگشت به سایت</b>
              <small>صفحه‌ی اول مجمع باورمندان</small>
            </span>
            <ChevronLeft size={15} className="tm-go" aria-hidden="true" />
          </Link>

          <button type="button" role="menuitem" className="tm-item" onClick={openNotes}>
            <span className="tm-ic">
              <NotebookPen size={17} strokeWidth={1.8} />
            </span>
            <span className="tm-tx">
              <b>نوشتن یادداشت</b>
            </span>
            {unseen ? <span className="tm-chip">{fa(unseen)} تازه</span> : null}
            <ChevronLeft size={15} className="tm-go" aria-hidden="true" />
          </button>

          <div className="tm-sep tm-sep-plain" aria-hidden="true" />

          <button
            type="button"
            role="menuitem"
            className="tm-item tm-danger"
            onClick={async () => {
              setOpen(false);
              await logoutAdminSession();
              window.location.href = "/admin";
            }}
          >
            <span className="tm-ic">
              <LogOut size={17} strokeWidth={1.8} />
            </span>
            <span className="tm-tx">
              <b>خروج</b>
            </span>
          </button>
        </div>
      ) : null}

      {dialogRoot
        ? createPortal(
            <NotesDialog
              initial={note}
              onClose={() => {
                setNotesOpen(false);
                void refresh();
              }}
              onSaved={(saved) => setNote(saved)}
            />,
            dialogRoot
          )
        : null}
    </div>
  );
}

/** "همین الان" / "۵ دقیقه پیش" / "۲ ساعت پیش" / the date. */
function ago(iso: string | null, now: number) {
  if (!iso) return "";
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return "همین الان";
  if (seconds < 3600) return `${fa(Math.max(1, Math.round(seconds / 60)))} دقیقه پیش`;
  if (seconds < 86400) return `${fa(Math.round(seconds / 3600))} ساعت پیش`;
  return new Date(iso).toLocaleDateString("fa-IR", { day: "numeric", month: "long" });
}

type SaveState = "saved" | "saving" | "offline";

function NotesDialog({ initial, onClose, onSaved }: { initial: Note | null; onClose: () => void; onSaved: (note: Note) => void }) {
  const [text, setText] = useState(() => initial?.text ?? localText());
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<SaveState>("saved");
  const [note, setNote] = useState<Note | null>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [other, setOther] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    areaRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const tick = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearInterval(tick);
    };
  }, [onClose]);

  // Auto-save shortly after the last key press.
  useEffect(() => {
    if (!dirty) return;
    setState("saving");
    const timer = window.setTimeout(async () => {
      const saved = await putNote(text);
      if (saved) {
        setNote(saved);
        onSaved(saved);
        setState("saved");
      } else {
        setState("offline");
      }
      if (textRef.current === text) setDirty(false);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [text, dirty, onSaved]);

  // Another admin saved while this window is open: show their text, unless we are in the middle of typing.
  useEffect(() => {
    const check = async () => {
      const next = await fetchNote();
      if (!next || textRef.current === next.text) return;
      if (next.rev > (note?.rev ?? 0) && next.by !== clientId() && !dirty) {
        setText(next.text);
        setNote(next);
        setOther(true);
        markSeen(next.rev);
      }
    };
    const timer = window.setInterval(() => void check(), 10_000);
    return () => window.clearInterval(timer);
  }, [note, dirty]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const date = new Date(note?.updatedAt ?? now).toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" });
  const byOther = !!note && note.by !== "" && note.by !== clientId();

  let pill: { cls: string; label: string };
  if (state === "saving") pill = { cls: "warn", label: "در حال ذخیره…" };
  else if (state === "offline") pill = { cls: "off", label: "فقط روی همین مرورگر ذخیره شد" };
  else if (other || (byOther && !dirty && note?.updatedAt)) pill = { cls: "warn", label: `ویرایش ادمین دیگر · ${ago(note?.updatedAt ?? null, now)}` };
  else pill = { cls: "ok", label: `ذخیره شد · ${note?.updatedAt ? ago(note.updatedAt, now) : "همین الان"}` };

  return (
    <div className="tm-back" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="tm-dialog tm-notes" role="dialog" aria-modal="true" aria-label="یادداشت">
        <header>
          <span className="tm-ic tm-ic-lg">
            <NotebookPen size={22} strokeWidth={1.8} />
          </span>
          <div className="tm-hd">
            <h2>یادداشت‌های من چون یادم می‌ره</h2>
          </div>
          <button type="button" className="tm-x" aria-label="بستن" onClick={onClose}>
            <X size={19} />
          </button>
        </header>

        <div className="tm-paper">
          <div className="tm-paper-bar">
            <span>
              <i aria-hidden="true" />
              {date}
            </span>
            <span>
              {fa(words)} واژه · {fa(text.length)} نویسه
            </span>
          </div>
          <textarea
            ref={areaRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setDirty(true);
              setOther(false);
            }}
            placeholder="هر چیزی که نمی‌خواهی فراموش شود را اینجا بنویس…"
            spellCheck={false}
          />
        </div>

        <footer>
          <span className={`tm-pill ${pill.cls}`}>
            {pill.cls === "ok" ? <Check size={14} aria-hidden="true" /> : null}
            {pill.label}
          </span>
          <button
            type="button"
            className="tm-clear"
            disabled={!text}
            onClick={() => {
              setText("");
              setDirty(true);
              areaRef.current?.focus();
            }}
          >
            <Trash2 size={16} aria-hidden="true" />
            پاک کردن
          </button>
        </footer>
      </section>
    </div>
  );
}

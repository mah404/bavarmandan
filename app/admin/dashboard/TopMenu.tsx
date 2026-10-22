"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Globe, Moon, NotebookPen, Sun, Trash2, X } from "lucide-react";
import "./top-menu.css";
import { useThemeFlow } from "./use-theme-flow";

const NOTES_KEY = "bv-admin-notes";

function readNotes() {
  try {
    return window.localStorage.getItem(NOTES_KEY) ?? "";
  } catch {
    return "";
  }
}

/** The top bar's one menu: switch the theme, go back to the site, and jot a private note. */
export function TopMenu() {
  const { theme, toggleTheme } = useThemeFlow();
  const [open, setOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dark = theme === "dark";

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

  return (
    <div className="tm" ref={wrapRef}>
      <button
        type="button"
        className={`icon-btn tm-btn${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="منوی پیشخوان"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="tm-lines" aria-hidden="true">
          <i />
          <i />
        </span>
      </button>

      {open ? (
        <div className="tm-panel" role="menu">
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={!dark}
            className="tm-item"
            onClick={toggleTheme}
          >
            <span className="tm-ic">{dark ? <Moon size={20} strokeWidth={1.8} /> : <Sun size={20} strokeWidth={1.8} />}</span>
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
              <Globe size={20} strokeWidth={1.8} />
            </span>
            <span className="tm-tx">
              <b>بازگشت به سایت</b>
              <small>صفحه‌ی اول مجمع باورمندان</small>
            </span>
            <ChevronLeft size={18} className="tm-go" aria-hidden="true" />
          </Link>

          <button
            type="button"
            role="menuitem"
            className="tm-item"
            onClick={() => {
              setOpen(false);
              setNotesOpen(true);
            }}
          >
            <span className="tm-ic">
              <NotebookPen size={20} strokeWidth={1.8} />
            </span>
            <span className="tm-tx">
              <b>نوشتن یادداشت</b>
            </span>
            <ChevronLeft size={18} className="tm-go" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {dialogRoot ? createPortal(<NotesDialog onClose={() => setNotesOpen(false)} />, dialogRoot) : null}
    </div>
  );
}

function NotesDialog({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState(readNotes);
  const [saved, setSaved] = useState(true);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = useCallback((value: string) => {
    try {
      window.localStorage.setItem(NOTES_KEY, value);
    } catch {
      // Blocked storage: the note stays in this window only.
    }
    setSaved(true);
  }, []);

  useEffect(() => {
    if (saved) return;
    const timer = window.setTimeout(() => save(text), 400);
    return () => window.clearTimeout(timer);
  }, [text, saved, save]);

  return (
    <div className="tm-back" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="tm-dialog" role="dialog" aria-modal="true" aria-label="یادداشت">
        <header>
          <span className="tm-ic tm-ic-sm">
            <NotebookPen size={18} strokeWidth={1.8} />
          </span>
          <h2>یادداشت من</h2>
          <button type="button" className="tm-x" aria-label="بستن" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <textarea
          ref={areaRef}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setSaved(false);
          }}
          placeholder="هر چیزی که نمی‌خواهی فراموش شود را اینجا بنویس…"
          spellCheck={false}
        />
        <footer>
          <span className={`tm-state${saved ? " ok" : ""}`}>{saved ? "ذخیره شد" : "در حال ذخیره…"}</span>
          <span className="tm-count">{text.length.toLocaleString("fa-IR")} نویسه</span>
          <button
            type="button"
            className="tm-clear"
            disabled={!text}
            onClick={() => {
              setText("");
              save("");
              areaRef.current?.focus();
            }}
          >
            <Trash2 size={15} aria-hidden="true" />
            پاک کردن
          </button>
        </footer>
      </section>
    </div>
  );
}

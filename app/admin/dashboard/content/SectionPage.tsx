"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ContentShell } from "./ContentShell";
import { createCourse, listCourses, patchCourse, removeCourse, saveCourseOrder, useRemote, type Course } from "./api";
import type { SectionSlug } from "./data";
import { sectionMeta } from "./meta";

const fa = (value: number) => value.toLocaleString("fa-IR");

function lastSessionLabel(course: Course) {
  if (!course.sessionCount || !course.lastSessionAt) return "هنوز جلسه‌ای نیست";
  return `آخرین جلسه: ${new Date(course.lastSessionAt).toLocaleDateString("fa-IR", { day: "numeric", month: "long" })}`;
}

export function SectionPage({ slug }: { slug: SectionSlug }) {
  const meta = sectionMeta[slug];
  const Icon = meta.icon;
  const { data, setData, loading, error: loadError, reload } = useRemote(() => listCourses(slug), [slug]);
  const courses = useMemo(() => data ?? [], [data]);

  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ id: string; after: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** The server's message for a failed change on one row, shown inside that row (the page banner may be out of view). */
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const sessionTotal = useMemo(() => courses.reduce((sum, course) => sum + course.sessionCount, 0), [courses]);
  const q = query.trim();
  const rows = courses.filter((course) => !q || course.title.includes(q));
  const canReorder = !q && !busy;

  /** Runs one change on the server, then loads the real data again. A failure shows the server's message. */
  const run = async (action: () => Promise<unknown>, rowId?: string) => {
    setBusy(true);
    setError("");
    setRowError(null);
    try {
      await action();
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "درخواست انجام نشد.";
      if (rowId) setRowError({ id: rowId, message });
      else setError(message);
    } finally {
      await reload();
      setBusy(false);
    }
  };

  const submitNew = async () => {
    if (!newTitle.trim()) return;
    await run(() => createCourse(slug, newTitle));
    setNewTitle("");
    setAdding(false);
  };

  const submitRename = async (id: string) => {
    const title = editTitle.trim();
    setEditId(null);
    if (title) await run(() => patchCourse(slug, id, { title }), id);
  };

  const toggleVisible = (course: Course) => {
    // Shown at once, then confirmed (or rolled back) by the reload after the request.
    setData(courses.map((item) => (item.id === course.id ? { ...item, visible: !course.visible } : item)));
    void run(() => patchCourse(slug, course.id, { visible: !course.visible }), course.id);
  };

  const move = (id: string, toIndex: number) => {
    const from = courses.findIndex((item) => item.id === id);
    if (from < 0 || from === toIndex || toIndex < 0 || toIndex >= courses.length) return;
    const next = [...courses];
    const [item] = next.splice(from, 1);
    next.splice(toIndex, 0, item);
    setData(next);
    void run(() => saveCourseOrder(slug, next.map((course) => course.id)));
  };

  return (
    <ContentShell crumbs={[{ label: "پیشخوان", href: "/admin/dashboard" }, { label: meta.title }]}>
      <section className="ct-hero rise">
        <span className="ct-hero-ic" aria-hidden="true">
          <Icon size={30} strokeWidth={1.6} />
        </span>
        <div className="ct-hero-txt">
          <span className="ct-kicker">بخش · {meta.kicker}</span>
          <h1>{meta.title}</h1>
          <p>
            {fa(courses.length)} دوره · {fa(sessionTotal)} جلسه
          </p>
        </div>
        <button type="button" className="ct-primary" onClick={() => setAdding((open) => !open)} aria-expanded={adding}>
          <Plus size={18} aria-hidden="true" />
          دوره‌ی جدید
        </button>
      </section>

      {adding ? (
        <form
          className="ct-card ct-new rise"
          onSubmit={(event) => {
            event.preventDefault();
            void submitNew();
          }}
        >
          <label htmlFor="ct-new-title">عنوان دوره</label>
          <div className="ct-new-row">
            <input
              id="ct-new-title"
              className="ct-input"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="مثلاً: حسادت"
              autoFocus
            />
            <button type="submit" className="ct-primary" disabled={!newTitle.trim() || busy}>
              {busy ? "در حال افزودن…" : "افزودن دوره"}
            </button>
            <button type="button" className="ct-ghost" onClick={() => setAdding(false)}>
              انصراف
            </button>
          </div>
        </form>
      ) : null}

      {error || loadError ? (
        <p className="ct-error" role="alert" style={{ marginTop: 16 }}>
          {error || loadError}
        </p>
      ) : null}

      <div className="ct-listhead rise">
        <div>
          <h2>دوره‌های این بخش</h2>
          <span>ترتیب این فهرست همان ترتیب نمایش در سایت است</span>
        </div>
        <label className="ct-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجوی دوره…"
            aria-label="جستجوی دوره"
          />
        </label>
      </div>

      <div className="ct-list">
        {loading ? <div className="ct-empty">در حال بارگذاری…</div> : null}
        {!loading && rows.length === 0 && !loadError ? (
          <div className="ct-empty">{courses.length ? "دوره‌ای با این جستجو پیدا نشد." : "هنوز دوره‌ای نیست. با «دوره‌ی جدید» شروع کنید."}</div>
        ) : null}
        {!loading && loadError && !data ? (
          <div className="ct-empty">
            <button type="button" className="ct-outline" onClick={() => void reload()}>
              تلاش دوباره
            </button>
          </div>
        ) : null}

        {rows.map((course) => {
          const index = courses.findIndex((item) => item.id === course.id);
          const confirming = confirmId === course.id;
          const editing = editId === course.id;

          return (
            <article
              key={course.id}
              className={`ct-row rise${dragId === course.id ? " is-dragging" : ""}${
                dropHint?.id === course.id ? (dropHint.after ? " drop-after" : " drop-before") : ""
              }${course.visible ? "" : " is-hidden"}`}
              draggable={canReorder && !editing}
              onDragStart={(event) => {
                setDragId(course.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                setDragId(null);
                setDropHint(null);
              }}
              onDragOver={(event) => {
                if (!dragId || dragId === course.id) return;
                event.preventDefault();
                const box = event.currentTarget.getBoundingClientRect();
                setDropHint({ id: course.id, after: event.clientY > box.top + box.height / 2 });
              }}
              onDragLeave={() => setDropHint((hint) => (hint?.id === course.id ? null : hint))}
              onDrop={(event) => {
                event.preventDefault();
                if (!dragId || dragId === course.id) return;
                const box = event.currentTarget.getBoundingClientRect();
                const after = event.clientY > box.top + box.height / 2;
                const from = courses.findIndex((item) => item.id === dragId);
                let to = index + (after ? 1 : 0);
                if (from < to) to -= 1;
                move(dragId, to);
                setDragId(null);
                setDropHint(null);
              }}
            >
              <div className="ct-order">
                {canReorder ? (
                  <button type="button" aria-label="بردن بالاتر" disabled={index === 0} onClick={() => move(course.id, index - 1)}>
                    <ChevronUp size={14} />
                  </button>
                ) : null}
                <b>{fa(index + 1)}</b>
                {canReorder ? (
                  <button type="button" aria-label="بردن پایین‌تر" disabled={index === courses.length - 1} onClick={() => move(course.id, index + 1)}>
                    <ChevronDown size={14} />
                  </button>
                ) : null}
              </div>

              <div className="ct-row-main">
                {editing ? (
                  <form
                    className="ct-rename"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitRename(course.id);
                    }}
                  >
                    <input className="ct-input" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} autoFocus aria-label="عنوان دوره" />
                    <button type="submit" className="ct-ghost">ذخیره</button>
                    <button type="button" className="ct-ghost" onClick={() => setEditId(null)}>انصراف</button>
                  </form>
                ) : (
                  <>
                    <h3>{course.title}</h3>
                    <span>
                      {fa(course.sessionCount)} جلسه · {lastSessionLabel(course)}
                    </span>
                  </>
                )}
              </div>

              {confirming ? (
                <div className="ct-confirm" role="alertdialog" aria-label="تأیید حذف">
                  <span>
                    حذف «{course.title}» با {fa(course.sessionCount)} جلسه؟
                  </span>
                  <button
                    type="button"
                    className="ct-danger"
                    disabled={busy}
                    onClick={() => {
                      setConfirmId(null);
                      void run(() => removeCourse(slug, course.id), course.id);
                    }}
                  >
                    حذف
                  </button>
                  <button type="button" className="ct-ghost" onClick={() => setConfirmId(null)}>نه</button>
                </div>
              ) : (
                <div className="ct-row-acts">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={course.visible}
                    className={`ct-switch${course.visible ? " on" : ""}`}
                    disabled={busy}
                    onClick={() => toggleVisible(course)}
                    aria-label={course.visible ? "پنهان کردن دوره از سایت" : "نمایش دوره در سایت"}
                  >
                    <i aria-hidden="true" />
                    <span>{course.visible ? "در سایت" : "پنهان"}</span>
                  </button>
                  <button
                    type="button"
                    className="ct-icon"
                    aria-label="تغییر نام دوره"
                    onClick={() => {
                      setEditId(course.id);
                      setEditTitle(course.title);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button type="button" className="ct-icon danger" aria-label="حذف دوره" onClick={() => setConfirmId(course.id)}>
                    <Trash2 size={16} />
                  </button>
                  <Link href={`/admin/dashboard/${slug}/${course.id}`} className="ct-go">
                    جلسه‌ها
                    <ChevronLeft size={16} aria-hidden="true" />
                  </Link>
                </div>
              )}
              {rowError?.id === course.id ? (
                <p className="ct-error ct-row-error" role="alert">
                  {rowError.message}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </ContentShell>
  );
}

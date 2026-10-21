"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ContentShell } from "./ContentShell";
import type { Course, SectionSlug } from "./data";
import { sectionMeta } from "./meta";
import { addCourse, deleteCourse, moveCourse, renameCourse, setCourseVisible, useContent } from "./store";

const fa = (value: number) => value.toLocaleString("fa-IR");

function lastSessionLabel(course: Course) {
  if (!course.sessions.length) return "هنوز جلسه‌ای نیست";
  const last = course.sessions.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  return `آخرین جلسه: ${new Date(last.createdAt).toLocaleDateString("fa-IR", { day: "numeric", month: "long" })}`;
}

export function SectionPage({ slug }: { slug: SectionSlug }) {
  const meta = sectionMeta[slug];
  const Icon = meta.icon;
  const content = useContent();
  const courses = useMemo(() => content[slug] ?? [], [content, slug]);

  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ id: string; after: boolean } | null>(null);

  const sessionTotal = useMemo(() => courses.reduce((sum, course) => sum + course.sessions.length, 0), [courses]);
  const q = query.trim();
  const rows = courses.filter((course) => !q || course.title.includes(q));
  const canReorder = !q;

  const submitNew = () => {
    if (!newTitle.trim()) return;
    addCourse(slug, newTitle);
    setNewTitle("");
    setAdding(false);
  };

  const submitRename = (id: string) => {
    if (editTitle.trim()) renameCourse(slug, id, editTitle);
    setEditId(null);
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
            submitNew();
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
            <button type="submit" className="ct-primary" disabled={!newTitle.trim()}>
              افزودن دوره
            </button>
            <button type="button" className="ct-ghost" onClick={() => setAdding(false)}>
              انصراف
            </button>
          </div>
        </form>
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
        {rows.length === 0 ? (
          <div className="ct-empty">{courses.length ? "دوره‌ای با این جستجو پیدا نشد." : "هنوز دوره‌ای نیست. با «دوره‌ی جدید» شروع کنید."}</div>
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
                moveCourse(slug, dragId, to);
                setDragId(null);
                setDropHint(null);
              }}
            >
              <div className="ct-order">
                {canReorder ? (
                  <button type="button" aria-label="بردن بالاتر" disabled={index === 0} onClick={() => moveCourse(slug, course.id, index - 1)}>
                    <ChevronUp size={14} />
                  </button>
                ) : null}
                <b>{fa(index + 1)}</b>
                {canReorder ? (
                  <button type="button" aria-label="بردن پایین‌تر" disabled={index === courses.length - 1} onClick={() => moveCourse(slug, course.id, index + 1)}>
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
                      submitRename(course.id);
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
                      {fa(course.sessions.length)} جلسه · {lastSessionLabel(course)}
                    </span>
                  </>
                )}
              </div>

              {confirming ? (
                <div className="ct-confirm" role="alertdialog" aria-label="تأیید حذف">
                  <span>
                    حذف «{course.title}» با {fa(course.sessions.length)} جلسه؟
                  </span>
                  <button type="button" className="ct-danger" onClick={() => deleteCourse(slug, course.id)}>حذف</button>
                  <button type="button" className="ct-ghost" onClick={() => setConfirmId(null)}>نه</button>
                </div>
              ) : (
                <div className="ct-row-acts">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={course.visible}
                    className={`ct-switch${course.visible ? " on" : ""}`}
                    onClick={() => setCourseVisible(slug, course.id, !course.visible)}
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
            </article>
          );
        })}
      </div>
    </ContentShell>
  );
}

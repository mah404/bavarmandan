"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FileText, Headphones, Pencil, Plus, Trash2 } from "lucide-react";
import { ContentShell } from "./ContentShell";
import {
  createSession,
  listCourses,
  listSessions,
  patchSession,
  removeSession,
  removeSessionFile,
  uploadSessionFile,
  useRemote,
  type Session,
} from "./api";
import type { SectionSlug } from "./data";
import { AudioField, FileField } from "./fields";
import { sectionMeta } from "./meta";
import { siteLabel } from "./site-labels";

const fa = (value: number) => value.toLocaleString("fa-IR");
const TIME = /^\d{1,2}:[0-5]\d$/;
const toSeconds = (value: string) => {
  const [m, s] = value.split(":").map(Number);
  return m * 60 + s;
};

interface Draft {
  title: string;
  subtitle: string;
  /** Name shown in the tile: the picked file, or the file already on the server. */
  audioName: string | null;
  /** Set only when the admin picked a new audio; it is uploaded on save. */
  audioFile: File | null;
  textName: string | null;
  textFile: File | null;
  lesson: boolean;
  lessonStart: string;
  lessonEnd: string;
}

const emptyDraft = (): Draft => ({
  title: "",
  subtitle: "",
  audioName: null,
  audioFile: null,
  textName: null,
  textFile: null,
  lesson: false,
  lessonStart: "",
  lessonEnd: "",
});

const draftFrom = (session: Session): Draft => ({
  title: session.title,
  subtitle: session.subtitle ?? "",
  audioName: session.audioName,
  audioFile: null,
  textName: session.textName,
  textFile: null,
  lesson: Boolean(session.lessonStart && session.lessonEnd),
  lessonStart: session.lessonStart ?? "",
  lessonEnd: session.lessonEnd ?? "",
});

export function CoursePage({ slug, courseId }: { slug: SectionSlug; courseId: string }) {
  const meta = sectionMeta[slug];
  const coursesR = useRemote(() => listCourses(slug), [slug]);
  const sessionsR = useRemote(() => listSessions(slug, courseId), [slug, courseId]);
  const course = (coursesR.data ?? []).find((item) => item.id === courseId);
  const sessions = useMemo(() => [...(sessionsR.data ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [sessionsR.data]);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [askMissing, setAskMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const crumbsBase = [{ label: "پیشخوان", href: "/admin/dashboard" }, { label: meta.title, href: `/admin/dashboard/${slug}` }];

  if (coursesR.loading || (!course && !coursesR.error)) {
    return (
      <ContentShell crumbs={[...crumbsBase, { label: "…" }]}>
        <div className="ct-empty">{coursesR.loading ? "در حال بارگذاری…" : "این دوره وجود ندارد."}</div>
      </ContentShell>
    );
  }

  if (!course) {
    return (
      <ContentShell crumbs={[...crumbsBase, { label: "دوره پیدا نشد" }]}>
        <div className="ct-empty">
          {coursesR.error || "این دوره وجود ندارد."}{" "}
          <Link href={`/admin/dashboard/${slug}`}>بازگشت به {meta.title}</Link>
        </div>
      </ContentShell>
    );
  }

  const publishedCount = sessions.filter((session) => session.status === "published").length;
  const nextNumber = sessions.length + 1;
  const editingSession = editingId ? sessions.find((session) => session.id === editingId) : undefined;

  const reset = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setConfirmDelete(false);
    setError("");
    setAskMissing(false);
  };

  const startEdit = (session: Session) => {
    setDraft(draftFrom(session));
    setEditingId(session.id);
    setConfirmDelete(false);
    setError("");
    setSaved("");
    setAskMissing(false);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const refresh = () => Promise.all([sessionsR.reload(), coursesR.reload()]);

  const save = async (status: Session["status"], confirmed = false) => {
    setSaved("");
    setAskMissing(false);
    if (!draft.title.trim()) return setError("عنوان جلسه را بنویسید.");
    if (draft.lesson) {
      if (!TIME.test(draft.lessonStart) || !TIME.test(draft.lessonEnd)) return setError("زمان شروع و پایانِ «درس» را مثل ۰۵:۱۰ بنویسید.");
      if (toSeconds(draft.lessonEnd) <= toSeconds(draft.lessonStart)) return setError("پایانِ «درس» باید بعد از شروع آن باشد.");
    }
    if (status === "published" && !draft.audioName && !draft.textName) {
      return setError("برای انتشار حداقل یک فایل صوت یا مکتوب لازم است. یا آن را پیش‌نویس ذخیره کنید.");
    }
    if (status === "published" && !confirmed && (!draft.audioName || !draft.textName)) return setAskMissing(true);

    setBusy(true);
    setError("");
    const fields = {
      title: draft.title.trim(),
      lessonStart: draft.lesson ? draft.lessonStart : null,
      lessonEnd: draft.lesson ? draft.lessonEnd : null,
      // Sent only when it has something to say or changed, so servers that do not store it yet are not bothered.
      ...(draft.subtitle.trim() !== (editingSession?.subtitle ?? "") ? { subtitle: draft.subtitle.trim() } : {}),
    };
    let sessionId = editingId;
    try {
      // A new session is created as a draft first; files are uploaded next, and publishing comes last.
      if (!sessionId) {
        const created = await createSession(slug, courseId, { ...fields, status: "draft" });
        sessionId = created.id;
        setEditingId(sessionId);
      }
      if (draft.audioFile) await uploadSessionFile(slug, courseId, sessionId, "audio", draft.audioFile, draft.audioFile.name);
      else if (editingSession?.audioName && !draft.audioName) await removeSessionFile(slug, courseId, sessionId, "audio");
      if (draft.textFile) await uploadSessionFile(slug, courseId, sessionId, "text", draft.textFile, draft.textFile.name);
      else if (editingSession?.textName && !draft.textName) await removeSessionFile(slug, courseId, sessionId, "text");

      if (editingSession || status === "published") await patchSession(slug, courseId, sessionId, { ...fields, status });

      setSaved(editingSession ? "تغییرات ذخیره شد." : status === "published" ? "جلسه منتشر شد." : "پیش‌نویس ذخیره شد.");
      reset();
    } catch (failure) {
      // The session may already exist as a draft: keep the form open on it so the admin can retry.
      setError(failure instanceof Error ? failure.message : "ذخیره انجام نشد.");
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editingId) return;
    setBusy(true);
    try {
      await removeSession(slug, courseId, editingId);
      reset();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "حذف انجام نشد.");
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  return (
    <ContentShell crumbs={[...crumbsBase, { label: course.title }]}>
      <section className="ct-course-head rise">
        <div>
          <span className="ct-kicker">دوره · {meta.title}</span>
          <h1>{course.title}</h1>
          <p>
            {fa(sessions.length)} جلسه · {fa(publishedCount)} منتشرشده
          </p>
        </div>
        <button type="button" className="ct-outline" onClick={reset}>
          <Plus size={18} aria-hidden="true" />
          جلسه‌ی جدید
        </button>
      </section>

      <div className="ct-two">
        <div className="ct-sessions">
          {sessionsR.loading ? <div className="ct-empty">در حال بارگذاری…</div> : null}
          {sessionsR.error ? <p className="ct-error" role="alert">{sessionsR.error}</p> : null}
          {!sessionsR.loading && !sessionsR.error && sessions.length === 0 ? (
            <div className="ct-empty">هنوز جلسه‌ای ندارد. از فرم کنار، اولین جلسه را بسازید.</div>
          ) : null}

          {sessions.map((session, index) => (
            <article key={session.id} className={`ct-session rise${editingId === session.id ? " is-editing" : ""}`}>
              <span className="ct-num">{fa(index + 1)}</span>
              <div className="ct-session-main">
                <h3>
                  {siteLabel(session.title, index)}
                  <span className={`ct-state ${session.status}`}>{session.status === "published" ? "منتشرشده" : "پیش‌نویس"}</span>
                </h3>
                {session.subtitle ? <p className="ct-subline">{session.subtitle}</p> : null}
                <div className="ct-chips">
                  <span className={`ct-chip ${session.textName ? "ok" : "off"}`}>
                    <FileText size={13} aria-hidden="true" />
                    {session.textName ? "مکتوب" : "بدون مکتوب"}
                  </span>
                  <span className={`ct-chip ${session.audioName ? "ok" : "off"}`}>
                    <Headphones size={13} aria-hidden="true" />
                    {session.audioName ? "صوت" : "بدون صوت"}
                  </span>
                  {session.lessonStart && session.lessonEnd ? (
                    <span className="ct-chip lesson">
                      <span>درس</span>
                      <bdi dir="ltr">{session.lessonStart} – {session.lessonEnd}</bdi>
                    </span>
                  ) : null}
                </div>
              </div>
              <button type="button" className="ct-icon" aria-label={`ویرایش ${session.title}`} onClick={() => startEdit(session)}>
                <Pencil size={16} />
              </button>
            </article>
          ))}
        </div>

        <aside className="ct-card ct-form rise" ref={formRef}>
          <header>
            <h2>{editingId ? "ویرایش جلسه" : "جلسه‌ی جدید"}</h2>
            <span>{editingId ? "در حال ویرایش" : `جلسه ${fa(nextNumber)}`}</span>
          </header>

          <label htmlFor="ct-title">عنوان جلسه</label>
          <input
            id="ct-title"
            className="ct-input"
            value={draft.title}
            onChange={(event) => {
              setError("");
              setDraft({ ...draft, title: event.target.value });
            }}
            placeholder="مثلاً: جلسه هشتم ـ ریشه‌های تکبر"
          />
          {draft.title.trim() ? <small className="ct-hint">در سایت نمایش داده می‌شود: «{siteLabel(draft.title, editingId ? sessions.findIndex((item) => item.id === editingId) : sessions.length)}»</small> : null}

          <label htmlFor="ct-subtitle">توضیح جلسه (اختیاری)</label>
          <textarea
            id="ct-subtitle"
            className="ct-input ct-textarea"
            value={draft.subtitle}
            onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })}
            placeholder="مثلاً: ۱- مفهوم تکبر ۲- ریشه‌ها (چند مورد را با « - » جدا کنید)"
            rows={3}
          />

          <div className="ct-drops">
            <AudioField
              value={draft.audioName}
              artist={meta.audioArtist}
              defaultTitle={draft.title}
              onChange={(file) => setDraft({ ...draft, audioFile: file, audioName: file?.name ?? null })}
              onError={setError}
            />
            <FileField
              label="مکتوب"
              value={draft.textName}
              onChange={(file) => setDraft({ ...draft, textFile: file, textName: file?.name ?? null })}
              onError={setError}
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={draft.lesson}
            className={`ct-lesson${draft.lesson ? " on" : ""}`}
            onClick={() => setDraft({ ...draft, lesson: !draft.lesson })}
          >
            <span>
              <b>بخش درس</b>
              <small>در سایت گزینه‌ی «درس» کنار «کامل» می‌آید</small>
            </span>
            <i className="ct-toggle" aria-hidden="true" />
          </button>

          {draft.lesson ? (
            <div className="ct-times">
              <label>
                شروع درس
                <input className="ct-input" dir="ltr" inputMode="numeric" placeholder="05:10" value={draft.lessonStart} onChange={(event) => setDraft({ ...draft, lessonStart: event.target.value })} />
              </label>
              <label>
                پایان درس
                <input className="ct-input" dir="ltr" inputMode="numeric" placeholder="41:00" value={draft.lessonEnd} onChange={(event) => setDraft({ ...draft, lessonEnd: event.target.value })} />
              </label>
            </div>
          ) : null}

          {error ? <p className="ct-error" role="alert">{error}</p> : null}
          {saved ? <p className="ct-saved" role="status">{saved}</p> : null}

          {askMissing && (!draft.audioName || !draft.textName) ? (
            <div className="ct-ask" role="alertdialog" aria-label="تأیید انتشار">
              <p>{draft.audioName ? "این جلسه فایل مکتوب (PDF) ندارد." : "این جلسه فایل صوت ندارد."} بدون آن منتشر شود؟</p>
              <div>
                <button type="button" className="ct-primary" disabled={busy} onClick={() => void save("published", true)}>
                  بله، منتشر شود
                </button>
                <button type="button" className="ct-ghost" onClick={() => setAskMissing(false)}>
                  نه، برمی‌گردم
                </button>
              </div>
            </div>
          ) : null}

          <div className="ct-actions">
            <button type="button" className="ct-ghost" disabled={busy} onClick={() => void save("draft")}>
              ذخیره‌ی پیش‌نویس
            </button>
            <button type="button" className="ct-primary" disabled={busy} onClick={() => void save("published")}>
              {busy ? "در حال ذخیره…" : editingId ? "ذخیره‌ی تغییرات" : "انتشار جلسه"}
            </button>
          </div>

          {editingId ? (
            <div className="ct-editbar">
              {confirmDelete ? (
                <>
                  <span>این جلسه حذف شود؟</span>
                  <button type="button" className="ct-danger" disabled={busy} onClick={() => void remove()}>
                    حذف
                  </button>
                  <button type="button" className="ct-ghost" onClick={() => setConfirmDelete(false)}>نه</button>
                </>
              ) : (
                <>
                  <button type="button" className="ct-link danger" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={14} aria-hidden="true" />
                    حذف جلسه
                  </button>
                  <button type="button" className="ct-link" onClick={reset}>انصراف از ویرایش</button>
                </>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </ContentShell>
  );
}

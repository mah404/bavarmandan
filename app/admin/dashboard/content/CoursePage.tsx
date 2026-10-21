"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText, Headphones, Pencil, Plus, Trash2, X } from "lucide-react";
import { ContentShell } from "./ContentShell";
import type { Session, SectionSlug } from "./data";
import { checkTags, PUBLISHER_URL, readTags, writeTags, type AudioTags } from "./id3";
import { sectionMeta } from "./meta";
import { addSession, deleteSession, updateSession, useContent, type SessionInput } from "./store";

const fa = (value: number) => value.toLocaleString("fa-IR");
const TIME = /^\d{1,2}:[0-5]\d$/;
const toSeconds = (value: string) => {
  const [m, s] = value.split(":").map(Number);
  return m * 60 + s;
};

interface Draft {
  title: string;
  audioName: string | null;
  textName: string | null;
  lesson: boolean;
  lessonStart: string;
  lessonEnd: string;
}

interface TagFix {
  file: File;
  bytes: Uint8Array;
  tags: AudioTags;
  open: boolean;
}

const emptyDraft = (): Draft => ({ title: "", audioName: null, textName: null, lesson: false, lessonStart: "", lessonEnd: "" });

const draftFrom = (session: Session): Draft => ({
  title: session.title,
  audioName: session.audioName,
  textName: session.textName,
  lesson: Boolean(session.lessonStart && session.lessonEnd),
  lessonStart: session.lessonStart ?? "",
  lessonEnd: session.lessonEnd ?? "",
});

export function CoursePage({ slug, courseId }: { slug: SectionSlug; courseId: string }) {
  const meta = sectionMeta[slug];
  const course = (useContent()[slug] ?? []).find((item) => item.id === courseId);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [askMissing, setAskMissing] = useState(false);
  const audioInput = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  // The audio that passed the check (or was re-tagged); the demo only stores its name.
  const audioBlob = useRef<Blob | null>(null);
  const [tagFix, setTagFix] = useState<TagFix | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const cover = tagFix?.tags.cover ?? null;
  useEffect(() => {
    if (!cover) return setCoverUrl("");
    const url = URL.createObjectURL(new Blob([cover.data], { type: cover.mime }));
    setCoverUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  if (!course) {
    return (
      <ContentShell crumbs={[{ label: "پیشخوان", href: "/admin/dashboard" }, { label: meta.title, href: `/admin/dashboard/${slug}` }, { label: "دوره پیدا نشد" }]}>
        <div className="ct-empty">
          این دوره وجود ندارد.{" "}
          <Link href={`/admin/dashboard/${slug}`}>بازگشت به {meta.title}</Link>
        </div>
      </ContentShell>
    );
  }

  const publishedCount = course.sessions.filter((session) => session.status === "published").length;
  const nextNumber = course.sessions.length + 1;

  const reset = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setConfirmDelete(false);
    setError("");
    setTagFix(null);
    setAskMissing(false);
    audioBlob.current = null;
  };

  const startEdit = (session: Session) => {
    setDraft(draftFrom(session));
    setEditingId(session.id);
    setConfirmDelete(false);
    setError("");
    setSaved("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const save = (status: Session["status"], confirmed = false) => {
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

    const input: SessionInput = {
      title: draft.title,
      audioName: draft.audioName,
      textName: draft.textName,
      lessonStart: draft.lesson ? draft.lessonStart : null,
      lessonEnd: draft.lesson ? draft.lessonEnd : null,
      status,
    };

    if (editingId) updateSession(slug, courseId, editingId, input);
    else addSession(slug, courseId, input);

    setSaved(editingId ? "تغییرات ذخیره شد." : status === "published" ? "جلسه منتشر شد." : "پیش‌نویس ذخیره شد.");
    reset();
  };

  const pick = async (kind: "audio" | "text", files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const ok = kind === "audio" ? /\.mp3$/i.test(file.name) : /\.pdf$/i.test(file.name);
    if (!ok) return setError(kind === "audio" ? "فایل صوت فقط باید MP3 باشد." : "فایل مکتوب فقط باید PDF باشد.");
    setError("");
    if (kind === "text") return setDraft((current) => ({ ...current, textName: file.name }));

    const bytes = new Uint8Array(await file.arrayBuffer());
    const tags = readTags(bytes);
    const problems = checkTags(tags, meta.audioArtist);
    if (!problems.length) {
      audioBlob.current = file;
      setTagFix(null);
      return setDraft((current) => ({ ...current, audioName: file.name }));
    }
    setDraft((current) => ({ ...current, audioName: null }));
    audioBlob.current = null;
    setTagFix({
      file,
      bytes,
      open: false,
      tags: {
        title: tags.title || draft.title,
        artist: meta.audioArtist ?? tags.artist,
        publisher: PUBLISHER_URL,
        cover: tags.cover,
      },
    });
    setError(`صوت متادیتای درستی ندارد (ناقص یا نادرست: ${problems.join("، ")}).`);
  };

  const pickCover = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !tagFix) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) return setError("لوگو باید JPG یا PNG باشد.");
    setError("");
    const data = new Uint8Array(await file.arrayBuffer());
    setTagFix({ ...tagFix, tags: { ...tagFix.tags, cover: { mime: file.type, data } } });
  };

  const applyTags = () => {
    if (!tagFix) return;
    const { title, artist, publisher, cover } = tagFix.tags;
    if (!title.trim() || !artist.trim() || !publisher.trim() || !cover) return setError("لوگو، artist، publisher و title همه لازم‌اند.");
    if (meta.audioArtist && artist.trim() !== meta.audioArtist) return setError(`artist این بخش باید «${meta.audioArtist}» باشد.`);
    if (!/bavarmandan\.com/i.test(publisher)) return setError("publisher باید نشانی سایت باورمندان باشد.");
    const blob = writeTags(tagFix.bytes, { title: title.trim(), artist: artist.trim(), publisher: publisher.trim(), cover });
    audioBlob.current = blob;
    setDraft((current) => ({ ...current, audioName: tagFix.file.name }));
    setTagFix(null);
    setError("");
  };

  return (
    <ContentShell
      crumbs={[
        { label: "پیشخوان", href: "/admin/dashboard" },
        { label: meta.title, href: `/admin/dashboard/${slug}` },
        { label: course.title },
      ]}
    >
      <section className="ct-course-head rise">
        <div>
          <span className="ct-kicker">دوره · {meta.title}</span>
          <h1>{course.title}</h1>
          <p>
            {fa(course.sessions.length)} جلسه · {fa(publishedCount)} منتشرشده
          </p>
        </div>
        <button type="button" className="ct-outline" onClick={reset}>
          <Plus size={18} aria-hidden="true" />
          جلسه‌ی جدید
        </button>
      </section>

      <div className="ct-two">
        <div className="ct-sessions">
          {course.sessions.length === 0 ? <div className="ct-empty">هنوز جلسه‌ای ندارد. از فرم کنار، اولین جلسه را بسازید.</div> : null}

          {course.sessions.map((session, index) => (
            <article key={session.id} className={`ct-session rise${editingId === session.id ? " is-editing" : ""}`}>
              <span className="ct-num">{fa(index + 1)}</span>
              <div className="ct-session-main">
                <h3>
                  {session.title}
                  <span className={`ct-state ${session.status}`}>{session.status === "published" ? "منتشرشده" : "پیش‌نویس"}</span>
                </h3>
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

          <div className="ct-drops">
            {(
              [
                { kind: "audio", label: "صوت", hint: "فقط MP3", name: draft.audioName, Icon: Headphones, ref: audioInput, accept: ".mp3,audio/mpeg" },
                { kind: "text", label: "مکتوب", hint: "فقط PDF", name: draft.textName, Icon: FileText, ref: textInput, accept: ".pdf,application/pdf" },
              ] as const
            ).map(({ kind, label, hint, name, Icon, ref, accept }) => (
              <div key={kind} className={`ct-drop${name ? " has" : ""}`}>
                <button type="button" onClick={() => ref.current?.click()}>
                  <Icon size={22} aria-hidden="true" />
                  <b>{label}</b>
                  <small>{name ?? hint}</small>
                </button>
                {name ? (
                  <button
                    type="button"
                    className="ct-drop-x"
                    aria-label={`حذف فایل ${label}`}
                    onClick={() => {
                      if (kind === "audio") audioBlob.current = null;
                      setDraft({ ...draft, [kind === "audio" ? "audioName" : "textName"]: null });
                    }}
                  >
                    <X size={14} />
                  </button>
                ) : null}
                <input ref={ref} type="file" accept={accept} hidden onChange={(event) => {
                    void pick(kind, event.target.files);
                    event.target.value = "";
                  }} />
              </div>
            ))}
          </div>

          {tagFix ? (
            <div className="ct-tags">
              {!tagFix.open ? (
                <button type="button" className="ct-outline" onClick={() => setTagFix({ ...tagFix, open: true })}>
                  وارد کردن متادیتای صوت
                </button>
              ) : (
                <>
                  <b>متادیتای صوت</b>
                  <div className="ct-cover">
                    <button type="button" className="ct-ghost" onClick={() => coverInput.current?.click()}>
                      {tagFix.tags.cover ? "تغییر لوگو" : "آپلود لوگو"}
                    </button>
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverUrl} alt="لوگوی صوت" />
                    ) : null}
                    <input ref={coverInput} type="file" accept="image/jpeg,image/png" hidden onChange={(event) => { void pickCover(event.target.files); event.target.value = ""; }} />
                  </div>
                  {(["artist", "publisher", "title"] as const).map((field) => (
                    <label key={field}>
                      {field}
                      <input
                        className="ct-input"
                        dir="auto"
                        value={tagFix.tags[field]}
                        onChange={(event) => setTagFix({ ...tagFix, tags: { ...tagFix.tags, [field]: event.target.value } })}
                      />
                    </label>
                  ))}
                  <button type="button" className="ct-primary" onClick={applyTags}>
                    ثبت متادیتا و آپلود صوت
                  </button>
                </>
              )}
            </div>
          ) : null}

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
                <button type="button" className="ct-primary" onClick={() => save("published", true)}>
                  بله، منتشر شود
                </button>
                <button type="button" className="ct-ghost" onClick={() => setAskMissing(false)}>
                  نه، برمی‌گردم
                </button>
              </div>
            </div>
          ) : null}

          <div className="ct-actions">
            <button type="button" className="ct-ghost" onClick={() => save("draft")}>
              ذخیره‌ی پیش‌نویس
            </button>
            <button type="button" className="ct-primary" onClick={() => save("published")}>
              {editingId ? "ذخیره‌ی تغییرات" : "انتشار جلسه"}
            </button>
          </div>

          {editingId ? (
            <div className="ct-editbar">
              {confirmDelete ? (
                <>
                  <span>این جلسه حذف شود؟</span>
                  <button
                    type="button"
                    className="ct-danger"
                    onClick={() => {
                      deleteSession(slug, courseId, editingId);
                      reset();
                    }}
                  >
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

"use client";

import { useMemo, useState } from "react";
import { Check, Paperclip, Pencil, Plus, X } from "lucide-react";
import { ContentShell } from "./ContentShell";
import {
  getBurhan,
  patchBurhanSession,
  removeBurhanFile,
  removeBurhanRelated,
  uploadBurhanFile,
  useRemote,
  type BurhanSession,
} from "./api";
import { AudioField, FileField } from "./fields";
import { siteLabel } from "./site-labels";
import { burhanMeta } from "./solo-data";

const fa = (value: number) => value.toLocaleString("fa-IR");

/** A related file of the draft: already on the server (has an id) or picked now (has a File). */
interface DraftFile {
  id?: string;
  name: string;
  file?: File;
}

interface Draft {
  title: string;
  subtitle: string;
  textName: string | null;
  textFile: File | null;
  audioName: string | null;
  audioFile: File | null;
  files: DraftFile[];
}

const draftFrom = (session: BurhanSession): Draft => ({
  title: session.title,
  subtitle: session.subtitle ?? "",
  textName: session.textName,
  textFile: null,
  audioName: session.audioName,
  audioFile: null,
  files: session.files.map((file) => ({ id: file.id, name: file.name })),
});

/** برهان امکان و وجوب: a finished course. No new sessions; every session can still be corrected. */
export function BurhanPage() {
  const { data, loading, error: loadError, reload } = useRemote(getBurhan, []);
  const sessions = useMemo(() => data ?? [], [data]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const audioCount = sessions.filter((session) => session.audioName).length;
  const fileCount = sessions.reduce((sum, session) => sum + session.files.length, 0);
  const original = editingId ? sessions.find((session) => session.id === editingId) : undefined;

  const edit = (session: BurhanSession) => {
    setEditingId(session.id);
    setDraft(draftFrom(session));
    setError("");
    setSaved("");
  };

  const close = () => {
    setEditingId(null);
    setDraft(null);
    setError("");
  };

  const save = async () => {
    if (!editingId || !draft || !original) return;
    if (!draft.title.trim()) return setError("عنوان جلسه را بنویسید.");
    setBusy(true);
    setError("");
    try {
      const changes = {
        ...(draft.title.trim() !== original.title ? { title: draft.title.trim() } : {}),
        ...(draft.subtitle.trim() !== (original.subtitle ?? "") ? { subtitle: draft.subtitle.trim() } : {}),
      };
      if (Object.keys(changes).length) await patchBurhanSession(editingId, changes);

      if (draft.audioFile) await uploadBurhanFile(editingId, "audio", draft.audioFile, draft.audioFile.name);
      else if (original.audioName && !draft.audioName) await removeBurhanFile(editingId, "audio");
      if (draft.textFile) await uploadBurhanFile(editingId, "text", draft.textFile, draft.textFile.name);
      else if (original.textName && !draft.textName) await removeBurhanFile(editingId, "text");

      const keptIds = new Set(draft.files.map((file) => file.id).filter(Boolean));
      for (const file of original.files) if (!keptIds.has(file.id)) await removeBurhanRelated(editingId, file.id);
      for (const file of draft.files) if (file.file) await uploadBurhanFile(editingId, "files", file.file, file.file.name);

      setSaved("تغییرات ذخیره شد.");
      close();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "ذخیره انجام نشد.");
    } finally {
      await reload();
      setBusy(false);
    }
  };

  return (
    <ContentShell crumbs={[{ label: "پیشخوان", href: "/admin/dashboard" }, { label: burhanMeta.short }]}>
      <section className="ct-course-head rise">
        <div>
          <span className="ct-kicker">بخش · {burhanMeta.kicker} · کامل‌شده</span>
          <h1>{burhanMeta.title}</h1>
          <p>
            {fa(sessions.length)} جلسه · {fa(sessions.length)} منتشرشده · هر جلسه: متن، صوت و فایل‌های مرتبط
          </p>
        </div>
      </section>

      <div className="ct-two">
        <div className="ct-sessions">
          <div className="lt-head">
            <h2>جلسه‌ها</h2>
            <span className="bk-done">
              <Check size={13} aria-hidden="true" /> دوره کامل شده
            </span>
          </div>
          {loading ? <div className="ct-empty">در حال بارگذاری…</div> : null}
          {loadError ? (
            <div className="ct-empty">
              <p className="ct-error" role="alert">{loadError}</p>
              <button type="button" className="ct-outline" onClick={() => void reload()}>تلاش دوباره</button>
            </div>
          ) : null}
          {sessions.map((session, index) => (
            <article key={session.id} className={`ct-session rise${editingId === session.id ? " is-editing" : ""}`}>
              <span className="ct-num">{fa(index + 1)}</span>
              <div className="ct-session-main">
                <h3>
                  {siteLabel(session.title, index)}
                  <span className="ct-state published">منتشرشده</span>
                </h3>
                {session.subtitle ? <p className="ct-subline">{session.subtitle}</p> : null}
                <div className="ct-chips">
                  <span className={`ct-chip ${session.textName ? "ok" : "off"}`}>متن</span>
                  <span className={`ct-chip ${session.audioName ? "ok" : "off"}`}>صوت</span>
                  <span className={`ct-chip ${session.files.length ? "lesson" : "off"}`}>
                    <Paperclip size={12} aria-hidden="true" />
                    {session.files.length ? `${fa(session.files.length)} فایل` : "بدون فایل"}
                  </span>
                </div>
              </div>
              <button type="button" className="ct-icon" aria-label={`ویرایش ${session.title}`} onClick={() => edit(session)}>
                <Pencil size={16} />
              </button>
            </article>
          ))}
        </div>

        {draft ? (
          <aside className="ct-card ct-form rise">
            <header>
              <h2>ویرایش جلسه</h2>
              <span>در حال ویرایش</span>
            </header>
            <label htmlFor="bk-title">عنوان جلسه</label>
            <input id="bk-title" className="ct-input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            {draft.title.trim() ? <small className="ct-hint">در سایت نمایش داده می‌شود: «{siteLabel(draft.title, Math.max(0, sessions.findIndex((item) => item.id === editingId)))}»</small> : null}
            <label htmlFor="bk-subtitle">توضیح جلسه (اختیاری)</label>
            <textarea id="bk-subtitle" className="ct-input ct-textarea" rows={3} value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
            <div className="ct-drops">
              <FileField
                label="متن"
                value={draft.textName}
                onChange={(file) => setDraft({ ...draft, textFile: file, textName: file?.name ?? null })}
                onError={setError}
              />
              <AudioField
                value={draft.audioName}
                defaultTitle={draft.title}
                onChange={(file) => setDraft({ ...draft, audioFile: file, audioName: file?.name ?? null })}
                onError={setError}
              />
            </div>

            <label>فایل‌های مرتبط</label>
            <ul className="bk-files">
              {draft.files.map((item, index) => (
                <li key={`${item.id ?? "new"}-${item.name}-${index}`}>
                  <Paperclip size={14} aria-hidden="true" />
                  <span dir="ltr">{item.name}</span>
                  <button type="button" aria-label={`حذف ${item.name}`} onClick={() => setDraft({ ...draft, files: draft.files.filter((_, i) => i !== index) })}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <label className="ct-outline bk-add">
              <Plus size={16} aria-hidden="true" />
              افزودن فایل مرتبط (PDF)
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                hidden
                onChange={(event) => {
                  const picked = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  if (picked.some((file) => !/\.pdf$/i.test(file.name))) return setError("فایل مرتبط فقط باید PDF باشد.");
                  setError("");
                  setDraft({ ...draft, files: [...draft.files, ...picked.map((file) => ({ name: file.name, file }))] });
                }}
              />
            </label>

            {error ? <p className="ct-error" role="alert">{error}</p> : null}
            <div className="ct-actions">
              <button type="button" className="ct-ghost" disabled={busy} onClick={close}>انصراف</button>
              <button type="button" className="ct-primary" disabled={busy} onClick={() => void save()}>
                {busy ? "در حال ذخیره…" : "ذخیره‌ی تغییرات"}
              </button>
            </div>
          </aside>
        ) : (
          <aside className="ct-card bk-info rise">
            <span className="bk-check" aria-hidden="true"><Check size={22} /></span>
            <h2>این دوره کامل شده است</h2>
            <p>جلسه‌ی تازه‌ای به این بخش اضافه نمی‌شود. اگر عنوان یا فایلی نیاز به اصلاح دارد، روی همان جلسه بزنید.</p>
            {saved ? <p className="ct-saved" role="status">{saved}</p> : null}
            <div className="bk-stats">
              <div><b>{fa(sessions.length)}</b><span>جلسه</span></div>
              <div><b>{fa(audioCount)}</b><span>صوت</span></div>
              <div><b>{fa(fileCount)}</b><span>فایل مرتبط</span></div>
            </div>
          </aside>
        )}
      </div>
    </ContentShell>
  );
}

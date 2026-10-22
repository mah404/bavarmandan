"use client";

import { useMemo, useState } from "react";
import { BookOpenText, Check, ChevronUp } from "lucide-react";
import { ContentShell } from "./ContentShell";
import { getTajrid, patchTajridSession, removeTajridFile, uploadTajridFile, useRemote, type TajridSession } from "./api";
import { AudioField, FileField } from "./fields";
import { siteLabel } from "./site-labels";
import { tajridMeta } from "./solo-data";

const fa = (value: number) => value.toLocaleString("fa-IR");
const monthOf = (iso: string) => new Date(iso).toLocaleDateString("fa-IR", { month: "long" });

interface Draft {
  title: string;
  subtitle: string;
  textName: string | null;
  textFile: File | null;
  handoutName: string | null;
  handoutFile: File | null;
  audioName: string | null;
  audioFile: File | null;
}

const draftFrom = (session: TajridSession): Draft => ({
  title: session.title,
  subtitle: session.subtitle ?? "",
  textName: session.textName,
  textFile: null,
  handoutName: session.handoutName,
  handoutFile: null,
  audioName: session.audioName,
  audioFile: null,
});

/** شرح تجرید الاعتقاد: a finished book (مقصد → فصل → جلسه). Sessions can only be corrected. */
export function TajridPage() {
  const { data, loading, error: loadError, reload } = useRemote(getTajrid, []);
  const sessions = useMemo(() => data?.sessions ?? [], [data]);
  const chapters = useMemo(() => data?.chapters ?? [], [data]);
  const [maqsadOpen, setMaqsadOpen] = useState(true);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const handoutCount = sessions.filter((session) => session.handoutName).length;
  const audioCount = sessions.filter((session) => session.audioName).length;
  const original = editingId ? sessions.find((session) => session.id === editingId) : undefined;

  const edit = (session: TajridSession) => {
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
      if (Object.keys(changes).length) await patchTajridSession(editingId, changes);

      const files = [
        { kind: "audio", file: draft.audioFile, name: draft.audioName, had: original.audioName },
        { kind: "sharh", file: draft.textFile, name: draft.textName, had: original.textName },
        { kind: "jozve", file: draft.handoutFile, name: draft.handoutName, had: original.handoutName },
      ] as const;
      for (const item of files) {
        if (item.file) await uploadTajridFile(editingId, item.kind, item.file, item.file.name);
        else if (item.had && !item.name) await removeTajridFile(editingId, item.kind);
      }

      setSaved("تغییرات ذخیره شد.");
      close();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "ذخیره انجام نشد.");
    } finally {
      await reload();
      setBusy(false);
    }
  };

  const sessionRow = (session: TajridSession) => (
    <button key={session.id} type="button" className={`bk-session${editingId === session.id ? " on" : ""}`} onClick={() => edit(session)}>
      <span className="bk-sn">{fa(session.n)}</span>
      <span className="bk-st">
        <b>{siteLabel(session.title, session.n - 1)}</b>
        <small>{session.subtitle || monthOf(session.createdAt)}</small>
      </span>
      <span className="bk-tags">
        <i className={session.textName ? "ok" : ""}>شرح</i>
        <i className={session.handoutName ? "ok" : ""}>جزوه</i>
        <i className={session.audioName ? "ok" : ""}>صوت</i>
      </span>
    </button>
  );

  return (
    <ContentShell crumbs={[{ label: "پیشخوان", href: "/admin/dashboard" }, { label: tajridMeta.short }]}>
      <section className="ct-hero bk-hero rise">
        <span className="ct-hero-ic" aria-hidden="true">
          <BookOpenText size={30} strokeWidth={1.6} />
        </span>
        <div className="ct-hero-txt">
          <span className="ct-kicker">بخش · شرح کتاب</span>
          <h1>{tajridMeta.title}</h1>
          <p>{tajridMeta.author} · هر جلسه: شرح، جزوه و صوت</p>
          <div className="bk-pills">
            <span className="bk-done"><Check size={13} aria-hidden="true" /> دوره کامل شده</span>
            {chapters.length ? (
              <>
                <span>{fa(1)} مقصد</span>
                <span>{fa(chapters.length)} فصل</span>
              </>
            ) : null}
            <span>{fa(sessions.length)} جلسه</span>
          </div>
        </div>
        <div className="bk-big"><b>{fa(sessions.length)}</b><span>جلسه</span></div>
      </section>

      <div className="ct-two bk-two">
        <section className="ct-card bk-toc rise">
          <h2 className="bk-toc-title">فهرست کتاب</h2>
          {loading ? <div className="ct-empty">در حال بارگذاری…</div> : null}
          {loadError ? (
            <div className="ct-empty">
              <p className="ct-error" role="alert">{loadError}</p>
              <button type="button" className="ct-outline" onClick={() => void reload()}>تلاش دوباره</button>
            </div>
          ) : null}

          {!loading && !loadError ? (
            <>
              <button type="button" className="bk-maqsad" aria-expanded={maqsadOpen} onClick={() => setMaqsadOpen((open) => !open)}>
                <span className="bk-n">{fa(1)}</span>
                <span className="bk-maqsad-t">
                  <b>{tajridMeta.maqsad}</b>
                  <small>
                    {chapters.length ? `${fa(chapters.length)} فصل · ` : ""}
                    {fa(sessions.length)} جلسه
                  </small>
                </span>
                <ChevronUp size={18} aria-hidden="true" className={maqsadOpen ? "" : "bk-flip"} />
              </button>

              {maqsadOpen && chapters.length === 0 ? <div className="bk-sessions">{sessions.map(sessionRow)}</div> : null}

              {maqsadOpen && chapters.length > 0 ? (
                <div className="bk-chapters">
                  {chapters.map((chapter) => {
                    const open = chapterId === chapter.id;
                    const items = sessions.filter((session) => session.n >= chapter.from && session.n <= chapter.to);
                    return (
                      <div key={chapter.id}>
                        <button type="button" className={`bk-chapter${open ? " on" : ""}`} aria-expanded={open} onClick={() => setChapterId(open ? null : chapter.id)}>
                          <b>{chapter.title}</b>
                          <span className="bk-range">{fa(chapter.from)}–{fa(chapter.to)}</span>
                          <span className="bk-count">{fa(items.length)}</span>
                        </button>
                        {open ? <div className="bk-sessions">{items.map(sessionRow)}</div> : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        {draft && original ? (
          <aside className="ct-card ct-form rise">
            <header>
              <h2>ویرایش جلسه</h2>
              <span>جلسه {fa(original.n)}</span>
            </header>
            <label htmlFor="tj-title">عنوان جلسه</label>
            <input id="tj-title" className="ct-input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            {draft.title.trim() ? <small className="ct-hint">در سایت نمایش داده می‌شود: «{siteLabel(draft.title, original.n - 1)}»</small> : null}
            <label htmlFor="tj-subtitle">توضیح جلسه (اختیاری)</label>
            <textarea id="tj-subtitle" className="ct-input ct-textarea" rows={4} value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} placeholder="چند مورد را با « - » از هم جدا کنید" />
            <div className="ct-drops">
              <FileField
                label="شرح"
                value={draft.textName}
                onChange={(file) => setDraft({ ...draft, textFile: file, textName: file?.name ?? null })}
                onError={setError}
              />
              <FileField
                label="جزوه"
                value={draft.handoutName}
                onChange={(file) => setDraft({ ...draft, handoutFile: file, handoutName: file?.name ?? null })}
                onError={setError}
              />
              <AudioField
                value={draft.audioName}
                defaultTitle={draft.title}
                onChange={(file) => setDraft({ ...draft, audioFile: file, audioName: file?.name ?? null })}
                onError={setError}
              />
            </div>
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
            <h2>شرح این کتاب کامل شده است</h2>
            <p>جلسه‌ی تازه‌ای اضافه نمی‌شود. برای اصلاح موضوع بحث یا جایگزینی شرح، جزوه و صوت، {chapters.length ? "از فهرست کتاب یک فصل را باز کنید و " : ""}روی جلسه بزنید.</p>
            {saved ? <p className="ct-saved" role="status">{saved}</p> : null}
            <div className="bk-stats">
              <div><b>{fa(sessions.length)}</b><span>جلسه</span></div>
              <div><b>{fa(handoutCount)}</b><span>جزوه</span></div>
              <div><b>{fa(audioCount)}</b><span>صوت</span></div>
            </div>
          </aside>
        )}
      </div>
    </ContentShell>
  );
}

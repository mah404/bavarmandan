"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, FileText, Headphones, Pin, Play, Plus, Timer } from "lucide-react";
import { ContentShell } from "./ContentShell";
import { getLatest, putLatest, useRemote, type LatestEntry, type LatestSettings } from "./api";
import { SECTION_SLUGS, isSectionSlug } from "./data";
import { sectionMeta } from "./meta";

const fa = (value: number) => value.toLocaleString("fa-IR");
const valid = (iso: string) => !Number.isNaN(new Date(iso).getTime());
const day = (iso: string) => (valid(iso) ? new Date(iso).toLocaleDateString("fa-IR", { day: "numeric" }) : "");
const dayMonth = (iso: string) => (valid(iso) ? new Date(iso).toLocaleDateString("fa-IR", { day: "numeric", month: "long" }) : "");
const month = (iso: string) => (valid(iso) ? new Date(iso).toLocaleDateString("fa-IR", { month: "long" }) : "");
const kicker = (section: string) => (isSectionSlug(section) ? sectionMeta[section].kicker : section);
const sectionTitle = (section: string) => (isSectionSlug(section) ? sectionMeta[section].title : section);

function parts(item: LatestEntry) {
  const list: string[] = [];
  if (item.hasText) list.push("مکتوب");
  if (item.hasAudio) list.push("صوت");
  if (item.hasLesson) list.push("درس + کامل");
  return list;
}

/** What the live site shows today under «جدیدترین محتواها» (from its current catalog), shaped like a server item. */
async function loadSiteLatest(): Promise<LatestEntry[]> {
  const response = await fetch("/api/audios", { cache: "no-store" });
  const catalog = (await response.json()) as { latest?: Array<Record<string, any>> };
  return (catalog.latest ?? []).map((item) => ({
    key: String(item.key ?? `${item.section}/${item.collection}/${item.id}`),
    section: item.section === "tafsirmozooei" ? "tafsir" : String(item.section ?? ""),
    courseTitle: String(item.collectionTitle ?? ""),
    title: String(item.title || `جلسه ${item.id ?? ""}`).trim(),
    createdAt: String(item.addedAt ?? ""),
    hasAudio: Boolean(item.audioUrl),
    hasText: Array.isArray(item.pdfs) && item.pdfs.length > 0,
    hasLesson: Boolean(item.lesson),
    draft: false,
    courseHidden: false,
  }));
}

export function LatestPage() {
  const { data, setData, loading, error: loadError, reload } = useRemote(getLatest, []);
  const [filter, setFilter] = useState<string>("all");
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ key: string; after: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [siteLatest, setSiteLatest] = useState<LatestEntry[]>([]);

  useEffect(() => {
    loadSiteLatest().then(setSiteLatest).catch(() => setSiteLatest([]));
  }, []);

  if (!data) {
    return (
      <ContentShell crumbs={[{ label: "پیشخوان", href: "/admin/dashboard" }, { label: "جدیدترین محتواها" }]}>
        <div className="ct-empty">
          {loading ? (
            "در حال بارگذاری…"
          ) : (
            <>
              <p className="ct-error" role="alert">{loadError}</p>
              <button type="button" className="ct-outline" onClick={() => void reload()}>تلاش دوباره</button>
            </>
          )}
        </div>
      </ContentShell>
    );
  }

  const { settings, recent: all } = data;
  // Until the new content is published, the site still reads its old catalog: show what it displays now (read-only).
  const usingSite = data.current.length === 0 && siteLatest.length > 0;
  const shown = usingSite ? siteLatest : data.current;
  const onHome = new Set(shown.map((item) => item.key));
  const manual = settings.mode === "manual";
  const recent = all.filter((item) => filter === "all" || item.section === filter).slice(0, 14);

  /** Saves the whole settings object, then shows what the server computed from it. */
  const save = async (next: LatestSettings, optimisticCurrent?: LatestEntry[]) => {
    setBusy(true);
    setError("");
    setData({ ...data, settings: next, current: optimisticCurrent ?? data.current });
    try {
      await putLatest(next);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "ذخیره انجام نشد.");
    } finally {
      await reload();
      setBusy(false);
    }
  };

  const setMode = (mode: "auto" | "manual") =>
    save({ ...settings, mode, picked: mode === "manual" && settings.picked.length === 0 ? shown.map((item) => item.key) : settings.picked });

  const togglePin = (key: string) =>
    save({ ...settings, pinned: settings.pinned.includes(key) ? settings.pinned.filter((k) => k !== key) : [key, ...settings.pinned] });

  const removeFromHome = (key: string) =>
    save({
      ...settings,
      hidden: settings.hidden.includes(key) ? settings.hidden : [...settings.hidden, key],
      picked: settings.picked.filter((k) => k !== key),
      pinned: settings.pinned.filter((k) => k !== key),
    });

  const addToHome = (key: string) =>
    save({
      ...settings,
      hidden: settings.hidden.filter((k) => k !== key),
      picked: settings.picked.includes(key) ? settings.picked : [key, ...settings.picked],
    });

  /** Drag and drop: the visible list becomes the custom order, with `key` moved to `toIndex`. */
  const moveShown = (key: string, toIndex: number) => {
    const keys = shown.map((entry) => entry.key).filter((k) => k !== key);
    keys.splice(toIndex, 0, key);
    const byKey = new Map(shown.map((entry) => [entry.key, entry]));
    void save({ ...settings, order: keys }, keys.map((k) => byKey.get(k)!));
  };

  return (
    <ContentShell crumbs={[{ label: "پیشخوان", href: "/admin/dashboard" }, { label: "جدیدترین محتواها" }]}>
      <section className="ct-hero rise">
        <span className="ct-hero-ic" aria-hidden="true">
          <Timer size={30} strokeWidth={1.6} />
        </span>
        <div className="ct-hero-txt">
          <h1>جدیدترین محتواها</h1>
          <p>جلسه‌هایی که در صفحه‌ی اول سایت، زیر «جدیدترین محتواها» نمایش داده می‌شوند.</p>
        </div>
        <span className="lt-mode-badge">{manual ? "دستی ـ انتخاب شما" : "خودکار ـ به‌روز با هر بارگذاری"}</span>
      </section>

      {error || loadError ? (
        <p className="ct-error" role="alert" style={{ marginTop: 16 }}>
          {error || loadError}
        </p>
      ) : null}

      <section className="ct-card lt-settings rise">
        <div className="lt-field">
          <b>انتخاب جلسه‌ها</b>
          <div className="lt-seg" role="group" aria-label="انتخاب جلسه‌ها">
            {(["auto", "manual"] as const).map((mode) => (
              <button key={mode} type="button" disabled={busy} className={settings.mode === mode ? "on" : ""} aria-pressed={settings.mode === mode} onClick={() => void setMode(mode)}>
                {mode === "auto" ? "خودکار" : "دستی"}
              </button>
            ))}
          </div>
        </div>
        <div className="lt-field">
          <b>تعداد نمایش</b>
          <div className="lt-seg" role="group" aria-label="تعداد نمایش">
            {([3, 5, 8] as const).map((count) => (
              <button key={count} type="button" disabled={busy} className={settings.count === count ? "on" : ""} aria-pressed={settings.count === count} onClick={() => void save({ ...settings, count })}>
                {fa(count)}
              </button>
            ))}
          </div>
        </div>
        <p className="lt-hint">
          {manual
            ? "جلسه‌ها را از فهرست «بارگذاری‌های اخیر» اضافه کنید. با سنجاق، جلسه‌ای را بالا نگه دارید یا با چشم آن را بردارید."
            : "هر جلسه‌ی تازه خودکار اول فهرست می‌آید. با سنجاق، جلسه‌ای را بالا نگه دارید یا با چشم آن را بردارید."}
        </p>
      </section>

      <div className="ct-two lt-two">
        <section className="lt-now">
          <div className="lt-head">
            <h2>الان در صفحه‌ی اول</h2>
            <span>
              {fa(shown.length)} از {fa(settings.count)}
              {settings.order.length ? (
                <button type="button" className="ct-link lt-reset" disabled={busy} onClick={() => void save({ ...settings, order: [] })}>
                  ترتیب خودکار
                </button>
              ) : null}
            </span>
          </div>
          {usingSite ? (
            <p className="lt-note">
              این‌ها همان جلسه‌هایی هستند که همین الان در سایت زیر «جدیدترین محتواها» دیده می‌شوند (از کاتالوگ فعلی سایت). تا وقتی محتوای جدید منتشر نشده، فقط نمایش داده می‌شوند و قابل تغییر نیستند.
            </p>
          ) : null}
          {shown.length === 0 ? <div className="ct-empty">چیزی برای نمایش نیست. از فهرست کناری جلسه اضافه کنید.</div> : null}
          <div className="ct-sessions">
            {shown.map((item, index) => {
              const pinned = settings.pinned.includes(item.key);
              return (
                <article
                  key={item.key}
                  className={`lt-card rise${dragKey === item.key ? " is-dragging" : ""}${drop?.key === item.key ? (drop.after ? " drop-after" : " drop-before") : ""}`}
                  draggable={!busy && !usingSite}
                  onDragStart={(event) => {
                    setDragKey(item.key);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragKey(null);
                    setDrop(null);
                  }}
                  onDragOver={(event) => {
                    if (!dragKey || dragKey === item.key) return;
                    event.preventDefault();
                    const box = event.currentTarget.getBoundingClientRect();
                    setDrop({ key: item.key, after: event.clientY > box.top + box.height / 2 });
                  }}
                  onDragLeave={() => setDrop((hint) => (hint?.key === item.key ? null : hint))}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!dragKey || dragKey === item.key) return;
                    const box = event.currentTarget.getBoundingClientRect();
                    const after = event.clientY > box.top + box.height / 2;
                    let to = index + (after ? 1 : 0);
                    if (shown.findIndex((entry) => entry.key === dragKey) < to) to -= 1;
                    moveShown(dragKey, to);
                    setDragKey(null);
                    setDrop(null);
                  }}
                >
                  <span className="ct-num lt-num">{fa(index + 1)}</span>
                  <div className="lt-body">
                    <small>
                      <span className="lt-pill">{kicker(item.section)}</span> {item.courseTitle}
                    </small>
                    <h3>{item.title}</h3>
                    <span className="lt-sub">{[dayMonth(item.createdAt), ...parts(item)].filter(Boolean).join(" · ")}</span>
                  </div>
                  <button type="button" disabled={busy || usingSite} className={`ct-icon${pinned ? " lt-on" : ""}`} aria-pressed={pinned} aria-label={pinned ? "برداشتن سنجاق" : "سنجاق کردن"} onClick={() => void togglePin(item.key)}>
                    <Pin size={16} />
                  </button>
                  <button type="button" disabled={busy || usingSite} className="ct-icon" aria-label="برداشتن از صفحه‌ی اول" onClick={() => void removeFromHome(item.key)}>
                    <EyeOff size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="ct-card lt-recent">
          <div className="lt-head">
            <h2>بارگذاری‌های اخیر</h2>
          </div>
          <div className="lt-chips" role="group" aria-label="فیلتر بخش">
            {[{ id: "all", label: "همه" }, ...SECTION_SLUGS.map((slug) => ({ id: slug, label: sectionMeta[slug].kicker }))].map((chip) => (
              <button key={chip.id} type="button" className={filter === chip.id ? "on" : ""} aria-pressed={filter === chip.id} onClick={() => setFilter(chip.id)}>
                {chip.label}
              </button>
            ))}
          </div>
          <ul className="lt-list">
            {recent.map((item) => {
              const isOn = onHome.has(item.key);
              const hidden = settings.hidden.includes(item.key);
              return (
                <li key={item.key}>
                  <span className="lt-date">
                    <b>{day(item.createdAt)}</b>
                    {month(item.createdAt)}
                  </span>
                  <span className="lt-title">
                    <b>{item.title}</b>
                    <small>
                      {sectionTitle(item.section)} › {item.courseTitle}
                      {!item.hasAudio ? " · بدون صوت" : !item.hasText ? " · بدون مکتوب" : ""}
                    </small>
                  </span>
                  {isOn ? (
                    <span className="lt-badge">در صفحه‌ی اول</span>
                  ) : item.draft || item.courseHidden ? (
                    <span className="lt-badge lt-badge-off" title="تا منتشر و قابل‌نمایش نشود در صفحه‌ی اول نمی‌آید">
                      {item.draft ? "پیش‌نویس" : "دوره پنهان"}
                    </span>
                  ) : manual || hidden ? (
                    <button type="button" className="lt-add" disabled={busy} onClick={() => void addToHome(item.key)}>
                      {hidden ? <Eye size={14} /> : <Plus size={14} />}
                      {hidden ? "بازگردانی" : "افزودن"}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <section className="lt-preview rise">
        <div className="lt-head">
          <h2>پیش‌نمایش در صفحه‌ی اول سایت</h2>
          <span>به‌روزرسانی زنده با هر تغییر</span>
        </div>
        <div className="lt-rail">
          {shown.map((item) => (
            <article key={item.key} className="lt-tile">
              <span className="lt-pill">{kicker(item.section)}</span>
              <h3>{item.title}</h3>
              <small>{item.courseTitle}</small>
              <footer>
                <span className="lt-play" aria-hidden="true">
                  {item.hasAudio ? <Play size={12} fill="currentColor" /> : <FileText size={12} />}
                </span>
                <time dateTime={item.createdAt}>{dayMonth(item.createdAt)}</time>
                {item.hasAudio ? <Headphones size={13} aria-hidden="true" /> : null}
              </footer>
            </article>
          ))}
        </div>
      </section>
    </ContentShell>
  );
}

"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  FileText,
  Headphones,
  Pin,
  Play,
  Plus,
  Timer,
} from "lucide-react";
import { ContentShell } from "./ContentShell";
import { SECTION_SLUGS } from "./data";
import {
  addToHome,
  moveShown,
  removeFromHome,
  resetOrder,
  togglePin,
  updateLatest,
  useLatest,
  type LatestItem,
} from "./latest-store";
import { sectionMeta } from "./meta";

const fa = (value: number) => value.toLocaleString("fa-IR");
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("fa-IR", { day: "numeric" });
const dayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("fa-IR", { day: "numeric", month: "long" });
const month = (iso: string) =>
  new Date(iso).toLocaleDateString("fa-IR", { month: "long" });

function parts(item: LatestItem) {
  const { session } = item;
  const list: string[] = [];
  if (session.textName) list.push("مکتوب");
  if (session.audioName) list.push("صوت");
  if (session.lessonStart) list.push("درس + کامل");
  return list;
}

export function LatestPage() {
  const { settings, all, shown } = useLatest();
  const [filter, setFilter] = useState<string>("all");
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ key: string; after: boolean } | null>(
    null,
  );
  const onHome = new Set(shown.map((item) => item.key));
  const manual = settings.mode === "manual";
  const recent = all
    .filter((item) => filter === "all" || item.slug === filter)
    .slice(0, 14);

  const setMode = (mode: "auto" | "manual") =>
    updateLatest((s) => ({
      ...s,
      mode,
      picked:
        mode === "manual" && s.picked.length === 0
          ? shown.map((item) => item.key)
          : s.picked,
    }));

  return (
    <ContentShell
      crumbs={[
        { label: "پیشخوان", href: "/admin/dashboard" },
        { label: "جدیدترین محتواها" },
      ]}
    >
      <section className="ct-hero rise">
        <span className="ct-hero-ic" aria-hidden="true">
          <Timer size={30} strokeWidth={1.6} />
        </span>
        <div className="ct-hero-txt">
          <h1>جدیدترین محتواها</h1>
          <p>
            جلسه‌هایی که در صفحه‌ی اول سایت، زیر «جدیدترین محتواها» نمایش داده
            می‌شوند.
          </p>
        </div>
        <span className="lt-mode-badge">
          {manual ? "دستی ـ انتخاب شما" : "خودکار ـ به‌روز با هر بارگذاری"}
        </span>
      </section>

      <section className="ct-card lt-settings rise">
        <div className="lt-field">
          <b>انتخاب جلسه‌ها</b>
          <div className="lt-seg" role="group" aria-label="انتخاب جلسه‌ها">
            {(["auto", "manual"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={settings.mode === mode ? "on" : ""}
                aria-pressed={settings.mode === mode}
                onClick={() => setMode(mode)}
              >
                {mode === "auto" ? "خودکار" : "دستی"}
              </button>
            ))}
          </div>
        </div>
        <div className="lt-field">
          <b>تعداد نمایش</b>
          <div className="lt-seg" role="group" aria-label="تعداد نمایش">
            {([3, 5, 8] as const).map((count) => (
              <button
                key={count}
                type="button"
                className={settings.count === count ? "on" : ""}
                aria-pressed={settings.count === count}
                onClick={() => updateLatest((s) => ({ ...s, count }))}
              >
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
                <button
                  type="button"
                  className="ct-link lt-reset"
                  onClick={resetOrder}
                >
                  ترتیب خودکار
                </button>
              ) : null}
            </span>
          </div>
          {shown.length === 0 ? (
            <div className="ct-empty">
              چیزی برای نمایش نیست. از فهرست کناری جلسه اضافه کنید.
            </div>
          ) : null}
          <div className="ct-sessions">
            {shown.map((item, index) => {
              const pinned = settings.pinned.includes(item.key);
              return (
                <article
                  key={item.key}
                  className={`lt-card rise${dragKey === item.key ? " is-dragging" : ""}${drop?.key === item.key ? (drop.after ? " drop-after" : " drop-before") : ""}`}
                  draggable
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
                    setDrop({
                      key: item.key,
                      after: event.clientY > box.top + box.height / 2,
                    });
                  }}
                  onDragLeave={() =>
                    setDrop((hint) => (hint?.key === item.key ? null : hint))
                  }
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!dragKey || dragKey === item.key) return;
                    const box = event.currentTarget.getBoundingClientRect();
                    const after = event.clientY > box.top + box.height / 2;
                    const keys = shown.map((entry) => entry.key);
                    let to = index + (after ? 1 : 0);
                    if (keys.indexOf(dragKey) < to) to -= 1;
                    moveShown(keys, dragKey, to);
                    setDragKey(null);
                    setDrop(null);
                  }}
                >
                  <span className="ct-num lt-num">{fa(index + 1)}</span>
                  <div className="lt-body">
                    <small>
                      <span className="lt-pill">
                        {sectionMeta[item.slug].kicker}
                      </span>{" "}
                      {item.course.title}
                    </small>
                    <h3>{item.session.title}</h3>
                    <span className="lt-sub">
                      {[dayMonth(item.session.createdAt), ...parts(item)].join(
                        " · ",
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`ct-icon${pinned ? " lt-on" : ""}`}
                    aria-pressed={pinned}
                    aria-label={pinned ? "برداشتن سنجاق" : "سنجاق کردن"}
                    onClick={() => togglePin(item.key)}
                  >
                    <Pin size={16} />
                  </button>
                  <button
                    type="button"
                    className="ct-icon"
                    aria-label="برداشتن از صفحه‌ی اول"
                    onClick={() => removeFromHome(item.key)}
                  >
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
            {[
              { id: "all", label: "همه" },
              ...SECTION_SLUGS.map((slug) => ({
                id: slug,
                label: sectionMeta[slug].kicker,
              })),
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={filter === chip.id ? "on" : ""}
                aria-pressed={filter === chip.id}
                onClick={() => setFilter(chip.id)}
              >
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
                    <b>{day(item.session.createdAt)}</b>
                    {month(item.session.createdAt)}
                  </span>
                  <span className="lt-title">
                    <b>{item.session.title}</b>
                    <small>
                      {sectionMeta[item.slug].title} › {item.course.title}
                      {!item.session.audioName
                        ? " · بدون صوت"
                        : !item.session.textName
                          ? " · بدون مکتوب"
                          : ""}
                    </small>
                  </span>
                  {isOn ? (
                    <span className="lt-badge">در صفحه‌ی اول</span>
                  ) : manual || hidden ? (
                    <button
                      type="button"
                      className="lt-add"
                      onClick={() => addToHome(item.key)}
                    >
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
              <span className="lt-pill">{sectionMeta[item.slug].kicker}</span>
              <h3>{item.session.title}</h3>
              <small>{item.course.title}</small>
              <footer>
                <span className="lt-play" aria-hidden="true">
                  {item.session.audioName ? (
                    <Play size={12} fill="currentColor" />
                  ) : (
                    <FileText size={12} />
                  )}
                </span>
                <time dateTime={item.session.createdAt}>
                  {dayMonth(item.session.createdAt)}
                </time>
                {item.session.audioName ? (
                  <Headphones size={13} aria-hidden="true" />
                ) : null}
              </footer>
            </article>
          ))}
        </div>
      </section>
    </ContentShell>
  );
}

"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import {
  formatSessionTitle,
  normalizeSessionTitle,
  sessionNumberFromText,
  toPersianDigits,
  type AudioCatalog,
  type LatestCatalogItem,
  type MaktubatSession,
} from "@/lib/media-api";
import { akhlaghOrderIndex, normalizePersianText } from "@/lib/akhlagh-order";

const featureMeta = {
  title: "جدیدترین محتواها",
};

function sessionTitle(item: LatestCatalogItem, fallbackIndex: number) {
  const order = sessionNumber(item, fallbackIndex);
  return normalizeSessionTitle(item.title || "", order) || formatSessionTitle(order);
}

function latestTitle(item: LatestCatalogItem, fallbackIndex: number) {
  const title = sessionTitle(item, fallbackIndex);

  if (item.section === "tafsir" && item.collection === "tafsir") {
    return toPersianDigits(`تفسیر ترتیبی - سوره حمد - ${title}`);
  }

  if (item.section === "tafsirmozooei" && item.collection === "nur") {
    return toPersianDigits(`تفسیر موضوعی - احسن الحدیث - سوره نور - ${title}`);
  }

  if (item.section === "tafsirmozooei" && item.collection === "maad") {
    return toPersianDigits(`تفسیر موضوعی - احسن الحدیث - ${title}`);
  }

  if (item.section === "akhlagh" && item.collection === "nashaatvojoodi") {
    return toPersianDigits(`نشآت وجودی انسان: درجات و درکات - ${title}`);
  }

  if (item.section === "aghayed" && item.collection === "dine-fetri") {
    return toPersianDigits(`دین فطری - مقدمه - ${title}`);
  }

  return toPersianDigits([item.collectionTitle || item.collection, title]
    .filter(Boolean)
    .join(" - "));
}

function sessionNumber(item: LatestCatalogItem, fallbackIndex: number) {
  const idNumber = Number(item.id);
  if (Number.isFinite(idNumber) && idNumber > 0) return idNumber;

  return sessionNumberFromText(item.title || "") || fallbackIndex + 1;
}

function sessionOrder(session: MaktubatSession, fallbackIndex: number) {
  const source = [session.title, session.id].filter(Boolean).join(" ");
  return sessionNumberFromText(source) || fallbackIndex + 1;
}

function sortSessions(sessions: MaktubatSession[] = []) {
  return sessions
    .map((session, originalIndex) => ({
      session,
      originalIndex,
      order: sessionOrder(session, originalIndex),
    }))
    .sort((a, b) => a.order - b.order || a.originalIndex - b.originalIndex)
    .map(({ session }) => session);
}

function isNashaatTitle(title = "") {
  const normalizedTitle = normalizePersianText(title);
  return (
    normalizedTitle === normalizePersianText("نشآت وجودی انسان") ||
    normalizedTitle === normalizePersianText("نشآت وجودی انسان: درجات و درکات")
  );
}

function latestTarget(
  item: LatestCatalogItem,
  catalog: AudioCatalog | null,
  fallbackIndex: number
) {
  const order = sessionNumber(item, fallbackIndex);

  if (item.section === "tafsir" && item.collection === "tafsir") {
    return {
      sheetId: "tafsir",
      accordionValue: "tafsir-tartibi",
      itemDomId: `tafsir-session-${item.id || order}`,
    };
  }

  if (item.section === "tafsirmozooei" && item.collection === "nur") {
    return {
      sheetId: "tafsir",
      accordionValue: "tafsir-mozooei",
      itemDomId: `tafsir-nur-session-${item.id || order}`,
    };
  }

  if (item.section === "tafsirmozooei" && item.collection === "maad") {
    return {
      sheetId: "tafsir",
      accordionValue: "tafsir-mozooei",
      itemDomId: `tafsir-mozooei-session-${item.id || order}`,
    };
  }

  if (item.section === "aghayed" && item.collection === "bavardasht") {
    return {
      sheetId: "akhlagh",
      accordionValue: "belief",
      itemDomId: `audio-akhlagh-belief-${Math.max(order - 1, 0)}`,
    };
  }

  if (item.section === "aghayed" && item.collection === "dine-fetri") {
    return {
      sheetId: "akhlagh",
      accordionValue: "fitri-religion",
      itemDomId: "audio-akhlagh-fitri-1",
    };
  }

  if (item.section === "akhlagh" && item.collection) {
    const groups = Object.entries(catalog?.akhlagh || {})
      .map(([key, topic], originalIndex) => ({
        key,
        originalIndex,
        subject: topic?.title || key,
        sessions: sortSessions(topic?.sessions || []),
      }))
      .sort((a, b) => {
        const byTitle = akhlaghOrderIndex(a.subject) - akhlaghOrderIndex(b.subject);
        return byTitle || a.originalIndex - b.originalIndex;
      });
    const groupIndex = groups.findIndex(
      (group) =>
        group.key === item.collection ||
        normalizePersianText(group.subject) === normalizePersianText(item.collectionTitle || "") ||
        (item.collection === "nashaatvojoodi" && isNashaatTitle(group.subject))
    );

    if (groupIndex >= 0) {
      const group = groups[groupIndex];
      const sessionIndex = Math.max(
        group.sessions.findIndex((session, index) => {
          const currentOrder = sessionOrder(session, index);
          return String(session.id || currentOrder) === String(item.id || order);
        }),
        Math.max(order - 1, 0)
      );

      return {
        sheetId: "benefitsCard",
        accordionValue: `group-${groupIndex}`,
        itemDomId: `audio-benefitsCard-${groupIndex}-${sessionIndex}`,
      };
    }
  }

  if (item.section === "maktubat") {
    return {
      sheetId: "maktobat",
      accordionValue: item.id,
      itemDomId: item.id ? `maktobat-item-${item.id}` : undefined,
    };
  }

  if (item.section === "tajrid") {
    return {
      sheetId: "tajrid",
      accordionValue: `audio-${order}`,
      itemDomId: `tajrid-audio-${order}`,
    };
  }

  return null;
}

/** «تفسیر ترتیبی - سوره حمد - جلسه نوزدهم» → the series on a small line and the session on a big one. */
function splitLatestTitle(text: string) {
  const index = text.lastIndexOf(" - ");
  if (index === -1) return { series: "", session: text.trim() };
  return {
    series: text
      .slice(0, index)
      .split(" - ")
      .map((part) => part.trim())
      .join(" · "),
    session: text.slice(index + 3).trim(),
  };
}

export const FeaturesSection = () => {
  const { catalog, loading, error, load } = useAudioCatalog();
  const dineFetriLatest: LatestCatalogItem = {
    id: "1",
    key: "dine-fetri-session-1",
    title: "جلسه اول",
    subtitle: "مقدمه",
    section: "aghayed",
    collection: "dine-fetri",
    collectionTitle: "دین فطری",
  };
  const latest5 = [
    dineFetriLatest,
    ...(catalog?.latest || []),
  ].slice(0, 5);
  const { goTo } = useSheetNav();

  useEffect(() => {
    load(true);
  }, [load]);

  return (
    <section id="features" className="h-full w-full">
      <div className="lt-card" dir="rtl">
        <div className="lt-head">
          <span className="lt-live">
            <i aria-hidden="true" />
            تازه‌ها
          </span>
          <h3 className="lt-title">{featureMeta.title}</h3>
          <p className="lt-lead">برای شنیدن یا رفتن به بخش مربوط، روی هر مورد کلیک کنید.</p>
        </div>

        {loading && latest5.length === 0 ? (
          <div className="mt-5 flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-14 skeleton-shimmer rounded-2xl border border-secondary/40 bg-background/25" />
            ))}
          </div>
        ) : error && latest5.length === 0 ? (
          <p className="lt-note">{error}</p>
        ) : latest5.length === 0 ? (
          <p className="lt-note">هنوز محتوای جدیدی ثبت نشده.</p>
        ) : (
          <ol className="lt-list">
            {latest5.map((item, index) => {
              const target = latestTarget(item, catalog, index);
              const { series, session } = splitLatestTitle(latestTitle(item, index));

              return (
                <li key={item.key || `${item.collection}-${item.id}-${index}`}>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("mohtava")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });

                      if (target) goTo(target);
                    }}
                    className={index === 0 ? "lt-item lt-first" : "lt-item"}
                  >
                    <span className="lt-num" aria-hidden="true">
                      <span>{toPersianDigits(index + 1)}</span>
                    </span>
                    <span className="lt-txt">
                      {series ? <span className="lt-series">{series}</span> : null}
                      <span className="lt-session">
                        {session}
                        {index === 0 ? <span className="lt-new">تازه</span> : null}
                      </span>
                    </span>
                    <span className="lt-play" aria-hidden="true">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5.5v13a1 1 0 001.5.9l10.4-6.5a1 1 0 000-1.8L9.5 4.6A1 1 0 008 5.5z" />
                      </svg>
                    </span>
                  </button>
                </li>
              );
            })}
            {loading ? (
              <li className="lt-loading">
                <Loader2 className="ml-2 size-4 animate-spin" />
                در حال به‌روزرسانی
              </li>
            ) : null}
          </ol>
        )}
      </div>
    </section>
  );
};

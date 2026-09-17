"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import {
  sessionNumberFromText,
  type AudioCatalog,
  type LatestCatalogItem,
  type MaktubatSession,
} from "@/lib/media-api";
import { akhlaghOrderIndex, normalizePersianText } from "@/lib/akhlagh-order";
import { MotionItem, MotionList } from "./reveal";

const featureMeta = {
  title: "جدیدترین محتواها",
};

function sessionTitle(item: LatestCatalogItem, fallbackIndex: number) {
  return item.title || `جلسه ${item.id || fallbackIndex + 1}`;
}

function latestTitle(item: LatestCatalogItem, fallbackIndex: number) {
  const title = sessionTitle(item, fallbackIndex);

  if (item.section === "tafsir" && item.collection === "tafsir") {
    return `تفسیر ترتیبی - سوره حمد - ${title}`;
  }

  if (item.section === "tafsirmozooei" && item.collection === "maad") {
    return `تفسیر موضوعی - احسن الحدیث - ${title}`;
  }

  if (item.section === "akhlagh" && item.collection === "nashaatvojoodi") {
    return `نشآت وجودی انسان: درجات و درکات - ${title}`;
  }

  return [item.collectionTitle || item.collection, title]
    .filter(Boolean)
    .join(" - ");
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

export const FeaturesSection = () => {
  const { catalog, loading, error, load } = useAudioCatalog();
  const latest5 = (catalog?.latest || []).slice(0, 5);
  const { goTo } = useSheetNav();

  useEffect(() => {
    load(true);
  }, [load]);

  return (
    <section id="features" className="w-full">
      <div
        className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-primary/25 bg-card/45 p-5 text-right shadow-[0_18px_44px_rgba(0,0,0,0.08)] backdrop-blur-xl transition duration-300 hover:border-primary/45 sm:p-6 dark:bg-card/70"
        dir="rtl"
      >
        <div className="absolute right-0 top-8 h-24 w-1 rounded-l-full bg-primary" />
        <div className="absolute left-6 top-6 h-px w-20 bg-gradient-to-l from-primary to-transparent" />

        <div className="relative z-10">
          <p className="mb-3 text-sm font-bold text-primary">تازه‌ها</p>
          <h3 className="max-w-sm text-3xl font-extrabold leading-[1.7] text-foreground md:text-4xl">
            {featureMeta.title}
          </h3>
          <p className="mt-3 text-base leading-8 text-muted-foreground md:text-lg">
            برای شنیدن یا رفتن به بخش مربوط، روی هر مورد کلیک کنید.
          </p>
        </div>

        <div className="relative z-10 mt-6">
          {loading && latest5.length === 0 ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-2xl border border-secondary/40 bg-background/25"
                />
              ))}
            </div>
          ) : error && latest5.length === 0 ? (
            <p className="rounded-2xl border border-secondary/50 bg-card/60 p-4 text-center text-base text-muted-foreground">
              {error}
            </p>
          ) : latest5.length === 0 ? (
            <p className="rounded-2xl border border-secondary/50 bg-card/60 p-4 text-center text-base text-muted-foreground">
              هنوز محتوای جدیدی ثبت نشده.
            </p>
          ) : (
            <MotionList className="flex flex-col gap-3">
              {latest5.map((item, index) => {
                const target = latestTarget(item, catalog, index);

                return (
                  <MotionItem key={item.key || `${item.collection}-${item.id}-${index}`}>
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById("mohtava")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });

                        if (target) goTo(target);
                      }}
                      className="group flex w-full items-center justify-between gap-2 rounded-2xl border border-secondary/40 bg-background/25 px-3 py-3 text-right shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/70 sm:gap-4 sm:px-4 dark:bg-background/20"
                    >
                      <span className="hidden h-px w-8 shrink-0 bg-primary/70 transition duration-300 group-hover:w-12 sm:block" />
                      <span className="block min-w-0 flex-1 text-base font-bold leading-8 text-primary transition group-hover:text-foreground sm:text-xl md:text-2xl">
                        {latestTitle(item, index)}
                      </span>
                    </button>
                  </MotionItem>
                );
              })}

              {loading ? (
                <MotionItem>
                  <div
                    className="flex min-h-16 items-center justify-center rounded-2xl border border-secondary/40 bg-background/20 p-4 text-sm font-semibold text-muted-foreground"
                    dir="rtl"
                  >
                    <Loader2 className="ml-2 size-4 animate-spin" />
                    در حال به‌روزرسانی
                  </div>
                </MotionItem>
              ) : null}
            </MotionList>
          )}
        </div>
      </div>
    </section>
  );
};

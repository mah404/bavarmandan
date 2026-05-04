"use client";

import { getLatestAudios } from "@/lib/getLatestAudios";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";
import { MotionItem, MotionList } from "./reveal";

const featureMeta = {
  title: "جدیدترین محتوای اضافه شده",
};

export const FeaturesSection = () => {
  const latest5 = getLatestAudios(3);
  const { play } = useAudioPlayer();
  const { goTo } = useSheetNav();

  return (
    <section id="features" className="h-full w-full">
      <div
        className="relative flex h-full min-h-[392px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-primary/25 bg-card/45 p-6 text-right shadow-[0_18px_44px_rgba(0,0,0,0.08)] backdrop-blur-xl transition duration-300 hover:border-primary/45 dark:bg-card/70"
        dir="rtl"
      >
        <div className="absolute right-0 top-8 h-28 w-1 rounded-l-full bg-primary" />
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

        <div className="relative z-10 mt-8">
          {latest5.length === 0 ? (
            <p className="rounded-2xl border border-secondary/50 bg-card/60 p-4 text-center text-base text-muted-foreground">
              هنوز فایل جدیدی ثبت نشده.
            </p>
          ) : (
            <MotionList className="flex flex-col gap-3">
              {latest5.map((audio, index) => (
                <MotionItem key={index}>
                  <button
                    onClick={() => {
                      document.getElementById("mohtava")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });

                      if (
                        audio.sheetId &&
                        audio.accordionValue &&
                        audio.itemDomId
                      ) {
                        goTo({
                          sheetId: audio.sheetId,
                          accordionValue: audio.accordionValue,
                          itemDomId: audio.itemDomId,
                        });
                        return;
                      }

                      play({
                        title: audio.title,
                        url: audio.url,
                        description: audio.description,
                      });
                    }}
                    className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-secondary/40 bg-background/25 px-4 py-3 text-right shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/70 dark:bg-background/20"
                  >
                    <span className="h-px w-8 shrink-0 bg-primary/70 transition duration-300 group-hover:w-12" />
                    <span className="block flex-1 text-xl font-bold leading-9 text-primary transition group-hover:text-foreground md:text-2xl">
                      {audio.description?.trim() ?? audio.title}
                    </span>
                  </button>
                </MotionItem>
              ))}
            </MotionList>
          )}
        </div>
      </div>
    </section>
  );
};

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLatestAudios } from "@/lib/getLatestAudios";
import { Separator } from "@/components/ui/separator";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";

const featureMeta = {
  title: "جدیدترین فایل‌ها و آخرین  به روز رسانی ",
};

export const FeaturesSection = () => {
  const latest5 = getLatestAudios(5);
  const { play } = useAudioPlayer();
  const { goTo } = useSheetNav();

  return (
    <section id="features" className="container py-8 sm:py-8">
      <div className="flex justify-center">
        <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-card border-2 shadow-none">
          <CardHeader className="flex flex-col items-center text-center pb-4">
            <CardTitle className="text-3xl sm:text-3xl font-semibold text-primary">
              {featureMeta.title}
              <Separator className="my-6 bg-muted-foreground" />
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {latest5.length === 0 ? (
              <p className="text-primary text-center text-lg sm:text-xl">
                هنوز فایل جدیدی ثبت نشده.
              </p>
            ) : (
              latest5.map((audio, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // ✅ If we know where it belongs → open that sheet & autoplay there
                    if (audio.sheetId && audio.accordionValue && audio.itemDomId) {
                      goTo({
                        sheetId: audio.sheetId,
                        accordionValue: audio.accordionValue,
                        itemDomId: audio.itemDomId,
                        autoplay: {
                          title: audio.title,
                          url: audio.url,
                          description: audio.description,
                        },
                      });
                      return;
                    }

                    // fallback: just play
                    play({ title: audio.title, url: audio.url });
                  }}
                  className="text-center text-lg sm:text-xl leading-relaxed transition hover:text-primary cursor-pointer"
                >
                  <span className="block font-medium">{audio.title}</span>
                  <span className="block text-sm sm:text-base text-muted-foreground mt-1">
                    {audio.description}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

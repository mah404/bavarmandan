"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLatestAudios } from "@/lib/getLatestAudios";
import { Separator } from "@/components/ui/separator";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";

const featureMeta = {
  title: "جدیدترین محتوای اضافه شده",
};

export const FeaturesSection = () => {
  const latest5 = getLatestAudios(3);
  const { play } = useAudioPlayer();
  const { goTo } = useSheetNav();

  return (
    <section id="features" className="py-8 w-full "
    >
      <div className="flex justify-center ">
        <Card
          className="
            w-full
            max-w-xl
            text-card
            border
            shadow-none
            bg-primary
            
          "
        >
          <CardHeader className="flex flex-col items-center text-center py-2">
            <CardTitle className="text-xl font-semibold text-card">
              {featureMeta.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-2 py-2 bg-card text-primary cursor-pointer hover:bg-background transition"
          >
            {latest5.length === 0 ? (
              <p className="text-primary text-center text-sm">
                هنوز فایل جدیدی ثبت نشده.
              </p>
            ) : (
              latest5.map((audio, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (
                      audio.sheetId &&
                      audio.accordionValue &&
                      audio.itemDomId
                    ) {
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

                    play({ title: audio.title, url: audio.url });
                  }}
                  className="
                    text-center
                    text-sm
                    leading-tight
                    transition
                    hover:text-white
                    
                    
                  "
                >
                  <span className="block text-lg font-medium">
                    {audio.title}
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

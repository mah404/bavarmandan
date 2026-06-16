"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BookOpenText } from "lucide-react";
import loadingPdfAnim from "@/public/loading.json";
import Lottie from "lottie-react";
import { useRouter } from "next/navigation";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { tajridAudios } from "@/data/content";
import { HoverLift, MotionItem, MotionList } from "./reveal";

// PDF config
const TOTAL_PDFS = 2;
const BASE_PATH = "";


const toStreamable = (u: string) => {
  if (!u) return u;
  if (!u.includes("dropbox.com")) return u;
  const noParam = u.replace(/([?&])(dl|raw)=[01]/g, "").replace(/[?&]$/, "");
  return noParam + (noParam.includes("?") ? "&raw=1" : "?raw=1");
};
interface PdfSection {
  id: string;
  pdfUrl: string;
}
export const BenefitTajrid = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { play } = useAudioPlayer();

  const sections: PdfSection[] = useMemo(() => {
    return Array.from({ length: TOTAL_PDFS }, (_, i) => {
      const n = i + 1;
      const path = `${BASE_PATH}/${n}.pdf`.replace("//", "/");
      return { id: `v${n}`, pdfUrl: path };
    });
  }, []);

  const toDownloadUrl = (u: string) => u;

  return (
    <>
      <HoverLift className="h-full">
      <Card
        onClick={() => setOpen(true)}
        className="service-tile group flex h-full min-h-[168px] cursor-pointer flex-col justify-between"
      >
        <div className="service-tile-header">
          <span className="service-tile-kicker">شرح کتاب</span>
          <span className="service-tile-mark" aria-hidden="true">
            <BookOpenText className="size-5" />
          </span>
        </div>
        <div className="service-tile-copy">
          <h3>دروس شرح کتاب تجرید الاعتقاد</h3>
          <p>شرح، جزوه و صوت جلسات</p>
        </div>
      </Card>
      </HoverLift>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-h-screen overflow-y-auto">
          <SheetHeader>
            <SheetTitle>دروس شرح کتاب تجرید الاعتقاد</SheetTitle>
            <SheetDescription>
              {loading ? (
                <Lottie
                  animationData={loadingPdfAnim}
                  loop
                  className="text-muted-foreground bg-transparent mt-4"
                />
              ) : (
                <Accordion type="single" collapsible className="w-full mt-4">
                  {/* PDFs */}
                  <AccordionItem value="tajrid-pdfs">
                    <AccordionTrigger>کتاب شرح تجرید الاعتقاد</AccordionTrigger>
                    <AccordionContent>
                      <MotionList className="flex flex-col gap-3">
                      {sections.map((section, index) => {
                        const vol = index + 1;
                        const label = `کتاب کشف المراد جلد ${vol}`;
                        const fileName = `${label}.pdf`;
                        return (
                          <MotionItem
                            key={section.id}
                            className="motion-list-item flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                          >
                            <span className="text-sm text-muted-foreground">
                              {label}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(section.pdfUrl, "_blank")
                                }
                              >
                                نمایش
                              </Button>
                              <Button
                                className="text-card"
                                size="sm"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = section.pdfUrl;
                                  a.download = fileName; // browsers may honor this for same-origin
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                              >
                                دانلود
                              </Button>
                            </div>
                          </MotionItem>
                        );
                      })}
                      </MotionList>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Audios */}
                  {[...tajridAudios].reverse().map((audio, i, arr) => {
                    const sessionNumber = arr.length - i;
                    const descriptions = [
                      audio.DescriptionOne,
                      audio.DescriptionTwo,
                      audio.DescriptionThree,
                      audio.DescriptionFour,
                      (audio as any).DescriptionFive,
                      (audio as any).DescriptionSix,
                    ].filter((d) => d && String(d).trim() !== "") as string[];

                    const url = toStreamable(audio.url);

                    return (
                      <AccordionItem
                        key={`audio-${sessionNumber}`}
                        value={`audio-${sessionNumber}`}
                      >
                        <AccordionTrigger>
                          جلسه {sessionNumber}
                        </AccordionTrigger>
                   <AccordionContent>
  <div className="space-y-4">
    {descriptions.length > 0 ? (
      <div
        className="text-sm text-primary leading-relaxed text-right whitespace-pre-line"
        dir="rtl"
      >
        {descriptions.map((desc, idx) => (
          <p key={idx}>{desc}</p>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground text-center">
        توضیحی برای این جلسه موجود نیست
      </p>
    )}

    <div className="flex flex-col sm:flex-row gap-2 justify-center">
      <Button
        className="w-full sm:w-auto text-card"
        onClick={() => {
          if (!url) return;

          play({
            title: `جلسه ${sessionNumber}`,
            url,
            description: descriptions.length
              ? descriptions.join(" | ")
              : undefined,
          });
        }}
      >
        پخش
      </Button>

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <a
          href={toDownloadUrl(url)}
          download={`جلسه-${sessionNumber}.mp3`}
          rel="noopener noreferrer"
        >
          دانلود صوت
        </a>
      </Button>
    </div>
  </div>
</AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
};

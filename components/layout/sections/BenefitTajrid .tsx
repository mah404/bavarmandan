"use client";

import { useMemo, useState } from "react";
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
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { toDownloadUrl, toPdfViewUrl, toStreamableUrl } from "@/lib/media-api";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import { HoverLift, MotionItem, MotionList } from "./reveal";

const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toPersianNumber(value: number) {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

function normalizeTajridLine(value = "") {
  return value
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[ـ]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTajridSessionNumber(title = "", fallback: number) {
  const normalized = normalizeTajridLine(title);
  const match = normalized.match(/(?:جلسه|session)\s*([0-9۰-۹٠-٩]+)/i);
  if (!match) return fallback;

  const normalizedDigits = match[1]
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

  const parsed = Number(normalizedDigits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function splitTajridSubtitle(value: string | string[] = "") {
  if (Array.isArray(value)) {
    return value.map((line) => normalizeTajridLine(line)).filter(Boolean);
  }

  const normalized = normalizeTajridLine(value);
  if (!normalized) return [];

  const matches = Array.from(
    normalized.matchAll(
      /(?:^|\s)[0-9۰-۹٠-٩]+\s*[-:]\s*([\s\S]*?)(?=\s+[0-9۰-۹٠-٩]+\s*[-:]|$)/g
    )
  );

  if (matches.length) {
    return matches.map((match) => match[1].trim()).filter(Boolean);
  }

  return normalized
    .split(/\s+-\s+|\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatTajridSubtitle(audio: { subtitle?: string | string[] }) {
  return splitTajridSubtitle(audio.subtitle || "")
    .map((line) =>
      normalizeTajridLine(line)
        .replace(/^[0-9۰-۹٠-٩]+\s*[-:]\s*/, "")
        .trim()
    )
    .filter(Boolean)
    .map((line, index) => `${toPersianNumber(index + 1)}-${line}`);
}
export const BenefitTajrid = () => {
  const [open, setOpen] = useState(false);
  const { play } = useAudioPlayer();
  const { catalog, loading, error, load } = useAudioCatalog();

  const sections = useMemo(() => catalog?.tajrid?.pdfs || [], [catalog]);
  const tajridAudios = useMemo(() => catalog?.tajrid?.audios || [], [catalog]);

  return (
    <>
      <HoverLift className="h-full">
      <Card
        onClick={() => {
          setOpen(true);
          load();
        }}
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
            <SheetDescription className="mb-4"></SheetDescription>
          </SheetHeader>

          {loading ? (
            <Lottie
              animationData={loadingPdfAnim}
              loop
              className="text-muted-foreground bg-transparent mt-4"
            />
          ) : error ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {error}
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full mt-4">
                  {/* PDFs */}
                  <AccordionItem value="tajrid-pdfs">
                    <AccordionTrigger>کتاب شرح تجرید الاعتقاد</AccordionTrigger>
                    <AccordionContent>
                      <MotionList className="flex flex-col gap-3">
                      {sections.map((section, index) => {
                        const vol = index + 1;
                        const label = section.title || `کتاب کشف المراد جلد ${vol}`;
                        const fileName = `${label}.pdf`;
                        const pdfUrl = section.url || "";
                        return (
                          <MotionItem
                            key={section.id || pdfUrl || index}
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
                                  window.open(toPdfViewUrl(pdfUrl), "_blank")
                                }
                              >
                                نمایش
                              </Button>
                              <Button
                                className="text-card"
                                size="sm"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = pdfUrl;
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
                  {[...tajridAudios]
                    .map((audio, index) => ({
                      audio,
                      sessionNumber: extractTajridSessionNumber(
                        audio.title,
                        index + 1
                      ),
                    }))
                    .sort((a, b) => b.sessionNumber - a.sessionNumber)
                    .map(({ audio, sessionNumber }) => {
                    const subtitleLines = formatTajridSubtitle(audio);

                    const url = toStreamableUrl(audio.url || "");

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
    {subtitleLines.length > 0 ? (
      <div
        className="text-sm text-primary leading-relaxed text-right whitespace-pre-line"
        dir="rtl"
      >
        {subtitleLines.map((point) => (
          <p key={point}>{point}</p>
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
            description: subtitleLines.join(" | "),
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
        </SheetContent>
      </Sheet>
    </>
  );
};

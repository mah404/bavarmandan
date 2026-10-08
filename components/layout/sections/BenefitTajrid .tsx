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
import { BookOpenText, Download, Headphones, Play } from "lucide-react";
import loadingPdfAnim from "@/public/loading.json";
import Lottie from "lottie-react";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import {
  formatSessionTitle,
  toPersianDigits,
  toDownloadUrl,
  toPdfViewUrl,
  toStreamableUrl,
} from "@/lib/media-api";
import { resolveLessonSegment } from "@/lib/audio-segments";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import { useSheetNav } from "./SheetNavProvider";
import { HoverLift, MotionItem, MotionList } from "./reveal";

function toPersianNumber(value: number) {
  return toPersianDigits(value);
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
  const SHEET_ID = "tajrid";
  const [open, setOpen] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string | undefined>();
  const { current, isPlaying, play, notifyLessonSoon } = useAudioPlayer();
  const { catalog, loading, error, load } = useAudioCatalog();
  const { target, clear } = useSheetNav();

  const sections = useMemo(() => catalog?.tajrid?.pdfs || [], [catalog]);
  const tajridAudios = useMemo(() => catalog?.tajrid?.audios || [], [catalog]);

  const flashHighlight = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.classList.add("nav-highlight");
    window.setTimeout(() => element.classList.remove("nav-highlight"), 1700);
  };

  useEffect(() => {
    if (!target || target.sheetId !== SHEET_ID) return;

    setOpen(true);
    load();
    if (target.accordionValue) setAccordionValue(target.accordionValue);

    const timer = window.setTimeout(() => {
      if (target.itemDomId) {
        document.getElementById(target.itemDomId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        flashHighlight(target.itemDomId);
      }
      if (target.autoplay) play(target.autoplay);
      clear();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [target, clear, load, play]);

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
            <Accordion
              type="single"
              collapsible
              value={accordionValue}
              onValueChange={setAccordionValue}
              className="w-full mt-4"
            >
                  {/* PDFs */}
                  <AccordionItem value="tajrid-pdfs">
                    <AccordionTrigger>کتاب شرح تجرید الاعتقاد</AccordionTrigger>
                    <AccordionContent>
                      <MotionList className="flex flex-col gap-3">
                      {sections.map((section, index) => {
                        const vol = index + 1;
                        const label = toPersianDigits(
                          section.title || `کتاب کشف المراد جلد ${vol}`
                        );
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
                    const sessionTitle = formatSessionTitle(sessionNumber);

                    const url = toStreamableUrl(audio.url || "");
                    const lessonSegment = resolveLessonSegment(audio);
                    const isCurrentTrack = current?.url === url;
                    const isLessonActive =
                      isCurrentTrack && current?.segmentMode === "lesson";
                    const isFullActive =
                      isCurrentTrack && current?.segmentMode !== "lesson";

                    return (
                      <AccordionItem
                        key={`audio-${sessionNumber}`}
                        id={`tajrid-audio-${sessionNumber}`}
                        value={`audio-${sessionNumber}`}
                      >
                        <AccordionTrigger>
                          {sessionTitle}
                        </AccordionTrigger>
                   <AccordionContent>
  <div className="space-y-4">
    {subtitleLines.length > 0 ? (
      <div
        className="text-sm text-primary leading-relaxed text-right whitespace-pre-line"
        dir="rtl"
      >
        {subtitleLines.map((point) => (
          <p key={point}>{toPersianDigits(point)}</p>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground text-center">
        توضیحی برای این جلسه موجود نیست
      </p>
    )}

    <div className="lesson-audio-card">
      <p className="lesson-audio-title">
        <span>صوت</span>
        <Headphones aria-hidden="true" />
      </p>

      <div className="lesson-segment-switch">
        <button
          type="button"
          className={`lesson-segment-chip ${
            lessonSegment && isLessonActive && isPlaying ? "is-active" : ""
          }`}
          onClick={() => {
            if (!lessonSegment) {
              notifyLessonSoon();
              return;
            }

            play({
              title: sessionTitle,
              url,
              description: subtitleLines.join(" | "),
              lessonStart: lessonSegment.start,
              lessonEnd: lessonSegment.end,
              segmentMode: "lesson",
              navTarget: {
                sheetId: "tajrid",
                accordionValue: `audio-${sessionNumber}`,
                itemDomId: `tajrid-audio-${sessionNumber}`,
              },
            });
          }}
        >
          درس
        </button>

        <button
          type="button"
          className={`lesson-segment-chip ${
            isFullActive && isPlaying ? "is-active" : ""
          }`}
          onClick={() => {
            if (!url) return;

            play({
              title: sessionTitle,
              url,
              description: subtitleLines.join(" | "),
              lessonStart: lessonSegment?.start ?? null,
              lessonEnd: lessonSegment?.end ?? null,
              segmentMode: "full",
              navTarget: {
                sheetId: "tajrid",
                accordionValue: `audio-${sessionNumber}`,
                itemDomId: `tajrid-audio-${sessionNumber}`,
              },
            });
          }}
        >
          کامل
        </button>
      </div>

      <div className="lesson-action-row">
        <a
          className="lesson-download-action"
          href={toDownloadUrl(url)}
          download={`${sessionTitle}.mp3`}
          rel="noopener noreferrer"
        >
          <span>دانلود صوت</span>
          <Download aria-hidden="true" />
        </a>

        <button
          type="button"
          className="lesson-primary-action"
          onClick={() => {
            if (!url) return;

            play({
              title: sessionTitle,
              url,
              description: subtitleLines.join(" | "),
              lessonStart: lessonSegment?.start ?? null,
              lessonEnd: lessonSegment?.end ?? null,
              segmentMode: "full",
              navTarget: {
                sheetId: "tajrid",
                accordionValue: `audio-${sessionNumber}`,
                itemDomId: `tajrid-audio-${sessionNumber}`,
              },
            });
          }}
        >
          <span>پخش</span>
          <Play aria-hidden="true" />
        </button>
      </div>
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, Headphones, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import {
  formatSessionTitle,
  normalizeSessionTitle,
  toPersianDigits,
  type MaktubatSession,
  toDownloadUrl,
  toPdfViewUrl,
  toStreamableUrl,
} from "@/lib/media-api";
import { resolveLessonSegment } from "@/lib/audio-segments";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import { useSheetNav } from "./SheetNavProvider";
import { HoverLift } from "./reveal";

type TafsirSessionItem = MaktubatSession & { isPlaceholder?: boolean };

function tafsirSessionNumber(session: MaktubatSession, index: number) {
  const idNumber = Number(session.id);
  return Number.isFinite(idNumber) && idNumber > 0 ? idNumber : index + 1;
}

function tafsirSessionTitle(number: number) {
  return formatSessionTitle(number);
}

export const BenefitTafsir = () => {
  const SHEET_ID = "tafsir";
  const [open, setOpen] = useState(false);
  const [sectionValue, setSectionValue] = useState<string | undefined>();
  const [sessionValue, setSessionValue] = useState<string | undefined>();
  const [tartibiTopicValue, setTartibiTopicValue] = useState<string | undefined>();
  const [thematicTopicValue, setThematicTopicValue] = useState<string | undefined>();
  const { catalog, loading, error, load } = useAudioCatalog();
  const { current, isPlaying, play, notifyLessonSoon } = useAudioPlayer();
  const { target, clear } = useSheetNav();

  const flashHighlight = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.classList.add("nav-highlight");
    window.setTimeout(() => element.classList.remove("nav-highlight"), 1700);
  };

  useEffect(() => {
    if (open) load(true);
  }, [load, open]);

  const tafsir = catalog?.tafsir;
  const tafsirSessions = useMemo<TafsirSessionItem[]>(() => {
    const sessions = [...(tafsir?.sessions || [])].sort(
      (a, b) =>
        tafsirSessionNumber(a, 0) - tafsirSessionNumber(b, 0)
    );

    if (!sessions.length) return [];

    const lastSessionNumber = sessions.reduce(
      (max, session, index) =>
        Math.max(max, tafsirSessionNumber(session, index)),
      0
    );
    const nextSessionNumber = lastSessionNumber + 1;

    return [
      ...sessions,
      {
        id: String(nextSessionNumber),
        title: tafsirSessionTitle(nextSessionNumber),
        isPlaceholder: true,
      },
    ];
  }, [tafsir?.sessions]);

  const thematicTafsirSessions = useMemo<TafsirSessionItem[]>(() => {
    const rawSessions =
      (
        catalog as
          | {
              tafsirmozooei?: {
                maad?: {
                  sessions?: MaktubatSession[];
                };
              };
            }
          | undefined
      )?.tafsirmozooei?.maad?.sessions || [];
    const sessions = [...rawSessions].sort(
      (a, b) =>
        tafsirSessionNumber(a, 0) - tafsirSessionNumber(b, 0)
    );
    const lastSessionNumber = sessions.reduce(
      (max, session, index) =>
        Math.max(max, tafsirSessionNumber(session, index)),
      0
    );
    const nextSessionNumber = lastSessionNumber + 1;

    return [
      ...sessions,
      {
        id: String(nextSessionNumber),
        title: tafsirSessionTitle(nextSessionNumber),
        isPlaceholder: true,
      },
    ];
  }, [catalog]);

  useEffect(() => {
    if (!target || target.sheetId !== SHEET_ID) return;

    setOpen(true);
    setSectionValue(target.accordionValue || "tafsir-tartibi");
    if (target.itemDomId) setSessionValue(target.itemDomId);
    if (
      (target.accordionValue || "tafsir-tartibi") === "tafsir-tartibi" &&
      target.itemDomId?.startsWith("tafsir-session-")
    ) {
      setTartibiTopicValue("tafsir-tartibi-hamd");
    }
    if (
      target.accordionValue === "tafsir-mozooei" &&
      target.itemDomId?.startsWith("tafsir-mozooei-session-")
    ) {
      setThematicTopicValue("tafsir-mozooei-ahsan");
    }

    const timer = setTimeout(() => {
      if (target.itemDomId) {
        document.getElementById(target.itemDomId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        flashHighlight(target.itemDomId);
      }
      clear();
    }, 650);

    return () => clearTimeout(timer);
  }, [target, clear]);

  return (
    <>
      <HoverLift className="h-full">
        <Card
          onClick={() => setOpen(true)}
          className="service-tile group flex h-full min-h-[168px] cursor-pointer flex-col justify-between"
        >
          <div className="service-tile-header">
            <span className="service-tile-kicker">تفسیر</span>
            <span className="service-tile-mark" aria-hidden="true">
              <BookOpen className="size-5" />
            </span>
          </div>
          <div className="service-tile-copy">
            <h3>قرآن کریم</h3>
            <p>مجموعه ی تفسیر قرآن کریم به زبان ساده</p>
          </div>
        </Card>
      </HoverLift>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="h-dvh overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{toPersianDigits(tafsir?.title || "تفسیر قرآن")}</SheetTitle>
            <SheetDescription className="mb-4">
              {toPersianDigits(tafsir?.description || "")}
            </SheetDescription>
          </SheetHeader>

          <Accordion
            type="single"
            collapsible
            value={sectionValue}
            onValueChange={setSectionValue}
            className="mt-4 w-full"
            dir="rtl"
          >
            <AccordionItem value="tafsir-tartibi">
              <AccordionTrigger className="text-right">
                تفسیر ترتیبی
              </AccordionTrigger>
              <AccordionContent>
                {loading && !tafsirSessions.length ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-20 animate-pulse rounded-xl border border-secondary/40 bg-card/50"
                      />
                    ))}
                  </div>
                ) : error && !tafsirSessions.length ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {error}
                  </p>
                ) : tafsirSessions.length ? (
                  <Accordion
                    type="single"
                    collapsible
                    value={tartibiTopicValue}
                    onValueChange={setTartibiTopicValue}
                    className="w-full"
                    dir="rtl"
                  >
                    <AccordionItem value="tafsir-tartibi-hamd">
                      <AccordionTrigger className="text-right font-bold text-primary">
                        سوره حمد
                      </AccordionTrigger>
                      <AccordionContent>
                        <Accordion
                          type="single"
                          collapsible
                          value={sessionValue}
                          onValueChange={setSessionValue}
                          className="w-full"
                          dir="rtl"
                        >
                          {[...tafsirSessions].reverse().map((session, index) => {
                            const itemId = `tafsir-session-${session.id || index}`;
                            const audioUrl = session.audioUrl || session.url || "";
                            const streamUrl = toStreamableUrl(audioUrl);
                            const lessonSegment = resolveLessonSegment(session);
                            const isCurrentTrack = current?.url === streamUrl;
                            const isLessonActive =
                              isCurrentTrack && current?.segmentMode === "lesson";
                            const isFullActive =
                              isCurrentTrack && current?.segmentMode !== "lesson";
                            const sessionNumber = tafsirSessionNumber(session, index);
                            const sessionTitle =
                              normalizeSessionTitle(session.title, sessionNumber) ||
                              tafsirSessionTitle(sessionNumber);
                            const pdfs = [
                              ...(session.pdfs || []),
                              ...(session.files || []),
                              ...(session.pdfUrl
                                ? [
                                    {
                                      title: "قسمت ۱",
                                      url: session.pdfUrl,
                                    },
                                  ]
                                : []),
                            ].filter((pdf) => pdf.url || pdf.pdfUrl);

                            return (
                              <AccordionItem
                                key={session.id || `${session.title}-${index}`}
                                id={itemId}
                                value={itemId}
                              >
                                <AccordionTrigger className="text-right">
                                  {sessionTitle}
                                </AccordionTrigger>
                                <AccordionContent>
                                  {session.isPlaceholder ? (
                                    <p className="py-4 text-center text-lg font-semibold text-muted-foreground">
                                      به زودی
                                    </p>
                                  ) : (
                                  <div className="space-y-5 text-center">
                                    {session.subtitle ? (
                                      <p className="whitespace-pre-line text-sm font-semibold leading-8 text-primary">
                                        {Array.isArray(session.subtitle)
                                          ? toPersianDigits(session.subtitle.join("\n"))
                                          : toPersianDigits(session.subtitle)}
                                      </p>
                                    ) : null}

                                    {audioUrl ? (
                                      <div className="lesson-audio-card">
                                        <p className="lesson-audio-title">
                                          <span>صوت</span>
                                          <Headphones aria-hidden="true" />
                                        </p>

                                        <div className="lesson-segment-switch">
                                          <button
                                            type="button"
                                            className={`lesson-segment-chip ${
                                              lessonSegment &&
                                              isLessonActive &&
                                              isPlaying
                                                ? "is-active"
                                                : ""
                                            }`}
                                            onClick={() => {
                                              if (!lessonSegment) {
                                                notifyLessonSoon();
                                                return;
                                              }

                                              play({
                                                title: sessionTitle,
                                                url: streamUrl,
                                                description: "پخش بخش درس",
                                                lessonStart: lessonSegment.start,
                                                lessonEnd: lessonSegment.end,
                                                segmentMode: "lesson",
                                                navTarget: {
                                                  sheetId: "tafsir",
                                                  accordionValue: "tafsir-tartibi",
                                                  itemDomId: itemId,
                                                },
                                              });
                                            }}
                                          >
                                            درس
                                          </button>

                                          <button
                                            type="button"
                                            className={`lesson-segment-chip ${
                                              isFullActive && isPlaying
                                                ? "is-active"
                                                : ""
                                            }`}
                                            onClick={() =>
                                              play({
                                                title: sessionTitle,
                                                url: streamUrl,
                                                description: "تفسیر ترتیبی",
                                                lessonStart:
                                                  lessonSegment?.start ?? null,
                                                lessonEnd:
                                                  lessonSegment?.end ?? null,
                                                segmentMode: "full",
                                                navTarget: {
                                                  sheetId: "tafsir",
                                                  accordionValue: "tafsir-tartibi",
                                                  itemDomId: itemId,
                                                },
                                              })
                                            }
                                          >
                                            کامل
                                          </button>
                                        </div>

                                        <div className="lesson-action-row">
                                          <a
                                            className="lesson-download-action"
                                            href={toDownloadUrl(audioUrl)}
                                            download={`${
                                              session.title || "tafsir-audio"
                                            }.mp3`}
                                          >
                                            <span>دانلود صوت</span>
                                            <Download aria-hidden="true" />
                                          </a>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              play({
                                                title: sessionTitle,
                                                url: streamUrl,
                                                description: "تفسیر ترتیبی",
                                                lessonStart:
                                                  lessonSegment?.start ?? null,
                                                lessonEnd:
                                                  lessonSegment?.end ?? null,
                                                segmentMode: "full",
                                                navTarget: {
                                                  sheetId: "tafsir",
                                                  accordionValue: "tafsir-tartibi",
                                                  itemDomId: itemId,
                                                },
                                              })
                                            }
                                            className="lesson-primary-action"
                                          >
                                            <span>پخش</span>
                                            <Play aria-hidden="true" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}

                                    {pdfs.length ? (
                                      <div className="space-y-3">
                                        <p className="text-center text-sm font-semibold text-primary">
                                          خلاصه متن محتوا
                                        </p>

                                        {pdfs.map((pdf, pdfIndex) => {
                                          const pdfUrl = pdf.url || pdf.pdfUrl || "";

                                          return (
                                            <div
                                              key={`${pdf.title || "pdf"}-${pdfIndex}`}
                                              className="rounded-xl p-4 shadow-md"
                                            >
                                              <p className="mb-3 text-center text-sm font-semibold text-primary">
                                                {toPersianDigits(
                                                  pdf.title || `قسمت ${pdfIndex + 1}`
                                                )}
                                              </p>

                                              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() =>
                                                    window.open(
                                                      toPdfViewUrl(pdfUrl),
                                                      "_blank"
                                                    )
                                                  }
                                                >
                                                  مشاهده
                                                </Button>

                                                <a
                                                  href={toDownloadUrl(pdfUrl)}
                                                  download={`${
                                                    pdf.title ||
                                                    `tafsir-part-${pdfIndex + 1}`
                                                  }.pdf`}
                                                >
                                                  <Button
                                                    size="sm"
                                                    className="text-background"
                                                  >
                                                    دانلود
                                                  </Button>
                                                </a>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : null}
                                  </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <p className="py-4 text-center text-lg font-semibold text-muted-foreground">
                    به زودی
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tafsir-mozooei">
              <AccordionTrigger className="text-right">
                تفسیر موضوعی
              </AccordionTrigger>
                <AccordionContent>
                  <Accordion
                    type="single"
                    collapsible
                    value={thematicTopicValue}
                    onValueChange={setThematicTopicValue}
                    className="w-full"
                    dir="rtl"
                  >
                    <AccordionItem value="tafsir-mozooei-ahsan">
                      <AccordionTrigger className="text-right">
                        <span className="flex w-full flex-col items-start gap-1 text-right leading-7">
                          <span className="font-bold text-primary">احسن الحدیث</span>
                          <span className="text-sm font-normal text-muted-foreground">
                            سوره واقعه ـ مباحث معاد
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Accordion
                          type="single"
                          collapsible
                          value={sessionValue}
                          onValueChange={setSessionValue}
                          className="w-full"
                          dir="rtl"
                        >
                          {thematicTafsirSessions.map((session, index) => {
                            const itemId = `tafsir-mozooei-session-${session.id || index}`;
                            const audioUrl = session.audioUrl || session.url || "";
                            const streamUrl = toStreamableUrl(audioUrl);
                            const lessonSegment = resolveLessonSegment(session);
                            const isCurrentTrack = current?.url === streamUrl;
                            const isLessonActive =
                              isCurrentTrack && current?.segmentMode === "lesson";
                            const isFullActive =
                              isCurrentTrack && current?.segmentMode !== "lesson";
                            const sessionNumber = tafsirSessionNumber(session, index);
                            const sessionTitle =
                              normalizeSessionTitle(session.title, sessionNumber) ||
                              tafsirSessionTitle(sessionNumber);
                            const pdfs = [
                              ...(session.pdfs || []),
                              ...(session.files || []),
                              ...(session.pdfUrl
                                ? [
                                    {
                                      title: "قسمت ۱",
                                      url: session.pdfUrl,
                                    },
                                  ]
                                : []),
                            ].filter((pdf) => pdf.url || pdf.pdfUrl);

                            return (
                              <AccordionItem
                                key={session.id || `${session.title}-${index}`}
                                id={itemId}
                                value={itemId}
                              >
                                <AccordionTrigger className="text-right">
                                  {sessionTitle}
                                </AccordionTrigger>
                                <AccordionContent>
                                  {session.isPlaceholder ? (
                                    <p className="py-4 text-center text-lg font-semibold text-muted-foreground">
                                      به زودی
                                    </p>
                                  ) : (
                                    <div className="space-y-5 text-center">
                                      {session.subtitle ? (
                                        <p className="whitespace-pre-line text-sm font-semibold leading-8 text-primary">
                                          {Array.isArray(session.subtitle)
                                            ? toPersianDigits(session.subtitle.join("\n"))
                                            : toPersianDigits(session.subtitle)}
                                        </p>
                                      ) : null}

                                      {audioUrl ? (
                                        <div className="lesson-audio-card">
                                          <p className="lesson-audio-title">
                                            <span>صوت</span>
                                            <Headphones aria-hidden="true" />
                                          </p>

                                          <div className="lesson-segment-switch">
                                            <button
                                              type="button"
                                              className={`lesson-segment-chip ${
                                                lessonSegment &&
                                                isLessonActive &&
                                                isPlaying
                                                  ? "is-active"
                                                  : ""
                                              }`}
                                              onClick={() => {
                                                if (!lessonSegment) {
                                                  notifyLessonSoon();
                                                  return;
                                                }

                                                play({
                                                  title:
                                                    `سوره واقعه ـ مباحث معاد ـ ${sessionTitle}`,
                                                  url: streamUrl,
                                                  description: "پخش بخش درس",
                                                  lessonStart: lessonSegment.start,
                                                  lessonEnd: lessonSegment.end,
                                                  segmentMode: "lesson",
                                                  navTarget: {
                                                    sheetId: "tafsir",
                                                    accordionValue: "tafsir-mozooei",
                                                    itemDomId: itemId,
                                                  },
                                                });
                                              }}
                                            >
                                              درس
                                            </button>

                                            <button
                                              type="button"
                                              className={`lesson-segment-chip ${
                                                isFullActive && isPlaying
                                                  ? "is-active"
                                                  : ""
                                              }`}
                                              onClick={() =>
                                                play({
                                                  title:
                                                    `سوره واقعه ـ مباحث معاد ـ ${sessionTitle}`,
                                                  url: streamUrl,
                                                  description: "احسن الحدیث",
                                                  lessonStart:
                                                    lessonSegment?.start ?? null,
                                                  lessonEnd:
                                                    lessonSegment?.end ?? null,
                                                  segmentMode: "full",
                                                  navTarget: {
                                                    sheetId: "tafsir",
                                                    accordionValue: "tafsir-mozooei",
                                                    itemDomId: itemId,
                                                  },
                                                })
                                              }
                                            >
                                              کامل
                                            </button>
                                          </div>

                                          <div className="lesson-action-row">
                                            <a
                                              className="lesson-download-action"
                                              href={toDownloadUrl(audioUrl)}
                                              download={`${
                                                session.title || "tafsir-topic-audio"
                                              }.mp3`}
                                            >
                                              <span>دانلود صوت</span>
                                              <Download aria-hidden="true" />
                                            </a>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                play({
                                                  title:
                                                    `سوره واقعه ـ مباحث معاد ـ ${sessionTitle}`,
                                                  url: streamUrl,
                                                  description: "احسن الحدیث",
                                                  lessonStart: lessonSegment?.start ?? null,
                                                  lessonEnd: lessonSegment?.end ?? null,
                                                  segmentMode: "full",
                                                  navTarget: {
                                                    sheetId: "tafsir",
                                                    accordionValue: "tafsir-mozooei",
                                                    itemDomId: itemId,
                                                  },
                                                })
                                              }
                                              className="lesson-primary-action"
                                            >
                                              <span>پخش</span>
                                              <Play aria-hidden="true" />
                                            </button>
                                          </div>
                                        </div>
                                      ) : null}

                                      {pdfs.length ? (
                                        <div className="space-y-3">
                                          <p className="text-center text-sm font-semibold text-primary">
                                            خلاصه متن محتوا
                                          </p>

                                          {pdfs.map((pdf, pdfIndex) => {
                                            const pdfUrl =
                                              pdf.url || pdf.pdfUrl || "";

                                            return (
                                              <div
                                                key={`${pdf.title || "pdf"}-${pdfIndex}`}
                                                className="rounded-xl p-4 shadow-md"
                                              >
                                                <p className="mb-3 text-center text-sm font-semibold text-primary">
                                                  {toPersianDigits(
                                                    pdf.title || `قسمت ${pdfIndex + 1}`
                                                  )}
                                                </p>

                                                <div className="flex flex-col justify-center gap-2 sm:flex-row">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                      window.open(
                                                        toPdfViewUrl(pdfUrl),
                                                        "_blank"
                                                      )
                                                    }
                                                  >
                                                    مشاهده
                                                  </Button>

                                                  <a
                                                    href={toDownloadUrl(pdfUrl)}
                                                    download={`${
                                                      pdf.title ||
                                                      `tafsir-topic-part-${pdfIndex + 1}`
                                                    }.pdf`}
                                                  >
                                                    <Button
                                                      size="sm"
                                                      className="text-background"
                                                    >
                                                      دانلود
                                                    </Button>
                                                  </a>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
          </Accordion>
        </SheetContent>
      </Sheet>
    </>
  );
};

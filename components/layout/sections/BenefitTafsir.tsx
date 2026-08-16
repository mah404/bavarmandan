"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
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
  type MaktubatSession,
  toDownloadUrl,
  toPdfViewUrl,
  toStreamableUrl,
} from "@/lib/media-api";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import { useSheetNav } from "./SheetNavProvider";
import { HoverLift } from "./reveal";

type TafsirSessionItem = MaktubatSession & { isPlaceholder?: boolean };

const sessionNameByNumber: Record<number, string> = {
  1: "جلسه اول",
  2: "جلسه دوم",
  3: "جلسه سوم",
  4: "جلسه چهارم",
  5: "جلسه پنجم",
  6: "جلسه ششم",
  7: "جلسه هفتم",
  8: "جلسه هشتم",
  9: "جلسه نهم",
  10: "جلسه دهم",
};

function tafsirSessionNumber(session: MaktubatSession, index: number) {
  const idNumber = Number(session.id);
  return Number.isFinite(idNumber) && idNumber > 0 ? idNumber : index + 1;
}

function tafsirSessionTitle(number: number) {
  return sessionNameByNumber[number] || `جلسه ${number}`;
}

export const BenefitTafsir = () => {
  const SHEET_ID = "tafsir";
  const [open, setOpen] = useState(false);
  const [sectionValue, setSectionValue] = useState<string | undefined>();
  const [sessionValue, setSessionValue] = useState<string | undefined>();
  const { catalog, loading, error, load } = useAudioCatalog();
  const { play } = useAudioPlayer();
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

  useEffect(() => {
    if (!target || target.sheetId !== SHEET_ID) return;

    setOpen(true);
    setSectionValue(target.accordionValue || "tafsir-tartibi");
    if (target.itemDomId) setSessionValue(target.itemDomId);

    const timer = setTimeout(() => {
      if (target.itemDomId) {
        document.getElementById(target.itemDomId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        flashHighlight(target.itemDomId);
      }
      clear();
    }, 350);

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
            <SheetTitle>{tafsir?.title || "تفسیر قرآن"}</SheetTitle>
            <SheetDescription className="mb-4">
              {tafsir?.description || ""}
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
                    value={sessionValue}
                    onValueChange={setSessionValue}
                    className="w-full"
                  >
                    {tafsirSessions.map((session, index) => {
                      const audioUrl = session.audioUrl || session.url || "";
                      const pdfs = [
                        ...(session.pdfs || []),
                        ...(session.files || []),
                        ...(session.pdfUrl
                          ? [
                              {
                                title: "قسمت 1",
                                url: session.pdfUrl,
                              },
                            ]
                          : []),
                      ].filter((pdf) => pdf.url || pdf.pdfUrl);

                      return (
                        <AccordionItem
                          key={session.id || `${session.title}-${index}`}
                          id={`tafsir-session-${session.id || index}`}
                          value={`tafsir-session-${session.id || index}`}
                        >
                          <AccordionTrigger className="text-right">
                            {session.title || `جلسه ${index + 1}`}
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
                                    ? session.subtitle.join("\n")
                                    : session.subtitle}
                                </p>
                              ) : null}

                              {audioUrl ? (
                                <div className="rounded-xl p-4 shadow-md">
                                  <p className="mb-3 text-center text-sm font-semibold text-primary">
                                    🎧 پخش صوت
                                  </p>

                                  <div className="flex flex-col justify-center gap-2 sm:flex-row">
                                    <Button
                                      onClick={() =>
                                        play({
                                          title:
                                            session.title ||
                                            `جلسه ${index + 1}`,
                                          url: toStreamableUrl(audioUrl),
                                          description: "تفسیر ترتیبی",
                                        })
                                      }
                                      className="w-full text-card sm:w-auto"
                                    >
                                      پخش
                                    </Button>

                                    <a
                                      href={toDownloadUrl(audioUrl)}
                                      download={`${
                                        session.title || "tafsir-audio"
                                      }.mp3`}
                                    >
                                      <Button
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                      >
                                        دانلود صوت
                                      </Button>
                                    </a>
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
                                          {pdf.title || `قسمت ${pdfIndex + 1}`}
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
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="tafsir-mozooei-session-1">
                      <AccordionTrigger className="text-right">
                        جلسه ۱
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="py-4 text-center text-lg font-semibold text-muted-foreground">
                          به زودی
                        </p>
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

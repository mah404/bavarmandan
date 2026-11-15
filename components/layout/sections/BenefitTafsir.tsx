"use client";

import { OrnateFrame, OrnateMedal, OrnateShine } from "@/components/layout/sections/OrnateCard";

import { SlideHeader, SoundWave, playingAttr, revealItem } from "@/components/layout/sections/SessionSlide";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, Headphones, Play } from "lucide-react";
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
} from "@/components/ui/sheet";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import {
  formatSessionTitle,
  normalizeSessionTitle,
  sessionNumberFromText,
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

/** The number of a session: the one written in its title («جلسه نوزدهم»), else a numeric id, else its place in the list. */
function tafsirSessionNumber(session: MaktubatSession, index: number) {
  const fromTitle = sessionNumberFromText(session.title || "");
  if (fromTitle && fromTitle > 0) return fromTitle;
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
  const [surahValue, setSurahValue] = useState<string | undefined>();
  const { catalog, loading, error, load } = useAudioCatalog();
  const { current, isPlaying, play, notifyLessonSoon } = useAudioPlayer();
  const { target, clear } = useSheetNav();

  useEffect(() => {
    if (open) load(true);
  }, [load, open]);

  const tafsir = catalog?.tafsir;
  const tafsirSessions = useMemo<TafsirSessionItem[]>(() => {
    const sessions = [...(tafsir?.sessions || [])].sort(
      (a, b) =>
        tafsirSessionNumber(a, 0) - tafsirSessionNumber(b, 0)
    );

    // the sessions of this surah are all there is, so there is no «به زودی» row after them
    return sessions as TafsirSessionItem[];
  }, [tafsir?.sessions]);
  const lastTartibiNumber = tafsirSessions.reduce(
    (max, session, index) => (session.isPlaceholder ? max : Math.max(max, tafsirSessionNumber(session, index))),
    0
  );

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
    // the sessions of this surah are all there is, so there is no «به زودی» row after them
    return sessions as TafsirSessionItem[];
  }, [catalog]);
  const lastThematicNumber = thematicTafsirSessions.reduce(
    (max, session, index) => (session.isPlaceholder ? max : Math.max(max, tafsirSessionNumber(session, index))),
    0
  );

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
      setSurahValue("tafsir-mozooei-waqia");
    }

    if (target.itemDomId) void revealItem(target.itemDomId);
    const timer = setTimeout(() => clear(), 650);

    return () => clearTimeout(timer);
  }, [target, clear]);

  return (
    <>
      <HoverLift className="h-full">
        <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
          onClick={() => setOpen(true)}
          className="ic-card group h-full cursor-pointer ic-wide"
        >
          <OrnateFrame />
          <OrnateMedal>
            <BookOpen className="ic-ico" strokeWidth={1.7} />
          </OrnateMedal>
          <span className="ic-body">
            <span className="ic-tag">تفسیر</span>
            <h3 className="ic-title">قرآن کریم</h3>
            <span className="ic-desc">مجموعه ی تفسیر قرآن کریم به زبان ساده</span>
          </span>
          <OrnateShine />
        </div>
      </HoverLift>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent overlayClassName="sd-backdrop"
          className="sd-sheet h-dvh overflow-y-auto">
          <SlideHeader title="قرآن کریم" subtitle="تفسیر" />

          <Accordion
            type="single"
            collapsible
            value={sectionValue}
            onValueChange={setSectionValue}
            className="sd-stack"
            dir="rtl"
          >
            <AccordionItem value="tafsir-tartibi" className="sd-group">
              <AccordionTrigger className="sd-toggle">
                تفسیر ترتیبی
              </AccordionTrigger>
              <AccordionContent className="sd-group-body">
                {loading && !tafsirSessions.length ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-20 skeleton-shimmer rounded-xl border border-secondary/40 bg-card/50"
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
                    className="sd-stack"
                    dir="rtl"
                  >
                    <AccordionItem value="tafsir-tartibi-hamd" className="sd-group">
                      <AccordionTrigger className="sd-toggle">
                        سوره حمد
                      </AccordionTrigger>
                      <AccordionContent className="sd-group-body">
                        <Accordion
                          type="single"
                          collapsible
                          value={sessionValue}
                          onValueChange={setSessionValue}
                          className="sd-list"
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
                                className="sd-item"
                                data-playing={playingAttr(current, isPlaying, itemId)}
                              >
                                <span className="sd-node" aria-hidden="true">
                                  {toPersianDigits(sessionNumber)}
                                </span>
                                <div className="sd-card">
                                <AccordionTrigger className="sd-toggle">
                                  <span className="sd-name block flex-1 text-right">
                                    {sessionTitle}
                                    {!session.isPlaceholder && sessionNumber === lastTartibiNumber ? (
                                      <span className="sd-last">(جلسه آخر)</span>
                                    ) : null}
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="sd-body">
                                  {session.isPlaceholder ? (
                                    <p className="py-4 text-center text-lg font-semibold text-muted-foreground">
                                      به زودی
                                    </p>
                                  ) : (
                                  <div className="space-y-5 text-center">
                                    {session.subtitle ? (
                                      <p className="sd-intro">
                                        {Array.isArray(session.subtitle)
                                          ? toPersianDigits(session.subtitle.join("\n"))
                                          : toPersianDigits(session.subtitle)}
                                      </p>
                                    ) : null}

                                    {audioUrl ? (
                                      <div className="lesson-audio-card">
                                        <p className="lesson-audio-title">
                                          <span>صوت</span>
                                          <Headphones className="sd-headphone" aria-hidden="true" />
<SoundWave />
                                        </p>


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
                                      <div className="space-y-3 sd-written">
                                        <p className="sd-written-title">
                                          خلاصه متن محتوا
                                        </p>

                                        {pdfs.map((pdf, pdfIndex) => {
                                          const pdfUrl = pdf.url || pdf.pdfUrl || "";

                                          return (
                                            <div
                                              key={`${pdf.title || "pdf"}-${pdfIndex}`}
                                              className="sd-written-card"
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
                                </div>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>

                    {/* سوره اسراء: the sessions are not recorded yet */}
                    <AccordionItem value="tafsir-tartibi-isra" className="sd-group">
                      <AccordionTrigger className="sd-toggle">سوره اسراء</AccordionTrigger>
                      <AccordionContent className="sd-group-body">
                        <Accordion type="single" collapsible className="sd-list" dir="rtl">
                          <AccordionItem value="tafsir-isra-session-1" id="tafsir-isra-session-1" className="sd-item">
                            <span className="sd-node" aria-hidden="true">
                              {toPersianDigits(1)}
                            </span>
                            <div className="sd-card">
                              <AccordionTrigger className="sd-toggle">
                                <span className="sd-name block flex-1 text-right">جلسه اول</span>
                              </AccordionTrigger>
                              <AccordionContent className="sd-body">
                                <p className="py-2 text-center text-lg font-semibold text-muted-foreground">به زودی</p>
                              </AccordionContent>
                            </div>
                          </AccordionItem>
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

            <AccordionItem value="tafsir-mozooei" className="sd-group">
              <AccordionTrigger className="sd-toggle">
                تفسیر موضوعی
              </AccordionTrigger>
                <AccordionContent className="sd-group-body">
                  <Accordion
                    type="single"
                    collapsible
                    value={thematicTopicValue}
                    onValueChange={setThematicTopicValue}
                    className="sd-stack"
                    dir="rtl"
                  >
                    <AccordionItem value="tafsir-mozooei-ahsan" className="sd-group">
                      <AccordionTrigger className="sd-toggle">
                        احسن الحدیث
                      </AccordionTrigger>
                      <AccordionContent className="sd-group-body">
                        <Accordion
                          type="single"
                          collapsible
                          value={surahValue}
                          onValueChange={setSurahValue}
                          className="sd-stack"
                          dir="rtl"
                        >
                          <AccordionItem value="tafsir-mozooei-waqia" className="sd-group">
                            <AccordionTrigger className="sd-toggle">
                              سوره واقعه ـ مباحث معاد
                            </AccordionTrigger>
                            <AccordionContent className="sd-group-body">
                              <Accordion
                          type="single"
                          collapsible
                          value={sessionValue}
                          onValueChange={setSessionValue}
                          className="sd-list"
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
                                className="sd-item"
                                data-playing={playingAttr(current, isPlaying, itemId)}
                              >
                                <span className="sd-node" aria-hidden="true">
                                  {toPersianDigits(sessionNumber)}
                                </span>
                                <div className="sd-card">
                                <AccordionTrigger className="sd-toggle">
                                  <span className="sd-name block flex-1 text-right">
                                    {sessionTitle}
                                    {!session.isPlaceholder && sessionNumber === lastThematicNumber ? (
                                      <span className="sd-last">(جلسه آخر)</span>
                                    ) : null}
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="sd-body">
                                  {session.isPlaceholder ? (
                                    <p className="py-4 text-center text-lg font-semibold text-muted-foreground">
                                      به زودی
                                    </p>
                                  ) : (
                                    <div className="space-y-5 text-center">
                                      {session.subtitle ? (
                                        <p className="sd-intro">
                                          {Array.isArray(session.subtitle)
                                            ? toPersianDigits(session.subtitle.join("\n"))
                                            : toPersianDigits(session.subtitle)}
                                        </p>
                                      ) : null}

                                      {audioUrl ? (
                                        <div className="lesson-audio-card">
                                          <p className="lesson-audio-title">
                                            <span>صوت</span>
                                            <Headphones className="sd-headphone" aria-hidden="true" />
<SoundWave />
                                          </p>


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
                                        <div className="space-y-3 sd-written">
                                          <p className="sd-written-title">
                                            خلاصه متن محتوا
                                          </p>

                                          {pdfs.map((pdf, pdfIndex) => {
                                            const pdfUrl =
                                              pdf.url || pdf.pdfUrl || "";

                                            return (
                                              <div
                                                key={`${pdf.title || "pdf"}-${pdfIndex}`}
                                                className="sd-written-card"
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
                                </div>
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
                </AccordionContent>
              </AccordionItem>
          </Accordion>
        </SheetContent>
      </Sheet>
    </>
  );
};

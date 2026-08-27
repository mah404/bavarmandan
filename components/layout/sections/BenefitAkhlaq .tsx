"use client";

import { useEffect, useState } from "react";
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
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { Button } from "@/components/ui/button";
import { ChevronDown, Landmark } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  catalogFiles,
  normalizeBeliefTopic,
  toDownloadUrl,
  toPdfViewUrl,
  toStreamableUrl,
} from "@/lib/media-api";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";
import { HoverLift, MotionItem, MotionList } from "./reveal";

const persianSessionWords = [
  "اول",
  "دوم",
  "سوم",
  "چهارم",
  "پنجم",
  "ششم",
  "هفتم",
  "هشتم",
  "نهم",
  "دهم",
];

const getSessionTitle = (sessionNumber: number) =>
  `جلسه ${persianSessionWords[sessionNumber - 1] || sessionNumber}`;

const AghayedSkeleton = () => (
  <div className="mt-4 flex w-full flex-col gap-3" aria-label="در حال بارگذاری">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="h-20 animate-pulse rounded-2xl border border-secondary bg-card/40 dark:bg-card/30"
      >
        <div className="flex h-full items-center justify-between px-6">
          <div className="h-3 w-8 rounded-full bg-muted-foreground/20" />
          <div className="h-4 w-32 rounded-full bg-muted-foreground/20" />
        </div>
      </div>
    ))}
  </div>
);

export const BenefitAkhlaq = () => {
  const SHEET_ID = "akhlagh";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string | undefined>();
  const [openBeliefSession, setOpenBeliefSession] = useState<string | null>(
    null
  );

  const { play } = useAudioPlayer();
  const { target, clear } = useSheetNav();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const { catalog, loading: catalogLoading, error, load } = useAudioCatalog();

  const flashHighlight = (id: string) => {
    setHighlightId(id);
    // remove after animation finishes (match your CSS duration)
    window.setTimeout(() => setHighlightId(null), 1500);
  };

  const fetchDescription = async () => {
    setLoading(true);
    try {
      await load(true);
      const response = await fetch("/api/benefit?id=akhlagh");
      if (response.ok) await response.json();
    } catch {
      // Description is optional; keep the sheet usable when the endpoint is absent.
    } finally {
      setLoading(false);
    }
  };

  const aghayed = catalog?.aghayed;
  const beliefAudios = normalizeBeliefTopic(aghayed?.bavardasht);
  const beliefAudiosNewestFirst = beliefAudios
    .map((file, originalIndex) => ({ file, originalIndex }))
    .reverse();
  const nextBeliefSessionIndex = beliefAudios.length;
  const nextBeliefSessionValue = `belief-session-${nextBeliefSessionIndex}`;
  const nextBeliefSessionTitle = getSessionTitle(nextBeliefSessionIndex + 1);
  const flatAghayedTopics = [
    {
      key: "maa-al-sadeghin",
      value: "group-1",
      idPrefix: "audio-akhlagh-audioFilessadeghin",
    },
    {
      key: "konkash-dar-aghayed",
      value: "group-2",
      idPrefix: "audio-akhlagh-audioFilesnew",
    },
    {
      key: "shia-va-miras-fatemi",
      value: "group-3",
      idPrefix: "audio-akhlagh-shia-va-miras-fatemi",
    },
    {
      key: "goftogooha-ye-qorani",
      value: "group-4",
      idPrefix: "audio-akhlagh-goftogooha-ye-qorani",
    },
    {
      key: "motafarreghe",
      value: "group-5",
      idPrefix: "audio-akhlagh-motafarreghe",
    },
  ].map((topicMeta) => {
    const topic = aghayed?.[topicMeta.key];
    return {
      ...topicMeta,
      title: topic?.title || topicMeta.key,
      files: catalogFiles(topic),
    };
  });
  const isLoading = loading || catalogLoading;

  useEffect(() => {
    if (!open) return;
    load(true);
  }, [open, load]);

  useEffect(() => {
    if (!target) return;
    if (target.sheetId !== SHEET_ID) return;

    setOpen(true);
    if (target.accordionValue) setAccordionValue(target.accordionValue);

    // wait for the sheet + accordion transition to mount/expand before
    // scrolling and highlighting (requestAnimationFrame is unreliable here
    // since it gets throttled while the sheet is transitioning in).
    const scrollTimer = setTimeout(() => {
      if (target.itemDomId) {
        document.getElementById(target.itemDomId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        flashHighlight(target.itemDomId);
      }

      if (target.autoplay) {
        play(target.autoplay);
      }
    }, 500);

    const clearTimer = setTimeout(() => clear(), 800);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [target, clear, play]);

  return (
    <>
      <HoverLift className="h-full">
      <Card
        onClick={() => {
          fetchDescription();
          setOpen(true);
        }}
        className="service-tile group flex h-full min-h-[168px] cursor-pointer flex-col justify-between"
      >
        <div className="service-tile-header">
          <span className="service-tile-kicker">اعتقادات</span>
          <span className="service-tile-mark" aria-hidden="true">
            <Landmark className="size-5" />
          </span>
        </div>
        <div className="service-tile-copy">
          <h3>اصول عقاید</h3>
          <p>مجموعه گفتارهای اعتقادی</p>
        </div>
      </Card>
      </HoverLift>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="h-dvh overflow-y-auto">
          <SheetHeader>
            <SheetTitle>اصول عقاید</SheetTitle>
            <SheetDescription className="mb-4"></SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <AghayedSkeleton />
          ) : error ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {error}
            </p>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={accordionValue}
              onValueChange={setAccordionValue}
            >
              <AccordionItem value="belief">
                <AccordionTrigger className="text-right">
                  <span className="flex flex-col items-start gap-1">
                    <span>باورداشت</span>
                    <span className="text-sm font-medium leading-6 text-muted-foreground">
                      بیان ساده از عقاید شیعه
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="justify-center mt-2 text-center">
                  <div className="flex w-full flex-col gap-1">
                    {beliefAudiosNewestFirst.map(({ file, originalIndex }) => (
                      <div
                        id={`audio-akhlagh-belief-${originalIndex}`}
                        key={`${file.title}-${file.url || originalIndex}`}
                        className={[
                          "border-b border-secondary bg-card/70 dark:bg-card px-4 my-3 border rounded-xl shadow-sm backdrop-blur transition-colors hover:border-primary/40",
                          highlightId === `audio-akhlagh-belief-${originalIndex}`
                            ? "nav-highlight"
                            : "",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenBeliefSession((current) =>
                              current === `belief-session-${originalIndex}`
                                ? null
                              : `belief-session-${originalIndex}`
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 py-4 text-right text-sm font-semibold text-muted-foreground transition-all hover:text-primary"
                        >
                          <span>{file.title}</span>
                          <ChevronDown
                            className={[
                              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                              openBeliefSession === `belief-session-${originalIndex}`
                                ? "rotate-180"
                                : "",
                            ].join(" ")}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {openBeliefSession === `belief-session-${originalIndex}` ? (
                            <motion.div
                              key={`belief-session-panel-${originalIndex}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                height: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                                opacity: { duration: 0.2, ease: "easeOut" },
                              }}
                              className="overflow-hidden"
                            >
                          <div className="pb-4 pt-0">
                            {file.points.length > 0 ? (
                              <div
                                className="motion-list-item space-y-2 text-right text-sm font-semibold leading-7 text-primary"
                                dir="rtl"
                              >
                                {file.points.map((point, index) => (
                                  <p key={point}>
                                    {index + 1}- {point}
                                  </p>
                                ))}
                              </div>
                            ) : null}

                            <div className="motion-list-item mt-3 text-center">
                              <p className="mb-2 text-sm font-semibold text-primary">
                                🎧 پخش صوت
                              </p>

                              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    play({
                                      title: file.title,
                                      url: toStreamableUrl(file.url),
                                      description: file.description,
                                    })
                                  }
                                  className="w-full sm:w-auto text-card"
                                >
                                  پخش
                                </Button>

                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                >
                                  <a
                                    href={toDownloadUrl(file.url)}
                                    download={`${file.description}.mp3`}
                                    rel="noopener noreferrer"
                                  >
                                    دانلود صوت
                                  </a>
                                </Button>
                              </div>
                            </div>

                            {file.summaries.length > 0 ? (
                            <div className="mt-4 text-right" dir="rtl">
                              <p className="mb-3 text-sm font-bold text-primary">
                                خلاصه متن محتوا
                              </p>

                              <div className="flex flex-col gap-3">
                                {file.summaries.map((summary) => (
                                  <div
                                    key={summary.url}
                                    className="motion-list-item"
                                  >
                                    <p className="mb-2 text-sm font-semibold text-primary">
                                      {summary.title}
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                        onClick={() =>
                                          window.open(toPdfViewUrl(summary.url), "_blank")
                                        }
                                      >
                                        مشاهده
                                      </Button>

                                      <Button
                                        asChild
                                        size="sm"
                                        className="w-full sm:w-auto text-card"
                                      >
                                        <a
                                          href={toDownloadUrl(summary.url)}
                                          download={`${summary.title}.pdf`}
                                          rel="noopener noreferrer"
                                        >
                                          دانلود
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            ) : null}
                          </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    ))}
                    <div className="order-first border-b border-secondary bg-card/70 dark:bg-card px-4 my-3 border rounded-xl shadow-sm backdrop-blur transition-colors hover:border-primary/40">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenBeliefSession((current) =>
                            current === nextBeliefSessionValue
                              ? null
                              : nextBeliefSessionValue
                          )
                        }
                        className="flex w-full items-center justify-between gap-4 py-4 text-right text-sm font-semibold text-muted-foreground transition-all hover:text-primary"
                      >
                        <span>{nextBeliefSessionTitle}</span>
                        <ChevronDown
                          className={[
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                            openBeliefSession === nextBeliefSessionValue
                              ? "rotate-180"
                              : "",
                          ].join(" ")}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {openBeliefSession === nextBeliefSessionValue ? (
                          <motion.div
                            key={`${nextBeliefSessionValue}-panel`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              height: {
                                duration: 0.34,
                                ease: [0.22, 1, 0.36, 1],
                              },
                              opacity: { duration: 0.2, ease: "easeOut" },
                            }}
                            className="overflow-hidden"
                          >
                            <div className="pb-4 pt-1 text-center text-sm font-semibold text-muted-foreground">
                              به زودی
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {flatAghayedTopics.map((topic) => (
                <AccordionItem key={topic.key} value={topic.value}>
                  <AccordionTrigger>{topic.title}</AccordionTrigger>
                  <AccordionContent className="justify-center text-center scroll-mt-24">
                    {topic.files.length === 0 ? (
                      <div className="text-muted-foreground py-4">
                        فعلاً صوتی اضافه نشده.
                      </div>
                    ) : (
                      <MotionList className="flex flex-col gap-3">
                        {topic.files.map((file, i) => {
                          const itemId = `${topic.idPrefix}-${i}`;

                          return (
                            <MotionItem
                              id={itemId}
                              key={file.url || itemId}
                              className={[
                                "motion-list-item transition",
                                highlightId === itemId
                                  ? "nav-highlight border"
                                  : "",
                              ].join(" ")}
                            >
                              <div className="font-semibold mb-2 text-primary">
                                {file.title}
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <Button
                                  onClick={() =>
                                    play({
                                      title: file.title || "",
                                      url: file.url,
                                      description: topic.title,
                                    })
                                  }
                                  className="w-full sm:w-auto text-card"
                                >
                                  پخش
                                </Button>

                                <Button
                                  asChild
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                >
                                  <a
                                    href={toDownloadUrl(file.url)}
                                    download={`${file.title || "audio"}.mp3`}
                                    rel="noopener noreferrer"
                                  >
                                    دانلود
                                  </a>
                                </Button>
                              </div>
                            </MotionItem>
                          );
                        })}
                      </MotionList>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

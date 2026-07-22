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
import Lottie from "lottie-react";
import loadingPdfAnim from "@/public/loading.json";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { Button } from "@/components/ui/button";
import { ChevronDown, Landmark } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  beliefAudios,
  audioFilessadeghin,
  audioFilesnew,
  audioFiles,
  miscFiles,
} from "@/data/content";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";
import { HoverLift, MotionItem, MotionList } from "./reveal";

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

  const flashHighlight = (id: string) => {
    setHighlightId(id);
    // remove after animation finishes (match your CSS duration)
    window.setTimeout(() => setHighlightId(null), 1500);
  };

  const toDownloadUrl = (u: string) =>
    u ? u.replace(/([?&])raw=1/, "$1dl=1").replace(/([?&])dl=0/, "$1dl=1") : u;

  const toStreamable = (u: string) =>
    u ? u.replace(/([?&])raw=1/, "$1raw=1").replace(/([?&])dl=0/, "$1raw=1") : u;

  const toDirectDropboxUrl = (u: string) => {
    if (!u.includes("dropbox.com")) return u;
    const direct = u
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace(/([?&])(dl|raw)=[01]/g, "")
      .replace(/[?&]$/, "");

    return direct + (direct.includes("?") ? "&raw=1" : "?raw=1");
  };

  const fetchDescription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/benefit?id=akhlagh");
      if (response.ok) await response.json();
    } catch {
      // Description is optional; keep the sheet usable when the endpoint is absent.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!target) return;
    if (target.sheetId !== SHEET_ID) return;

    setOpen(true);
    if (target.accordionValue) setAccordionValue(target.accordionValue);

    // wait for sheet + accordion content, then scroll and autoplay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
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
      });
    });

    const t = setTimeout(() => clear(), 800);
    return () => clearTimeout(t);
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

          {loading ? (
            <Lottie
              animationData={loadingPdfAnim}
              loop
              className="text-muted-foreground bg-transparent mt-4"
            />
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
                    {beliefAudios.map((file, i) => (
                      <div
                        id={`audio-akhlagh-belief-${i}`}
                        key={file.url}
                        className={[
                          "border-b border-secondary bg-card/70 dark:bg-card px-4 my-3 border rounded-xl shadow-sm backdrop-blur transition-colors hover:border-primary/40",
                          highlightId === `audio-akhlagh-belief-${i}`
                            ? "nav-highlight"
                            : "",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenBeliefSession((current) =>
                              current === `belief-session-${i}`
                                ? null
                              : `belief-session-${i}`
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 py-4 text-right text-sm font-semibold text-muted-foreground transition-all hover:text-primary"
                        >
                          <span>{file.title}</span>
                          <ChevronDown
                            className={[
                              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                              openBeliefSession === `belief-session-${i}`
                                ? "rotate-180"
                                : "",
                            ].join(" ")}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {openBeliefSession === `belief-session-${i}` ? (
                            <motion.div
                              key={`belief-session-panel-${i}`}
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
                                      url: toStreamable(file.url),
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
                                          window.open(
                                            `/api/pdf-view?url=${encodeURIComponent(
                                              toDirectDropboxUrl(summary.url)
                                            )}`,
                                            "_blank"
                                          )
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
                    <div className="border-b border-secondary bg-card/70 dark:bg-card px-4 my-3 border rounded-xl shadow-sm backdrop-blur transition-colors hover:border-primary/40">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenBeliefSession((current) =>
                            current === "belief-session-2"
                              ? null
                              : "belief-session-2"
                          )
                        }
                        className="flex w-full items-center justify-between gap-4 py-4 text-right text-sm font-semibold text-muted-foreground transition-all hover:text-primary"
                      >
                        <span>جلسه سوم</span>
                        <ChevronDown
                          className={[
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                            openBeliefSession === "belief-session-2"
                              ? "rotate-180"
                              : "",
                          ].join(" ")}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {openBeliefSession === "belief-session-2" ? (
                          <motion.div
                            key="belief-session-panel-2"
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

              <AccordionItem value="group-1">
                <AccordionTrigger className=""> مع الصادقین </AccordionTrigger>
                <AccordionContent className="justify-center mt-2 text-center">
                  <MotionList className="flex flex-col gap-3">
                  {audioFilessadeghin.slice(0, 4).map((file, i) => (
                    <MotionItem
                      id={`audio-akhlagh-audioFilessadeghin-${i}`}
                      key={i}
                      className={[
                        "motion-list-item transition",
                        highlightId === `audio-akhlagh-audioFilessadeghin-${i}`
                          ? "nav-highlight border"
                          : "",
                      ].join(" ")}
                    >
                      <div className="font-semibold mb-2 text-primary">
                        {file.description}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                          onClick={() =>
                            play({
                              title: file.title,
                              url: file.url,
                              description: file.description,
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
                  ))}
                  </MotionList>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="group-2">
                <AccordionTrigger className="">
                  {" "}
                  کنکاش در عقاید{" "}
                </AccordionTrigger>
                <AccordionContent className="justify-center mt-2 text-center">
                  <MotionList className="flex flex-col gap-3">
                  {audioFilesnew.slice(0, 4).map((file, i) => (
                    <MotionItem
                      id={`audio-akhlagh-audioFilesnew-${i}`}
                      key={i}
                      className={[
                        "motion-list-item transition",
                        highlightId === `audio-akhlagh-audioFilesnew-${i}`
                          ? "nav-highlight border"
                          : "",
                      ].join(" ")}
                    >
                      <div className="font-semibold mb-2 text-primary">
                        {file.description}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        {/* Play */}
                        <Button
                          onClick={() =>
                            play({
                              title: file.title,
                              url: file.url, // assumes streamable URL
                              description: file.description,
                            })
                          }
                          className="w-full sm:w-auto text-card"
                        >
                          پخش
                        </Button>

                        {/* Download */}
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
                  ))}
                  </MotionList>
                </AccordionContent>
              </AccordionItem>

              {/* First 4 sessions */}
              <AccordionItem value="group-3">
                <AccordionTrigger className="">
                  {" "}
                  شیعه و میراث فاطمی{" "}
                </AccordionTrigger>
                <AccordionContent className="justify-center mt-2 text-center">
                  <MotionList className="flex flex-col gap-3">
                  {audioFiles.slice(0, 4).map((file, i) => (
                    <MotionItem
                      key={i}
                      className="motion-list-item"
                    >
                      <div className="font-semibold mb-2 text-primary">
                        {file.description}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        {/* Play */}
                        <Button
                          onClick={() =>
                            play({
                              title: file.title,
                              url: file.url, // assumes streamable URL
                              description: file.description,
                            })
                          }
                          className="w-full sm:w-auto text-card"
                        >
                          پخش
                        </Button>

                        {/* Download */}
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
                  ))}
                  </MotionList>
                </AccordionContent>
              </AccordionItem>

              {/* Last 2 sessions */}
              <AccordionItem value="group-4">
                <AccordionTrigger>گفتگوهای قرآنی</AccordionTrigger>
                <AccordionContent className="justify-center text-center">
                  <MotionList className="flex flex-col gap-3">
                  {audioFiles.slice(4).map((file, i) => (
                    <MotionItem
                      key={i + 4}
                      className="motion-list-item"
                    >
                      <div className="font-semibold mb-2 text-primary">
                        {file.description}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        {/* Play */}
                        <Button
                          onClick={() =>
                            play({
                              title: file.title,
                              url: file.url,
                              description: file.description,
                            })
                          }
                          className="w-full sm:w-auto text-card"
                        >
                          پخش
                        </Button>

                        {/* Download */}
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
                  ))}
                  </MotionList>
                </AccordionContent>
              </AccordionItem>
         
              <AccordionItem value="group-5">
                <AccordionTrigger>مباحث متفرقه</AccordionTrigger>
                <AccordionContent className="justify-center text-center scroll-mt-24">
                  {miscFiles.length === 0 ? (
                    <div className="text-muted-foreground py-4">
                      فعلاً صوتی اضافه نشده.
                    </div>
                  ) : (
                    <MotionList className="flex flex-col gap-3">
                    {miscFiles.map((file, idx) => (
                      <MotionItem
                        key={`misc-${idx}`}
                        className="motion-list-item"
                      >
                        <div className="font-semibold mb-2 text-primary">
                          {file.title}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          {/* Play */}
                          <Button
                            onClick={() =>
                              play({
                                title: file.title,
                                url: file.url,
                                description: file.description,
                              })
                            }
                            className="w-full sm:w-auto text-card"
                          >
                            پخش
                          </Button>

                          {/* Download */}
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
                    ))}
                    </MotionList>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

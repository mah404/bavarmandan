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
import {
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

  const fetchDescription = async () => {
    setLoading(true);
    try {
      await fetch("/api/benefit?id=akhlagh").then((r) => r.json());
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
      <HoverLift>
      <Card
        onClick={() => {
          fetchDescription();
          setOpen(true);
        }}
        className="service-tile group flex min-h-[178px] cursor-pointer flex-col justify-between"
      >
        <h3 className="pt-8 text-right text-3xl font-bold leading-[3rem] text-foreground">
          مباحث اعتقادی
        </h3>
      </Card>
      </HoverLift>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="h-dvh overflow-y-auto">
          <SheetHeader>
            <SheetTitle>مباحث اعتقادی</SheetTitle>
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

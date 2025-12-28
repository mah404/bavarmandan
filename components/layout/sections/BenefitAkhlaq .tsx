"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icon";
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
      <Card
        onClick={() => {
          fetchDescription();
          setOpen(true);
        }}
        className="cursor-pointer hover:bg-background transition"
      >
        <CardHeader>
          <div className="flex justify-between">
            <Icon name="Wallet" size={32} color="hsl(var(--primary))" />
            <span className="text-5xl text-muted-foreground/15 font-medium">
              03
            </span>
          </div>
          <CardTitle> مباحث اعتقادی</CardTitle>
        </CardHeader>
      </Card>

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
                <AccordionContent className="flex flex-col gap-2 justify-center mt-2 text-center">
                  {audioFilessadeghin.slice(0, 4).map((file, i) => (
                    <div
                      id={`audio-akhlagh-audioFilessadeghin-${i}`}
                      key={i}
                      className={[
                        "border-b border-muted-foreground/30 p-3 transition",
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
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="group-2">
                <AccordionTrigger className="">
                  {" "}
                  کنکاش در عقاید{" "}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2 justify-center mt-2 text-center">
                  {audioFilesnew.slice(0, 4).map((file, i) => (
                    <div
                      id={`audio-akhlagh-audioFilesnew-${i}`}
                      key={i}
                      className={[
                        "border-b border-muted-foreground/30 p-3  transition",
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
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* First 4 sessions */}
              <AccordionItem value="group-3">
                <AccordionTrigger className="">
                  {" "}
                  شیعه و میراث فاطمی{" "}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2 justify-center mt-2 text-center">
                  {audioFiles.slice(0, 4).map((file, i) => (
                    <div
                      key={i}
                      className="border-b border-muted-foreground/30 p-3"
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
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Last 2 sessions */}
              <AccordionItem value="group-4">
                <AccordionTrigger>گفتگوهای قرآنی</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 justify-center text-center">
                  {audioFiles.slice(4).map((file, i) => (
                    <div
                      key={i + 4}
                      className="border-b border-muted-foreground/30 p-3"
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
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="group-5">
                <AccordionTrigger>مباحث متفرقه</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 justify-center text-center  scroll-mt-24">
                  {miscFiles.length === 0 ? (
                    <div className="text-muted-foreground py-4">
                      فعلاً صوتی اضافه نشده.
                    </div>
                  ) : (
                    miscFiles.map((file, idx) => (
                      <div
                        key={`misc-${idx}`}
                        className="border-b border-muted-foreground/30 p-3"
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
                      </div>
                    ))
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

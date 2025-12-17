"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { title } from "process";
import {
  audioFilessadeghin,
  audioFilesnew,
  audioFiles,
  miscFiles,
} from "@/data/content";
import { useSheetNav } from "./SheetNavProvider";

export const BenefitAkhlaq = () => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { play } = useAudioPlayer(); // ← use the global player
  const SHEET_ID = "akhlagh"; // ✅ this sheet's id
  const [accordionValue, setAccordionValue] = useState<string | undefined>();
  const { target, clear } = useSheetNav();
  const toDownloadUrl = (u: string) =>
    u ? u.replace(/([?&])raw=1/, "$1dl=1").replace(/([?&])dl=0/, "$1dl=1") : u;

  const fetchDescription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/benefit?id=akhlagh");
      await res.json();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!target) return;
    if (target.sheetId !== SHEET_ID) return;

    // 1) open the sheet first
    setOpen(true);

    // 2) open the right accordion item
    if (target.accordionValue) {
      setAccordionValue(target.accordionValue);
    }

    // 3) after React renders sheet + accordion content, scroll to the item
    if (target.itemDomId) {
      const id = target.itemDomId;

      // do 2 ticks to be safe (sheet render + accordion content render)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById(id);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
    }

    // optional: clear nav target after it was used
    const t = setTimeout(() => clear(), 800);
    return () => clearTimeout(t);
  }, [target, clear, SHEET_ID]);

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
        <SheetContent className="overflow-y-auto">
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
              <AccordionItem value="group-0">
                <AccordionTrigger className="">مع الصادقین</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2  justify-center  mt-2 text-center">
                  {audioFilessadeghin.slice(0, 4).map((file, i) => (
                    <div
                      id={`audio-eteghadat-audioFilessadeghin-${i}`}
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
                            دانلود صوت
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="group-1">
                <AccordionTrigger className="">کنکاش در عقاید</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2  justify-center  mt-2 text-center">
                  {audioFilesnew.slice(0, 4).map((file, i) => (
                    <div
                      id={`audio-eteghadat-audioFilesnew-${i}`}
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
                            دانلود صوت
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
              {/* First 4 sessions */}

              <AccordionItem value="group-2">
                <AccordionTrigger className="">
                  شیعه و میراث فاطمی
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2  justify-center  mt-2 text-center">
                  {audioFiles.slice(0, 4).map((file, i) => (
                    <div
                      id={`audio-eteghadat-audioFiles-${i}`}
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
                            دانلود صوت
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Last 2 sessions */}
              <AccordionItem value="group-3">
                <AccordionTrigger>گفتگوهای قرآنی</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4  justify-center  text-center">
                  {audioFiles.slice(4).map((file, i) => {
                    const realIndex = i + 4; // because slice(4) starts from index 4 in original array

                    return (
                      <div
                        id={`audio-eteghadat-audioFiles-${realIndex}`}
                        key={realIndex}
                        className="border-b border-muted-foreground/30 p-3"
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
                              دانلود صوت
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="group-4">
                <AccordionTrigger>مباحث متفرقه</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 justify-center text-center">
                  {miscFiles.length === 0 ? (
                    <div className="text-muted-foreground py-4">
                      فعلاً صوتی اضافه نشده.
                    </div>
                  ) : (
                    miscFiles.map((file, idx) => (
                      <div
                        id={`audio-akhlagh-miscFiles-${idx}`}
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
                              دانلود صوت
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

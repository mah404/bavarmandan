"use client";

import { useEffect, useMemo, useState } from "react";
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
import { audioGroups } from "@/data/content";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";

export const BenefitsCard = () => {
  const SHEET_ID = "benefitsCard";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ controlled accordion
  const [accordionValues, setAccordionValues] = useState<string[]>([]);

  const { play } = useAudioPlayer();
  const { target, clear } = useSheetNav();

  const toDownloadUrl = (u: string) =>
    u ? u.replace(/([?&])raw=1/, "$1dl=1").replace(/([?&])dl=0/, "$1dl=1") : u;

  const fetchDescription = async () => {
    setLoading(true);
    try {
      await fetch("/api/benefit?id=eteghadat").then((r) => r.json());
    } finally {
      setLoading(false);
    }
  };

  // ✅ wait-until-exists scroll helper
const scrollToId = async (id: string, tries = 20) => {
  for (let i = 0; i < tries; i++) {
    const el = document.getElementById(id);

    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // ✨ add highlight
      el.classList.add("nav-highlight");

      // ✨ remove highlight after animation
      setTimeout(() => {
        el.classList.remove("nav-highlight");
      }, 1700);

      return;
    }

    await new Promise((r) => setTimeout(r, 80));
  }
};


  useEffect(() => {
    if (!target) return;
    if (target.sheetId !== SHEET_ID) return;

    // 1) open sheet
    setOpen(true);

    // 2) open correct accordion group
    if (target.accordionValue) {
      setAccordionValues((prev) => {
        // keep multiple open (type="multiple") but ensure target is open
        if (prev.includes(target.accordionValue!)) return prev;
        return [...prev, target.accordionValue!];
      });
    }

    // 3) wait for accordion content to mount, then scroll
    if (target.itemDomId) {
      // small delay helps with sheet + accordion animation
      setTimeout(() => {
        scrollToId(target.itemDomId!);
      }, 150);
    }

    const t = setTimeout(() => clear(), 1000);
    return () => clearTimeout(t);
  }, [target, clear]);

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
              04
            </span>
          </div>
          <CardTitle>مباحث اخلاقی</CardTitle>
        </CardHeader>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* ✅ make sure the SheetContent can scroll */}
        <SheetContent className="h-dvh overflow-y-auto">
          <SheetHeader>
            <SheetTitle>مباحث اخلاقی</SheetTitle>
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
              type="multiple"
              className="w-full"
              value={accordionValues}
              onValueChange={setAccordionValues}
            >
              {audioGroups.map((group, groupIndex) => (
                <AccordionItem
                  key={groupIndex}
                  value={`group-${groupIndex}`}
                >
                  <AccordionTrigger className="text-right">
                    {group.subject}
                  </AccordionTrigger>

                  <AccordionContent className="flex flex-col gap-4 justify-center mt-2 text-center">
                    {group.files.map((file, fileIndex) => (
                      <div
                        // ✅ IMPORTANT: id must match what you generate in getLatestAudios
                        id={`audio-benefitsCard-${groupIndex}-${fileIndex}`}
                        key={fileIndex}
                        className="border-b border-muted-foreground p-2 scroll-mt-24"
                      >
                        <div className="font-semibold mb-3 text-primary">
                          {file.title}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            onClick={() =>
                              play({
                                title: file.title,
                                url: file.url,
                              })
                            }
                            className="w-full sm:w-auto text-card"
                          >
                            پخش
                          </Button>

                          <a
                            href={toDownloadUrl(file.url)}
                            download={`${file.title || "audio"}.mp3`}
                          >
                            <Button variant="outline" className="w-full sm:w-auto">
                              دانلود
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
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

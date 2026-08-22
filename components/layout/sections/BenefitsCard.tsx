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
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { Button } from "@/components/ui/button";
import {
  catalogFiles,
  sessionNumberFromText,
  toDownloadUrl,
  type CatalogFileWithUrl,
} from "@/lib/media-api";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";
import { akhlaghOrderIndex } from "@/lib/akhlagh-order";
import { HoverLift, MotionItem, MotionList } from "./reveal";
import { HeartHandshake } from "lucide-react";

const AkhlaghSkeleton = () => (
  <div className="mt-4 flex w-full flex-col gap-3" aria-label="در حال بارگذاری">
    {Array.from({ length: 8 }).map((_, index) => (
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

function getAkhlaghFileOrder(file: CatalogFileWithUrl, fallbackIndex: number) {
  const source = [file.title, file.file, file.id].filter(Boolean).join(" ");
  return sessionNumberFromText(source) || fallbackIndex + 1;
}

function sortAkhlaghFiles(files: CatalogFileWithUrl[]) {
  return files
    .map((file, originalIndex) => ({
      file,
      originalIndex,
      order: getAkhlaghFileOrder(file, originalIndex),
    }))
    .sort((a, b) => a.order - b.order || a.originalIndex - b.originalIndex)
    .map(({ file }) => file);
}

export const BenefitsCard = () => {
  const SHEET_ID = "benefitsCard";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ controlled accordion
  const [accordionValues, setAccordionValues] = useState<string[]>([]);

  const { play } = useAudioPlayer();
  const { target, clear } = useSheetNav();
  const { catalog, loading: catalogLoading, error, load } = useAudioCatalog();

  const fetchDescription = async () => {
    setLoading(true);
    try {
      await load(true);
      const response = await fetch("/api/benefit?id=eteghadat");
      if (response.ok) await response.json();
    } catch {
      // Description is optional; keep the sheet usable when the endpoint is absent.
    } finally {
      setLoading(false);
    }
  };

  const audioGroups = Object.entries(catalog?.akhlagh || {})
    .map(([key, topic], originalIndex) => ({
      key,
      originalIndex,
      subject: topic?.title || key,
      files: sortAkhlaghFiles(catalogFiles(topic)),
    }))
    .sort((a, b) => {
      const byTitle = akhlaghOrderIndex(a.subject) - akhlaghOrderIndex(b.subject);
      return byTitle || a.originalIndex - b.originalIndex;
    });
  const isLoading = loading || catalogLoading;

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
    if (!open) return;
    load(true);
  }, [open, load]);

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
      <HoverLift className="h-full">
      <Card
        onClick={() => {
          fetchDescription();
          setOpen(true);
        }}
        className="service-tile group flex h-full min-h-[168px] cursor-pointer flex-col justify-between"
      >
        <div className="service-tile-header">
          <span className="service-tile-kicker">اخلاق</span>
          <span className="service-tile-mark" aria-hidden="true">
            <HeartHandshake className="size-5" />
          </span>
        </div>
        <div className="service-tile-copy">
          <h3>مباحث اخلاقی</h3>
          <p>گفتارها و فایل‌های صوتی</p>
        </div>
      </Card>
      </HoverLift>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* ✅ make sure the SheetContent can scroll */}
        <SheetContent className="h-dvh overflow-y-auto">
          <SheetHeader>
            <SheetTitle>مباحث اخلاقی</SheetTitle>
            <SheetDescription className="mb-4"></SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <AkhlaghSkeleton />
          ) : error ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {error}
            </p>
          ) : (
            <Accordion
              type="multiple"
              className="w-full"
              value={accordionValues}
              onValueChange={setAccordionValues}
            >
              {audioGroups.map((group, groupIndex) => (
                <AccordionItem
                  key={group.key}
                  value={`group-${groupIndex}`}
                >
                  <AccordionTrigger className="text-right">
                    {group.subject}
                  </AccordionTrigger>

                  <AccordionContent className="justify-center mt-2 text-center">
                    {group.files.length === 0 ? (
                      <div className="py-4 text-sm text-muted-foreground">
                        فعلاً صوتی اضافه نشده.
                      </div>
                    ) : (
                    <MotionList className="flex flex-col gap-3">
                      {group.files.map((file, fileIndex) => (
                      <MotionItem
                        // ✅ IMPORTANT: id must match what you generate in getLatestAudios
                        id={`audio-benefitsCard-${groupIndex}-${fileIndex}`}
                        key={fileIndex}
                        className="motion-list-item scroll-mt-24"
                      >
                        <div className="font-semibold mb-3 text-primary">
                          {file.title}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            onClick={() =>
                              play({
                                title: file.title || "",
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
                      </MotionItem>
                      ))}
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

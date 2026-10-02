"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileText, Headphones, Sparkles } from "lucide-react";
import Lottie from "lottie-react";
import loadingPdfAnim from "@/public/loading.json";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import {
  fileUrl,
  formatSessionTitle,
  isAudioUrl,
  MaktubatSession,
  normalizeSessionTitle,
  sessionNumberFromText,
  toPersianDigits,
  toDownloadUrl,
  toPdfViewUrl,
  toStreamableUrl,
} from "@/lib/media-api";
import {
  buildMaktubatNotesMap,
  type MaktubatDetailsResponse,
} from "@/lib/maktubat-details";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import { useSheetNav } from "./SheetNavProvider";
import { HoverLift } from "./reveal";
import {
  MaktobatNotesButton,
  MaktobatNotesDialog,
  type MaktobatNotesDialogData,
} from "./MaktobatNotesDialog";

const CACHE_KEY = "maktobats_cache_v10";
type Maktobat = {
  id: string;
  title: string;
  content: string;
  pdfUrl: string | null;
  audioUrl?: string | null;
  notes: MaktobatNotesDialogData | null;
};
type CacheShape = { ts: number; items: Maktobat[] };

function cleanMaktobatContent(content: string) {
  return toPersianDigits(content
    .replace(/الله تبارک و تعالی/g, "الله تعالی")
    .replace(/ذات الله(?! تعالی)/g, "ذات الله تعالی")
    .replace(/الله(?! تعالی)/g, "الله تعالی")
    .replace(/(ذات الله(?: تعالی)?)\s*:\s*/g, "$1 "));
}

function maktobatTriggerContent(maktobat: Maktobat) {
  return cleanMaktobatContent(maktobat.content).trim();
}

function maktobatDocumentTitle(maktobat: Maktobat) {
  return maktobat.title.replace(/^جلسه\s+/, "مکتوب ");
}

function normalizedMaktobatId(id: string) {
  return id.replace(/^0+/, "") || id;
}

export const BenefitMaktobat = () => {
  const SHEET_ID = "maktobat";

  const [accordionValue, setAccordionValue] = useState<string | undefined>();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [maktobats, setMaktobats] = useState<Maktobat[]>([]);
  const [activeNotes, setActiveNotes] = useState<MaktobatNotesDialogData | null>(null);
  const [notesTrigger, setNotesTrigger] = useState<HTMLButtonElement | null>(null);
  const { play } = useAudioPlayer(); // ← use the global player
  const { target, clear } = useSheetNav();
  const { loading: catalogLoading, error, load } = useAudioCatalog();

  const flashHighlight = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.classList.add("nav-highlight");
    window.setTimeout(() => element.classList.remove("nav-highlight"), 1700);
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

  // ---------- Cache helpers ----------
  const readCache = (): Maktobat[] | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheShape;
      if (!parsed?.items?.length) return null;
      return parsed.items;
    } catch {
      return null;
    }
  };

  const writeCache = (items: Maktobat[]) => {
    try {
      const payload: CacheShape = { ts: Date.now(), items };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
  };

  // ---------- Transform & sort ----------
  const transformAndSort = (
    data: MaktubatSession[],
    notesById = new Map<string, MaktobatNotesDialogData>()
  ): Maktobat[] => {
    const extractPersianNumber = (title: string) => {
      return sessionNumberFromText(title) ?? 999;
    };

    const sessionTitle = (title: string | undefined, index: number) => {
      if (!title) return formatSessionTitle(index + 1);
      return normalizeSessionTitle(title.replace(/^مکتوب\s+/, "جلسه "), index + 1);
    };

    const sortedData = [...data].sort(
      (a, b) =>
        extractPersianNumber(a.title || "") - extractPersianNumber(b.title || "")
    );

    return sortedData.map((item, index) => {
      const possibleAudioUrl = fileUrl(item);
      const content = Array.isArray(item.subtitle)
        ? item.subtitle.join("\n")
        : item.subtitle || item.content || "";

      const id = item.id || `maktobat-${index}`;
      const normalizedId = normalizedMaktobatId(id);
      const notes = notesById.get(normalizedId) || null;

      return {
        id,
        title: sessionTitle(item.title, index),
        content: cleanMaktobatContent(content),
        pdfUrl: item.pdfUrl || null,
        notes,
        audioUrl:
          item.audioUrl ||
          (isAudioUrl(possibleAudioUrl) ? possibleAudioUrl : null),
      };
    });
  };

  const fetchMaktubatNotes = async () => {
    try {
      const response = await fetch("/api/maktubat-details", { cache: "no-store" });
      if (!response.ok) return new Map<string, MaktobatNotesDialogData>();
      const data = (await response.json()) as MaktubatDetailsResponse;
      return buildMaktubatNotesMap(data);
    } catch (err) {
      console.error("Failed to fetch maktubat notes:", err);
      return new Map<string, MaktobatNotesDialogData>();
    }
  };

  // ---------- Fetch + cache ----------
  const fetchAndCache = async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const [nextCatalog, notesById] = await Promise.all([
        load(true),
        fetchMaktubatNotes(),
      ]);
      const items = transformAndSort(nextCatalog?.maktubat?.sessions || [], notesById);
      setMaktobats(items);
      writeCache(items);
    } catch (err) {
      console.error("Failed to fetch maktobats:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // ---------- Prefetch on mount (SWR style) ----------
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setMaktobats(cached); // instant
      fetchAndCache(false); // background refresh
    } else {
      fetchAndCache(false); // prefetch in background
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Open handler uses cache first ----------
  const handleOpen = (value: boolean) => {
    setOpen(value);
    if (value && maktobats.length === 0) {
      const cached = readCache();
      if (cached) {
        setMaktobats(cached);
        fetchAndCache(false); // optional background refresh
      } else {
        fetchAndCache(true); // show spinner if nothing cached
      }
    }
  };

  const isLoading = loading || catalogLoading;

  const openNotes = (notes: MaktobatNotesDialogData, trigger: HTMLButtonElement) => {
    setNotesTrigger(trigger);
    setActiveNotes(notes);
  };

  return (
    <>
      <HoverLift className="h-full">
      <Card
        onClick={() => handleOpen(true)}
        className="service-tile group flex h-full min-h-[168px] cursor-pointer flex-col justify-between"
      >
        <div className="service-tile-header">
          <span className="service-tile-kicker">اصول عقاید</span>
          <span className="service-tile-mark" aria-hidden="true">
            <Sparkles className="size-5" />
          </span>
        </div>
        <div className="service-tile-copy">
          <h3 className="space-y-1">
            <span className="block">برهان امکان و وجوب</span>
            <span className="block">و اثبات صفات الله</span>
          </h3>
          <p>متن، صوت و فایل‌های مرتبط</p>
        </div>
      </Card>
      </HoverLift>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent
          className="max-h-screen overflow-y-auto"
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (activeNotes && target?.closest(".notes-overlay")) {
              event.preventDefault();
            }
          }}
          onFocusOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (activeNotes && target?.closest(".notes-overlay")) {
              event.preventDefault();
            }
          }}
        >
          <SheetHeader>
            <SheetTitle>برهان امکان و وجوب</SheetTitle>
            <SheetDescription className="mb-4 text-white">
              و اثبات صفات الله
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <Lottie
              animationData={loadingPdfAnim}
              loop
              className="text-muted-foreground bg-transparent mt-4"
            />
          ) : error ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {error}
            </p>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="w-full "
              value={accordionValue}
              onValueChange={setAccordionValue}
            >
              {maktobats.map((maktobat) => (
                <AccordionItem
                  id={`maktobat-item-${maktobat.id}`} // ✅ ADD THIS
                  key={maktobat.id}
                  value={maktobat.id}
                  className="text-right"
                >
                  <AccordionTrigger className="gap-4 text-right text-muted-foreground">
                    <span className="block flex-1 text-right leading-8">
                      <span className="block">{maktobat.title}:</span>
                      {maktobatTriggerContent(maktobat) ? (
                        <span className="mt-2 block">
                          {maktobatTriggerContent(maktobat)}
                        </span>
                      ) : null}
                    </span>
                  </AccordionTrigger>
            <AccordionContent>
  <div className="mb-4 pb-2">
    <div className="rounded-xl shadow-md p-4 mt-2">
      <p className="text-primary text-sm font-semibold mb-2 text-center">
        <FileText className="ml-1 inline size-4 text-muted-foreground" />
        {maktobatDocumentTitle(maktobat)}
      </p>

      <div className="flex justify-center gap-2 text-center">
        <Button
          size="sm"
          variant="outline"
          disabled={!maktobat.pdfUrl}
          onClick={() => {
            if (maktobat.pdfUrl) window.open(toPdfViewUrl(maktobat.pdfUrl), "_blank");
          }}
        >
          مشاهده
        </Button>

        <a href={maktobat.pdfUrl || "#"} download={`${maktobat.title || "maktobat"}.pdf`}>
          <Button size="sm" className="text-background">
            دانلود
          </Button>
        </a>
      </div>
      <MaktobatNotesButton notes={maktobat.notes} onOpen={openNotes} />
    </div>
    <div className="rounded-xl shadow-md p-4 mt-4">
  <p className="text-primary text-sm font-semibold mb-2 flex items-center justify-center gap-2 text-center">
    <span>صوت</span>
    <Headphones className="size-5 text-muted-foreground" />
  </p>

  {maktobat.audioUrl ? (
    <div className="flex gap-2 justify-center">
      <Button
        onClick={() =>
          play({
            title: maktobat.title,
            url: toStreamableUrl(maktobat.audioUrl!),
            description: maktobat.content,
          })
        }
        className="sm:w-auto w-full text-card"
      >
        پخش
      </Button>

      <a
        href={toDownloadUrl(maktobat.audioUrl!)}
        download={`${maktobat.title || "audio"}.mp3`}
      >
        <Button variant="outline" className="sm:w-auto w-full">
          دانلود صوت
        </Button>
      </a>
    </div>
  ) : (
    <p className="text-gray-500 text-sm text-center">
      فایل صوتی موجود نیست
    </p>
  )}
</div>
  </div>
</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          <MaktobatNotesDialog
            notes={activeNotes}
            trigger={notesTrigger}
            onClose={() => {
              setActiveNotes(null);
              setNotesTrigger(null);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
};

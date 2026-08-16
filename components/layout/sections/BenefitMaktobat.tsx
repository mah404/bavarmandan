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
import { Sparkles } from "lucide-react";
import Lottie from "lottie-react";
import loadingPdfAnim from "@/public/loading.json";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import {
  fileUrl,
  isAudioUrl,
  MaktubatSession,
  toDownloadUrl,
  toPdfViewUrl,
  toStreamableUrl,
} from "@/lib/media-api";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import { useSheetNav } from "./SheetNavProvider";
import { HoverLift, MotionItem, MotionList } from "./reveal";

const CACHE_KEY = "maktobats_cache_v6";
type Maktobat = {
  id: string;
  title: string;
  content: string;
  pdfUrl: string | null;
  audioUrl?: string | null;
};
type CacheShape = { ts: number; items: Maktobat[] };

export const BenefitMaktobat = () => {
  const SHEET_ID = "maktobat";

  const [accordionValue, setAccordionValue] = useState<string | undefined>();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [maktobats, setMaktobats] = useState<Maktobat[]>([]);
  const { play } = useAudioPlayer(); // ← use the global player
  const { target, clear } = useSheetNav();
  const { catalog, loading: catalogLoading, error, load } = useAudioCatalog();

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
  const transformAndSort = (data: MaktubatSession[]): Maktobat[] => {
    const persianOrderMap: Record<string, number> = {
      اول: 1,
      دوم: 2,
      سوم: 3,
      چهارم: 4,
      پنجم: 5,
      ششم: 6,
      هفتم: 7,
      هشتم: 8,
      نهم: 9,
      دهم: 10,
      یازدهم: 11,
      دوازدهم: 12,
    };

    const extractPersianNumber = (title: string) => {
      const match = title?.match(/مکتوب\s+(\S+)/);
      return match ? persianOrderMap[match[1]] ?? 999 : 999;
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

      return {
        id: item.id || `maktobat-${index}`,
        title: item.title || `مکتوب ${index + 1}`,
        content,
        pdfUrl: item.pdfUrl || null,
        audioUrl:
          item.audioUrl ||
          (isAudioUrl(possibleAudioUrl) ? possibleAudioUrl : null),
      };
    });
  };

  // ---------- Fetch + cache ----------
  const fetchAndCache = async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const nextCatalog = await load(true);
      const items = transformAndSort(nextCatalog?.maktubat?.sessions || []);
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

  const motafarreghe = catalog?.maktubat?.motafarreghe || [];
  const isLoading = loading || catalogLoading;
  const toStreamable = toStreamableUrl;
  const goftegooha: Record<string, string> = {
    "1": fileUrl(motafarreghe[0] || {}),
    "2": fileUrl(motafarreghe[1] || {}),
    "3": fileUrl(motafarreghe[2] || {}),
  };

  return (
    <>
      <HoverLift className="h-full">
      <Card
        onClick={() => handleOpen(true)}
        className="service-tile group flex h-full min-h-[168px] cursor-pointer flex-col justify-between"
      >
        <div className="service-tile-header">
          <span className="service-tile-kicker">مکتوبات</span>
          <span className="service-tile-mark" aria-hidden="true">
            <Sparkles className="size-5" />
          </span>
        </div>
        <div className="service-tile-copy">
          <h3>برهان امکان و وجوب</h3>
          <p>متن، صوت و فایل‌های مرتبط</p>
        </div>
      </Card>
      </HoverLift>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent className="max-h-screen overflow-y-auto">
          <SheetHeader>
            <SheetTitle>برهان امکان و وجوب</SheetTitle>
            <SheetDescription className="mb-4">
              لیست کامل مکتوبات
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
                  className="text-center"
                >
                  <AccordionTrigger className="text-muted-foreground">
                    {maktobat.title}
                  </AccordionTrigger>
            <AccordionContent>
  <div className="mb-4 pb-2">
    <p className="text-sm text-primary whitespace-pre-line">
      {maktobat.content || "متنی برای این مکتوب موجود نیست"}
    </p>

    <div className="flex justify-center gap-2 mt-2 text-center">
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
    <div className="rounded-xl shadow-md p-4 mt-4">
  <p className="text-primary text-sm font-semibold mb-2 text-center">
    🎧 پخش صوت
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
              <AccordionItem value="group-2">
                <AccordionTrigger className="text-muted-foreground">
                  مباحث متفرقه
                </AccordionTrigger>
                <AccordionContent>
                  <MotionList className="flex flex-col gap-3">
                  <MotionItem className="motion-list-item">
                  <div className="rounded-xl p-1">
                    <SheetDescription className="text-primary text-sm font-semibold mb-2 text-center">
                      🎧 گفتمان
                    </SheetDescription>

                    <div className="flex gap-2 justify-center">
                      {/* Play (same global player as بالا) */}
                      <Button
                        onClick={() =>
                          play({
                            title: "گفتمان",
                            url: toStreamable(goftegooha["1"]), // streamable: ...raw=1
                            description: "مباحث متفرقه",
                          })
                        }
                        className="sm:w-auto w-full text-card"
                      >
                        پخش
                      </Button>

                      {/* Download (matching the first section’s style) */}
                      <a
                        href={toDownloadUrl(goftegooha["1"])} // downloadable: ...dl=1
                        download="گفتمان.mp3"
                      >
                        <Button variant="outline" className="sm:w-auto w-full">
                          دانلود صوت
                        </Button>
                      </a>
                    </div>
                  </div>
                  </MotionItem>
                  <MotionItem className="motion-list-item">
                  <div className="rounded-xl p-1">
                    <SheetDescription className="text-primary text-sm font-semibold mb-2 text-center">
                      🎧 گفتاری در باب بساطت
                    </SheetDescription>

                    <div className="flex gap-2 justify-center">
                      {/* Play (same global player as بالا) */}
                      <Button
                        onClick={() =>
                          play({
                            title: "گفتاری در باب بساطت",
                            url: toStreamable(goftegooha["2"]), // streamable: ...raw=1
                            description: "مباحث متفرقه",
                          })
                        }
                        className="sm:w-auto w-full text-card"
                      >
                        پخش
                      </Button>

                      {/* Download (matching the first section’s style) */}
                      <a
                        href={toDownloadUrl(goftegooha["2"])} // downloadable: ...dl=1
                        download="گفتمان.mp3"
                      >
                        <Button variant="outline" className="sm:w-auto w-full">
                          دانلود صوت
                        </Button>
                      </a>
                    </div>
                  </div>
                  </MotionItem>
                  <MotionItem className="motion-list-item">
                  <div className="rounded-xl p-1">
                    <SheetDescription className="text-primary text-sm font-semibold mb-2 text-center">
                      🎧انکار عقل ، با وهم و گمان
                    </SheetDescription>

                    <div className="flex gap-2 justify-center">
                      {/* Play (same global player as بالا) */}
                      <Button
                        onClick={() =>
                          play({
                            title: "انکار عقل ، با وهم و گمان",
                            url: toStreamable(goftegooha["3"]), // streamable: ...raw=1
                            description: "مباحث متفرقه",
                          })
                        }
                        className="sm:w-auto w-full text-card"
                      >
                        پخش
                      </Button>

                      {/* Download (matching the first section’s style) */}
                      <a
                        href={toDownloadUrl(goftegooha["3"])} // downloadable: ...dl=1
                        download="گفتمان.mp3"
                      >
                        <Button variant="outline" className="sm:w-auto w-full">
                          دانلود صوت
                        </Button>
                      </a>
                    </div>
                  </div>
                  </MotionItem>
                  </MotionList>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

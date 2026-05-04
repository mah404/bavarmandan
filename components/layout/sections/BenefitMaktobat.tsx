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
import Lottie from "lottie-react";
import loadingPdfAnim from "@/public/loading.json";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { dropboxAudioMap, goftegooha, Maktobat } from "@/data/content";
import { useSheetNav } from "./SheetNavProvider";
import { HoverLift, MotionItem, MotionList } from "./reveal";

const CACHE_KEY = "maktobats_cache_v1";
type CacheShape = { ts: number; items: Maktobat[] };

export const BenefitMaktobat = () => {
  const SHEET_ID = "maktobat";

  const [accordionValue, setAccordionValue] = useState<string | undefined>();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [maktobats, setMaktobats] = useState<Maktobat[]>([]);
  const { play } = useAudioPlayer(); // ← use the global player
  const { target, clear } = useSheetNav();

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
        }
        if (target.autoplay) {
          play(target.autoplay);
        }
      });
    });

    const t = setTimeout(() => clear(), 800);
    return () => clearTimeout(t);
  }, [target, clear, play]);

  // Make Dropbox URLs streamable (inline) for the player
  const toStreamable = (u: string) => {
    if (!u) return u;
    // strip any existing dl/raw flags, then force raw=1
    const noParam = u.replace(/([?&])(dl|raw)=[01]/g, "").replace(/[?&]$/, "");
    return noParam + (noParam.includes("?") ? "&raw=1" : "?raw=1");
  };

  const toDownloadUrl = (u: string) =>
    u ? u.replace(/([?&])raw=1/, "$1dl=1").replace(/([?&])dl=0/, "$1dl=1") : u;

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
  const transformAndSort = (data: any[]): Maktobat[] => {
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
      (a, b) => extractPersianNumber(a.title) - extractPersianNumber(b.title)
    );

    return sortedData.map((item: any) => {
      const order = String(extractPersianNumber(item.title));
      const audioUrl = dropboxAudioMap[order]
        ? dropboxAudioMap[order].replace("&dl=0", "&raw=1")
        : null;

      return {
        id: item.id,
        title: item.title,
        content: item.content,
        pdfUrl: item.pdfUrl,
        audioUrl,
      } as Maktobat;
    });
  };

  // ---------- Fetch + cache ----------
  const fetchAndCache = async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch("/api/maktobats", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const raw = await res.json();
      const items = transformAndSort(raw);
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

  return (
    <>
      <HoverLift>
      <Card
        onClick={() => handleOpen(true)}
        className="service-tile group flex min-h-[178px] cursor-pointer flex-col justify-between"
      >
        <h3 className="pt-8 text-right text-3xl font-bold leading-[3rem] text-foreground">
          برهان امکان و وجوب
        </h3>
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
                    <MotionItem className="motion-list-item mb-3">
                    <div className="mb-4 pb-2">
                      <p className="text-sm text-primary">{maktobat.content}</p>
                      <div className="flex justify-center gap-2 mt-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const blob = fetch(maktobat.pdfUrl)
                              .then((res) => res.blob())
                              .then((blob) => {
                                const url = URL.createObjectURL(blob);
                                window.open(url, "_blank");
                              });
                          }}
                        >
                          مشاهده
                        </Button>

                        <a
                          href={maktobat.pdfUrl}
                          download={`${maktobat.title || "maktobat"}.pdf`}
                        >
                          <Button size="sm" className="text-background">
                            دانلود{" "}
                          </Button>
                        </a>
                      </div>

                      <div className="rounded-xl shadow-md p-4 ">
                        <SheetDescription className="text-primary text-sm font-semibold mb-2">
                          🎧 پخش صوت
                        </SheetDescription>
                        {maktobat.audioUrl ? (
                          <div className="flex gap-2 justify-center">
                            {/* Play */}
                            <Button
                              onClick={() =>
                                play({
                                  title: maktobat.title,
                                  url: maktobat.audioUrl!, // streamable: ...raw=1
                                  description: maktobat.content,
                                })
                              }
                              className="sm:w-auto w-full text-card "
                            >
                              پخش
                            </Button>

                            {/* Download */}
                            <a
                              href={toDownloadUrl(maktobat.audioUrl!)} // downloadable: ...dl=1
                              download={`${maktobat.title || "audio"}.mp3`}
                            >
                              <Button
                                variant="outline"
                                className="sm:w-auto w-full"
                              >
                                دانلود صوت
                              </Button>
                            </a>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            فایل صوتی موجود نیست
                          </p>
                        )}
                      </div>
                    </div>
                    </MotionItem>
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

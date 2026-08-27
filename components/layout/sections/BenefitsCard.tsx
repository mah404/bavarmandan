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
  fileUrl,
  isPdfUrl,
  sessionNumberFromText,
  toDownloadUrl,
  toPdfViewUrl,
  toStreamableUrl,
  type CatalogFileWithUrl,
  type MaktubatSession,
} from "@/lib/media-api";
import { useAudioCatalog } from "@/lib/use-audio-catalog";
import { useSheetNav } from "@/components/layout/sections/SheetNavProvider";
import { akhlaghOrderIndex, normalizePersianText } from "@/lib/akhlagh-order";
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

const neshaatTopicTitle = "نشآت وجودی انسان: درجات و درکات";
const neshaatApiTopicTitle = "نشآت وجودی انسان";

function isNeshaatTopic(title = "") {
  const normalizedTitle = normalizePersianText(title);
  return (
    normalizedTitle === normalizePersianText(neshaatTopicTitle) ||
    normalizedTitle === normalizePersianText(neshaatApiTopicTitle)
  );
}

function akhlaghSessionLabel(file: CatalogFileWithUrl, fallbackIndex: number) {
  const order = getAkhlaghFileOrder(file, fallbackIndex);
  return `جلسه ${order}`;
}

function textValue(value?: string | string[]) {
  if (Array.isArray(value)) return value.filter(Boolean).join(" ").trim();
  return (value || "").trim();
}

function sessionOrder(session: MaktubatSession, fallbackIndex: number) {
  const source = [session.title, session.id].filter(Boolean).join(" ");
  return sessionNumberFromText(source) || fallbackIndex + 1;
}

function sortAkhlaghSessions(sessions: MaktubatSession[] = []) {
  return sessions
    .map((session, originalIndex) => ({
      session,
      originalIndex,
      order: sessionOrder(session, originalIndex),
    }))
    .sort((a, b) => a.order - b.order || a.originalIndex - b.originalIndex)
    .map(({ session }) => session);
}

function akhlaghApiSessionLabel(session: MaktubatSession, fallbackIndex: number) {
  return textValue(session.title) || `جلسه ${sessionOrder(session, fallbackIndex)}`;
}

function akhlaghTopicDisplayTitle(title = "") {
  return isNeshaatTopic(title) ? neshaatTopicTitle : title;
}

function nashaatFallbackPdfUrl(audioUrl = "") {
  const urlWithoutQuery = audioUrl.split("?")[0];
  if (!urlWithoutQuery.endsWith("/audio.mp3")) return "";

  return urlWithoutQuery.replace(/\/audio\.mp3$/, "/pdfs/part1.pdf");
}

function nashaatSessionPdfs(session: MaktubatSession): CatalogFileWithUrl[] {
  const explicitPdfs = [...(session.pdfs || []), ...(session.files || [])]
    .map((pdf) => ({ ...pdf, url: fileUrl(pdf) }))
    .filter((pdf): pdf is CatalogFileWithUrl => !!pdf.url && isPdfUrl(pdf.url, pdf.type));

  if (explicitPdfs.length) return explicitPdfs;

  const fallbackUrl = nashaatFallbackPdfUrl(session.audioUrl || "");
  return fallbackUrl
    ? [
        {
          title: "قسمت 1",
          url: fallbackUrl,
          type: "pdf",
        },
      ]
    : [];
}

export const BenefitsCard = () => {
  const SHEET_ID = "benefitsCard";

  const [open, setOpen] = useState(false);

  // ✅ controlled accordion
  const [accordionValues, setAccordionValues] = useState<string[]>([]);

  // controlled so a "latest" click can force the target nashaat session open,
  // otherwise its content never mounts and the glow target is never found.
  const [nashaatSessionValues, setNashaatSessionValues] = useState<string[]>([]);

  const { play } = useAudioPlayer();
  const { target, clear } = useSheetNav();
  const { catalog, loading: catalogLoading, error, load } = useAudioCatalog();

  const fetchDescription = () => {
    if (!catalog) void load(false).catch(() => undefined);
    void fetch("/api/benefit?id=eteghadat").catch(() => undefined);
  };

  const audioGroups = Object.entries(catalog?.akhlagh || {})
    .map(([key, topic], originalIndex) => ({
      key,
      originalIndex,
      subject: topic?.title || key,
      files: sortAkhlaghFiles(catalogFiles(topic)),
      sessions: sortAkhlaghSessions(topic?.sessions || []),
    }))
    .concat(
      Object.entries(catalog?.akhlagh || {}).some(([key, topic]) =>
        key === "nashaatvojoodi" || isNeshaatTopic(topic?.title)
      )
        ? []
        : [
            {
              key: "neshaat-placeholder",
              originalIndex: -1,
              subject: neshaatTopicTitle,
              files: [],
              sessions: [],
            },
          ]
    )
    .sort((a, b) => {
      const byTitle = akhlaghOrderIndex(a.subject) - akhlaghOrderIndex(b.subject);
      return byTitle || a.originalIndex - b.originalIndex;
    });
  const isLoading = catalogLoading;

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
    load(false);
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

    // 2b) for nashaat, the session itself is a nested collapsed accordion
    // item whose content doesn't mount until it's opened — force it open
    // so the glow target actually exists in the DOM.
    if (target.itemDomId) {
      const nashaatMatch = target.itemDomId.match(
        /^audio-benefitsCard-(\d+)-(\d+)$/
      );
      if (nashaatMatch) {
        const group = audioGroups[Number(nashaatMatch[1])];
        if (group && isNeshaatTopic(group.subject)) {
          const sessionValue = `${group.key}-session-${nashaatMatch[2]}`;
          setNashaatSessionValues((prev) =>
            prev.includes(sessionValue) ? prev : [...prev, sessionValue]
          );
        }
      }
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
    // `catalog` is included so this reruns once it finishes loading —
    // audioGroups (used above to detect the nashaat group) is empty until
    // then, since the catalog fetch only starts after the sheet opens.
  }, [target, clear, catalog]);

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
                    {akhlaghTopicDisplayTitle(group.subject)}
                  </AccordionTrigger>

                  <AccordionContent className="justify-center mt-2 text-center">
                    {isNeshaatTopic(group.subject) ? (
                      <Accordion
                        type="multiple"
                        className="w-full"
                        value={nashaatSessionValues}
                        onValueChange={setNashaatSessionValues}
                      >
                        {group.sessions.map((session, fileIndex) => {
                          const audioUrl = session.audioUrl || "";
                          const pdfs = nashaatSessionPdfs(session);
                          const sessionLabel = akhlaghApiSessionLabel(session, fileIndex);
                          const subtitle = textValue(session.subtitle);

                          return (
                          <AccordionItem
                            key={`${group.key}-${fileIndex}`}
                            value={`${group.key}-session-${fileIndex}`}
                          >
                            <AccordionTrigger className="text-right">
                              {sessionLabel}
                            </AccordionTrigger>

                            <AccordionContent className="mt-2 text-center">
                              <div
                                id={`audio-benefitsCard-${groupIndex}-${fileIndex}`}
                                className="scroll-mt-24 rounded-2xl bg-background/20 px-4 py-5"
                              >
                                {subtitle ? (
                                  <div
                                    dir="rtl"
                                    className="mb-4 whitespace-pre-line text-center font-semibold leading-8 text-primary"
                                  >
                                    {subtitle}
                                  </div>
                                ) : null}

                                {audioUrl ? (
                                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                    <Button
                                      onClick={() =>
                                        play({
                                          title: sessionLabel,
                                          url: toStreamableUrl(audioUrl),
                                          description: akhlaghTopicDisplayTitle(group.subject),
                                        })
                                      }
                                      className="w-full sm:w-auto text-card"
                                    >
                                      پخش
                                    </Button>

                                    <a
                                      href={toDownloadUrl(audioUrl)}
                                      download={`${sessionLabel}.mp3`}
                                    >
                                      <Button variant="outline" className="w-full sm:w-auto">
                                        دانلود
                                      </Button>
                                    </a>
                                  </div>
                                ) : (
                                  <div className="py-2 text-sm text-muted-foreground">
                                    به زودی
                                  </div>
                                )}

                                {pdfs.length ? (
                                  <div className="mt-5 space-y-3">
                                    <p className="text-center text-sm font-semibold text-primary">
                                      خلاصه متن محتوا
                                    </p>

                                    {pdfs.map((pdf, pdfIndex) => {
                                      const pdfUrl = fileUrl(pdf);

                                      return (
                                        <div
                                          key={`${pdf.title || "pdf"}-${pdfIndex}`}
                                          className="rounded-xl p-4 shadow-md"
                                        >
                                          <p className="mb-3 text-center text-sm font-semibold text-primary">
                                            {pdf.title || `قسمت ${pdfIndex + 1}`}
                                          </p>

                                          <div className="flex flex-col justify-center gap-2 sm:flex-row">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                window.open(
                                                  toPdfViewUrl(pdfUrl),
                                                  "_blank"
                                                )
                                              }
                                            >
                                              مشاهده
                                            </Button>

                                            <a
                                              href={toDownloadUrl(pdfUrl)}
                                              download={`${pdf.title || "content"}.pdf`}
                                            >
                                              <Button
                                                size="sm"
                                                className="w-full text-card sm:w-auto"
                                              >
                                                دانلود
                                              </Button>
                                            </a>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          );
                        })}

                        <AccordionItem value={`${group.key}-coming-soon`}>
                          <AccordionTrigger className="text-right">
                            جلسه {group.sessions.length + 1}
                          </AccordionTrigger>
                          <AccordionContent className="text-center text-sm text-muted-foreground">
                            به زودی
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : group.files.length === 0 ? (
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
                          {akhlaghSessionLabel(file, fileIndex)}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            onClick={() =>
                              play({
                                title: file.title || "",
                                url: toStreamableUrl(file.url),
                                description: akhlaghTopicDisplayTitle(group.subject),
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

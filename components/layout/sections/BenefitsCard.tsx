"use client";

import { useState } from "react";
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

export const BenefitsCard = () => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { play } = useAudioPlayer(); // ← use the global player

  const toDownloadUrl = (u: string) =>
    u ? u.replace(/([?&])raw=1/, "$1dl=1").replace(/([?&])dl=0/, "$1dl=1") : u;

  const fetchDescription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/benefit?id=eteghadat");
      const data = await res.json();
      setDescription(data.description);
    } catch {
      setDescription("خطا در دریافت اطلاعات.");
    } finally {
      setLoading(false);
    }
  };



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
        <SheetContent className="overflow-y-auto ">
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
            <Accordion type="multiple" className="w-full">
              {audioGroups.map((group, groupIndex) => (
                <AccordionItem key={groupIndex} value={`group-${groupIndex}`}>
                  <AccordionTrigger className="text-right">
                    {group.subject}
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-4 justify-center mt-2 text-center">
                    {group.files.map((file, fileIndex) => (
                      <div
                        key={fileIndex}
                        className="border-b border-muted-foreground p-2"
                      >
                        <div className="font-semibold mb-3 text-primary">
                          {file.title}
                        </div>

                        <div className="flex gap-2 justify-center">
                          {/* Play */}
                          <Button
                            onClick={() =>
                              play({
                                title: file.title,
                                url: file.url, // assumes already streamable
                              })
                            }
                            className="w-full sm:w-auto text-card"
                          >
                            پخش
                          </Button>

                          {/* Download */}
                          <a
                            href={file.url.replace(/([?&])raw=1/, "$1dl=1")} // convert raw link to dl=1
                            download={`${file.title || "audio"}.mp3`}
                          >
                            <Button
                              variant="outline"
                              className="w-full sm:w-auto"
                            >
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

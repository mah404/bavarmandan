"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Icon } from "@/components/ui/icon";
import Lottie from "lottie-react";
import loadingPdfAnim from "@/public/loading.json";

interface Maktobat {
  id: string;
  title: string;
  content: string;
  pdfUrl: string;
  audioUrl?: string;
}

const dropboxAudioMap: Record<string, string> = {
  "1": "https://www.dropbox.com/scl/fi/sku831xpg2ucre47klnog/1.mp3?rlkey=tw5tpdjlpbjmm8l25g3uzt85s&st=b70uutvh&dl=0",
  "2": "https://www.dropbox.com/scl/fi/ig10u9c57y45bck5zr8lh/2.mp3?rlkey=zjf8vyojafpj6u1jsd91okx3g&st=vws4oz4o&dl=0",
  "3": "https://www.dropbox.com/scl/fi/pt6p75rcm456z6nuiwdbi/3.mp3?rlkey=d3alrs62hxr62ugy8kg56rgrf&st=60qgasw7&dl=0",
  "4": "https://www.dropbox.com/scl/fi/7rwfn9syqho61bhx8x7gn/4.mp3?rlkey=arbrbskuw27v6mnk7tbz4rxwt&st=333s63f1&dl=0",
  "5": "https://www.dropbox.com/scl/fi/xxikq2qokywsxyfegh1ft/5.mp3?rlkey=ua0rfjcdwn536kwdrkqju70ft&st=dxnlmbxq&dl=0",
  "6": "https://www.dropbox.com/scl/fi/7g5nhblpnzxdepr3h4cvr/6.mp3?rlkey=mi15f57k8ptksvzt6in8ytgb8&st=9m44u890&dl=0",
  "7": "https://www.dropbox.com/scl/fi/lkrj661nntozh21gv5ht4/7.mp3?rlkey=5yn56iente51slxmw0uu58boj&st=gx2qy5v9&dl=0",
  "8": "https://www.dropbox.com/scl/fi/jax9y6ps2r24e3r9ad35z/8.mp3?rlkey=6o2suuhwymg6yxuqd5xg2b2ig&st=0efxojg9&dl=0",
  "9": "https://www.dropbox.com/scl/fi/qovtqj58e1k52ojbjsun0/9.mp3?rlkey=7kzh50tk2apfqdwy1rbj13g0e&st=76y08k74&dl=0",
  "10": "https://www.dropbox.com/scl/fi/chiylb7qh7wqibwjo3hxx/10.mp3?rlkey=8z7f341hnnmjwmpcsb7eusd6k&st=0gl4f9dn&dl=0",
  "11": "https://www.dropbox.com/scl/fi/3hnudo5bjmrcnvpin6kqe/11.mp3?rlkey=yf7h04r0ymojdxwrl2dl4sdm8&st=y14fd9au&dl=0",
  "12": "",
};

const goftegooha: Record<string, string> = {
  "1": "https://www.dropbox.com/scl/fi/iq2w7txicij0oy5ycqc54/goftegoo.mp3?rlkey=h20ywqwgf4gkpqshvcx6a3fi1&st=61dregoe&dl=1",
};

export const BenefitMaktobat = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [maktobats, setMaktobats] = useState<Maktobat[]>([]);

  const handleOpen = (value: boolean) => {
    setOpen(value);
    if (value && maktobats.length === 0) {
      setLoading(true);
      fetch("/api/maktobats")
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          console.log("Raw response from /api/maktobats:", data); // ✅ Add this line

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
            const match = title.match(/مکتوب\s+(\S+)/);
            return match ? persianOrderMap[match[1]] ?? 999 : 999;
          };

          const sortedData = [...data].sort((a, b) => {
            return (
              extractPersianNumber(a.title) - extractPersianNumber(b.title)
            );
          });

          const transformed = sortedData.map((item: any) => {
            const order = extractPersianNumber(item.title).toString();
            const audioUrl =
              dropboxAudioMap[order]?.replace("&dl=0", "&raw=1") ?? null;

            return {
              id: item.id,
              title: item.title,
              content: item.content,
              pdfUrl: item.pdfUrl,
              audioUrl,
            };
          });

          setMaktobats(transformed);
        })

        .catch((err) => {
          console.error("Failed to fetch maktobats:", err);
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <>
      <Card
        onClick={() => handleOpen(true)}
        className="cursor-pointer hover:bg-background transition"
      >
        <CardHeader>
          <div className="flex justify-between">
            <Icon name="Blocks" size={32} color="hsl(var(--primary))" />
            <span className="text-5xl text-muted-foreground/15 font-medium">
              01
            </span>
          </div>
          <CardTitle>برهان امکان و وجوب</CardTitle>
        </CardHeader>
      </Card>

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
            <Accordion type="single" collapsible className="w-full">
              {maktobats.map((maktobat) => (
                <AccordionItem
                  key={maktobat.id}
                  value={maktobat.id}
                  className="text-center"
                >
                  <AccordionTrigger>{maktobat.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="mb-4 pb-2">
                      <p className="text-sm">{maktobat.content}</p>
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

                      <div className="rounded-xl shadow-md p-4 mt-4">
                        <SheetDescription className="text-primary text-sm font-semibold mb-2">
                          🎧 پخش صوت
                        </SheetDescription>
                        {maktobat.audioUrl ? (
                          <audio
                            controls
                            className="w-full rounded-md outline-none focus:ring-2 focus:ring-primary"
                          >
                            <source src={maktobat.audioUrl} type="audio/mpeg" />
                            مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                          </audio>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            فایل صوتی موجود نیست
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
              <AccordionItem value="group-2">
                <AccordionTrigger>مباحث متفرقه</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4">
                  <div className="rounded-xl shadow-md p-4">
                    <SheetDescription className="text-primary text-sm font-semibold mb-2">
                      🎧 گفتمان
                    </SheetDescription>
                    <audio
                      controls
                      className="w-full rounded-md outline-none focus:ring-2 focus:ring-primary"
                    >
                      <source src={goftegooha["1"]} type="audio/mpeg" />
                      مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                    </audio>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

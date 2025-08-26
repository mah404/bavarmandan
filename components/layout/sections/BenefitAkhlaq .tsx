"use client";

import { useState } from "react";
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



export const BenefitAkhlaq = () => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { play } = useAudioPlayer(); // ← use the global player


  const fetchDescription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/benefit?id=akhlagh");
      await res.json();
    } finally {
      setLoading(false);
    }
  };

  const audioFiles = [
    {
      title: "جلسه اول مجموعه شیعه و میراث فاطمی ",
      description: "دوشنبه،آن روز تاریک",
      url: "https://www.dropbox.com/scl/fi/btmozuf3laxsbgsmbmy24/1shieefatemi1.mp3?rlkey=lc0q4kshy9af1tbwqy290oa6x&st=mp9fwkgr&dl=1",
    },
    {
      title: "جلسه دوم مجموعه شیعه و میراث فاطمی",
      description: "سقیفه ، حلوای حکومت، بلوای بدعت",
      url: "https://www.dropbox.com/scl/fi/5oz26x4j7osyxvuxxfck3/2shieefatemi2.mp3?rlkey=li2lib2nfpp5do5brcjhcj8ua&st=vr39in6y&dl=1",
    },
    {
      title: "جلسه سوم مجموعه شیعه و میراث فاطمی",
      description: " فدک ، صدای حق طلبی فاطمی",
      url: "https://www.dropbox.com/scl/fi/rh1sorwji64exrxm3flqs/3shieefatemi4.mp3?rlkey=ur0oa9u7f1ve39qfq6zzshysu&st=j4ek72gy&dl=1",
    },
    {
      title: "جلسه چهارم مجموعه شیعه و میراث فاطمی",
      description: "در تکاپوی نجات امت رسول (ص)",
      url: "https://www.dropbox.com/scl/fi/47rrmjad2ho2r3exs76b4/4shieefatemi3.mp3?rlkey=r5yzdbzo5kvqhckg7gv0cpl71&st=g7oehbku&dl=1",
    },
    {
      title: "گفتگوی قرآنی",
      description: "عصمت انبیا",
      url: "https://www.dropbox.com/scl/fi/z72trsexlmb6qqdwpuebs/5goftegooqoraaniesmat.mp3?rlkey=rowl60vaoscx9kc9jrvhh5nh2&st=uf6tidxe&dl=1",
    },
    {
      title: "گفتگوی قرآنی",
      description: "شفاعت",
      url: "https://www.dropbox.com/scl/fi/b4ryi5fysvuilaebrh4hq/6goftegooyeqoraanishefaat.mp3?rlkey=w1kd24o757hyh88jollmzdp89&st=0vaqeb7s&dl=1",
    },
  ];

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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>مباحث اعتقادی</SheetTitle>
            <SheetDescription>
              {loading ? (
                <Lottie
                  animationData={loadingPdfAnim}
                  loop
                  className="text-muted-foreground bg-transparent mt-4"
                />
              ) : (
                <div>
                  <Accordion type="single" collapsible className="w-full">
                    {/* First 4 sessions */}
                                        

                    <AccordionItem value="group-1 ">
                      <AccordionTrigger>شیعه و میراث فاطمی</AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-4  justify-center  mt-2 text-center">
                        {audioFiles.slice(0, 4).map((file, i) => (
                          <div
                            key={i}
                            className="border-b border-muted-foreground p-2"
                          >
                           <div className="font-semibold mb-2 text-muted-foreground">{file.description}</div>
                            <Button
                              onClick={() => play({ title: file.title, url: file.url, description: file.description })}
                              className="w-full text-card"
                            >
                              پخش
                            </Button>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Last 2 sessions */}
                    <AccordionItem value="group-2">
                      <AccordionTrigger>گفتگوهای قرآنی</AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-4  justify-center  text-center">
                        {audioFiles.slice(4).map((file, i) => (
                          <div
                            key={i + 4}
                            className="border-b border-muted-foreground  p-2"
                          >
                             <div className="font-semibold mb-2 text-primary">{file.description}</div>
                            <Button
                              onClick={() => play({ title: file.title, url: file.url, description: file.description })}
                              className="w-full text-card"
                            >
                              پخش
                            </Button>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="group-2">
                      <AccordionTrigger> مباحث متفرقه</AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-4"></AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
};

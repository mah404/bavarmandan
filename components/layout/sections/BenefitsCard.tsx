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

export const BenefitsCard = () => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

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

  const audioGroups = [
    {
      subject: "تاملاتی در من",
      files: [
        {
          title: "تاملاتی در من",
          url: "https://www.dropbox.com/scl/fi/yn7lczizzy1taskripz60/1.mp3?rlkey=kvcoqgwwxrii8m3x6ug4svfym&st=687lourl&dl=1",
        },
      ],
    },
    {
      subject: "تکبر",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/zqea6e5d8vbgjz6ecuc2l/2.mp3?rlkey=91xd88htnx7srj739w6mbeifx&st=4xsk09we&dl=1",
        },
        {
          title: " جلسه 2",
          url: "https://www.dropbox.com/scl/fi/7etmwkuogzmfvu7ft04xy/3.mp3?rlkey=os2ysd1ldgh2iatqms0y9y6zf&st=8ul2eapt&dl=1",
        },
        {
          title: " جلسه 3",
          url: "https://www.dropbox.com/scl/fi/jt6lctlt58mjt3jfyjv01/4.mp3?rlkey=h0ydwofk1wvr9ooqc9rowwp8u&st=dwgfd14d&dl=1",
        },
        {
          title: " جلسه 4",
          url: "https://www.dropbox.com/scl/fi/1zr6e5vxsbittcszg9usd/5.mp3?rlkey=uw6qo2khku1ogde5mz631nmdm&st=anc8arrc&dl=1",
        },
        {
          title: " جلسه 5",
          url: "https://www.dropbox.com/scl/fi/bzzbu5oehjr25kav1nv70/6.mp3?rlkey=6att9368qo7bgcwfb7xnoubrm&st=8ho804ip&dl=1",
        },
      ],
    },
    {
      subject: "حب دنیا",
      files: [
        {
          title: "  جلسه 1",
          url: "https://www.dropbox.com/scl/fi/f09wvxxo5sy7ifu6qzkpg/7.mp3?rlkey=5vnt1nexzl6pl03qn9h1z0l16&st=1l43h5w9&dl=1",
        },
        {
          title: "  جلسه 2",
          url: "https://www.dropbox.com/scl/fi/l6vdqt0515jcq6d9swhgh/8.mp3?rlkey=406plqjht70ban0z9dmmpkbpu&st=jfg5vfzj&dl=1",
        },
        {
          title: "  جلسه 3",
          url: "https://www.dropbox.com/scl/fi/79xiee3x4d00j42wzus69/9.mp3?rlkey=p4i1rfj2jimwr24w6fqg2rkus&st=dl56r9yf&dl=1",
        },
        {
          title: "  جلسه 4",
          url: "https://www.dropbox.com/scl/fi/2864z3i4kuv0asru4f7zm/10.mp3?rlkey=jven8z7axkbbdncv2l1uh28v2&st=kd806nvi&dl=1",
        },
      ],
    },
    {
      subject: "بخل",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/82ohswqxjc9p7cj9na34r/11.mp3?rlkey=rsjqugxoprpetwrx0154xl6h8&st=pb41q7cf&dl=1",
        },
        {
          title: " جلسه 2",
          url: "https://www.dropbox.com/scl/fi/21h43ppd999i9b4wszi5m/12.mp3?rlkey=fbqh8hi31bow5cp7wklv19v3y&st=2b8zmcag&dl=1",
        },
      ],
    },
    {
      subject: "غضب",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/virpbx20rjt5galhkxbzh/13.mp3?rlkey=fqto073o5pbchltaotfr109zp&st=grbrmvn2&dl=1",
        },
        {
          title: " جلسه 2",
          url: "https://www.dropbox.com/scl/fi/r7hla81d9ltm94pcl815k/14.mp3?rlkey=g6tlyb8q53o5p5ac1vp427j3t&st=vdy5ln68&dl=1",
        },
      ],
    },
    {
      subject: "غیبت",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/1jh14grkq5c7jltgyhowj/15.mp3?rlkey=vbjgogsupv7o0ocfsa8kzlkza&st=ci50opaa&dl=1",
        },
        {
          title: " جلسه 2",
          url: "https://www.dropbox.com/scl/fi/qsdrpkcyefcp9f93u2k9y/16.mp3?rlkey=vy40syda3ofku4m5gp5gabddc&st=cbfdk3lw&dl=1",
        },
      ],
    },
    {
      subject: "نفاق",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/5i2iqkg0ugkhi7s27pdq4/17.mp3?rlkey=ulri5t4m7zxvwhl00v68438s5&st=kd1am8u9&dl=1",
        },
        {
          title: " جلسه 2",
          url: "https://www.dropbox.com/scl/fi/amu5z7k7utoc4f6hrxf7l/18.mp3?rlkey=7e93zo69lbrb2cv8k5f6fxrs9&st=l73iqbw6&dl=1",
        },
      ],
    },
    {
      subject: "تعصب",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/62qh6g05uo6vconz63ykn/19.mp3?rlkey=f1vmlqc9cw1faglxbdy6tlunw&st=urtpmqsw&dl=1",
        },
      ],
    },
    {
      subject: "حسد",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/35ylh3ed4fwomph4zrsk8/20.mp3?rlkey=17rewvu79egyzee0ivm1sxjr2&st=xlkf99o2&dl=1",
        },
        {
          title: " جلسه 2",
          url: "https://www.dropbox.com/scl/fi/qm8kzmdd7w5ug11ha8uyk/21.mp3?rlkey=jnw7o23z0lswbxyqey1a8hnpp&st=k5iszdsz&dl=1",
        },
      ],
    },
    {
      subject: "عجب",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/v8r4f6yi7cxuk5ljl31tj/22.mp3?rlkey=09gvkjutypjlcrcxxa56rwmk0&st=j2ai9xm3&dl=1",
        },
        {
          title: " جلسه 2",
          url: "https://www.dropbox.com/scl/fi/z0l7o3sc93ekywx2iggpp/23.mp3?rlkey=nrbkk1ubn0axnb2klosxjfps8&st=yngzxvf2&dl=1",
        },
      ],
    },
    {
      subject: "ریا",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/akfbj37610nflcj6rovfk/24.mp3?rlkey=aaxnaa5ydy8cbfzhwzoeqck5i&st=mim34u8e&dl=1",
        },
        {
          title: " جلسه 2",
          url: "https://www.dropbox.com/scl/fi/2zl88n8j6jik4niybc5dp/25.mp3?rlkey=dnhh8fzzue1axid8rn74al71p&st=f18l57r5&dl=1",
        },
        {
          title: " جلسه 2",
          url: "https://www.dropbox.com/scl/fi/yh84c2odpw2xf8eov5cbp/26.mp3?rlkey=eq51zazeg8iddzv7eemt7k3ve&st=1halkxrb&dl=1",
        },
      ],
    },
    {
      subject: "دعا",
      files: [
        {
          title: " جلسه 1",
          url: "https://www.dropbox.com/scl/fi/auck20y8ewe2jjkuh0aay/27.mp3?rlkey=5gy6t06mhjgce4b1mvjqavbr5&st=wuuabutq&dl=1",
        },
      ],
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
        <span className="text-5xl text-muted-foreground/15 font-medium">04</span>
      </div>
      <CardTitle>مباحث اخلاقی</CardTitle>
    </CardHeader>
  </Card>

  <Sheet open={open} onOpenChange={setOpen}>
    <SheetContent className="overflow-y-auto">
      <SheetHeader>
        <SheetTitle>مباحث اخلاقی</SheetTitle>
        <SheetDescription>
          {loading ? (
            <Lottie
              animationData={loadingPdfAnim}
              loop
              className="text-muted-foreground bg-transparent mt-4"
            />
          ) : (
            <Accordion type="multiple" className="w-full">
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
                        key={fileIndex}
                        className="border-b border-muted-foreground p-2"
                      >
                        <div className="font-semibold mb-3 text-primary">
                          {file.title}
                        </div>
                        <audio
                          controls
                          className="w-full mb-2"
                          onPlay={(event) => {
                            document.querySelectorAll("audio").forEach((audio) => {
                              if (audio !== event.currentTarget) audio.pause();
                            });
                          }}
                        >
                          <source src={file.url} type="audio/mpeg" />
                          مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                        </audio>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  </Sheet>
</>

  );
};

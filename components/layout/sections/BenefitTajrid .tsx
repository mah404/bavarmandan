"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { BookOpenText } from "lucide-react";
import loadingPdfAnim from "@/public/loadingpdf.json";
import Lottie from "lottie-react";

// Dropbox audio files mapping for Tajrid (1-23)
const tajridAudios: string[] = [
  "https://www.dropbox.com/scl/fi/wa5vq9ddmzwebablt1br4/tajrid1.mp3?rlkey=az1c5ef2zzhe8v3ycui85zbaw&st=dvsslaaa&dl=1",
  "https://www.dropbox.com/scl/fi/mwc6vkkqzb42nlytto184/tajrdi2.mp3?rlkey=2y4v8b87h0q342v77av0fi3uq&st=kimvjjxs&dl=1",
  "https://www.dropbox.com/scl/fi/i6glbaxcqcpmwwnvq3tjc/tajrid3.mp3?rlkey=m8vxgumon1oa2twziu8buc6rx&st=wtls75yw&dl=1",
  "https://www.dropbox.com/scl/fi/fgptpen1zio3ryhp358ar/tajrid4.mp3?rlkey=s6m7otcgynr7b7b4t3i3096pn&st=hipsfk3b&dl=1",
  "https://www.dropbox.com/scl/fi/c8rmvyomqfjmd8emt8ilp/tajrid5.mp3?rlkey=gq09dhzw7vql6e7z3npzjsnh3&st=l12vsvfl&dl=1",
  "https://www.dropbox.com/scl/fi/solal1yet7rcdzfxm507c/tajrid6.mp3?rlkey=imv1r2ywtnj9nytl95z7mal07&st=bzzssevl&dl=1",
  "https://www.dropbox.com/scl/fi/tuvxatxw83gocza67dfny/tajrid7.mp3?rlkey=w11h3pw4hn3j0c5d5zvra1ffq&st=8ftsfwlz&dl=1",
  "https://www.dropbox.com/scl/fi/vu2nkhvfsb07tkgn8n85o/tajrid8.mp3?rlkey=12jcwtev2tq5pex53wy48kym3&st=3ehufuqa&dl=1",
];



export const BenefitTajrid = () => {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sections.length === 0) {
      setLoading(true);
      fetch("/api/tajrid")
        .then((res) => res.json())
        .then((data) => setSections(data))
        .catch(() => console.error("❌ Error loading PDFs"))
        .finally(() => setLoading(false));
    }
  }, [open]);

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="cursor-pointer hover:bg-background transition"
      >
        <CardHeader>
          <div className="flex justify-between">
            <BookOpenText size={32} color="hsl(var(--primary))" />
            <span className="text-5xl text-muted-foreground/15 font-medium">
              02
            </span>
          </div>
          <CardTitle>کتاب تجرید الاعتقاد</CardTitle>
        </CardHeader>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-h-screen overflow-y-auto">
          <SheetHeader>
            <SheetTitle>کتاب تجرید الاعتقاد</SheetTitle>
            <SheetDescription>
              {loading ? (
                <Lottie
                  animationData={loadingPdfAnim}
                  loop
                  className="text-muted-foreground bg-transparent mt-4"
                />
              ) : (
                <Accordion type="single" collapsible className="w-full mt-4">
                  {sections.map((section: any) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger>{section.title}</AccordionTrigger>
                      <AccordionContent>
                        <a href={section.pdfUrl} download>
                          <Button>PDF</Button>
                        </a>
                      </AccordionContent>
                    </AccordionItem>
                  ))}

                  <AccordionItem value="tajrid-audio">
                    <AccordionTrigger>فایل‌های صوتی تجرید الاعتقاد</AccordionTrigger>
                    <AccordionContent>
                      {tajridAudios.map((url, i) => (
                        <div key={i} className="mb-4">
                          <SheetDescription className="text-sm mb-1">جلسه {i + 1}</SheetDescription>
                          <audio controls className="w-full">
                            <source src={url} type="audio/mpeg" />
                            مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                          </audio>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
};

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
  "https://www.dropbox.com/scl/fi/32gq08cqvm52eob8s0qsy/tajrid9.mp3?rlkey=7e4huy451fkz15sxjwd5y3q53&st=tt9ap55p&dl=1",

  "https://www.dropbox.com/scl/fi/1vdl2x6ue2urfztgu1wsg/tajrid10.mp3?rlkey=s5igsuz69ke2v1xkgadg1owu6&st=jek6i9cn&dl=1",
  "https://www.dropbox.com/scl/fi/qelngel22f7j8nse8ubiw/tajrid11.mp3?rlkey=spm58poolujz4bo6iru0fqem3&st=jo7x73vi&dl=1",
  "https://www.dropbox.com/scl/fi/44illo71jw06tyj6ugjph/tajrid12.mp3?rlkey=p211tb3pn7q1ipxl0eu6wz6fp&st=0uj0ne9i&dl=1",
  "https://www.dropbox.com/scl/fi/dbcsk491hwbv8hoxrti4r/tajrid13.mp3?rlkey=qrnqgdu2bpbqb50pbq4y8fvn9&st=m6ze0d27&dl=1",
  "https://www.dropbox.com/scl/fi/dq1thxesyvpe3jjo9l6y3/tajrid14.mp3?rlkey=s64ejts2apwoqpgbqqyq0cia2&st=5xedt3bs&dl=1",
  "https://www.dropbox.com/scl/fi/aeclnvfn223tf5q9wbv6n/tajrid15.mp3?rlkey=mdkd3bgjydwl85pyu6pw4pnty&st=4kzul2bo&dl=1",
  "https://www.dropbox.com/scl/fi/vco9kk3v27lew5rc7pnh1/tajrid16.mp3?rlkey=2sqyjomjvff8lqcjcvcpeniem&st=fbuwpp6p&dl=1",
  "https://www.dropbox.com/scl/fi/u295bcy6e9mvgx7vwfdf7/tajrid17.mp3?rlkey=cuxbuzr3yv5cfgg0klyke4bov&st=njkes2kl&dl=1",
  "https://www.dropbox.com/scl/fi/3enwxgoe0o7rgom8hm2eu/tajrid18.mp3?rlkey=cemfyp5n448q3mbipawwa9k7o&st=tyy79kif&dl=1",
  "https://www.dropbox.com/scl/fi/2wwp64nu3p53uoq23ch69/tajrid19.mp3?rlkey=8rtig64yi9fdoiwjak9zqjtaw&st=7pacwlm7&dl=1",
  "https://www.dropbox.com/scl/fi/fz600nrej39galrvbinno/tajrid20.mp3?rlkey=sm3r2wekd6jqc6suoj4w0wv8u&st=xs3lioa9&dl=1",
  "https://www.dropbox.com/scl/fi/slfjmnlmahm4zb0krcvwz/tajrid21.mp3?rlkey=3dbq3ig6wbhryyx6vd55rbgys&st=bvg128ph&dl=1",
  "https://www.dropbox.com/scl/fi/btt3vrlpjbx351irr7828/tajrid22.mp3?rlkey=xty7hkn2jgcg7xlpcf9nluqip&st=7c6izqhh&dl=1",
  "https://www.dropbox.com/scl/fi/rp0272b3bp1blntoi2i5k/tajrid23.mp3?rlkey=je7yj26e6n0z0pacc3c27amhd&st=jr6mfi0i&dl=1",
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
                  {/* PDFs in one item */}
                  <AccordionItem value="tajrid-pdfs">
                    <AccordionTrigger>
                      فایل‌های PDF تجرید الاعتقاد
                    </AccordionTrigger>
                    <AccordionContent>
                      {sections.map((section: any) => (
                        <div
                          key={section.id}
                          className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                        >
                          <span className="text-sm text-muted-foreground">
                            {section.title}
                          </span>
                          <div className="flex gap-2">
                            <a
                              href={section.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline">نمایش</Button>
                            </a>
                            <a href={section.pdfUrl} download>
                              <Button>دانلود</Button>
                            </a>
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  {[...tajridAudios].reverse().map((url, i) => {
                    const sessionNumber = tajridAudios.length - i; // 23 - i
                    return (
                      <AccordionItem
                        key={`audio-${sessionNumber}`}
                        value={`audio-${sessionNumber}`}
                      >
                        <AccordionTrigger>
                          جلسه {sessionNumber}
                        </AccordionTrigger>
                        <AccordionContent>
                          <audio controls className="w-full">
                            <source src={url} type="audio/mpeg" />
                            مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                          </audio>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
};

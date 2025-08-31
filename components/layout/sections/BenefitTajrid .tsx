"use client";

import { useEffect, useMemo, useState } from "react";
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
import loadingPdfAnim from "@/public/loading.json";
import Lottie from "lottie-react";
import { useRouter } from "next/navigation";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";

// PDF config
const TOTAL_PDFS = 2; 
const BASE_PATH = ""; 

const tajridAudios = [
  {
    url: "https://www.dropbox.com/scl/fi/wa5vq9ddmzwebablt1br4/tajrid1.mp3?rlkey=az1c5ef2zzhe8v3ycui85zbaw&st=dvsslaaa&dl=1",
    DescriptionOne: "۱-زندگینامه خواجه طوسی(ره)",
    DescriptionTwo: "۲-نگاهی اجمالی به کتاب تجرید و شروح آن",
    DescriptionThree: "۳-تعریف علم کلام",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/mwc6vkkqzb42nlytto184/tajrdi2.mp3?rlkey=2y4v8b87h0q342v77av0fi3uq&st=kimvjjxs&dl=1",
    DescriptionOne: "۱-بررسی خطبه مولف",
    DescriptionTwo: "۲-بررسی مباحث کتاب",
    DescriptionThree: "۳-تعریف امور عامه",
    DescriptionFour: "۴-بررسی انواع معقولات(معقول اولی و ثانی) و تمایزات آنها",
  },
  {
    url: "https://www.dropbox.com/scl/fi/i6glbaxcqcpmwwnvq3tjc/tajrid3.mp3?rlkey=m8vxgumon1oa2twziu8buc6rx&st=wtls75yw&dl=1",
    DescriptionOne: "۱-تقسیم علم حصولی به تصور و تصدیق",
    DescriptionTwo: "۲-اثبات وجود بدیهی در تصورات و تصدیقات",
    DescriptionThree: "۳-توضیح محل درست تعریف منطقی",
    DescriptionFour: "۴-تفاوت شرح لفظ یا تعریف حقیقی",
    DescriptionFive: "۵-مختصری در باب بداهت مفهوم وجود",
  },
  {
    url: "https://www.dropbox.com/scl/fi/fgptpen1zio3ryhp358ar/tajrid4.mp3?rlkey=s6m7otcgynr7b7b4t3i3096pn&st=hipsfk3b&dl=1",
    DescriptionOne: "۱-استحاله تناقض تصدیق اولی است",
    DescriptionTwo: "۲-وجود اولی التصور است",
    DescriptionThree: "۳-وجود اول الاوایل است",
    DescriptionFour: "۴-تعریف کلیات خمس",
    DescriptionFive: "۵-وجود جنس و فصل و خاصه ندارد",
    DescriptionSix: "۶-همه تعاریف وجود شرح لفظ است",
  },
  {
    url: "https://www.dropbox.com/scl/fi/c8rmvyomqfjmd8emt8ilp/tajrid5.mp3?rlkey=gq09dhzw7vql6e7z3npzjsnh3&st=l12vsvfl&dl=1",
    DescriptionOne: "۱-تعریف اشتراک لفظی و اشتراک معنوی",
    DescriptionTwo: "۲-اشتراک معنوی وجود به چه معناست",
    DescriptionThree: "۳-بیان ادله اشتراک معنوی وجود",
    DescriptionFour:
      "۴-قول به اشتراک لفظی وجود میان خالق و مخلوق مستلزم تعطیل عقل از معرفت خداوند است",
  },
  {
    url: "https://www.dropbox.com/scl/fi/solal1yet7rcdzfxm507c/tajrid6.mp3?rlkey=imv1r2ywtnj9nytl95z7mal07&st=bzzssevl&dl=1",
    DescriptionOne: "۱-معنای زیادت مفهومی وجود بر ماهیت",
    DescriptionTwo: "۲-توضیحی در باب تعریف ماهیت",
    DescriptionThree: "۳-برسی بخشی از دلایل زیادت وجود بر ماهیت",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/tuvxatxw83gocza67dfny/tajrid7.mp3?rlkey=w11h3pw4hn3j0c5d5zvra1ffq&st=8ftsfwlz&dl=1",
    DescriptionOne: "ادامه بررسی ادله زیادت وجود بر ماهیت",
    DescriptionTwo: "",
    DescriptionThree: "",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/vu2nkhvfsb07tkgn8n85o/tajrid8.mp3?rlkey=12jcwtev2tq5pex53wy48kym3&st=3ehufuqa&dl=1",
    DescriptionOne: "۱-تاریخچه بحث وجود ذهنی",
    DescriptionTwo: "۲-تفاوت تقسیم قیاسی و نفسی",
    DescriptionThree: "۳-تعریف قضیه ی حقیقیه ",
    DescriptionFour: "۴-اثبات وجود ذهنی",
  },
  {
    url: "https://www.dropbox.com/scl/fi/32gq08cqvm52eob8s0qsy/tajrid9.mp3?rlkey=7e4huy451fkz15sxjwd5y3q53&st=tt9ap55p&dl=1",
    DescriptionOne: "۱-اشکالی بر وجود ذهنی",
    DescriptionTwo: "۲-پاسخ خواجه طوسی در رد اشکال",
    DescriptionThree: "۳-شرح علامه حلی بر پایخ خواجه طوسی",
    DescriptionFour: "۴-شرح نظریه اشباح محکی و نقد آن",
  },
  {
    url: "https://www.dropbox.com/scl/fi/1vdl2x6ue2urfztgu1wsg/tajrid10.mp3?rlkey=s5igsuz69ke2v1xkgadg1owu6&st=jek6i9cn&dl=1",
    DescriptionOne: "۱-انطباق چیست",
    DescriptionTwo: "۲-تفاوت صدق و اندراج",
    DescriptionThree: "۳-نحوه انتزاع و صدق ماهیت بر واقعیت",
    DescriptionFour: "۴-حل اشکال وارد بر وجود ذهنی",
  },
  {
    url: "https://www.dropbox.com/scl/fi/qelngel22f7j8nse8ubiw/tajrid11.mp3?rlkey=spm58poolujz4bo6iru0fqem3&st=jo7x73vi&dl=1",
    DescriptionOne: "۱-وجود وصفی عقلی است",
    DescriptionTwo: "۲-وجود نفس تحقق ماهیت تست",
    DescriptionThree: "۳-چیستی حیثیت تقییدیه",
    DescriptionFour: "۴-وجود در حمل موجود بر ماهیت حیثیت تقییدیه است",
  },
  {
    url: "https://www.dropbox.com/scl/fi/44illo71jw06tyj6ugjph/tajrid12.mp3?rlkey=p211tb3pn7q1ipxl0eu6wz6fp&st=0uj0ne9i&dl=1",
    DescriptionOne: "1-مقدمات عدم تزاید و اشتداد در وجود",
    DescriptionTwo: "2-کثرت فرع بر تمایز است",
    DescriptionThree: "3-انواع تمایز",
    DescriptionFour: "4-تشکیک چیست",
  },
  {
    url: "https://www.dropbox.com/scl/fi/dbcsk491hwbv8hoxrti4r/tajrid13.mp3?rlkey=qrnqgdu2bpbqb50pbq4y8fvn9&st=m6ze0d27&dl=1",
    DescriptionOne: "۱-معیار عام تشکیک چیست",
    DescriptionTwo: "۲-تشکیک در مفهوم محال است",
    DescriptionThree: "۳-تشکیک در صدق مفهوم محال است",
    DescriptionFour: "۴-تصویر صحیح تشکیک در مصداق وجود چیست؟",
  },
  {
    url: "https://www.dropbox.com/scl/fi/dq1thxesyvpe3jjo9l6y3/tajrid14.mp3?rlkey=s64ejts2apwoqpgbqqyq0cia2&st=5xedt3bs&dl=1",
    DescriptionOne:
      "1-بررسی احتمالا مختلف در شرح عبارت ((و لا تزايد فيه ، و لا اشتداد ))",
    DescriptionTwo: "2-شرح دلیل علامه حلی بر عدم اشتداد و زیادت در وجود ماهیات",
    DescriptionThree: "",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/aeclnvfn223tf5q9wbv6n/tajrid15.mp3?rlkey=mdkd3bgjydwl85pyu6pw4pnty&st=4kzul2bo&dl=1",
    DescriptionOne: "۱-معنای شر و خیر",
    DescriptionTwo: "۲-وجود خیر محض است به چه معناست",
    DescriptionThree: "۳-خیر محض بودن خدای سبحان",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/vco9kk3v27lew5rc7pnh1/tajrid16.mp3?rlkey=2sqyjomjvff8lqcjcvcpeniem&st=fbuwpp6p&dl=1",
    DescriptionOne: "۱-تعریف تباین الفاظ و بررسی اقسام آن در علم منطق",
    DescriptionTwo: "۲-تعریف تقابل و بررسی اقسام آن",
    DescriptionThree: "۳-تعریف تضاد و بیان مقدمه ای بر ضد نداشتن وجود",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/u295bcy6e9mvgx7vwfdf7/tajrid17.mp3?rlkey=cuxbuzr3yv5cfgg0klyke4bov&st=njkes2kl&dl=1",
    DescriptionOne: "۱-توضیحی پیرامون مقولات عشر",
    DescriptionTwo: "۲-بیان دلایل ضد نداشتن وجود",
    DescriptionThree: "",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/3enwxgoe0o7rgom8hm2eu/tajrid18.mp3?rlkey=cemfyp5n448q3mbipawwa9k7o&st=tyy79kif&dl=1",
    DescriptionOne: "۱-توضیحی پیرامون مثل",
    DescriptionTwo: "۲-تعریف مفهوم جزیی و کلی",
    DescriptionThree: "۳-اثبات آنکه وجود مثل ندارد",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/2wwp64nu3p53uoq23ch69/tajrid19.mp3?rlkey=8rtig64yi9fdoiwjak9zqjtaw&st=7pacwlm7&dl=1",
    DescriptionOne: "۱-توضیح پیرامون تخالف مفاهیم",
    DescriptionTwo: "۲-مفهوم وجود مخالف معقولات است ولی مقابل با آنها نیست",
    DescriptionThree: "",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/fz600nrej39galrvbinno/tajrid20.mp3?rlkey=sm3r2wekd6jqc6suoj4w0wv8u&st=xs3lioa9&dl=1",
    DescriptionOne: "۱-معنای مساوقت و تفاوت آن با تساوی",
    DescriptionTwo: "۲-وجود مساوق با شییت هست",
    DescriptionThree: "",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/slfjmnlmahm4zb0krcvwz/tajrid21.mp3?rlkey=3dbq3ig6wbhryyx6vd55rbgys&st=bvg128ph&dl=1",
    DescriptionOne: "۱-توضیح نظریه حال",
    DescriptionTwo:
      "۲-نظریه حال و واسطه میان وجود و عدم با قدرت الهی تعارض دارد",
    DescriptionThree: "",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/btt3vrlpjbx351irr7828/tajrid22.mp3?rlkey=xty7hkn2jgcg7xlpcf9nluqip&st=7c6izqhh&dl=1",
    DescriptionOne:
      "۱-ثبوت معدومات مستلزم نا متناهی بودن امور ثابت است و این باطل است",
    DescriptionTwo: "۲-رد ادله ارایه شده برای،ثبوت معدومات ممکن",
    DescriptionThree: "",
    DescriptionFour: "",
  },
  {
    url: "https://www.dropbox.com/scl/fi/rp0272b3bp1blntoi2i5k/tajrid23.mp3?rlkey=je7yj26e6n0z0pacc3c27amhd&st=jr6mfi0i&dl=1",
    DescriptionOne: "۱-امکان صفت اعتباری است و نه ثبوتی",
    DescriptionTwo: "۲-رد دلیل دوم قائلین به ثبوت معدومات",
    DescriptionThree: "",
    DescriptionFour: "",
  },
    {
    url: "https://www.dropbox.com/scl/fi/byui4lu2gd7859awilqcm/24.mp3?rlkey=v1bilhwfmf5t4dpnn6o6ay0vs&st=yzuzl696&dl=1",
    DescriptionOne: "۱-مروری بر مباحث گذشته",
    DescriptionTwo: "(یازده مساله)",
    DescriptionThree: "",
    DescriptionFour: "",
  },
];

const toStreamable = (u: string) => {
  if (!u) return u;
  if (!u.includes("dropbox.com")) return u;
  const noParam = u.replace(/([?&])(dl|raw)=[01]/g, "").replace(/[?&]$/, "");
  return noParam + (noParam.includes("?") ? "&raw=1" : "?raw=1");
};
interface PdfSection {
  id: string;
  pdfUrl: string;
}
export const BenefitTajrid = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { play } = useAudioPlayer(); 

  const sections: PdfSection[] = useMemo(() => {
    return Array.from({ length: TOTAL_PDFS }, (_, i) => {
      const n = i + 1;
      const path = `${BASE_PATH}/${n}.pdf`.replace("//", "/");
      return { id: `v${n}`, pdfUrl: path };
    });
  }, []);

  const toDownloadUrl = (u: string) => u; 

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
          <CardTitle>دروس شرح کتاب تجرید الاعتقاد</CardTitle>
        </CardHeader>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-h-screen overflow-y-auto">
          <SheetHeader>
            <SheetTitle>دروس شرح کتاب تجرید الاعتقاد</SheetTitle>
            <SheetDescription>
              {loading ? (
                <Lottie
                  animationData={loadingPdfAnim}
                  loop
                  className="text-muted-foreground bg-transparent mt-4"
                />
              ) : (
                <Accordion type="single" collapsible className="w-full mt-4">
                  {/* PDFs */}
                  <AccordionItem value="tajrid-pdfs">
                    <AccordionTrigger>کتاب شرح تجرید الاعتقاد</AccordionTrigger>
                    <AccordionContent>
                      {sections.map((section, index) => {
                        const vol = index + 1;
                        const label = `کتاب کشف المراد جلد ${vol}`;
                        const fileName = `${label}.pdf`;
                        return (
                          <div
                            key={section.id}
                            className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                          >
                            <span className="text-sm text-muted-foreground">
                              {label}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(section.pdfUrl, "_blank")
                                }
                              >
                                نمایش
                              </Button>
                              <Button
                                className="text-card"
                                size="sm"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = section.pdfUrl;
                                  a.download = fileName; // browsers may honor this for same-origin
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                              >
                                دانلود
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Audios */}
                  {[...tajridAudios].reverse().map((audio, i, arr) => {
                    const sessionNumber = arr.length - i;
                    const descriptions = [
                      audio.DescriptionOne,
                      audio.DescriptionTwo,
                      audio.DescriptionThree,
                      audio.DescriptionFour,
                      (audio as any).DescriptionFive,
                      (audio as any).DescriptionSix,
                    ].filter((d) => d && String(d).trim() !== "") as string[];

                    const url = toStreamable(audio.url); 

                    return (
                      <AccordionItem
                        key={`audio-${sessionNumber}`}
                        value={`audio-${sessionNumber}`}
                      >
                        <AccordionTrigger>
                          جلسه {sessionNumber}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          {descriptions.length > 0 && (
                            <div
                              className="text-sm text-primary leading-relaxed text-right"
                              dir="rtl"
                            >
                              {descriptions.map((desc, idx) => (
                                <p key={idx}>{desc}</p>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            {/* Play button */}
                            <Button
                              className="w-full sm:w-auto text-card"
                              onClick={() => {
                                if (!url) {
                                  console.error(
                                    "No URL for session",
                                    sessionNumber,
                                    audio
                                  );
                                  return;
                                }
                                play({
                                  title: `جلسه ${sessionNumber}`,
                                  url, 
                                  description: descriptions.length
                                    ? descriptions.join(" | ")
                                    : undefined,
                                });
                              }}
                            >
                              پخش
                            </Button>

                            {/* Download button */}
                            <Button
                              asChild
                              variant="outline"
                              className="w-full sm:w-auto"
                            >
                              <a
                                href={toDownloadUrl(url)}
                                download={`جلسه-${sessionNumber}.mp3`}
                                rel="noopener noreferrer"
                              >
                                دانلود صوت
                              </a>
                            </Button>
                          </div>
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

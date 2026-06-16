import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Instagram,
  MessageCircle,
  Send,
  Youtube,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverLift, MotionItem, MotionList, Reveal } from "./reveal";

interface ServiceProps {
  title: string;
  description: string;
  link: string;
  icon: LucideIcon;
  label: string;
}

const serviceList: ServiceProps[] = [
  {
    title: "تلگرام مجمع باورمندان کلاب هاوس",
    description: "کانال اطلاع رسانی برنامه ها و جلسات مجمع",
    link: "https://t.me/bavarmandan110",
    icon: Send,
    label: "تلگرام",
  },
  {
    title: "ارتباط مستقیم",
    description: "ارسال سوالات، انتقادات، پیشنهادات و نقطه نظرات",
    link: "https://t.me/bavarmandan_bot",
    icon: MessageCircle,
    label: "ارتباط",
  },
  {
    title: "کانال یوتیوب",
    description: "آرشیو ویدیوها و محتوای تصویری",
    link: "https://www.youtube.com/@bavarmandan110",
    icon: Youtube,
    label: "ویدیو",
  },
  {
    title: "اینستاگرام",
    description: "حضور مجمع در شبکه اجتماعی اینستاگرام",
    link: "https://www.instagram.com/bavarmandan110/",
    icon: Instagram,
    label: "اجتماعی",
  },
];

export const ServicesSection = () => {
  return (
    <section id="tarnama" className="container py-20 sm:py-28">
      <Reveal
        className="mx-auto mb-10 flex max-w-5xl flex-col items-center text-center"
        dir="rtl"
      >
        <span className="mb-4 h-px w-24 bg-gradient-to-l from-transparent via-primary to-transparent" />
        <h2 className="mt-2 text-4xl font-extrabold leading-[1.7] text-primary md:text-5xl">
          <span className="text-2xl align-super">*</span>
          تارنماهای مرتبط
        </h2>
      </Reveal>

      <Reveal delay={0.08} className="mx-auto w-full max-w-6xl">
        <MotionList className="grid auto-rows-fr gap-4 lg:grid-cols-2" dir="rtl">
          {serviceList.map(({ title, description, link, icon: Icon, label }) => (
            <MotionItem key={title} className="h-full">
              <HoverLift className="h-full">
                <Link
                  href={link}
                  className="service-tile group flex h-full min-h-[142px] cursor-pointer flex-col justify-between"
                >
                  <div className="service-tile-header">
                    <span className="service-tile-kicker">{label}</span>
                    <span className="service-tile-mark" aria-hidden="true">
                      <Icon className="size-5" />
                    </span>
                  </div>

                  <div className="service-tile-copy">
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </Link>
              </HoverLift>
            </MotionItem>
          ))}
        </MotionList>

        <div className="mt-5 flex justify-center">
          <MotionItem className="h-full w-full lg:max-w-2xl">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="service-tile group flex h-full min-h-[142px] w-full cursor-pointer flex-col justify-between"
                  dir="rtl"
                >
                  <div className="service-tile-header">
                    <span className="service-tile-kicker">منابع</span>
                    <span className="service-tile-mark" aria-hidden="true">
                      <BookOpen className="size-5" />
                    </span>
                  </div>

                  <div className="service-tile-copy">
                    <h3>سایر منابع مفید</h3>
                    <p>تارنماها و کتب مفید</p>
                  </div>
                </button>
              </PopoverTrigger>

              <PopoverContent align="center" side="bottom" className="w-[420px]">
                <Tabs defaultValue="sites" className="w-full" dir="rtl">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sites">تارنماهای مفید</TabsTrigger>
                    <TabsTrigger value="books">کتب مفید</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sites" className="mt-3">
                    <div className="space-y-2">
                      <p className="text-sm text-primary">لینک ها:</p>
                      <ul className="list-disc space-y-1 pr-4">
                        <li>
                          <Link
                            className="underline underline-offset-4"
                            href="https://t.me/firstcreation1"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            کانال تلگرامی خلق اول
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="underline underline-offset-4"
                            href="https://www.valiasr-aj.tv/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            شبکه جهانی حضرت ولی عصر (عج)
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="underline underline-offset-4"
                            href="https://javadi.esra.ir/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            بنیاد بین المللی علوم وحیانی اسراء
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="books" className="mt-3">
                    <div className="space-y-2">
                      <p className="text-sm text-primary">کتب مفید:</p>
                      <Link
                        dir="rtl"
                        href="/taghvim-shia.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline underline-offset-4"
                      >
                        تقویم شیعه - عبدالحسین بندانی نیشابوری (PDF)
                      </Link>
                    </div>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          </MotionItem>
        </div>
      </Reveal>
    </section>
  );
};

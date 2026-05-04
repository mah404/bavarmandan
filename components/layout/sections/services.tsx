import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpLeft,
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
}

const serviceList: ServiceProps[] = [
  {
    title: "تلگرام مجمع باورمندان کلاب هاوس",
    description: "کانال اطلاع رسانی برنامه ها و جلسات مجمع",
    link: "https://t.me/bavarmandan110",
    icon: Send,
  },
  {
    title: "ارتباط مستقیم",
    description: "ارسال سوالات، انتقادات، پیشنهادات و نقطه نظرات",
    link: "https://t.me/bavarmandan_bot",
    icon: MessageCircle,
  },
  {
    title: "کانال یوتیوب",
    description: "آرشیو ویدیوها و محتوای تصویری",
    link: "https://www.youtube.com/@bavarmandan110",
    icon: Youtube,
  },
  {
    title: "اینستاگرام",
    description: "حضور مجمع در شبکه اجتماعی اینستاگرام",
    link: "https://www.instagram.com/bavarmandan110/",
    icon: Instagram,
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
        <p className="text-sm font-bold text-primary">راه‌های ارتباطی</p>
        <h2 className="mt-2 text-4xl font-extrabold leading-[1.7] text-primary md:text-5xl">
          <span className="text-2xl align-super">*</span>
          تارنماهای مرتبط
        </h2>
      </Reveal>

      <Reveal delay={0.08} className="mx-auto w-full max-w-6xl">
        <MotionList className="grid gap-4 lg:grid-cols-2" dir="rtl">
          {serviceList.map(({ title, description, link, icon: Icon }) => (
            <MotionItem key={title}>
              <HoverLift>
                <Link
                  href={link}
                  className="group relative flex min-h-[126px] items-center justify-between gap-5 overflow-hidden rounded-lg border border-secondary/40 border-r-4 border-r-primary/70 bg-card/40 p-5 text-right shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/60 hover:shadow-[0_14px_34px_rgba(0,0,0,0.1)] dark:bg-card/70"
                >
                  <div className="flex items-center gap-5">
                    <span className="grid size-14 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-7" />
                    </span>
                    <span>
                      <span className="block text-2xl font-extrabold leading-10 text-foreground">
                        {title}
                      </span>
                      <span className="mt-1 block text-lg leading-8 text-muted-foreground">
                        {description}
                      </span>
                    </span>
                  </div>

                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/25 text-primary transition duration-300 group-hover:-translate-x-1 group-hover:border-primary/60">
                    <ArrowUpLeft className="size-5" />
                  </span>
                </Link>
              </HoverLift>
            </MotionItem>
          ))}
        </MotionList>

        <div className="mt-5 flex justify-center">
          <MotionItem className="w-full lg:max-w-2xl">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="group relative flex w-full items-center justify-between gap-5 overflow-hidden rounded-lg border border-primary/25 bg-card/35 p-5 text-right shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card/60 dark:bg-card/70"
                  dir="rtl"
                >
                  <div className="flex items-center gap-5">
                    <span className="grid size-14 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      <BookOpen className="size-7" />
                    </span>
                    <span>
                      <span className="block text-2xl font-extrabold leading-10 text-foreground">
                        سایر منابع مفید
                      </span>
                      <span className="mt-1 block text-lg leading-8 text-muted-foreground">
                        تارنماها و کتب مفید
                      </span>
                    </span>
                  </div>

                  <span className="h-px w-16 bg-gradient-to-l from-primary to-transparent transition duration-300 group-hover:w-24" />
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

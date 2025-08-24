import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

enum ProService {
  YES = 1,
  NO = 0,
}
interface ServiceProps {
  title: string;
  pro: ProService;
  description: string;
  link: string;
}
const serviceList: ServiceProps[] = [
  {
    title: "تلگرام مجمع باورمندان کلاب هاوس ",
    description:
      "کانال تلگرامی مجمع باورمندان کلاب هاوس (جهت اطلاع رسانی از برنامه ها)",
    pro: 0,
    link: "https://t.me/bavarmandan110",
  },
  {
    title: "بات تلگرام",
    description:
      "پیام رسان ارتباطی(جهت ارسال سوالات، انتقادات، پیشنهادات و نقطه نظرات)",
    pro: 0,
    link: "https://t.me/bavarmandanBot",
  },
  {
    title: " کانال یوتیوب",
    description: "در حال احداث",
    pro: 0,
    link: "https://www.youtube.com/@bavarmandan",
  },
  {
    title: " اینستاگرام",
    description: "در حال احداث",
    pro: 0,
    link: "https://www.instagram.com/bavarmandan110/",
  },
  {
    title: "کانال تلگرامی خلق اول ",
    description: "شبکه اطلاع رسانی تشکیل جلسات و اشتراک مطالب",
    pro: 0,
    link: "https://t.me/firstcreation1",
  },
  {
    title: "سایر منابع مفید",
    description: "....",
    pro: 0,
    link: "https://www.instagram.com/bavarmandan110/",
  },
];

export const ServicesSection = () => {
  return (
    <section id="tarnama" className="container py-24 sm:py-32">
      <h2 className="text-3xl md:text-4xl text-center text-primary font-bold mb-4">
        <span className="text-sm align-super ">*</span>
        تارنماهای مرتبط
      </h2>

      <div className="flex flex-col items-center gap-6 w-full lg:w-[70%] mx-auto">
        {/* Row 1 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
          {serviceList.slice(0, 2).map(({ title, description, pro, link }) => (
            <Card
              dir="rtl"
              key={title}
              className="bg-card dark:bg-card w-full sm:w-[480px] h-[130px] mx-auto relative"
            >
              <Link href={link}>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription className="text-primary">
                    {description}
                  </CardDescription>
                </CardHeader>
                <Badge
                  data-pro={ProService.YES === pro}
                  variant="secondary"
                  className="absolute -top-2 -right-3 data-[pro=false]:hidden"
                >
                  PRO
                </Badge>
              </Link>
            </Card>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
          {serviceList.slice(2, 4).map(({ title, description, pro, link }) => (
            <Card
              dir="rtl"
              key={title}
              className="bg-card dark:bg-card w-full sm:w-[480px] h-[130px] mx-auto relative"
            >
              <Link href={link}>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription className="text-yellow-300">
                    {description}
                  </CardDescription>
                </CardHeader>
                <Badge
                  data-pro={ProService.YES === pro}
                  variant="secondary"
                  className="absolute -top-2 -right-3 data-[pro=false]:hidden"
                >
                  PRO
                </Badge>
              </Link>
            </Card>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
          {serviceList.slice(4, 6).map(({ title, description, pro, link }) => {
            const isExtra = title.trim() === "سایر منابع مفید";
            if (isExtra) {
              return (
                <Popover key={title}>
                  <PopoverTrigger asChild>
                    {/* کارت به‌عنوان تریگر؛ لینک نیست تا جابجا نشود */}
                    <div
                      dir="rtl"
                      role="button"
                      tabIndex={0}
                      className="bg-card dark:bg-card w-full sm:w-[480px] h-[130px] mx-auto relative rounded-xl border hover:shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <Card className="bg-transparent border-0 shadow-none h-full">
                        <CardHeader>
                          <CardTitle>{title}</CardTitle>
                          <CardDescription className="text-yellow-300">
                            {description}
                          </CardDescription>
                        </CardHeader>
                        <Badge
                          data-pro={ProService.YES === pro}
                          variant="secondary"
                          className="absolute -top-2 -right-3 data-[pro=false]:hidden"
                        >
                          منابع
                        </Badge>
                      </Card>
                    </div>
                  </PopoverTrigger>

                  <PopoverContent align="center" side="bottom" className="w-80">
                    <div dir="rtl" className="space-y-2">
                      <p className="text-sm text-primary">منابع مفید:</p>
                      <ul className="list-disc pr-4 space-y-1">
                        <li>
                          <Link
                            className="underline underline-offset-4"
                            href="https://www.valiasr-aj.tv/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            شبکه جهانی حضرت ولی عصر (عج){" "}
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="underline underline-offset-4"
                            href="https://javadi.esra.ir/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            بنیاد بین المللی علوم وحیانی اسراء{" "}
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            // حالت کارت‌های عادی (بدون پاپ‌اور)
            return (
              <Card
                dir="rtl"
                key={title}
                className="bg-card dark:bg-card w-full sm:w-[480px] h-[130px] mx-auto relative"
              >
                <Link href={link}>
                  <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="text-yellow-300">
                      {description}
                    </CardDescription>
                  </CardHeader>
                  <Badge
                    data-pro={ProService.YES === pro}
                    variant="secondary"
                    className="absolute -top-2 -right-3 data-[pro=false]:hidden"
                  >
                    PRO
                  </Badge>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

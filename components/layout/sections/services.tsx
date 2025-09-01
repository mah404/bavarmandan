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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";


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
    description: "تارنماها و کتب مفید",
    pro: 0,
    link: "https://www.instagram.com/bavarmandan110/",
  },
];

export const ServicesSection = () => {
  return (
    <section id="tarnama" className="container py-24 sm:py-32">
    <h2 className="w-fit mx-auto text-3xl md:text-4xl text-center p-2  text-primary font-bold mb-4 bg-card border-secondary border dark:border-none rounded-2xl dark:bg-transparent dark:rounded-none dark:p-0">
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
<PopoverContent align="center" side="bottom" className="w-[420px]">
  <Tabs defaultValue="sites" className="w-full" dir="rtl">
    <TabsList className="grid grid-cols-2 w-full">
      <TabsTrigger value="sites">تارنماهای مفید</TabsTrigger>
      <TabsTrigger value="books">کتب مفید</TabsTrigger>
    </TabsList>

    {/* تارنماهای مفید */}
    <TabsContent value="sites" className="mt-3">
      <div className="space-y-2">
        <p className="text-sm text-primary">لینک‌ها:</p>
        <ul className="list-disc pr-4 space-y-1">
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
              بنیاد بین‌المللی علوم وحیانی اسراء
            </Link>
          </li>
          {/* هر لینک دیگری را اینجا اضافه کنید */}
        </ul>
      </div>
    </TabsContent>

    {/* کتب مفید */}
<TabsContent value="books" className="mt-3">
  <div className="space-y-2">
    <p className="text-sm text-primary">کتب مفید:</p>
    <div className="text-sm text-muted-foreground">
      <Link
        href="/taghvim-shia.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-white underline-offset-4 text-primary"
      >
قویم شیعه – عبدالحسین بندانی نیشابوری (PDF)
  </Link>
    </div>
  </div>
</TabsContent>

  </Tabs>
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
            );
          })}
        </div>
      </div>
    </section>
  );
};

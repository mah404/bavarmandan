import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

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
    title: "کانال تلگرامی خلق اول ",
    description: "شبکه اطلاع رسانی تشکیل جلسات و اشتراک مطالب",
    pro: 0,
    link: "https://t.me/firstcreation1",
  },
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
    description:
      "در حال احداث",
    pro: 0,
    link: "#",
  },
    {
    title: " اینستاگرام",
    description:
      "در حال احداث",
    pro: 0,
    link: "#",
  },
];

export const ServicesSection = () => {
  return (
    <section id="services" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider"></h2>

      <h2 className="text-3xl md:text-4xl text-center text-primary font-bold mb-4">
        *تارنماهای مرتبط{" "}
      </h2>
      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8"></h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full lg:w-[60%] mx-auto">
        {serviceList.map(({ title, description, pro, link }) => (
          <Card
            dir="rtl"
            key={title}
            className="bg-card dark:bg-card h-full relative"
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
    </section>
  );
};

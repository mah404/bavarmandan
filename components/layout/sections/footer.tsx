import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Reveal } from "./reveal";

const socialLinks = [
  {
    label: "یوتیوب",
    href: "https://www.youtube.com/@bavarmandan110",
    icon: "/youtube.png",
    alt: "youtube",
  },
  {
    label: "کلاب‌هاوس",
    href: "https://www.clubhouse.com/house/%D9%85%D8%AC%D9%85%D8%B9-%D8%A8%D8%A7%D9%88%D8%B1%D9%85%D9%86%D8%AF%D8%A7%D9%86?chs=vgJIag5VYG%3AHJqbfkIoYRlofbeOY8p06RDKoa8xs1iz8W4cLx6HAlA&utm_medium=ch_house_settings",
    icon: "/clubhouse-icon.png",
    alt: "clubhouse",
  },
  {
    label: "تیک تاک",
    href: "https://www.tiktok.com/@bavarmandan110",
    icon: "/tiktok.png",
    alt: "TikTok",
  },
  {
    label: "اینستاگرام",
    href: "https://www.instagram.com/bavarmandan110/",
    icon: "/instagram.png",
    alt: "instagram",
  },
  {
    label: "تلگرام",
    href: "https://t.me/bavarmandan110",
    icon: "/telegramicon.png",
    alt: "telegram",
  },
];

export const FooterSection = () => {
  return (
    <footer id="contact" className="container py-12 sm:py-16">
      <Reveal className="glass-panel relative overflow-hidden rounded-2xl px-5 py-7 text-center md:px-8 md:py-8">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <Link href="#" className="group flex flex-col items-center">
            <Image
              src="/mainicon.jpg"
              alt="Logo"
              width={112}
              height={112}
              className="size-24 rounded-2xl border border-primary/35 object-cover shadow-[0_14px_30px_rgba(0,0,0,0.12)] ring-1 ring-primary/25 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.16)] md:size-28"
            />
          </Link>

          <h3 className="mt-4 text-xl font-extrabold leading-8 text-foreground">
            شبکه‌های اجتماعی
          </h3>
          <p className="mt-1 max-w-md text-sm leading-7 text-muted-foreground">
            راه‌های رسمی ارتباط و دنبال کردن محتوای مجمع باورمندان
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2.5" dir="rtl">
            {socialLinks.map(({ label, href, icon, alt }) => (
              <Link
                key={label}
                href={href}
                className="group inline-flex items-center gap-2 rounded-full border border-secondary/55 bg-card/35 px-3.5 py-2 text-sm font-bold text-foreground shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card/60 hover:text-primary"
              >
                <span>{label}</span>
                <span className="grid size-6 place-items-center rounded-full bg-background/25">
                  <Image src={icon} alt={alt} width={16} height={16} />
                </span>
              </Link>
            ))}
          </div>

          <Link
            href="https://t.me/bavarmandanBot"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-extrabold text-primary transition duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary hover:text-primary-foreground"
          >
            <MessageCircle className="size-4" />
            ارتباط مستقیم با ما
          </Link>
        </div>

        <div className="mx-auto mt-6 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />

        <section className="mt-4 w-full text-center">
          <h3 className="text-xs text-muted-foreground">
            © 1404 مالکیت، طراحی و توسعه{" "}
            <Link
              target="_blank"
              href="#"
              className="mx-2 font-bold text-primary transition hover:text-foreground"
            >
              فرزندان امیرالمومنین (ع)
            </Link>
          </h3>
        </section>
      </Reveal>
    </footer>
  );
};

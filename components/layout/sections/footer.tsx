import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import {
  FloatInPlace,
  MotionButton,
  MotionItem,
  MotionList,
  Reveal,
} from "./reveal";

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
      <Reveal className="relative mx-auto max-w-5xl text-center">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        <div className="relative overflow-hidden rounded-2xl border border-secondary/45 bg-card/45 px-5 pb-7 pt-8 shadow-[0_18px_46px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:bg-card/70">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="mx-auto flex max-w-3xl flex-col items-center">
            <FloatInPlace delay={0.15}>
              <Link
                href="#"
                className="group relative grid size-24 place-items-center rounded-2xl border border-primary/30 bg-primary/10 p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.14)] ring-1 ring-primary/20 transition duration-300 hover:border-primary/55 md:size-28"
              >
                <Image
                  src="/mainicon.jpg"
                  alt="Logo"
                  width={104}
                  height={104}
                  className="size-full rounded-xl object-cover"
                />
              </Link>
            </FloatInPlace>

            <MotionList
              className="mt-4 flex flex-col items-center"
              delay={0.08}
            >
              <MotionItem>
                <p className="text-xs font-bold text-primary">در ارتباط بمانید</p>
              </MotionItem>
              <MotionItem>
                <h3 className="mt-1 text-xl font-extrabold leading-8 text-foreground md:text-2xl">
                  شبکه‌های اجتماعی مجمع باورمندان
                </h3>
              </MotionItem>
            </MotionList>

            <MotionList
              className="mt-5 flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-secondary/35 bg-background/10 p-2 backdrop-blur"
              delay={0.14}
              dir="rtl"
            >
              {socialLinks.map(({ label, href, icon, alt }) => (
                <MotionItem key={label}>
                  <MotionButton>
                    <Link
                      href={href}
                      className="group inline-flex items-center gap-2 rounded-xl border border-transparent bg-card/25 px-3 py-2 text-sm font-bold text-foreground transition duration-300 hover:border-primary/40 hover:bg-card/60 hover:text-primary"
                    >
                      <span className="grid size-7 place-items-center rounded-lg bg-background/25 transition duration-300 group-hover:bg-primary/10">
                        <Image src={icon} alt={alt} width={16} height={16} />
                      </span>
                      <span>{label}</span>
                    </Link>
                  </MotionButton>
                </MotionItem>
              ))}
            </MotionList>

            <MotionButton className="mt-5">
              <Link
                href="https://t.me/bavarmandan_bot"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition duration-300 hover:border-primary/60 hover:bg-primary/90"
              >
                <MessageCircle className="size-4" />
                ارتباط مستقیم با ما
              </Link>
            </MotionButton>
          </div>

          <Reveal delay={0.12}>
            <div className="mx-auto mt-6 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />

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
        </div>
      </Reveal>
    </footer>
  );
};

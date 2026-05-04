"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FloatInPlace, MotionButton, Reveal } from "./reveal";

export const HeroSection = () => {
  return (
    <section className="container w-full">
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-16 md:py-28">
        <Reveal className="text-center space-y-8">
          <FloatInPlace className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-thin leading-tight">
            <h1 className="">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ </h1>
          </FloatInPlace>

          <p
            className="lux-text-panel max-w-screen-sm mx-auto text-md flex-col flex"
            dir="rtl"
          >
            <span className="text-primary text-2xl font-bold leading-relaxed">
              رَبَّنَا إِنَّنَا سَمِعْنَا مُنَادِيًا يُنَادِي لِلْإِيمَانِ أَنْ
              آمِنُوا بِرَبِّكُمْ فَآمَنَّا رَبَّنَا فَاغْفِرْ لَنَا ذُنُوبَنَا
              وَكَفِّرْ عَنَّا سَيِّئَاتِنَا وَتَوَفَّنَا مَعَ الْأَبْرَارِ
            </span>
            پروردگارا! بی تردید ما ندا دهنده ای را شنیدیم که به ایمان فرا می
            خواند که به پروردگارتان ایمان آورید. پس ما ایمان آوردیم. پروردگارا!
            گناهان ما را بیامرز، و بدی هایمان را از ما محو کن، و ما را در زمره
            نیکوکاران بمیران.
            <span className="text-muted-foreground text-xs pt-4">
              (سوره مبارکه آل عمران آیه شریفه ۱۹۳)
            </span>
          </p>

          <hr className="soft-divider w-full" />

          <p
            dir="rtl"
            className="max-w-screen-md mx-auto text-lg md:text-xl text-foreground/85 dark:text-muted-foreground leading-relaxed"
          >
            با سلام و سپاس از حضور شما در تارنمای{" "}
            <span className=" inline-block whitespace-nowrap text-primary pl-1  pr-1">
              « مجمع باورمندان »
            </span>
            کلاب‌هاوس و با آرزوی سلامتی و توفیقات روزافزون. این تارنما با هدف
            اطلاع‌ رسانی و به‌اشتراک‌گذاری مطالبی شکل گرفته است که می‌تواند برای
            شرکت‌کنندگان در جلسات و اتاق‌های مجمع باورمندان مفید واقع شود.
            امیدواریم تلاش اساتید و همراهان ما در فضای مجازی کلاب‌هاوس، همراه با
            مطالب ارائه‌شده در این تارنما، زمینه‌ساز دسترسی بهتر و ارتباط مؤثرتر
            میان دوستان و اعضای مجمع باشد. از حضور، مشارکت، دیدگاه‌ها، پیشنهادها
            و انتقادات سازنده‌ی شما صمیمانه استقبال می‌کنیم.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <MotionButton className="w-5/6 md:w-auto">
            <Button
              variant="secondary"
              className="modern-action w-full group/arrow text-md"
            >
              <Link
                className="flex items-center"
                href="https://www.clubhouse.com/house/%D9%85%D8%AC%D9%85%D8%B9-%D8%A8%D8%A7%D9%88%D8%B1%D9%85%D9%86%D8%AF%D8%A7%D9%86?chs=vgJIag5VYG%3AHJqbfkIoYRlofbeOY8p06RDKoa8xs1iz8W4cLx6HAlA&utm_medium=ch_house_settings"
              >
                کلاب هاوس
                <img
                  src="/clubhouse-icon.png"
                  alt="Clubhouse"
                  className="ml-2 h-6 w-6"
                />
              </Link>
            </Button>
            </MotionButton>

            <MotionButton className="w-5/6 md:w-auto">
            <Button
              asChild
              variant="secondary"
              className="modern-action w-full text-md"
            >
              <Link
                href="https://t.me/bavarmandan110"
                target="_blank"
              >
                تلگرام
                <img
                  src="/telegramicon.png"
                  alt="telegram"
                  className="ml-2 h-6 w-6"
                />
              </Link>
            </Button>
            </MotionButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

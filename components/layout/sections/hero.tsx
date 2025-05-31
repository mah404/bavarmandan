"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export const HeroSection = () => {
  const [data, setData] = useState<any>(null);

  const { theme } = useTheme();
  return (
    <section className="container w-full" >
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
        <div className="text-center space-y-8">
          <Badge variant="outline" className="border-none text-md py-2">
            <span> </span>
          </Badge>

          <div className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-thin">
            <h1>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ </h1>
          </div>

          <p className="max-w-screen-sm mx-auto text-md text-muted-foreground text-gray-100  flex-col flex" dir="rtl">
            <span className="text-yellow-500 text-2xl  pr-1" >
              رَبَّنَا إِنَّنَا سَمِعْنَا مُنَادِيًا يُنَادِي لِلْإِيمَانِ أَنْ
              آمِنُوا بِرَبِّكُمْ فَآمَنَّا رَبَّنَا فَاغْفِرْ لَنَا ذُنُوبَنَا
              وَكَفِّرْ عَنَّا سَيِّئَاتِنَا وَتَوَفَّنَا مَعَ الْأَبْرَارِ
            </span>
            پروردگارا! بی تردید ما ندا دهنده ای را شنیدیم که به ایمان فرا می
            خواند که به پروردگارتان ایمان آورید. پس ما ایمان آوردیم. پروردگارا!
            گناهان ما را بیامرز، و بدی هایمان را از ما محو کن، و ما را در زمره
            نیکوکاران بمیران.

            <span className="text-gray-200 text-xs pt-4">(سوره مبارکه آل عمران آیه شریفه ۱۹۳)</span>
          </p>


          <hr className="border-secondary w-full   border-yellow-500" />

          <p dir="rtl" className="max-w-screen-sm text-gray-100 mx-auto text-xl text-muted-foreground">
          با عرض سلام و تشکر از حضور شما در  تارنمای             <span className="text-yellow-500 pr-1">
              مجمع باورمندان کلاب هاوس
            </span>
            ، و آروزی سلامتی و توفیقات روز افزون. این تارنمای به جهت اطلاع رسانی
            و اشتراک گذاری مطالبی که برای شرکت کنندگان در جلسات و اتاقهای مجمع
            باورمندان می‌تواند مفید باشد تشکیل یافته، و امیدوار هستیم که تلاش
            اساتید و دوستان در فضای مجازی کلاب هاوس و اطلاعاتی که از این تارنما
            با  شما عزیزان به اشتراک گذاشته میشود سبب دسترسی بهتر و  تسهیل در
           برقراری ارتباط با دوستان مجمع باورمندان گردد. از مشارکت ، حضور ، 
            نقطه نظرات ، پیشنهادات و انتقادات همه عزیزان استقبال می‌نماییم.
          </p>

          <div className="space-y-4 md:space-y-0 md:space-x-4">
            <Button               variant="secondary"
 className="w-5/6 md:w-1/4 font-bold group/arrow text-md">
              <Link
                className="flex"
                href="https://www.clubhouse.com/house/%D9%85%D8%AC%D9%85%D8%B9-%D8%A8%D8%A7%D9%88%D8%B1%D9%85%D9%86%D8%AF%D8%A7%D9%86-%DA%A9%D9%84%D8%A7%D8%A8-%D9%87%D8%A7%D9%88%D8%B3?chs=lgAI3r9pbR%3ADrbcc1Vdpax6lhaqJt_P0rUiUeHCPDXTK0QStpjNRXo&utm_medium=ch_house_settings"
              >
                کلاب هاوس
                <img src="/clubhouse-icon.png" alt="Clubhouse" className="ml-2 h-6 w-6" />
              </Link>
            </Button>

            <Button
              asChild
              variant="secondary"
              className="w-5/6  text-md md:w-1/4 font-bold  "
            >
              <Link
                href="https://github.com/nobruf/shadcn-landing-page.git"
                target="_blank"
              >

                تلگرام
                                <img src="/telegramicon.png" alt="telegram" className="ml-2 h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative group mt-14 flex flex-col">
          <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-primary/50 rounded-full blur-3xl"></div>


          <div className="absolute bottom-0 left-0 w-full h-20 md:h-28 bg-gradient-to-b from-background/0 via-background/50 to-background rounded-lg">
          
        
          
          </div>
        </div>
      </div>
   

    </section>
  );
};

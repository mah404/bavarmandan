import DiscordIcon from "@/components/icons/discord-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Scale } from "lucide-react";

export const CommunitySection = () => {
  return (
    <section id="rules" className="py-12 ">
      <hr className="border-secondary" />
      <div className="container py-20 sm:py-20">
        <div className="lg:w-[60%] mx-auto">
          <Card
            dir="rtl"
            className="bg-background border-none shadow-none text-center flex flex-col items-center justify-center"
          >
            <CardHeader>
              <CardTitle className="text-4xl md:text-5xl font-bold flex flex-col items-center">
                <div>
                  <span className=" pl-2 bg-gradient-to-r text-yellow-300 bg-clip-text">
                    تذکرات و نکات جلسات «مجمع باورمندان» در کلاب‌هاوس
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground leading-relaxed">
              با توجه به اهداف شکل‌گیری جلسات «مجمع باورمندان» در کلاب‌هاوس، که
              با نیت هم‌افزایی فکری و تبادل آرا در راستای ایجاد فضایی سالم برای
              گفت‌وگو، در سایه عقل، منطق و ادب و همچنین تقویت مودت و آرامش در
              مسیر رشد عقلی، اخلاقی و معنوی برگزار می‌شود، از همه دوستان و
              همراهان گرامی درخواست می‌شود در جهت حفظ کیفیت جلسات، موارد زیر را
              رعایت فرمایند:
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground ">
              🔸 حفظ آرامش، ادب و اخلاق و رعایت کرامت انسانی در رفتار، گفتار و
              نوشتار.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
              🔸پرهیز از توهین و جسارت به اعتقادات و تفکرات و رعایت احترام افراد
              و تمرکز در نقد تفکرات، عقائد و باورها.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
              🔸پرهیز از طرح مسائل سیاسی و پیش آمدهای اختلافی اجتماعی خارج از
              موضوع جلسه.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
              🔸پرهیز از طرح، گفتگو و نوشتار پیرامون مسائل متفرقه و خارج از مسیر
              و محتوای ارائه شده در جلسه.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
              🔸پرهیز از طرح و گفتگو پیرامون مسائل و اختلافات و منازعات شخصی.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
              🔸عدم اصرار به گفتگو و شرکت در بحث در صورت عدم تمایل به گفتگوی
              مخاطب بحث.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
              🔸رعایت نوبت و صبوری و عدم ورود در کلام و گفتار دیگران.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
              🔸عدم استفاده از عکس پروفایل توهین آمیز به مقدسات، اشخاص و باورهای
              اعتقادی و گروه های سیاسی.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
              🔸تخصیص زمان، نوبت و مدت گفتگوی عزیزان در جلسات بنا به صلاحدید و
              تشخیص مدیران خواهد بود، لذا از هرگونه ورود و تداخل در گفتگوی
              دیگران غیر از زمان و مدت مشخص شده پرهیز نمایید.
            </CardContent>

            <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
              قابل ذکر است که از حضور کاربرانی که موارد ذکر شده را در جلسه،
              استیج و یا چت اتاق رعایت ننمایند بنا به صلاحدید مدیران در جلسه در
              حال اجرا و یا جلسات آتی معذور خواهیم بود. همچنین بنا به صلاحدید و
              نیاز، مجمع باورمندان کلاب هاوس حق هرگونه استفاده از محتوای صوتی،
              گفتاری و نوشتاری حاضران در جلسات را برای خویش محفوظ میداند. از همه
              دوستان خواستاریم که به جهت بهتر برگزاری جلسات و ارایه مطالب مطلوب
              و رفع هرگونه ابهام کلیه سوالات، انتقادات و پیشنهادات خود را از
              طریق پیام رسان تلگرامی مندرج به سمع و نظر مدیران مجمع باورمندان
              کلاب هاوس رسانده و پیشاپیش از همه عزیزان به خاطر حضور و ارائه نقطه
              نظرات و صبوری و رعایت تذکرات و حفظ اخلاق حسنه کمال قدردانی و تشکر
              را داریم.
            </CardContent>
          </Card>
        </div>
      </div>
      <hr className="border-secondary border-yellow-500" />
    </section>
  );
};

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
import Link from "next/link";

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
         <CardTitle className="text-center font-bold text-xl sm:text-3xl md:text-4xl lg:text-4xl">
  <div className="flex flex-col items-center">
    <span className="text-yellow-300 bg-gradient-to-r bg-clip-text leading-snug text-center whitespace-nowrap">
      تذکرات و نکات جلسات «مجمع باورمندان»
    </span>
    <span className="text-yellow-300 bg-gradient-to-r bg-clip-text leading-snug text-center whitespace-nowrap">
      در کلاب‌هاوس
    </span>
  </div>
</CardTitle>

              <hr className="border-primary w-full   " />
            </CardHeader>
            <CardContent className="lg:w-[80%] font-semibold text-xl text-muted-foreground leading-relaxed">
              با توجه به اهداف شکل‌گیری جلسات «مجمع باورمندان» در کلاب‌هاوس، که
              با نیت هم‌افزایی فکری و تبادل آرا در راستای ایجاد فضایی سالم برای
              گفت‌وگو، در سایه عقل، منطق و ادب و همچنین تقویت مودت و آرامش در
              مسیر رشد عقلی، اخلاقی و معنوی برگزار می‌شود، از همه دوستان و
              همراهان گرامی درخواست می‌شود در جهت حفظ کیفیت جلسات، موارد زیر را
              رعایت فرمایند:
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground  font-thin">
              🔸 رعایت آرامش، ادب، اخلاق و حفظ کرامت انسانی در رفتار، گفتار و
              نوشتار. نوشتار.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground  font-thin">
              🔸 پرهیز از هرگونه توهین، تمسخر یا بی‌احترامی به عقاید، باورها و
              دیدگاه‌های دیگران و تمرکز صرف بر نقد تفکرات، نه اشخاص.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground  font-thin">
              🔸 اجتناب از طرح مباحث سیاسی یا مسائل اختلاف‌برانگیز اجتماعی خارج
              از موضوع جلسه.{" "}
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground  font-thin">
              🔸 خودداری از پرداختن به موضوعات متفرقه یا خارج از محتوای اصلی
              ارائه‌شده در جلسه.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground  font-thin">
              🔸 پرهیز از مطرح‌کردن اختلافات، منازعات یا مسائل شخصی در جلسه.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground  font-thin">
              🔸 احترام به تمایل یا عدم تمایل دیگران به شرکت در گفت‌وگو؛ اصرار
              به صحبت کردن با مخاطبی که تمایلی ندارد، پذیرفته نیست.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground  font-thin">
              🔸 استفاده از عکس پروفایل محترمانه و متناسب؛ عکس‌هایی با محتوای
              توهین‌آمیز نسبت به مقدسات، اشخاص، باورهای اعتقادی یا گروه‌های
              سیاسی ممنوع است.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground  font-thin">
              🔸 زمان، نوبت و مدت گفت‌وگوی هر یک از شرکت‌کنندگان بر اساس تشخیص و
              صلاحدید مدیران جلسه تعیین می‌شود. لطفاً از مداخله در گفت‌وگوی
              دیگران خارج از زمان مشخص‌شده پرهیز نمایید.
            </CardContent>
            <CardContent className="lg:w-[80%] text-xl text-muted-foreground font-semibold ">
              بدیهی است در صورت عدم رعایت موارد فوق در جلسه، استیج یا بخش چت،
              مدیران جلسات بنا به صلاحدید خود می‌توانند از ادامه حضور افراد در
              همان جلسه یا جلسات آینده جلوگیری نمایند.
            </CardContent>

            <CardContent className="lg:w-[80%] text-xl text-muted-foreground font-semibold">
              همچنین «مجمع باورمندان کلاب‌هاوس» بنابر نیاز و مصالح مجموعه، حق
              استفاده از محتوای صوتی، گفتاری و نوشتاری ارائه‌ شده در جلسات را
              برای خود محفوظ می‌داند.
            </CardContent>

            <CardContent className="lg:w-[80%] text-xl text-muted-foreground font-semibold">
              از تمامی دوستان عزیز درخواست می‌شود به‌منظور برگزاری بهتر جلسات و
              رفع ابهامات احتمالی، پرسش‌ها، انتقادات و پیشنهادات خود را از طریق
              پیام‌رسان تلگرام
              <Link
                className="text-yellow-300 pl-1 pr-1"
                href="https://t.me/bavarmandanBot"
              >
                (آدرس مندرج)
              </Link>
              به اطلاع مدیران برسانند. پیشاپیش از حضور گرم، مشارکت فکری، صبوری و
              رعایت نکات اخلاقی و آیین گفت‌وگو از سوی تمامی عزیزان صمیمانه
              سپاسگزاریم.
            </CardContent>
            <CardContent className="lg:w-[80%] text-md text-muted-foreground font-thin mt-8">
              <span className="text-xl text-primary-foreground">*</span>
              حضور مجمع باورمندان در شبکه های اجتماعی و مجازی تنها به هدف اشتراک
              گذاری محتوای اشخاص و صرفاً جنبه آموزشی داشته فلذا مجمع باورمندان
              هیچگونه مسئولیتی در قبال اشخاص، نظرات، مطالب، و محتوای به اشتراک
              گذاشته شده و باز نشر داده شده در هیچ‌یک از شبکه های وابسته به مجمع
              باورمندان را بر عهده نمی‌گیرد.
            </CardContent>
          </Card>
        </div>
      </div>
      <hr className="border-secondary border-yellow-500" />
    </section>
  );
};

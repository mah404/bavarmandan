import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Scale } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./reveal";

export const CommunitySection = () => {
  return (
    <section id="rules" className="py-12">
      <hr className="border-secondary/70" />
      <div className="container py-20 sm:py-20">
        <Reveal className="lg:w-[60%] mx-auto">
          <Card
            dir="rtl"
            className="text-center flex flex-col items-center justify-center border-none bg-transparent shadow-none"
          >
            <CardHeader className="w-full pb-8">
              <CardTitle className="mx-auto max-w-5xl text-center">
                <div className="flex flex-col items-center" dir="rtl">
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/25 px-4 py-2 text-sm font-bold text-primary backdrop-blur">
                    <Scale className="size-4" />
                    آیین حضور و گفت‌وگو
                  </span>
                  <span className="block text-3xl font-extrabold leading-[1.7] text-primary md:text-4xl">
      تذکرات و نکات جلسات «مجمع باورمندان»
    </span>
                  <span className="mt-1 block text-2xl font-extrabold leading-[1.7] text-foreground/90 md:text-3xl">
      در کلاب‌هاوس
    </span>
  </div>
</CardTitle>

              <hr className="mx-auto mt-5 h-px w-full max-w-2xl border-0 bg-gradient-to-l from-transparent via-primary/50 to-transparent" />
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
        </Reveal>
      </div>
      <hr className="border-primary/50" />
    </section>
  );
};

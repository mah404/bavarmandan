import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const FooterSection = () => {
  return (
    <footer id="contact" className="container py-24 sm:py-32">
      <div className="p-10 bg-card border border-secondary rounded-2xl">
<div className="flex flex-col xl:flex-row xl:justify-center items-center gap-12 text-center">
          <div className="col-span-full xl:col-span-2 flex justify-center">
            <Link href="#" className="flex flex-col items-center font-bold">
              <img
                src="/mainicon.jpg"
                alt="Logo"
                className="w-24 h-24 bg-gradient-to-tr from-primary via-primary/70 to-primary rounded-lg border border-secondary"
              />
              <span className="mt-2">لوگوی سایت</span>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h3 className="font-bold text-lg">شبکه‌های اجتماعی</h3>
            <Link href="#" className="opacity-60 hover:opacity-100">
              تلگرام
            </Link>
            <Link href="#" className="opacity-60 hover:opacity-100">
              کلاب‌هاوس
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h3 className="font-bold text-lg">ارتباط با ما</h3>
            <Link href="#" className="opacity-60 hover:opacity-100">
              راه ارتباطی
            </Link>
            <Link href="#" className="opacity-60 hover:opacity-100">
              نظرات شما
            </Link>
          </div>
        </div>

        <Separator className="my-6" />

        <section className="w-full text-center">
          <h3 className="text-xs">
            &copy; 2025 طراحی و توسعه توسط
            <Link
              target="_blank"
              href="#"
              className="text-yellow-300 transition-all border-yellow-600 hover:border-b-2 ml-1 mr-2"
            >
              باورمندان
            </Link>
          </h3>
        </section>
      </div>
    </footer>
  );
};

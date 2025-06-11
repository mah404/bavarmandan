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
                className="w-40 h-40 rounded-2xl shadow-lg ring-2 ring-primary bg-gradient-to-tr from-primary via-primary/60 to-primary "
              />
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Link href="#services">
              <h3 className="font-bold text-lg cursor-pointer hover:text-primary transition">
                شبکه‌های اجتماعی
              </h3>
            </Link>{" "}
            <div className="flex flex-row">
              <Link
                href="https://t.me/bavarmandan110"
                className="opacity-60 hover:opacity-100 mr-2"
              >
                تلگرام
              </Link>
              <Link href="" className="opacity-60 hover:opacity-100 ml-2">
                کلاب‌هاوس
              </Link>
            </div>
            <div className="flex flex-row">
              <Link
                href="#services"
                className="opacity-60 hover:opacity-100 mr-2"
              >
                یوتیوب
              </Link>
              <Link
                href="#services"
                className="opacity-60 hover:opacity-100 ml-2"
              >
                اینستاگرام
              </Link>
            </div>
            <div className=" items-center gap-2 ">
              <Link href="https://t.me/bavarmandanBot">
                <h3 className="font-bold text-lg mt-6"> ارتباط مستقیم با ما</h3>
              </Link>
            </div>
          </div>
        </div>

<Separator className="my-6 bg-muted-foreground" />

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

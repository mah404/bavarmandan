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
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Link href="#services">
              <h3 className="font-bold text-lg cursor-pointer hover:text-primary transition">
                شبکه‌های اجتماعی
              </h3>
            </Link>{" "}
            <Link href="https://t.me/bavarmandan110" className="opacity-60 hover:opacity-100">
              تلگرام
            </Link>
            <Link href="https://www.clubhouse.com/house/%D9%85%D8%AC%D9%85%D8%B9-%D8%A8%D8%A7%D9%88%D8%B1%D9%85%D9%86%D8%AF%D8%A7%D9%86-%DA%A9%D9%84%D8%A7%D8%A8-%D9%87%D8%A7%D9%88%D8%B3?chs=lgAI3r9pbR%3ADrbcc1Vdpax6lhaqJt_P0rUiUeHCPDXTK0QStpjNRXo&utm_medium=ch_house_settings" className="opacity-60 hover:opacity-100">
              کلاب‌هاوس
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Link href="#services" className="opacity-60 hover:opacity-100">
              یوتیوب
            </Link>
            <Link href="#services" className="opacity-60 hover:opacity-100">
              اینستاگرام
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Link href="https://t.me/bavarmandanBot">
              <h3 className="font-bold text-lg"> ارتباط مستقیم با ما</h3>
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

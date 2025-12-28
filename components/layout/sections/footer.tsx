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
                href="https://www.youtube.com/@bavarmandan"
                className="opacity-60 hover:opacity-100 mr-2 transition duration-300 flex items-center gap-1  hover:text-primary"
              >
                یوتیوب
                <img src="/youtube.png" alt="youtube" className="w-4 h-4" />
              </Link>

              <Link
                href="https://www.clubhouse.com/house/%D9%85%D8%AC%D9%85%D8%B9-%D8%A8%D8%A7%D9%88%D8%B1%D9%85%D9%86%D8%AF%D8%A7%D9%86?chs=vgJIag5VYG%3AHJqbfkIoYRlofbeOY8p06RDKoa8xs1iz8W4cLx6HAlA&utm_medium=ch_house_settings"
                className="opacity-60 hover:opacity-100 ml-2 transition duration-300 flex items-center gap-1  hover:text-primary"
              >
                کلاب‌هاوس
                <img
                  src="/clubhouse-icon.png"
                  alt="clubhouse"
                  className="w-4 h-4"
                />
              </Link>
            </div>
            <div className="flex flex-row">
              <Link
                href="https://www.tiktok.com/@bavarmandan"
                className="opacity-60 hover:opacity-100 mr-2 transition duration-300 flex items-center gap-1  hover:text-primary"
              >
                تیک‌ تاک
                <img src="/tiktok.png" alt="TikTok" className="w-4 h-4" />
              </Link>

              <Link
                href="https://www.instagram.com/bavarmandan110/"
                className="opacity-60 hover:opacity-100 ml-2 transition duration-300 flex items-center gap-1  hover:text-primary"
              >
                اینستاگرام
                <img src="/instagram.png" alt="instagram" className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex justify-center ">
              <Link
                href="https://t.me/bavarmandan110"
                className="flex items-center gap-1 opacity-60 hover:opacity-100 transition hover:text-primary duration-300 "
              >
                تلگرام
                <img
                  src="/telegramicon.png"
                  alt="telegram"
                  className="w-4 h-4"
                />
              </Link>
            </div>
            <div className=" items-center gap-2 ">
              <Link href="https://t.me/bavarmandanBot">
                <h3 className="font-bold text-lg mt-6 transition duration-300  hover:text-primary">
                  {" "}
                  ارتباط مستقیم با ما
                </h3>
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-muted-foreground" />

        <section className="w-full text-center">
          <h3 className="text-xs">
            © 1404 مالکیت، طراحی و توسعه{" "}
            <Link
              target="_blank"
              href="#"
              className="text-yellow-300 transition-all border-yellow-200 hover:border-b-2 ml-1 mr-2"
            >
              فرزندان امیرالمومنین (ع){" "}
            </Link>
          </h3>
        </section>
      </div>
    </footer>
  );
};

import { Separator } from "@/components/ui/separator";
import { ChevronsDownIcon } from "lucide-react";
import Link from "next/link";

export const FooterSection = () => {
  return (
    <footer id="contact" className="container py-24 sm:py-32">
      <div className="p-10 bg-card border border-secondary rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
          <div className="col-span-full xl:col-span-2">
            <Link href="#" className="flex font-bold items-center">
              <img
                src="/mainicon.jpg"
                className="w-24 h-24 mr-2 bg-gradient-to-tr from-primary via-primary/70 to-primary rounded-lg border border-secondary"
              />

            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg"> شبکه های اجتماعی</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                تلگرام
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                کلاب هاوس
              </Link>
            </div>

       
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">ارتباط با ما</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                راه ارتباطی
              </Link>
            </div>

        

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                نظرات شما
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        <section className="">
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

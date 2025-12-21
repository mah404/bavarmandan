import { BenefitAkhlaq } from "./BenefitAkhlaq ";
import { BenefitMaktobat } from "./BenefitMaktobat";
import { BenefitTajrid } from "./BenefitTajrid ";
import { BenefitsCard } from "./BenefitsCard";
import { SheetNavProvider } from "./SheetNavProvider";
export const BenefitsSection = () => {
  return (
    <section id="mohtava" className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
        <div className="">
          <h2 className="text-3xl  mb-4 text-primary  font-bold bg-card p-2 border-secondary border dark:border-none rounded-2xl dark:bg-transparent dark:rounded-none dark:p-0">
            <span className="text-sm align-super ">*</span>
            محتوای صوتی و نوشتاری
          </h2>

          <p className="text-lg text-muted-foreground mb-8 whitespace-nowrap overflow-hidden text-ellipsis text-center">
            مجموعه صوتی کامل و تدوین نشده ی جلسات
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 w-full">
          <SheetNavProvider>
            <BenefitMaktobat />
            <BenefitTajrid />
            <BenefitAkhlaq />
            <BenefitsCard />
          </SheetNavProvider>
        </div>
      </div>
    </section>
  );
};

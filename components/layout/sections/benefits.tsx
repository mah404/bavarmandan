import { BenefitAkhlaq } from "./BenefitAkhlaq ";
import { BenefitMaktobat } from "./BenefitMaktobat";
import { BenefitTajrid } from "./BenefitTajrid ";
import { BenefitsCard } from "./BenefitsCard";
import { SheetNavProvider } from "./SheetNavProvider";
import { FeaturesSection } from "./features";
export const BenefitsSection = () => {
  return (
    <section id="mohtava" className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
        <div className="w-full flex flex-col items-center text-center">
          {/* Title + description */}
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-2xl mb-4 text-primary font-bold bg-card px-6 py-2 border-secondary border dark:border-none rounded-2xl dark:bg-transparent dark:rounded-none">
              <span className="text-sm align-super">*</span>
              محتوای صوتی و نوشتاری
            </h2>

            <p className="text-md text-muted-foreground max-w-md">
              مجموعه صوتی کامل و تدوین نشده‌ی جلسات
            </p>
          </div>

          {/* Features */}
          <FeaturesSection />
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

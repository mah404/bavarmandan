import { BenefitAkhlaq } from "./BenefitAkhlaq ";
import { BenefitMaktobat } from "./BenefitMaktobat";
import { BenefitTajrid } from "./BenefitTajrid ";
import { BenefitsCard } from "./BenefitsCard";
import { FeaturesSection } from "./features";
import { MotionItem, MotionList, Reveal } from "./reveal";

export const BenefitsSection = () => {
  return (
    <section id="mohtava" className="container py-20 sm:py-28">
      <Reveal className="space-y-12">
        <div
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
          dir="rtl"
        >
          <div className="mb-5 h-1 w-16 rounded-full bg-primary" />
          <h2 className="whitespace-nowrap text-[2rem] font-extrabold leading-[1.7] text-primary sm:text-4xl md:text-5xl">
            <span className="text-xl align-super sm:text-2xl">*</span>
            محتوای صوتی و نوشتاری
          </h2>
          <p className="mt-3 max-w-2xl text-xl leading-9 text-muted-foreground md:text-2xl">
            مجموعه صوتی کامل و تدوین نشده‌ی جلسات
          </p>
        </div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="order-2 lg:order-1">
            <FeaturesSection />
          </div>

          <MotionList className="order-1 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:order-2">
            <MotionItem className="h-full">
              <BenefitMaktobat />
            </MotionItem>
            <MotionItem className="h-full">
              <BenefitTajrid />
            </MotionItem>
            <MotionItem className="h-full">
              <BenefitAkhlaq />
            </MotionItem>
            <MotionItem className="h-full">
              <BenefitsCard />
            </MotionItem>
          </MotionList>
        </div>
      </Reveal>
    </section>
  );
};

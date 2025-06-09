import { BenefitAkhlaq } from "./BenefitAkhlaq ";
import { BenefitMaktobat } from "./BenefitMaktobat";
import { BenefitTajrid } from "./BenefitTajrid ";
import { BenefitsCard } from "./BenefitsCard";
export const BenefitsSection = () => {
  return (
    <section className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
        <div dir="rtl">
          <h2 className="text-3xl font-bold mb-4">محتوای صوتی و نوشتاری</h2>
          <p className="text-xl text-muted-foreground mb-8">
            معرفی موضوعات متنوع برای توسعه فکری.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 w-full">
          <BenefitMaktobat />
          <BenefitTajrid />
          <BenefitAkhlaq />
          <BenefitsCard />
        </div>
      </div>
    </section>
  );
};

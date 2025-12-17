import { BenefitsSection } from "@/components/layout/sections/benefits";
import { CommunitySection } from "@/components/layout/sections/community";
import { FAQSection } from "@/components/layout/sections/faq";
import { FeaturesSection } from "@/components/layout/sections/features";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { PricingSection } from "@/components/layout/sections/pricing";
import { ServicesSection } from "@/components/layout/sections/services";
import { SponsorsSection } from "@/components/layout/sections/sponsors";
import { TeamSection } from "@/components/layout/sections/team";
import { TestimonialSection } from "@/components/layout/sections/testimonial";

export const metadata = {
  title: "مجمع باورمندان کلاب هاوس",
  description: "تارنما مجمع باورمندان کلاب هاوس",
  openGraph: {
    type: "website",
    url: "https://www.bavarmandan.com/",
    title:"مجمع باورمندان",
    description: "تارنما مجمع باورمندان کلاب هاوس",
    images: [
      {
        url: "https://www.bavarmandan.com/mainicon.jpg",
        width: 1200,
        height: 630,
        alt: "تارنما مجمع باورمندان کلاب هاوس",
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <ServicesSection />
      <CommunitySection />
      <FooterSection />
    </>
  );
}

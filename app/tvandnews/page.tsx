import { SponsorsSection } from "@/components/layout/sections/sponsors";
import { FAQSection } from "@/components/layout/sections/faq";
import { PricingSection } from "@/components/layout/sections/pricing";
import { TestimonialSection } from "@/components/layout/sections/testimonial";
import { TeamSection } from "@/components/layout/sections/team";
import { FooterSection } from "@/components/layout/sections/footer";
import LivePlayer from "@/components/layout/sections/LivePlayer";

export default function NewsPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      
      <LivePlayer />

      {/* <TestimonialSection /> */}
      {/* <TeamSection /> */}

      <FooterSection />
    </main>
  );
}
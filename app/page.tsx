import { BenefitsSection } from "@/components/layout/sections/benefits";
import { CommunitySection } from "@/components/layout/sections/community";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { ServicesSection } from "@/components/layout/sections/services";

export const metadata = {
  title: "مجمع باورمندان",
  description:
    "تارنمای مجمع باورمندان؛ معرفی جلسات، گفتگوها، فایل‌های صوتی و منابع مرتبط.",
  openGraph: {
    type: "website",
    url: "https://www.bavarmandan.com/",
    title: "مجمع باورمندان",
    description:
      "تارنمای مجمع باورمندان؛ معرفی جلسات، گفتگوها، فایل‌های صوتی و منابع مرتبط.",
    images: [
      {
        url: "https://www.bavarmandan.com/mainicon.jpg",
        width: 1200,
        height: 630,
        alt: "مجمع باورمندان",
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <ServicesSection />
      <CommunitySection />
      <FooterSection />
    </>
  );
}

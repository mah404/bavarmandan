import type { Metadata } from "next";
import { BenefitsSection } from "@/components/layout/sections/benefits";
import { CommunitySection } from "@/components/layout/sections/community";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { ServicesSection } from "@/components/layout/sections/services";

const siteUrl = "https://www.bavarmandan.com";

const homeDescription =
  "در مجمع باورمندان به آرشیو جلسات صوتی و مکتوبات تفسیر قرآن، تفسیر ترتیبی سوره حمد، تفسیر موضوعی احسن الحدیث، اصول عقاید شیعه، مباحث اخلاقی و دروس شرح کتاب تجرید الاعتقاد دسترسی داشته باشید.";

export const metadata: Metadata = {
  title: {
    absolute: "مجمع باورمندان | تفسیر قرآن، عقاید شیعه و مباحث اخلاقی",
  },
  description: homeDescription,
  alternates: {
    canonical: siteUrl,
  },
  keywords: [
    "مجمع باورمندان",
    "تفسیر قرآن",
    "تفسیر ترتیبی سوره حمد",
    "تفسیر موضوعی احسن الحدیث",
    "اصول عقاید شیعه",
    "مباحث اخلاقی",
    "شرح کتاب تجرید الاعتقاد",
    "برهان امکان و وجوب",
    "اثبات ذات و صفات الله",
    "نشئات وجودی انسان",
    "جلسات صوتی دینی",
    "مکتوبات اعتقادی",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "مجمع باورمندان | تفسیر قرآن، عقاید شیعه و مباحث اخلاقی",
    description: homeDescription,
    images: [
      {
        url: `${siteUrl}/mainicon.jpg`,
        width: 1200,
        height: 630,
        alt: "مجمع باورمندان",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مجمع باورمندان | تفسیر قرآن، عقاید شیعه و مباحث اخلاقی",
    description: homeDescription,
    images: [`${siteUrl}/mainicon.jpg`],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "مجمع باورمندان",
      alternateName: "باورمندان",
      url: siteUrl,
      inLanguage: "fa-IR",
      description: homeDescription,
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${siteUrl}/#organization`,
      name: "مجمع باورمندان",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/mainicon.jpg`,
      },
      sameAs: [
        "https://www.instagram.com/bavarmandan110/",
        "https://www.youtube.com/@bavarmandan",
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${siteUrl}/#main-topics`,
      name: "موضوعات اصلی مجمع باورمندان",
      inLanguage: "fa-IR",
      itemListElement: [
        "تفسیر قرآن",
        "تفسیر ترتیبی سوره حمد",
        "تفسیر موضوعی احسن الحدیث",
        "اصول عقاید شیعه",
        "مباحث اخلاقی",
        "دروس شرح کتاب تجرید الاعتقاد",
      ].map((name, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
        url: siteUrl,
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HeroSection />
      <BenefitsSection />
      <ServicesSection />
      <CommunitySection />
      <FooterSection />
    </>
  );
}

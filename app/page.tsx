import type { Metadata } from "next";
import { BenefitsSection } from "@/components/layout/sections/benefits";
import { CommunitySection } from "@/components/layout/sections/community";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { ServicesSection } from "@/components/layout/sections/services";

const siteUrl = "https://www.bavarmandan.com";

const homeTitle = "مجمع باورمندان | تفسیر قرآن، اصول عقاید شیعه و مباحث اخلاقی";

const homeDescription =
  "مجمع باورمندان: آرشیو جلسات صوتی و مکتوب تفسیر قرآن و سوره حمد، تفسیر موضوعی احسن الحدیث، اصول عقاید شیعه، برهان امکان و وجوب، شرح تجرید الاعتقاد و مباحث اخلاقی.";

export const metadata: Metadata = {
  title: {
    absolute: homeTitle,
  },
  description: homeDescription,
  alternates: {
    canonical: siteUrl,
    languages: { "fa-IR": siteUrl },
  },
  // Search engines mostly ignore keywords; they are kept for the ones that still read them, as the words people type.
  keywords: [
    "مجمع باورمندان",
    "باورمندان",
    "تفسیر قرآن",
    "تفسیر قرآن صوتی",
    "تفسیر ترتیبی سوره حمد",
    "تفسیر سوره حمد",
    "تفسیر موضوعی احسن الحدیث",
    "احسن الحدیث",
    "تفسیر سوره واقعه",
    "اصول عقاید شیعه",
    "عقاید شیعه",
    "اثبات وجود خدا",
    "برهان امکان و وجوب",
    "برهان وجوب و امکان",
    "اثبات ذات و صفات الله",
    "شرح تجرید الاعتقاد",
    "شرح کشف المراد",
    "دروس تجرید الاعتقاد",
    "مباحث اخلاقی",
    "اخلاق اسلامی",
    "نشئات وجودی انسان",
    "جلسات صوتی دینی",
    "دانلود جلسات صوتی تفسیر",
    "مکتوب جلسات تفسیر",
    "کلاس اعتقادات",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "مجمع باورمندان",
    locale: "fa_IR",
    title: homeTitle,
    description: "گوش دادن و دانلود جلسات تفسیر قرآن، اصول عقاید شیعه، برهان امکان و وجوب، شرح تجرید الاعتقاد و مباحث اخلاقی، همراه با مکتوب هر جلسه.",
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: "گوش دادن و دانلود جلسات تفسیر قرآن، اصول عقاید شیعه، برهان امکان و وجوب، شرح تجرید الاعتقاد و مباحث اخلاقی، همراه با مکتوب هر جلسه.",
  },
};

const sameAs = [
  "https://www.instagram.com/bavarmandan110/",
  "https://www.youtube.com/@bavarmandan110",
  "https://t.me/bavarmandan110",
  "https://www.aparat.com/Bavarmandan110",
  "https://eitaa.com/Bavarmandan110",
  "https://virasty.com/bavarmandan110",
  "https://www.tiktok.com/@bavarmandan110",
];

// The series of the site, described to search engines as courses (all of them can be listened to and read by anyone).
const courses = [
  {
    name: "تفسیر ترتیبی سوره حمد",
    description: "جلسات صوتی و مکتوب تفسیر ترتیبی سوره مبارکه حمد.",
    about: ["تفسیر قرآن", "سوره حمد"],
    teacher: "حجت‌الاسلام والمسلمین رامین گلمکانی",
  },
  {
    name: "تفسیر موضوعی احسن الحدیث",
    description: "تفسیر موضوعی سوره واقعه و مباحث معاد، در قالب جلسات صوتی و مکتوب.",
    about: ["تفسیر موضوعی قرآن", "معاد"],
    teacher: "حجت‌الاسلام والمسلمین رامین گلمکانی",
  },
  {
    name: "اصول عقاید شیعه",
    description: "گفتارهای اعتقادی: باورداشت، مع الصادقین، کنکاش در عقاید، شیعه و میراث فاطمی و گفتگوهای قرآنی.",
    about: ["اصول عقاید شیعه", "کلام اسلامی"],
  },
  {
    name: "برهان امکان و وجوب و اثبات صفات الله تعالی",
    description: "جلسات اثبات ذات و صفات الله از طریق برهان امکان و وجوب، همراه با مکتوب هر جلسه.",
    about: ["برهان امکان و وجوب", "اثبات صفات الله"],
  },
  {
    name: "دروس شرح کتاب تجرید الاعتقاد",
    description: "شرح، جزوه و صوت جلسات کتاب تجرید الاعتقاد خواجه نصیرالدین طوسی (کشف المراد).",
    about: ["تجرید الاعتقاد", "کلام شیعه"],
  },
  {
    name: "مباحث اخلاقی",
    description: "گفتارهای اخلاقی دربارهٔ نشئات وجودی انسان، تکبر، حب دنیا، حسد، غیبت، ریا و دیگر موضوعات.",
    about: ["اخلاق اسلامی", "نشئات وجودی انسان"],
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "مجمع باورمندان",
      alternateName: ["باورمندان", "Bavarmandan"],
      url: siteUrl,
      inLanguage: "fa-IR",
      description: homeDescription,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      url: siteUrl,
      name: homeTitle,
      description: homeDescription,
      inLanguage: "fa-IR",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${siteUrl}/#organization`,
      name: "مجمع باورمندان",
      alternateName: "باورمندان",
      url: siteUrl,
      description: homeDescription,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/mainicon.jpg`,
        width: 500,
        height: 500,
      },
      image: `${siteUrl}/opengraph-image`,
      sameAs,
      knowsAbout: ["تفسیر قرآن", "اصول عقاید شیعه", "کلام اسلامی", "اخلاق اسلامی", "تجرید الاعتقاد"],
      hasCourse: courses.map((course) => ({ "@id": `${siteUrl}/#course-${encodeURIComponent(course.name)}` })),
    },
    ...courses.map((course) => ({
      "@type": "Course",
      "@id": `${siteUrl}/#course-${encodeURIComponent(course.name)}`,
      name: course.name,
      description: course.description,
      url: siteUrl,
      inLanguage: "fa",
      about: course.about,
      isAccessibleForFree: true,
      courseMode: "online",
      provider: { "@id": `${siteUrl}/#organization` },
      ...(course.teacher ? { teaches: course.about.join("، "), author: { "@type": "Person", name: course.teacher } } : {}),
    })),
    {
      "@type": "ItemList",
      "@id": `${siteUrl}/#main-topics`,
      name: "موضوعات اصلی مجمع باورمندان",
      inLanguage: "fa-IR",
      itemListElement: courses.map((course, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: course.name,
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
      <h1 className="sr-only">
        مجمع باورمندان؛ جلسات صوتی و مکتوب تفسیر قرآن، اصول عقاید شیعه، برهان امکان و وجوب، شرح تجرید الاعتقاد و مباحث اخلاقی
      </h1>
      <HeroSection />
      <BenefitsSection />
      <ServicesSection />
      <CommunitySection />
      <FooterSection />
    </>
  );
}

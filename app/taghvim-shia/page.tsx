import type { Metadata } from "next";
import Link from "next/link";

const pageUrl = "https://www.bavarmandan.com/taghvim-shia";
const pdfUrl = "https://www.bavarmandan.com/taghvim-shia.pdf";

export const metadata: Metadata = {
  title: "تقویم شیعه | مجمع باورمندان",
  description:
    "صفحه معرفی و دریافت تقویم شیعه؛ کتابی درباره مناسبت‌ها، ایام و رویدادهای مهم مذهبی بر اساس منابع شیعی.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "تقویم شیعه | مجمع باورمندان",
    description:
      "معرفی، مشاهده و دانلود فایل PDF تقویم شیعه در سایت مجمع باورمندان.",
    url: pageUrl,
    siteName: "مجمع باورمندان",
    type: "article",
    locale: "fa_IR",
  },
  twitter: {
    card: "summary",
    title: "تقویم شیعه | مجمع باورمندان",
    description:
      "معرفی، مشاهده و دانلود فایل PDF تقویم شیعه در سایت مجمع باورمندان.",
  },
};

export default function TaghvimShiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "تقویم شیعه",
    inLanguage: "fa",
    author: {
      "@type": "Person",
      name: "عبدالحسین بندانی نیشابوری",
    },
    publisher: {
      "@type": "Organization",
      name: "مجمع باورمندان",
      url: "https://www.bavarmandan.com",
    },
    url: pageUrl,
    encoding: {
      "@type": "MediaObject",
      contentUrl: pdfUrl,
      encodingFormat: "application/pdf",
    },
  };

  return (
    <main className="container py-20 sm:py-28" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-4xl text-center">
        <p className="mx-auto mb-5 w-fit rounded-full border border-primary/30 px-5 py-2 text-sm font-bold text-primary">
          کتاب مفید
        </p>

        <h1 className="text-4xl font-extrabold leading-[1.8] text-foreground sm:text-5xl">
          تقویم شیعه
        </h1>

        <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-10 text-muted-foreground">
          تقویم شیعه مجموعه‌ای برای آشنایی با مناسبت‌ها، ایام و رویدادهای
          مهم مذهبی است. در این صفحه می‌توانید فایل PDF این کتاب را مشاهده یا
          دانلود کنید.
        </p>

        <section className="mt-10 rounded-2xl border border-secondary/50 bg-card/80 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.12)] dark:bg-card/70 sm:p-8">
          <h2 className="text-2xl font-extrabold leading-10 text-primary">
            تقویم شیعه - عبدالحسین بندانی نیشابوری
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-8 text-muted-foreground">
            برای جلوگیری از نمایش نامرتب متن PDF در نتایج جستجو، این صفحه به
            عنوان صفحه اصلی معرفی فایل ساخته شده است.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/taghvim-shia.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl border border-primary/30 bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:bg-primary/90 dark:text-[#082b26] sm:w-auto"
            >
              مشاهده PDF
            </Link>

            <Link
              href="/taghvim-shia.pdf"
              download
              className="inline-flex w-full items-center justify-center rounded-xl border border-secondary px-5 py-3 text-sm font-extrabold text-foreground transition hover:border-primary/50 hover:text-primary sm:w-auto"
            >
              دانلود PDF
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}

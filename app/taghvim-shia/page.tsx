import Link from "next/link";

export const metadata = {
  title: "تقویم شیعه | مجمع باورمندان",
  description:
    "معرفی و دسترسی به فایل PDF تقویم شیعه اثر عبدالحسین بندانی نیشابوری.",
  alternates: {
    canonical: "https://www.bavarmandan.com/taghvim-shia",
  },
  openGraph: {
    title: "تقویم شیعه | مجمع باورمندان",
    description:
      "معرفی و دسترسی به فایل PDF تقویم شیعه اثر عبدالحسین بندانی نیشابوری.",
    url: "https://www.bavarmandan.com/taghvim-shia",
    type: "article",
  },
};

export default function TaghvimShiaPage() {
  return (
    <main className="container py-20 sm:py-28" dir="rtl">
      <section className="mx-auto max-w-3xl rounded-2xl border border-secondary/50 bg-card/90 p-6 text-right shadow-[0_18px_48px_rgba(0,0,0,0.12)] dark:bg-card/80 sm:p-8">
        <p className="mb-3 text-sm font-bold text-primary">کتب مفید</p>
        <h1 className="text-3xl font-extrabold leading-[1.7] text-foreground sm:text-4xl">
          تقویم شیعه
        </h1>
        <p className="mt-3 text-base font-medium leading-8 text-muted-foreground">
          فایل PDF کتاب تقویم شیعه اثر عبدالحسین بندانی نیشابوری برای مطالعه و
          استفاده علاقه‌مندان.
        </p>

        <Link
          href="/taghvim-shia.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center rounded-xl border border-primary/30 bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:bg-primary/90 dark:text-[#082b26]"
        >
          مشاهده فایل PDF
        </Link>
      </section>
    </main>
  );
}

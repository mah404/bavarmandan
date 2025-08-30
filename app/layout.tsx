import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";
const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "مجمع باورمندان ",
  description: "وبسایت رسمی مجمع باورمندان ؛ معرفی جلسات، گفتگوها و محتوای مرتبط.",
  keywords: [
    "مجمع باورمندان",
    "کلاب هاوس",
    "گفتگو",
    "ایران",
    "فلسفه",
    "باورمندان",
    "جلسات اعتقادی",
    "باور قرآن",
    "گفتگوهای فلسفی",
    "خداباوران",
    "خداناباوران",
    "جلسات کلاب هاوس",
    "اندیشه دینی",
    "گفتگوی اعتقادی",
    "بحث فلسفی",
    "گفتگو درباره خدا",
    "ایمان و عقل",
    "جامعه باورمندان",
    "دیالوگ فلسفی",
    "نقد دین",
    "معرفت‌شناسی",
    "خردگرایی",
    "بحث دینی",
    "فلسفه دین",
    "الهیات",
  ],  openGraph: {
    title: "مجمع باورمندان",
    description: "  معرفی جلسات و گفتگوهای مجمع باورمندان در کلاب هاوس و سایر پلتفرم ها",
    url: "https://www.bavarmandan.com",
    siteName: "مجمع باورمندان",
    images: [
      {
        url: "https://www.bavarmandan.com/mainicon.jpg",
        width: 1200,
        height: 630,
        alt: "مجمع باورمندان",
      },
    ],
    locale: "fa_IR",
    type: "website",
  },
  verification: {
    google: "4cbe7fbb3092c5fd",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className="dark overflow-x-hidden"
      suppressHydrationWarning
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playpen+Sans+Arabic:wght@100..800&display=swap"
          rel="stylesheet"
        />
             {/* Instagram profile */}
        <meta property="og:see_also" content="https://www.instagram.com/bavarmandan110/" />
        <meta name="instagram:site" content="https://www.instagram.com/bavarmandan110/" />

        {/* YouTube channel */}
        <meta property="og:see_also" content="https://www.youtube.com/@bavarmandan" />
        <meta name="youtube:channel" content="https://www.youtube.com/@bavarmandan" />
        
      </head>

      <body
        className={cn(
          "min-h-screen bg-background overflow-x-hidden",
          inter.className
        )}
      >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AudioPlayerProvider>
              <Navbar />
              {children}
            </AudioPlayerProvider>
          </ThemeProvider>
          <Analytics />
      </body>
    </html>
  );
}

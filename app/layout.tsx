import type { Metadata, Viewport } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";
import { PWAInstallIntent } from "@/components/pwa-install-intent";
import { PWARegister } from "@/components/pwa-register";
import { Providers } from "./providers";

const siteUrl = "https://www.bavarmandan.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "مجمع باورمندان | تفسیر قرآن، عقاید شیعه و مباحث اخلاقی",
    template: "%s | مجمع باورمندان",
  },
  description:
    "مجمع باورمندان؛ آرشیو جلسات صوتی، مکتوبات و منابع آموزشی در تفسیر قرآن، تفسیر ترتیبی سوره حمد، تفسیر موضوعی احسن الحدیث، اصول عقاید شیعه، مباحث اخلاقی و شرح کتاب تجرید الاعتقاد.",
  applicationName: "مجمع باورمندان",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  creator: "مجمع باورمندان",
  publisher: "مجمع باورمندان",
  category: "آموزش دینی و معارف اسلامی",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
    languages: {
      "fa-IR": "/",
    },
  },
  keywords: [
    "مجمع باورمندان",
    "باورمندان",
    "تفسیر قرآن",
    "تفسیر ترتیبی",
    "تفسیر ترتیبی سوره حمد",
    "تفسیر موضوعی",
    "تفسیر موضوعی احسن الحدیث",
    "احسن الحدیث",
    "اصول عقاید شیعه",
    "عقاید شیعه",
    "مباحث اخلاقی",
    "دروس شرح کتاب تجرید الاعتقاد",
    "شرح تجرید الاعتقاد",
    "تجرید الاعتقاد",
    "قرآن کریم",
    "سوره حمد",
    "برهان امکان و وجوب",
    "اثبات ذات و صفات الله",
    "نشئات وجودی انسان",
    "اندیشه دینی",
    "فلسفه دین",
    "گفتگوی اعتقادی",
    "جلسات اعتقادی",
    "فایل صوتی مذهبی",
    "مکتوبات دینی",
    "کلاب هاوس",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "مجمع باورمندان | تفسیر قرآن، عقاید شیعه و مباحث اخلاقی",
    description:
      "آرشیو جلسات و منابع مجمع باورمندان: تفسیر قرآن، تفسیر سوره حمد، احسن الحدیث، اصول عقاید شیعه، مباحث اخلاقی و شرح تجرید الاعتقاد.",
    url: siteUrl,
    siteName: "مجمع باورمندان",
    images: [
      {
        url: "/mainicon.jpg",
        width: 1200,
        height: 630,
        alt: "مجمع باورمندان",
      },
    ],
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "مجمع باورمندان | تفسیر قرآن، عقاید شیعه و مباحث اخلاقی",
    description:
      "آرشیو جلسات صوتی و مکتوبات دینی در تفسیر قرآن، عقاید شیعه، اخلاق و شرح تجرید الاعتقاد.",
    images: ["/mainicon.jpg"],
  },
  verification: {
    google: "4cbe7fbb3092c5fd",
  },
  appleWebApp: {
    capable: true,
    title: "مجمع باورمندان",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#082b26",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn("overflow-x-hidden", inter.variable, vazir.variable)}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="pwa-install-prompt-capture"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.__bavarmandanInstallPrompt = null;
              window.addEventListener("beforeinstallprompt", function(event) {
                event.preventDefault();
                window.__bavarmandanInstallPrompt = event;
                window.dispatchEvent(new Event("bavarmandan-pwa-install-ready"));
              });
            `,
          }}
        />
        <meta
          property="og:see_also"
          content="https://www.instagram.com/bavarmandan110/"
        />
        <meta
          name="instagram:site"
          content="https://www.instagram.com/bavarmandan110/"
        />
        <meta
          property="og:see_also"
          content="https://www.youtube.com/@bavarmandan110"
        />
        <meta
          name="youtube:channel"
          content="https://www.youtube.com/@bavarmandan"
        />
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "مجمع باورمندان",
              url: siteUrl,
              logo: `${siteUrl}/mainicon.jpg`,
              sameAs: [
                "https://www.instagram.com/bavarmandan110/",
                "https://www.youtube.com/@bavarmandan",
              ],
            }),
          }}
        />
      </head>

      <body
        className={cn(
          "min-h-screen overflow-x-hidden bg-background",
          inter.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <AudioPlayerProvider>
              <PWARegister />
              <Navbar />
              {children}
              <Suspense fallback={null}>
                <PWAInstallIntent />
              </Suspense>
            </AudioPlayerProvider>
          </Providers>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

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
import { Providers } from "./providers";

const siteUrl = "https://www.bavarmandan.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "مجمع باورمندان",
  description:
    "تارنمای مجمع باورمندان؛ معرفی جلسات، گفتگوها، فایل‌های صوتی و منابع مرتبط.",
  applicationName: "مجمع باورمندان",
  manifest: "/manifest.webmanifest",
  keywords: [
    "مجمع باورمندان",
    "کلاب هاوس",
    "جلسات اعتقادی",
    "گفتگوی اعتقادی",
    "اندیشه دینی",
    "فلسفه دین",
    "باورمندان",
  ],
  openGraph: {
    title: "مجمع باورمندان",
    description:
      "معرفی جلسات و گفتگوهای مجمع باورمندان در کلاب هاوس و سایر پلتفرم‌ها.",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Playpen+Sans+Arabic:wght@100..800&display=swap"
          rel="stylesheet"
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

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";
import SmoothScroll from "@/components/layout/sections/SmoothScroll";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Landing Page",
  description: "Landing template from SomeThing",
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
      </head>

      <body
        className={cn(
          "min-h-screen bg-background overflow-x-hidden",
          inter.className
        )}
      >
        <SmoothScroll>
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
        </SmoothScroll>
      </body>
    </html>
  );
}

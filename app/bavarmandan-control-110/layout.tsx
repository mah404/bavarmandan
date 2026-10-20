import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "داشبورد مدیریت",
  description: "داشبورد خصوصی مدیریت مجمع باورمندان",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminAreaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

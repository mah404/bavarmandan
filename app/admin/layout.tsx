import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود به پنل مدیریت",
  description: "پنل خصوصی مدیریت مجمع باورمندان",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}

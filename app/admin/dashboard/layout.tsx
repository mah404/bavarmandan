import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "داشبورد مدیریت | مجمع باورمندان",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

// One session check for every dashboard section.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasAdminSession()) redirect("/admin");

  return children;
}

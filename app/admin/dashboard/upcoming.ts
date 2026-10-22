import {
  BookOpen,
  BookOpenText,
  HeartHandshake,
  Landmark,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type PlannedSection = {
  /** Small pill in the card's top corner. */
  kicker: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Set once the management page exists; the card then opens it. */
  href?: string;
};

// The sections of the site's first page. Each one is shown as "under construction" until its management
// page exists: build it under app/admin/dashboard/<name>/, then move the entry to sections.ts (with an href).
export const plannedSections: PlannedSection[] = [
  {
    kicker: "تفسیر",
    title: "قرآن کریم",
    description: "مجموعه‌ی تفسیر قرآن کریم به زبان ساده",
    icon: BookOpen,
    href: "/admin/dashboard/tafsir",
  },
  {
    kicker: "اعتقادات",
    title: "اصول عقاید تشیع",
    description: "مجموعه گفتارهای اعتقادی",
    icon: Landmark,
    href: "/admin/dashboard/aghayed",
  },
  {
    kicker: "اصول عقاید",
    title: "برهان امکان و وجوب · اثبات صفات الله تعالی",
    description: "متن، صوت و فایل‌های مرتبط",
    icon: Sparkles,
    href: "/admin/dashboard/burhan",
  },
  {
    kicker: "اخلاق",
    title: "مباحث اخلاقی",
    description: "گفتارها و فایل‌های صوتی",
    icon: HeartHandshake,
    href: "/admin/dashboard/akhlagh",
  },
  {
    kicker: "شرح کتاب",
    title: "دروس شرح کتاب تجرید الاعتقاد",
    description: "شرح، جزوه و صوت جلسات",
    icon: BookOpenText,
    href: "/admin/dashboard/tajrid",
  },
  {
    kicker: "تنظیمات",
    title: "تنظیمات سایت",
    description: "لوگو، متن‌ها و شبکه‌های اجتماعی",
    icon: Settings,
  },
];

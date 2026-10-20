export type DashboardSection = {
  id: string;
  href: string;
  title: string;
  description: string;
  cta: string;
};

// Add a live dashboard section here and create its folder under app/admin/dashboard/<name>/.
export const dashboardSections: DashboardSection[] = [
  {
    id: "announcements",
    href: "/admin/dashboard/announcements",
    title: "اعلانات",
    description: "نوشتن، ویرایش و انتشار اعلان‌های صفحهٔ اول سایت",
    cta: "مدیریت اعلان‌ها",
  },
];

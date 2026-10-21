import type { Metadata } from "next";
import { AnnouncementsAdmin } from "./AnnouncementsAdmin";

export const metadata: Metadata = {
  title: "اعلانات | پیشخوان مدیریت",
};

export default function DashboardAnnouncementsPage() {
  return <AnnouncementsAdmin />;
}

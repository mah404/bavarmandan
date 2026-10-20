import type { Metadata } from "next";
import { AnnouncementsAdmin } from "./AnnouncementsAdmin";

export const metadata: Metadata = {
  title: "اعلانات | پنل مدیریت",
};

export default function DashboardAnnouncementsPage() {
  return <AnnouncementsAdmin />;
}

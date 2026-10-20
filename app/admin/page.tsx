import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import { AdminLoginPage } from "./AdminLoginPage";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (hasAdminSession()) redirect("/admin/dashboard");
  return <AdminLoginPage />;
}

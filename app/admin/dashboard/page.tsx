import { redirect } from "next/navigation";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { hasAdminSession } from "@/lib/admin-auth";
import { logoutAdmin } from "../actions";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  if (!hasAdminSession()) redirect("/admin");

  return (
    <main className="fixed inset-0 z-[2147483000] min-h-dvh overflow-y-auto bg-background text-foreground" dir="rtl">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between gap-4 border-b border-primary/25 pb-5">
          <p className="text-base font-extrabold sm:text-lg">مجمع باورمندان</p>
          <form action={logoutAdmin}>
            <button type="submit" className="grid size-10 place-items-center rounded-xl border border-primary/25 text-primary transition hover:border-primary/60 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="خروج از داشبورد" title="خروج">
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          </form>
        </header>
        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 grid size-16 place-items-center rounded-2xl border border-primary/35 bg-primary/10 text-primary">
            <LayoutDashboard className="size-8" aria-hidden="true" />
          </div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-primary sm:text-sm">
            <ShieldCheck className="size-4" aria-hidden="true" />
            <span>نشست مدیریت فعال است</span>
          </div>
          <h1 className="text-2xl font-black sm:text-3xl">داشبورد مدیریت</h1>
          <p className="mt-3 max-w-md text-sm font-medium leading-7 text-muted-foreground sm:text-base">فضای اصلی داشبورد آماده است. امکانات مدیریت در مراحل بعدی به این صفحه اضافه می‌شوند.</p>
        </section>
      </div>
    </main>
  );
}

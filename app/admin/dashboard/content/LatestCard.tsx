"use client";

import Link from "next/link";
import { Timer } from "lucide-react";

/** A plain card like the other sections: it only opens the page that manages "جدیدترین محتواها". */
export function LatestCard({ style }: { style?: React.CSSProperties }) {
  return (
    <Link href="/admin/dashboard/latest" className="plan-card is-link rise" style={style}>
      <div className="plan-top">
        <span className="plan-ic" aria-hidden="true">
          <Timer size={22} strokeWidth={1.7} />
        </span>
        <span className="plan-kicker">صفحه‌ی اول</span>
      </div>
      <h3>جدیدترین محتواها</h3>
      <p>انتخاب جلسه‌هایی که در صفحه‌ی اول سایت نمایش داده می‌شوند</p>
      <div className="plan-foot">
        <span className="plan-status live">
          <i aria-hidden="true" />
          فعال
        </span>
        <span className="plan-soon">مدیریت جدیدترین‌ها ←</span>
      </div>
    </Link>
  );
}

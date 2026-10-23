"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

/** Opens the visits page. Built like the other cards: the icon is the faded watermark that flies to the corner on hover. */
export function AnalyticsCard({ style }: { style?: React.CSSProperties }) {
  return (
    <Link href="/admin/dashboard/analytics" className="plan-card is-link rise" style={style}>
      <div className="plan-top">
        <span className="plan-ic" aria-hidden="true">
          <BarChart3 size={22} strokeWidth={1.7} />
        </span>
        <span className="plan-kicker">آمار</span>
      </div>
      <h3>آمار بازدید سایت</h3>
      <p>چه روزها و چه ساعت‌هایی سایت دیده شده</p>
      <div className="plan-foot">
        <span className="plan-status live">
          <i aria-hidden="true" />
          فعال
        </span>
        <span className="plan-soon">مشاهدهٔ آمار ←</span>
      </div>
    </Link>
  );
}

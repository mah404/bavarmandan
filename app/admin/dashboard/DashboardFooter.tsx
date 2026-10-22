import "./dashboard-footer.css";

/** A light footer for the dashboard pages: a thin line, the tagline in the middle, the brand and the brand at the side. */
export function DashboardFooter() {
  return (
    <footer className="bv-foot" dir="rtl">
      <div className="bv-foot-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mainicon.jpg" alt="" width={26} height={26} draggable={false} />
        <span>پیشخوان مجمع باورمندان</span>
      </div>

      <p className="bv-foot-tag" dir="ltr">
        <span>
          Powered with <b>چای</b> <em aria-hidden="true">☕</em>
        </span>
        <i aria-hidden="true">·</i>
        <span>
          Made with <em className="bv-heart" aria-hidden="true">♥</em> love
        </span>
      </p>
    </footer>
  );
}

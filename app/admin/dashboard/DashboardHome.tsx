"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./admin-home.css";
import { dashboardSections } from "./sections";
import { upcomingSections } from "./upcoming";
import { logoutAdminSession } from "./logout-client";
import { useThemeFlow } from "./use-theme-flow";

const rise = (delay: number) => ({ animationDelay: `${delay}s` });

// Four parts of the day, by the time the admin opens the page.
function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return { text: "صبح بخیر", emoji: "🌅" };
  if (hour >= 12 && hour < 16) return { text: "ظهر بخیر", emoji: "☀️" };
  if (hour >= 16 && hour < 20) return { text: "عصر بخیر", emoji: "🌤️" };
  return { text: "شب بخیر", emoji: "🌙" };
}

export function DashboardHome() {
  const { toggleTheme } = useThemeFlow();
  const [hello, setHello] = useState({ text: "سلام، خوش آمدید", emoji: "👋" });
  const [today, setToday] = useState("");

  useEffect(() => {
    const now = new Date();
    setHello(greetingFor(now.getHours()));
    try {
      setToday(
        now.toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      );
    } catch {
      setToday("");
    }
  }, []);

  return (
    <div className="bv-home" dir="rtl" lang="fa">
      <svg className="pattern" aria-hidden="true" width="100%" height="520">
        <defs>
          <pattern id="bvh-khatam" width="80" height="80" patternUnits="userSpaceOnUse">
            <g fill="none" strokeWidth="1">
              <rect x="20" y="20" width="40" height="40" />
              <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
              <path d="M0 40h11.7M68.3 40H80M40 0v11.7M40 68.3V80" />
            </g>
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="620" fill="url(#bvh-khatam)" />
      </svg>

      <div className="wrap">
        <header className="top">
          <Link className="brand" href="/admin/dashboard" aria-label="مجمع باورمندان، پیشخوان مدیریت">
            <span className="logo" aria-hidden="true">
              <img src="/mainicon.jpg" alt="" draggable={false} />
            </span>
            <span>
              <b>مجمع باورمندان</b>
              <small>پیشخوان مدیریت</small>
            </span>
          </Link>
          <span className="grow" />
          <button className="icon-btn" type="button" onClick={toggleTheme} aria-label="تغییر روشن/تیره">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />
            </svg>
          </button>
          <button
            className="icon-btn"
            type="button"
            aria-label="خروج"
            onClick={async () => {
              await logoutAdminSession();
              window.location.href = "/admin";
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 4H5v16h5M14 12H4M17 9l3 3-3 3" />
            </svg>
          </button>
        </header>

        <section className="hero">
          <div className="hero-txt">
            <span className="hello rise">
              <span className="hello-emoji" aria-hidden="true">{hello.emoji}</span> {hello.text}
            </span>
            <h1 className="rise" style={rise(0.08)}>امروز چه چیزی را با مخاطبان در میان می‌گذارید؟</h1>
            <span className="date rise" style={rise(0.16)}>{today}</span>
          </div>
          <div className="rose rise" aria-hidden="true">
            <span className="glow" />
            <svg className="a" viewBox="0 0 300 300">
              <g fill="none" stroke="#E6C55A" strokeLinejoin="round" strokeWidth="2">
                <rect x="62" y="62" width="176" height="176" opacity=".7" />
                <rect x="62" y="62" width="176" height="176" transform="rotate(45 150 150)" opacity=".7" />
                <circle cx="150" cy="150" r="136" strokeWidth="1.5" opacity=".3" strokeDasharray="4 10" />
              </g>
            </svg>
            <svg className="b" viewBox="0 0 300 300">
              <g fill="none" stroke="#E6C55A" strokeWidth="1.5" opacity=".4">
                <rect x="90" y="90" width="120" height="120" transform="rotate(22.5 150 150)" />
                <rect x="90" y="90" width="120" height="120" transform="rotate(67.5 150 150)" />
              </g>
            </svg>
            <span className="tile">
              <img src="/mainicon.jpg" alt="" draggable={false} />
            </span>
          </div>
        </section>

        <div className="main">
          {dashboardSections.map((section) => (
            <article key={section.href} className="feature rise" style={rise(0.22)} aria-labelledby={`bvh-${section.id}`}>
              <div className="feature-in f-row">
                <div className="f-head">
                  <span className="f-ic" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 10v4h3l7 4.5V5.5L7 10z" />
                      <path d="M17.5 9a4 4 0 010 6" />
                      <path d="M7 14l1.2 5h2.3l-1-5" />
                    </svg>
                  </span>
                  <div>
                    <h2 id={`bvh-${section.id}`}>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                </div>
                <Link className="primary" href={section.href}>
                  {section.cta}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="soon-head rise" style={rise(0.38)}>بخش‌هایی که به‌زودی اضافه می‌شوند</div>
        <div className="soon">
          {upcomingSections.map((item, index) => (
            <div key={item.title} className="s-card rise" style={rise(0.44 + index * 0.06)}>
              <span className="s-ic" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </span>
              <span>
                <b>{item.title}</b>
                <small>{item.description}</small>
              </span>
              <span className="tag">به‌زودی</span>
            </div>
          ))}
        </div>

        <footer className="foot">
          <Link href="/">مشاهدهٔ سایت</Link>
          <span>اتصال امن · فقط برای مدیر سایت</span>
        </footer>
      </div>
    </div>
  );
}

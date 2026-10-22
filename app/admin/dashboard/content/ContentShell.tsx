"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import "../admin-home.css";
import "./content.css";
import { DashboardFooter } from "../DashboardFooter";
import { TopMenu } from "../TopMenu";
import { DEMO_MODE } from "./api";
import { useLogoAudio } from "../secret-audio";

export interface Crumb {
  label: string;
  href?: string;
}

/** Page frame shared by the content pages: pattern, top bar with the breadcrumb, theme and sign-out. */
export function ContentShell({ crumbs, children }: { crumbs: Crumb[]; children: ReactNode }) {
  const toggleLogoAudio = useLogoAudio();
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : undefined;

  return (
    <div className="bv-home bv-ct" dir="rtl" lang="fa">
      <svg className="pattern" aria-hidden="true" width="100%" height="520">
        <defs>
          <pattern id="bvct-khatam" width="80" height="80" patternUnits="userSpaceOnUse">
            <g fill="none" strokeWidth="1">
              <rect x="20" y="20" width="40" height="40" />
              <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
              <path d="M0 40h11.7M68.3 40H80M40 0v11.7M40 68.3V80" />
            </g>
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="620" fill="url(#bvct-khatam)" />
      </svg>

      <div className="wrap">
        <header className="top ct-top">
          <div className="brand">
            <button type="button" className="logo logo-btn" onClick={toggleLogoAudio} aria-label="پخش صوت مجمع باورمندان">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mainicon.jpg" alt="" draggable={false} />
            </button>
          </div>

          <nav className="ct-crumbs" aria-label="مسیر">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="ct-crumb">
                {index > 0 ? (
                  <svg className="ct-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                ) : null}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <b aria-current="page">{crumb.label}</b>}
              </span>
            ))}
          </nav>

          <span className="grow" />
          {parent?.href ? (
            <Link className="icon-btn ct-back" href={parent.href} aria-label={`بازگشت به ${parent.label}`} title={`بازگشت به ${parent.label}`}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ) : null}
          <TopMenu />
        </header>

        {children}

        {DEMO_MODE ? <p className="ct-demo">پیشخوان به سرور وصل نیست؛ داده‌های این صفحه نمایشی‌اند و فقط روی همین مرورگر می‌مانند.</p> : null}

      </div>

      <DashboardFooter />
    </div>
  );
}

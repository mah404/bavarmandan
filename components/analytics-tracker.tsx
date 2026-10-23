"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackEvent, trackPageview } from "@/lib/track-client";

const stripExtension = (name: string) => name.replace(/\.(pdf|mp3)$/i, "").trim();

/** The file name inside a «/api/pdf-view?url=…» address. */
function pdfNameFromViewUrl(address: string) {
  try {
    const target = new URL(address, window.location.origin).searchParams.get("url") ?? "";
    return stripExtension(decodeURIComponent(target.split("/").pop() ?? ""));
  } catch {
    return "";
  }
}

/**
 * Counts one visit for every page the visitor opens (the dashboard is skipped by the server), and the actions that
 * are not pages: a downloaded PDF or lesson, a PDF opened for reading. Playing a lesson is counted by the player.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) trackPageview(pathname);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[download]") as HTMLAnchorElement | null;
      if (!link) return;
      const file = link.getAttribute("download") ?? "";
      const label = stripExtension(file);
      if (/\.pdf$/i.test(file)) trackEvent("pdf_download", label);
      else if (/\.mp3$/i.test(file)) trackEvent("audio_download", label);
    };

    // The PDF reader opens in a new tab through window.open; that is the moment a PDF is "viewed".
    const open = window.open;
    window.open = function (this: Window, ...args: Parameters<Window["open"]>) {
      const address = String(args[0] ?? "");
      if (address.includes("/api/pdf-view")) trackEvent("pdf_view", pdfNameFromViewUrl(address));
      return open.apply(this, args);
    } as Window["open"];

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.open = open;
    };
  }, []);

  return null;
}

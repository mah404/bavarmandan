"use client";

import { Download, Info, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";

import { recordPwaEvent } from "@/lib/pwa-events";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __bavarmandanInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

type PWAInstallButtonProps = {
  className?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  label?: string;
};

const isStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: fullscreen)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export function PWAInstallButton({
  className,
  fullWidth = false,
  icon,
  label = "نصب اپلیکیشن",
}: PWAInstallButtonProps) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallNotice, setShowInstallNotice] = useState(false);
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());
    setInstallPrompt(window.__bavarmandanInstallPrompt ?? null);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      window.__bavarmandanInstallPrompt = promptEvent;
      setInstallPrompt(promptEvent);
    };

    const handleInstallReady = () => {
      setInstallPrompt(window.__bavarmandanInstallPrompt ?? null);
    };

    const handleAppInstalled = () => {
      track("pwa_installed");
      window.__bavarmandanInstallPrompt = null;
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("bavarmandan-pwa-install-ready", handleInstallReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener(
        "bavarmandan-pwa-install-ready",
        handleInstallReady
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isStandalone) return null;

  const installApp = async () => {
    track("pwa_install_button_clicked");
    recordPwaEvent("pwa_install_button_clicked", { source: "site_button" });
    const promptEvent = installPrompt ?? window.__bavarmandanInstallPrompt;

    if (!promptEvent) {
      track("pwa_install_prompt_unavailable");
      setShowInstallNotice(true);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => {
        setShowInstallNotice(false);
      }, 5200);
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    track("pwa_install_prompt_result", { outcome: choice.outcome });
    window.__bavarmandanInstallPrompt = null;
    setInstallPrompt(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={installApp}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary/45 bg-primary px-4 text-sm font-extrabold text-[#082b26] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          !installPrompt && "opacity-90",
          fullWidth && "w-full",
          className
        )}
        dir="rtl"
      >
        {icon ?? <Download className="size-5" />}
        <span>{label}</span>
      </button>

      {showInstallNotice && (
        <div
          className="fixed bottom-5 left-1/2 z-[95] w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 rounded-xl border border-primary/40 bg-card/95 p-3 text-card-foreground shadow-2xl backdrop-blur-xl"
          dir="rtl"
          role="status"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              <Info className="size-5" />
            </span>
            <p className="flex-1 text-sm font-bold leading-7">
              اگر پنجره نصب باز نشد، روی آیکن نصب کنار نوار آدرس مرورگر بزنید.
            </p>
            <button
              type="button"
              onClick={() => setShowInstallNotice(false)}
              className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
              aria-label="بستن"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

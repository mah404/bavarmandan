"use client";

import { Download, Info, Smartphone, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __bavarmandanInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

const isStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: fullscreen)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export function PWAInstallIntent() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const guideTimer = useRef<number | null>(null);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());
    setInstallPrompt(window.__bavarmandanInstallPrompt ?? null);

    const handleInstallReady = () => {
      setInstallPrompt(window.__bavarmandanInstallPrompt ?? null);
    };

    const handleAppInstalled = () => {
      track("pwa_installed_from_install_link");
      window.__bavarmandanInstallPrompt = null;
      setInstallPrompt(null);
      setIsStandalone(true);
      setOpen(false);
    };

    window.addEventListener("bavarmandan-pwa-install-ready", handleInstallReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (guideTimer.current) window.clearTimeout(guideTimer.current);
      window.removeEventListener(
        "bavarmandan-pwa-install-ready",
        handleInstallReady
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (searchParams?.get("install") === "1" && !isStandalone) {
      track("pwa_install_link_opened");
      setOpen(true);
    }
  }, [isStandalone, searchParams]);

  if (!open || isStandalone) return null;

  const installApp = async () => {
    track("pwa_install_link_button_clicked");
    const promptEvent = installPrompt ?? window.__bavarmandanInstallPrompt;

    if (!promptEvent) {
      track("pwa_install_link_prompt_unavailable");
      setShowGuide(true);
      if (guideTimer.current) window.clearTimeout(guideTimer.current);
      guideTimer.current = window.setTimeout(() => setShowGuide(false), 7000);
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    track("pwa_install_link_prompt_result", { outcome: choice.outcome });
    window.__bavarmandanInstallPrompt = null;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-background/70 px-4 backdrop-blur-md"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div className="w-[min(100%,560px)] rounded-2xl border border-primary/45 bg-card/95 p-5 text-card-foreground shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-primary/45 bg-primary/15 text-primary">
              <Smartphone className="size-7" />
            </span>
            <div>
              <h2 id="pwa-install-title" className="text-2xl font-extrabold">
                نصب اپلیکیشن باورمندان
              </h2>
              <p className="mt-1 text-sm font-bold leading-7 text-muted-foreground">
                با نصب اپلیکیشن، سایت را مثل یک برنامه از صفحه اصلی گوشی یا
                کامپیوتر باز می‌کنید.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-border/70 text-muted-foreground transition hover:border-primary/45 hover:text-primary"
            aria-label="بستن"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={installApp}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-5 text-base font-extrabold text-[#082b26] shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
          >
            <Download className="size-5" />
            نصب اپلیکیشن
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-12 rounded-xl border border-border/80 px-5 text-base font-extrabold text-foreground transition hover:border-primary/45 hover:text-primary"
          >
            بعدا
          </button>
        </div>

        {showGuide && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm font-bold leading-7">
            <div className="mb-1 flex items-center gap-2 text-primary">
              <Info className="size-4" />
              راهنمای نصب
            </div>
            اگر پنجره نصب باز نشد، در Chrome یا Edge روی آیکن نصب کنار نوار
            آدرس بزنید. در iPhone با Safari، دکمه Share را بزنید و گزینه Add
            to Home Screen را انتخاب کنید.
          </div>
        )}
      </div>
    </div>
  );
}

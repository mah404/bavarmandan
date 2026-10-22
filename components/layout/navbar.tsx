"use client";

import { ChevronLeft, Menu, Music2, ShieldCheck } from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { ToggleTheme } from "./toogle-theme";
import { motion, useReducedMotion } from "framer-motion";
import { PWAInstallButton } from "../pwa-install-button";

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  { href: "#mohtava", label: "محتوا" },
  { href: "#tarnama", label: "تارنماها" },
  { href: "#rules", label: "تذکرات" },
  { href: "#contact", label: "ارتباط با ما" },
];

function BackgroundMusicNavButton() {
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    const onState = (event: Event) => {
      const detail = (event as CustomEvent<{ playing?: boolean }>).detail;
      setIsPlaying(!!detail?.playing);
    };

    window.addEventListener("bavarmandan:background-music-state", onState);
    return () => {
      window.removeEventListener("bavarmandan:background-music-state", onState);
    };
  }, []);

  const triggerBackgroundMusic = () => {
    window.dispatchEvent(
      new CustomEvent(
        isPlaying
          ? "bavarmandan:background-music-stop"
          : "bavarmandan:background-music-trigger"
      )
    );
  };

  return (
    <button
      type="button"
      className={`nav-music-button ${isPlaying ? "is-playing" : ""}`}
      aria-label="پخش نوای پس‌زمینه"
      aria-pressed={isPlaying}
      onClick={triggerBackgroundMusic}
    >
      <span className="nav-music-ring" aria-hidden="true" />
      <span className="nav-music-core">
        {isPlaying ? (
          <>
            <i />
            <i />
            <i />
            <i />
          </>
        ) : (
          <Music2 aria-hidden="true" />
        )}
      </span>
    </button>
  );
}

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const peekTimer = React.useRef<number>(0);
  const [mobilePeek, setMobilePeek] = React.useState(false);
  const holdTimer = React.useRef<number>(0);
  const heldRef = React.useRef(false);
  const hidePeekTimer = React.useRef<number>(0);

  // Touch: press and hold the name inside the menu to reveal the dashboard link (a quick tap still plays the audio).
  const startHold = () => {
    heldRef.current = false;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = true;
      setMobilePeek(true);
      if (navigator.vibrate) navigator.vibrate(12);
      window.clearTimeout(hidePeekTimer.current);
      hidePeekTimer.current = window.setTimeout(() => setMobilePeek(false), 6000);
    }, 550);
  };
  const cancelHold = () => window.clearTimeout(holdTimer.current);
  const secretAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    return () => {
      if (secretAudioRef.current) {
        secretAudioRef.current.pause();
        secretAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const toggleSecretAudio = () => {
    if (!secretAudioRef.current) {
      secretAudioRef.current = new Audio("/sout.mp3");
    }

    if (!secretAudioRef.current.paused) {
      secretAudioRef.current.pause();
      secretAudioRef.current.currentTime = 0;
      return;
    }

    secretAudioRef.current.currentTime = 0;
    secretAudioRef.current.play().catch(() => {});
  };

  const handleMobileNav = (
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    href: string
  ) => {
    event.preventDefault();
    const id = href.replace("#", "");
    setIsOpen(false);

    window.setTimeout(() => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", href);
      }
    }, 260);
  };

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { opacity: 0, y: -18 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-4 z-40 mx-auto w-[94%] max-w-6xl"
    >
      <div className="relative flex items-center justify-between rounded-xl border border-secondary/45 bg-card/70 px-3 py-2 shadow-[0_16px_42px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:bg-card/85">
        <div className="flex items-center gap-3 py-1 pl-4 pr-1" dir="rtl">
          <button
            type="button"
            onClick={toggleSecretAudio}
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label="Play Bavarmandan audio"
          >
            <Image
              src="/mainicon.jpg"
              alt="Bavarmandan"
              width={44}
              height={44}
              className="size-11 rounded-full border object-cover transition duration-300"
            />
          </button>

          {/* Hold the pointer on the name: it flips to a "dashboard login" link. A quick click still plays the audio. */}
          <Link
            href="/admin"
            className="admin-peek hidden sm:grid"
            data-peek={peek ? "true" : "false"}
            onPointerEnter={() => {
              window.clearTimeout(peekTimer.current);
              peekTimer.current = window.setTimeout(() => setPeek(true), 450);
            }}
            onPointerLeave={() => {
              window.clearTimeout(peekTimer.current);
              setPeek(false);
            }}
            onFocus={() => setPeek(true)}
            onBlur={() => setPeek(false)}
            onClick={(event) => {
              if (peek) return;
              event.preventDefault();
              toggleSecretAudio();
            }}
            aria-label="مجمع باورمندان؛ ورود به پیشخوان مدیریت"
          >
            <span className="admin-peek__name">مجمع باورمندان</span>
            <span className="admin-peek__enter" aria-hidden="true">
              <ShieldCheck className="size-3.5" />
              ورود به پیشخوان مدیریت
              <ChevronLeft className="admin-peek__arrow size-3.5" />
            </span>
          </Link>
        </div>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 rounded-lg border border-secondary/35 bg-background/15 p-1 backdrop-blur lg:flex"
          dir="rtl"
        >
          {routeList.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-4 py-2 text-sm font-bold text-foreground/80 transition duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <BackgroundMusicNavButton />
          <ToggleTheme />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <BackgroundMusicNavButton />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation"
                className="grid size-11 place-items-center rounded-full border border-primary/25 text-primary transition duration-300 hover:border-primary/50 hover:bg-primary/10"
              >
                <Menu className="size-6" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="sheet-modern flex flex-col justify-between rounded-r-2xl"
            >
              {/* The sheet wraps its children in one block, so this fills the sheet height (100dvh minus its p-6) and pushes the footer to the very bottom. */}
              <div className="flex min-h-[calc(100dvh-3rem)] flex-col justify-between">
              <div>
                <SheetHeader className="mb-6 h-14 pt-0">
                  <SheetTitle>
                    <button
                      type="button"
                      onClick={() => {
                        if (heldRef.current) {
                          heldRef.current = false;
                          return;
                        }
                        toggleSecretAudio();
                      }}
                      onPointerDown={startHold}
                      onPointerUp={cancelHold}
                      onPointerLeave={cancelHold}
                      onPointerCancel={cancelHold}
                      onContextMenu={(event) => event.preventDefault()}
                      className="absolute left-5 top-8 flex h-10 max-w-[calc(100%-6rem)] touch-manipulation select-none items-center gap-2 border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                      dir="ltr"
                      aria-label="Play Bavarmandan audio"
                    >
                      <Image
                        src="/mainicon.jpg"
                        alt="Bavarmandan"
                        width={44}
                        height={44}
                        className="size-10 shrink-0 rounded-full border border-primary/40 object-cover"
                      />
                      <span
                        className="min-w-0 whitespace-nowrap text-right text-lg font-extrabold leading-none"
                        dir="rtl"
                      >
                        مجمع باورمندان 
                      </span>
                    </button>
                    <Link
                      href="/admin"
                      className="admin-peek-mobile"
                      data-open={mobilePeek ? "true" : "false"}
                      tabIndex={mobilePeek ? 0 : -1}
                      aria-hidden={!mobilePeek}
                    >
                      <ShieldCheck className="size-4" />
                      ورود به پیشخوان مدیریت
                      <ChevronLeft className="size-4" />
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-2" dir="rtl">
                  {routeList.map(({ href, label }) => (
                    <button
                      key={href}
                      type="button"
                      onClick={(e) => handleMobileNav(e, href)}
                      className="flex h-12 w-full items-center justify-center rounded-xl border border-primary/70 bg-card/30 px-4 text-base font-bold transition hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-muted-foreground/60 dark:hover:border-muted-foreground"
                    >
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              <SheetFooter className="mt-4 flex-col items-start justify-start sm:flex-col">
                <div className="mb-3 w-full">
                  <ToggleTheme />
                </div>
                <PWAInstallButton
                  fullWidth
                  label="اپلیکیشن باورمندان"
                  icon={
                    <Image
                      src="/mainicon.jpg"
                      alt="اپلیکیشن باورمندان"
                      width={28}
                      height={28}
                      className="size-7 rounded-full border border-primary/35 object-cover"
                    />
                  }
                  className="rounded-lg border-primary/70 bg-card/45 text-foreground hover:bg-card/70 hover:text-primary dark:bg-card/35 dark:text-foreground"
                />
              </SheetFooter>
              </div>


              <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  dir="rtl"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-4 text-base font-bold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <span>ورود به پیشخوان مدیریت</span>
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
};

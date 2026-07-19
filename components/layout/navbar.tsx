"use client";

import { Menu } from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Separator } from "../ui/separator";
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

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const secretAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const playSecretAudio = () => {
    if (!secretAudioRef.current) {
      secretAudioRef.current = new Audio("/sout.mp3");
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
        <button
          type="button"
          onClick={playSecretAudio}
          className="group flex items-center gap-3 rounded-lg border border-transparent py-1 pl-4 pr-1 transition duration-300  focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          dir="rtl"
          aria-label="Play Bavarmandan audio"
        >
          <Image
            src="/mainicon.jpg"
            alt="Bavarmandan"
            width={44}
            height={44}
            className="size-11 rounded-full border object-cover  transition duration-300 "
          />
          <span className="hidden text-right sm:block">
            <span className="block text-base font-extrabold leading-5 text-foreground">
              مجمع باورمندان
            </span>
         
          </span>
        </button>

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
          <ToggleTheme />
        </div>

        <div className="flex items-center lg:hidden">
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
              <div>
                <SheetHeader className="mb-6 h-14 pt-0">
                  <SheetTitle>
                    <button
                      type="button"
                      onClick={playSecretAudio}
                      className="absolute left-5 top-8 flex h-10 max-w-[calc(100%-6rem)] items-center gap-2 border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-0"
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
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-2" dir="rtl">
                  {routeList.map(({ href, label }) => (
                    <button
                      key={href}
                      type="button"
                      onClick={(e) => handleMobileNav(e, href)}
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-secondary/35 bg-card/30 px-4 text-base font-bold transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      <span>{label}</span>
                      <span className="h-px w-8 bg-primary/60" />
                    </button>
                  ))}
                </div>
              </div>

              <SheetFooter className="flex-col items-start justify-start sm:flex-col">
                <Separator className="mb-3" />
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
                  className="mb-3 rounded-lg border-primary/70 bg-card/45 text-foreground hover:bg-card/70 hover:text-primary dark:bg-card/35 dark:text-foreground"
                />
                <ToggleTheme />
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
};

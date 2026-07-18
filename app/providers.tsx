"use client";

import { SheetNavProvider } from "@/components/layout/sections/SheetNavProvider";
import { PWARegister } from "@/components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SheetNavProvider>
      {children}
      <PWARegister />
    </SheetNavProvider>
  );
}

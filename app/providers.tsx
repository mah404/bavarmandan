"use client";

import { SheetNavProvider } from "@/components/layout/sections/SheetNavProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SheetNavProvider>{children}</SheetNavProvider>;
}

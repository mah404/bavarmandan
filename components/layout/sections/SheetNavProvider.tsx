"use client";

import React, { createContext, useContext, useState } from "react";

export type SheetNavTarget = {
  sheetId: string;          // e.g. "akhlagh"
  accordionValue?: string;  // e.g. "group-3"
  itemDomId?: string;       // e.g. "audio-akhlagh-audioFiles-4"
  autoplay?: { title: string; url: string; description?: string };
};

type Ctx = {
  target: SheetNavTarget | null;
  goTo: (t: SheetNavTarget) => void;
  clear: () => void;
};

const SheetNavContext = createContext<Ctx | null>(null);

export function SheetNavProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<SheetNavTarget | null>(null);

  const goTo = (t: SheetNavTarget) => setTarget(t);
  const clear = () => setTarget(null);

  return (
    <SheetNavContext.Provider value={{ target, goTo, clear }}>
      {children}
    </SheetNavContext.Provider>
  );
}

export function useSheetNav() {
  const ctx = useContext(SheetNavContext);
  if (!ctx) throw new Error("useSheetNav must be used inside SheetNavProvider");
  return ctx;
}

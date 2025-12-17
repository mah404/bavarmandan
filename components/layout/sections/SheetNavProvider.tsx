"use client";

import React, { createContext, useContext, useState } from "react";

export type SheetId = "eteghadat" | "akhlaq" | "tajrid" | "maktobat";

export type SheetNavTarget = {
  sheetId?: SheetId;
  accordionValue?: string; // matches AccordionItem value like "group-0"
  itemDomId?: string;      // DOM id like "audio-eteghadat-audioFilesnew-0"
};

type Ctx = {
  target: SheetNavTarget | null;
  openTo: (t: SheetNavTarget) => void;
  clear: () => void;
};

const SheetNavContext = createContext<Ctx | null>(null);

export function SheetNavProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<SheetNavTarget | null>(null);

  return (
    <SheetNavContext.Provider
      value={{
        target,
        openTo: (t) => setTarget(t),
        clear: () => setTarget(null),
      }}
    >
      {children}
    </SheetNavContext.Provider>
  );
}

export function useSheetNav() {
  const ctx = useContext(SheetNavContext);
  if (!ctx) throw new Error("useSheetNav must be used inside SheetNavProvider");
  return ctx;
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { SourceData } from "@/lib/wiki";

interface SourceContextValue {
  activeSource: SourceData | null;
  open: (data: SourceData) => void;
  close: () => void;
}

const Ctx = createContext<SourceContextValue | null>(null);

export function SourceProvider({ children }: { children: ReactNode }) {
  const [activeSource, setActive] = useState<SourceData | null>(null);

  const open = useCallback((data: SourceData) => setActive(data), []);
  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Ctx.Provider value={{ activeSource, open, close }}>{children}</Ctx.Provider>
  );
}

export function useSourcePanel() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useSourcePanel must be used within <SourceProvider>");
  }
  return ctx;
}

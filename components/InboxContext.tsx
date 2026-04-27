"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { InboxItem } from "@/app/api/inbox/route";

interface InboxContextValue {
  count: number;
  items: InboxItem[] | null;
  loadingItems: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const Ctx = createContext<InboxContextValue | null>(null);

export function InboxProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch count once on mount. No polling, no focus refetch.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/inbox/count")
      .then((r) => r.json())
      .then((data: { count?: number }) => {
        if (!cancelled && typeof data.count === "number") setCount(data.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setLoadingItems(true);
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((data: { items?: InboxItem[] }) => {
        setItems(data.items ?? []);
        if (Array.isArray(data.items)) setCount(data.items.length);
      })
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Ctx.Provider
      value={{ count, items, loadingItems, modalOpen, openModal, closeModal }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useInbox() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInbox must be used within <InboxProvider>");
  return ctx;
}

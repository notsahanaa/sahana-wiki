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

export interface IngestSuccess {
  kind: "success";
  summary: string;
  inboxRemoved: number;
  sourcesWritten: number;
  wikiPagesTouched: number;
  commitUrl: string | null;
}

export interface IngestFailure {
  kind: "error";
  message: string;
}

export type IngestResult = IngestSuccess | IngestFailure;

export type InboxView = "list" | "new";

export type CapturePayload =
  | { kind: "url"; url: string; note?: string }
  | { kind: "text"; text: string };

export interface CaptureSuccess {
  ok: true;
  filename: string;
  summary: string;
}

export interface CaptureFailure {
  ok: false;
  error: string;
}

export type CaptureResult = CaptureSuccess | CaptureFailure;

interface InboxContextValue {
  count: number;
  items: InboxItem[] | null;
  loadingItems: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  view: InboxView;
  openNewSource: () => void;
  closeNewSource: () => void;
  capturing: boolean;
  addSource: (payload: CapturePayload) => Promise<CaptureResult>;
  ingesting: boolean;
  ingestResult: IngestResult | null;
  ingest: () => void;
  deletingFilenames: Set<string>;
  deleteItem: (filename: string) => Promise<boolean>;
}

const Ctx = createContext<InboxContextValue | null>(null);

export function InboxProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<InboxView>("list");
  const [capturing, setCapturing] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [deletingFilenames, setDeletingFilenames] = useState<Set<string>>(
    () => new Set(),
  );

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

  const refreshItems = useCallback(() => {
    setLoadingItems(true);
    return fetch("/api/inbox")
      .then((r) => r.json())
      .then((data: { items?: InboxItem[] }) => {
        setItems(data.items ?? []);
        if (Array.isArray(data.items)) setCount(data.items.length);
      })
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, []);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setView("list");
    setIngestResult(null);
    refreshItems();
  }, [refreshItems]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const openNewSource = useCallback(() => setView("new"), []);
  const closeNewSource = useCallback(() => setView("list"), []);

  const addSource = useCallback(
    async (payload: CapturePayload): Promise<CaptureResult> => {
      setCapturing(true);
      try {
        const res = await fetch("/api/inbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          filename?: string;
          summary?: string;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.filename) {
          return { ok: false, error: data.error ?? `Capture failed (${res.status})` };
        }
        // Refresh list and switch back to it so the new item is visible.
        await refreshItems();
        setView("list");
        return {
          ok: true,
          filename: data.filename,
          summary: data.summary ?? "",
        };
      } catch (err) {
        return { ok: false, error: (err as Error).message || "Network error" };
      } finally {
        setCapturing(false);
      }
    },
    [refreshItems],
  );

  const deleteItem = useCallback(
    async (filename: string): Promise<boolean> => {
      setDeletingFilenames((prev) => {
        const next = new Set(prev);
        next.add(filename);
        return next;
      });
      try {
        const res = await fetch(
          `/api/inbox/${encodeURIComponent(filename)}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          alert(`Delete failed: ${data.error ?? res.status}`);
          return false;
        }
        setItems((prev) =>
          prev ? prev.filter((it) => it.filename !== filename) : prev,
        );
        setCount((c) => Math.max(0, c - 1));
        return true;
      } catch (err) {
        alert(`Delete failed: ${(err as Error).message}`);
        return false;
      } finally {
        setDeletingFilenames((prev) => {
          const next = new Set(prev);
          next.delete(filename);
          return next;
        });
      }
    },
    [],
  );

  const ingest = useCallback(() => {
    setIngesting(true);
    setIngestResult(null);
    fetch("/api/inbox/ingest", { method: "POST" })
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          summary?: string;
          inboxRemoved?: number;
          sourcesWritten?: number;
          wikiPagesTouched?: number;
          commitUrl?: string | null;
          error?: string;
        };
        if (!r.ok || data.error) {
          setIngestResult({
            kind: "error",
            message: data.error ?? `Ingest failed (${r.status})`,
          });
          return;
        }
        setIngestResult({
          kind: "success",
          summary: data.summary ?? "",
          inboxRemoved: data.inboxRemoved ?? 0,
          sourcesWritten: data.sourcesWritten ?? 0,
          wikiPagesTouched: data.wikiPagesTouched ?? 0,
          commitUrl: data.commitUrl ?? null,
        });
        // Refresh the inbox list so the cleared items disappear.
        try {
          const refreshed = await fetch("/api/inbox").then((res) => res.json());
          if (Array.isArray(refreshed.items)) {
            setItems(refreshed.items);
            setCount(refreshed.items.length);
          }
        } catch {
          // ignore
        }
      })
      .catch((err: Error) => {
        setIngestResult({
          kind: "error",
          message: err.message || "Network error",
        });
      })
      .finally(() => setIngesting(false));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Ctx.Provider
      value={{
        count,
        items,
        loadingItems,
        modalOpen,
        openModal,
        closeModal,
        view,
        openNewSource,
        closeNewSource,
        capturing,
        addSource,
        ingesting,
        ingestResult,
        ingest,
        deletingFilenames,
        deleteItem,
      }}
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

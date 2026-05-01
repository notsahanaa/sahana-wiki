"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { ClusterDef } from "@/lib/wiki";

// Selection key = page slug joined by "/" (e.g. "concepts/agent-native").
// We carry the slug array in the value so the API call doesn't have to split.
type SelectionMap = Record<string, string[]>;

interface ManageModeValue {
  active: boolean;
  setActive: (v: boolean) => void;
  toggle: () => void;
  selection: SelectionMap;
  selectedCount: number;
  isSelected: (slug: string[]) => boolean;
  toggleSelected: (slug: string[]) => void;
  clear: () => void;
  manifest: ClusterDef[];
  busy: boolean;
  error: string | null;
  // Actions
  addToCluster: (clusterSlug: string) => Promise<boolean>;
  removeFromCluster: (clusterSlug: string) => Promise<boolean>;
  // Bulk-removes a single (page, cluster) pair — used by the echo "x" button.
  removeOne: (slug: string[], clusterSlug: string) => Promise<boolean>;
  createCluster: (input: {
    slug: string;
    title: string;
    description: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

const Ctx = createContext<ManageModeValue | null>(null);

export function ManageModeProvider({
  manifest,
  children,
}: {
  manifest: ClusterDef[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [selection, setSelection] = useState<SelectionMap>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(() => {
    setActive((v) => {
      if (v) setSelection({});
      return !v;
    });
    setError(null);
  }, []);

  const setActiveExplicit = useCallback((v: boolean) => {
    setActive(v);
    if (!v) setSelection({});
    setError(null);
  }, []);

  const isSelected = useCallback(
    (slug: string[]) => selection[slug.join("/")] !== undefined,
    [selection],
  );

  const toggleSelected = useCallback((slug: string[]) => {
    const key = slug.join("/");
    setSelection((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = slug;
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelection({}), []);

  const selectedCount = Object.keys(selection).length;
  const selectedSlugs = useMemo(() => Object.values(selection), [selection]);

  const callAssign = useCallback(
    async (clusterSlug: string, mode: "add" | "remove") => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/clusters/assign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pageSlugs: selectedSlugs, clusterSlug, mode }),
        });
        if (!res.ok) {
          const text = await res.text();
          setError(text || `request failed (${res.status})`);
          return false;
        }
        router.refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "network error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [router, selectedSlugs],
  );

  const addToCluster = useCallback(
    async (clusterSlug: string) => {
      const ok = await callAssign(clusterSlug, "add");
      if (ok) clear();
      return ok;
    },
    [callAssign, clear],
  );

  const removeFromCluster = useCallback(
    async (clusterSlug: string) => {
      const ok = await callAssign(clusterSlug, "remove");
      if (ok) clear();
      return ok;
    },
    [callAssign, clear],
  );

  const removeOne = useCallback(
    async (slug: string[], clusterSlug: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/clusters/assign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pageSlugs: [slug],
            clusterSlug,
            mode: "remove",
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          setError(text || `request failed (${res.status})`);
          return false;
        }
        router.refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "network error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const createCluster = useCallback(
    async (input: { slug: string; title: string; description: string }) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/clusters/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...input, pageSlugs: selectedSlugs }),
        });
        if (!res.ok) {
          let message = `request failed (${res.status})`;
          try {
            const data = (await res.json()) as { error?: string };
            if (data.error) message = data.error;
          } catch {
            // ignore
          }
          setError(message);
          return { ok: false as const, error: message };
        }
        clear();
        router.refresh();
        return { ok: true as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : "network error";
        setError(message);
        return { ok: false as const, error: message };
      } finally {
        setBusy(false);
      }
    },
    [clear, router, selectedSlugs],
  );

  const value: ManageModeValue = {
    active,
    setActive: setActiveExplicit,
    toggle,
    selection,
    selectedCount,
    isSelected,
    toggleSelected,
    clear,
    manifest,
    busy,
    error,
    addToCluster,
    removeFromCluster,
    removeOne,
    createCluster,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useManageMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useManageMode must be used within <ManageModeProvider>");
  return ctx;
}

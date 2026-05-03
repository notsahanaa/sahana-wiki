"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { ClusterDef } from "@/lib/wiki";

interface ManageModeValue {
  active: boolean;
  toggle: () => void;
  manifest: ClusterDef[];
  busy: boolean;
  error: string | null;
  clearError: () => void;
  // Move a single page into a cluster (or null = Unsorted). Used by drag-drop.
  setPageCluster: (
    pageSlug: string[],
    clusterSlug: string | null,
  ) => Promise<boolean>;
  // Rename an existing cluster's display title.
  renameCluster: (slug: string, title: string) => Promise<boolean>;
  // Append a new cluster to the manifest.
  createCluster: (input: {
    slug: string;
    title: string;
    description?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  // Replace the manifest's cluster order. Set must match existing slugs.
  reorderClusters: (order: string[]) => Promise<boolean>;
  // Drop a cluster from the manifest. Pages that pointed at it lose their
  // `cluster:` and slide into Unsorted on the next render.
  deleteCluster: (slug: string) => Promise<boolean>;
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(() => {
    setActive((v) => !v);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Routes return JSON `{ error: "..." }` on failure. Pull the message out so
  // we can show it as a sentence rather than as raw JSON.
  async function extractError(res: Response): Promise<string> {
    try {
      const data = (await res.json()) as { error?: string };
      if (typeof data.error === "string" && data.error) return data.error;
    } catch {
      // not JSON
    }
    return `request failed (${res.status})`;
  }

  const setPageCluster = useCallback(
    async (pageSlug: string[], clusterSlug: string | null) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/clusters/assign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pageSlugs: [pageSlug], clusterSlug }),
        });
        if (!res.ok) {
          setError(await extractError(res));
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

  const renameCluster = useCallback(
    async (slug: string, title: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/clusters/rename", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, title }),
        });
        if (!res.ok) {
          setError(await extractError(res));
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
    async (input: { slug: string; title: string; description?: string }) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/clusters/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const message = await extractError(res);
          setError(message);
          return { ok: false as const, error: message };
        }
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
    [router],
  );

  const reorderClusters = useCallback(
    async (order: string[]) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/clusters/reorder", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ order }),
        });
        if (!res.ok) {
          setError(await extractError(res));
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

  const deleteCluster = useCallback(
    async (slug: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/clusters/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        if (!res.ok) {
          setError(await extractError(res));
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

  const value: ManageModeValue = {
    active,
    toggle,
    manifest,
    busy,
    error,
    clearError,
    setPageCluster,
    renameCluster,
    createCluster,
    reorderClusters,
    deleteCluster,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useManageMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useManageMode must be used within <ManageModeProvider>");
  return ctx;
}

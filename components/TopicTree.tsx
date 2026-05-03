"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ClusterGroup,
  WikiClusteredTree,
  WikiPageMeta,
} from "@/lib/wiki";
import { useManageMode } from "./ManageModeContext";

// ---------- Drag-and-drop context ----------
//
// Two payload kinds:
//   - "page" — drag a page row onto a cluster block. Drop sets the page's
//     cluster (or null = Unsorted). Available regardless of edit mode.
//   - "cluster" — drag a cluster header onto another cluster header to
//     reorder the manifest. Edit mode only. Drop position (upper/lower half
//     of the target) decides before/after.
//
// HTML5 DnD is not supported on touch devices.

type PageDrag = {
  kind: "page";
  slug: string[];
  sourceCluster: string | null;
};
type ClusterDrag = {
  kind: "cluster";
  slug: string;
};
type DragPayload = PageDrag | ClusterDrag;

type DropTarget =
  | { kind: "cluster-block"; cluster: string | null; position?: "before" | "after" };

interface DragApi {
  dragging: DragPayload | null;
  start: (p: DragPayload) => void;
  end: () => void;
  drop: (target: DropTarget) => Promise<void>;
  busy: boolean;
}

const DragCtx = createContext<DragApi | null>(null);

function useDragApi(): DragApi {
  const ctx = useContext(DragCtx);
  if (!ctx) throw new Error("DragCtx missing");
  return ctx;
}

function DragProvider({ children }: { children: ReactNode }) {
  const { setPageCluster, reorderClusters, manifest, busy } = useManageMode();
  const [dragging, setDragging] = useState<DragPayload | null>(null);

  const start = useCallback((p: DragPayload) => setDragging(p), []);
  const end = useCallback(() => setDragging(null), []);

  const drop = useCallback(
    async (target: DropTarget) => {
      if (!dragging || busy) return;
      const payload = dragging;
      setDragging(null);
      if (payload.kind === "page") {
        if (target.cluster === payload.sourceCluster) return;
        await setPageCluster(payload.slug, target.cluster);
        return;
      }
      // Cluster reorder. Unsorted is not a valid reorder target — it has no
      // slot in the manifest.
      if (target.cluster === null || target.cluster === payload.slug) return;
      const current = manifest.map((c) => c.slug);
      const without = current.filter((s) => s !== payload.slug);
      const targetIdx = without.indexOf(target.cluster);
      if (targetIdx === -1) return;
      const insertAt =
        target.position === "after" ? targetIdx + 1 : targetIdx;
      const next = [
        ...without.slice(0, insertAt),
        payload.slug,
        ...without.slice(insertAt),
      ];
      if (next.join(",") === current.join(",")) return;
      await reorderClusters(next);
    },
    [busy, dragging, manifest, reorderClusters, setPageCluster],
  );

  return (
    <DragCtx.Provider value={{ dragging, start, end, drop, busy }}>
      {children}
    </DragCtx.Provider>
  );
}

const CATEGORY_ORDER = ["concepts", "projects", "books", "resources"];
const CATEGORY_LABEL: Record<string, string> = {
  concepts: "Concepts",
  projects: "Projects",
  books: "Books",
  resources: "Resources",
  uncategorized: "Other",
};

export function TopicTree({ tree }: { tree: WikiClusteredTree }) {
  const pathname = usePathname();
  const { active: manageActive, toggle: toggleManage } = useManageMode();
  const categories = Object.keys(tree).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <nav aria-label="Wiki topics" className="flex min-h-full flex-col gap-5 px-4 py-6 text-sm">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className={cn(
            "font-heading text-2xl leading-none text-ink-primary transition-colors",
            pathname === "/" && "text-ink-primary",
          )}
        >
          sahana-wiki
        </Link>
        <button
          type="button"
          onClick={toggleManage}
          aria-label={manageActive ? "Done editing" : "Edit categories"}
          title={manageActive ? "Done editing" : "Edit categories"}
          className={cn(
            "flex items-center rounded p-1 text-ink-tertiary transition hover:bg-ink-muted/40 hover:text-ink-primary",
            manageActive && "bg-ink-primary text-bg-default hover:bg-ink-primary hover:text-bg-default",
          )}
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      <DragProvider>
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <CategorySection
              key={cat}
              label={CATEGORY_LABEL[cat] ?? cat}
              groups={tree[cat]}
              currentPath={pathname}
            />
          ))}
        </div>
      </DragProvider>

      <div className="mt-auto" />
    </nav>
  );
}

function CategorySection({
  label,
  groups,
  currentPath,
}: {
  label: string;
  groups: ClusterGroup[];
  currentPath: string | null;
}) {
  const { active: manageActive } = useManageMode();
  const containsActive = groups.some(
    (g) =>
      g.pages.some((p) => p.href === currentPath) ||
      g.cluster?.page?.href === currentPath,
  );
  const [open, setOpen] = useState(true);
  const isOpen = open || containsActive;

  // If there's exactly one group and it has no cluster, the category is flat
  // (no inner cluster headers). In edit mode we still don't surface a "new
  // category" button here because that category isn't using clusters at all.
  const isFlat = groups.length === 1 && groups[0].cluster === null;

  // In read mode, hide empty clusters (they'd render as bare headers with
  // nothing underneath). In edit mode they remain visible as drop targets.
  const visibleGroups = manageActive
    ? groups
    : groups.filter((g) => g.pages.length > 0);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-ink-tertiary transition-colors hover:text-ink-primary"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
        <span className="font-heading text-base uppercase leading-none tracking-wider">
          {label}
        </span>
      </button>

      {isOpen && (
        <div className="mt-1.5 ml-1 flex flex-col gap-2 border-l border-ink-muted pl-3">
          {isFlat ? (
            <PageList pages={groups[0].pages} currentPath={currentPath} />
          ) : (
            <>
              {visibleGroups.map((g, i) => (
                <ClusterBlock
                  key={g.cluster?.slug ?? `unsorted-${i}`}
                  group={g}
                  currentPath={currentPath}
                />
              ))}
              {manageActive && <NewClusterAffordance />}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function ClusterBlock({
  group,
  currentPath,
}: {
  group: ClusterGroup;
  currentPath: string | null;
}) {
  const { active: manageActive, renameCluster, deleteCluster, busy } = useManageMode();
  const containsActive =
    group.pages.some((p) => p.href === currentPath) ||
    group.cluster?.page?.href === currentPath;
  const [open, setOpen] = useState(true);
  const isOpen = open || containsActive;

  const headerLabel = group.cluster?.title ?? "Unsorted";
  const headerTitle = group.cluster?.description || undefined;
  const headerHref = group.cluster?.page?.href;
  const headerActive = headerHref === currentPath;
  const clusterSlug = group.cluster?.slug ?? null;
  const renameable = manageActive && clusterSlug !== null;

  const drag = useDragApi();
  const blockRef = useRef<HTMLDivElement>(null);
  const [pageHover, setPageHover] = useState(false);
  const [clusterDropEdge, setClusterDropEdge] = useState<"before" | "after" | null>(null);
  const dragEnterCount = useRef(0);

  const dragging = drag.dragging;
  const isPageDrag = dragging?.kind === "page";
  const isClusterDrag = dragging?.kind === "cluster";
  // Page-drop validity: any cluster (or unsorted) that isn't the page's
  // current home.
  const acceptsPage =
    isPageDrag && dragging.sourceCluster !== clusterSlug;
  // Cluster-drop validity: only between real clusters, never on self,
  // never on Unsorted (it has no manifest slot).
  const acceptsCluster =
    isClusterDrag && clusterSlug !== null && dragging.slug !== clusterSlug;

  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(headerLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftTitle(headerLabel);
  }, [headerLabel]);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  // Exit rename mode if the user clicks the pencil to leave edit mode.
  useEffect(() => {
    if (!manageActive && renaming) setRenaming(false);
  }, [manageActive, renaming]);

  function computeEdge(e: React.DragEvent): "before" | "after" | null {
    const el = blockRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return e.clientY - rect.top < rect.height / 2 ? "before" : "after";
  }

  function onDragOver(e: React.DragEvent) {
    if (acceptsPage) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      return;
    }
    if (acceptsCluster) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const edge = computeEdge(e);
      if (edge !== clusterDropEdge) setClusterDropEdge(edge);
    }
  }
  function onDragEnter(e: React.DragEvent) {
    if (acceptsPage) {
      e.preventDefault();
      dragEnterCount.current += 1;
      setPageHover(true);
      return;
    }
    if (acceptsCluster) {
      e.preventDefault();
      dragEnterCount.current += 1;
      setClusterDropEdge(computeEdge(e));
    }
  }
  function onDragLeave() {
    dragEnterCount.current = Math.max(0, dragEnterCount.current - 1);
    if (dragEnterCount.current === 0) {
      setPageHover(false);
      setClusterDropEdge(null);
    }
  }
  async function onDrop(e: React.DragEvent) {
    if (acceptsPage) {
      e.preventDefault();
      dragEnterCount.current = 0;
      setPageHover(false);
      await drag.drop({ kind: "cluster-block", cluster: clusterSlug });
      return;
    }
    if (acceptsCluster) {
      e.preventDefault();
      const edge = computeEdge(e) ?? "before";
      dragEnterCount.current = 0;
      setClusterDropEdge(null);
      await drag.drop({
        kind: "cluster-block",
        cluster: clusterSlug,
        position: edge,
      });
    }
  }

  async function commitRename() {
    if (!clusterSlug) return;
    const next = draftTitle.trim();
    if (!next || next === headerLabel) {
      setRenaming(false);
      setDraftTitle(headerLabel);
      return;
    }
    const ok = await renameCluster(clusterSlug, next);
    if (ok) setRenaming(false);
  }

  async function onDeleteCluster() {
    if (!clusterSlug) return;
    const pageCount = group.pages.length;
    const tail =
      pageCount === 0
        ? ""
        : ` ${pageCount} page${pageCount === 1 ? "" : "s"} will move to Unsorted.`;
    if (!confirm(`Delete category "${headerLabel}"?${tail}`)) return;
    await deleteCluster(clusterSlug);
  }

  return (
    <div
      ref={blockRef}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative rounded transition",
        pageHover && "bg-accent-lavender/30 ring-1 ring-accent-lavender",
      )}
    >
      {clusterDropEdge === "before" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px h-0.5 rounded bg-accent-lavender"
        />
      )}
      {clusterDropEdge === "after" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 rounded bg-accent-lavender"
        />
      )}
      <div className="group/clusterhdr flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-label={`Toggle ${headerLabel}`}
          className="flex shrink-0 items-center rounded p-0.5 text-ink-tertiary transition hover:text-ink-primary"
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3" strokeWidth={2.25} />
          ) : (
            <ChevronRight className="h-3 w-3" strokeWidth={2.25} />
          )}
        </button>
        {renaming ? (
          <input
            ref={inputRef}
            value={draftTitle}
            disabled={busy}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setDraftTitle(headerLabel);
                setRenaming(false);
              }
            }}
            className="min-w-0 flex-1 rounded border border-ink-tertiary bg-bg-default px-1 py-0 font-heading text-[14px] uppercase tracking-wider text-ink-primary outline-none"
          />
        ) : renameable && clusterSlug ? (
          <button
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", clusterSlug);
              drag.start({ kind: "cluster", slug: clusterSlug });
            }}
            onDragEnd={() => drag.end()}
            onClick={() => setRenaming(true)}
            title={headerTitle ?? "Drag to reorder · click to rename"}
            className="cursor-grab font-heading text-[14px] uppercase leading-none tracking-wider text-ink-tertiary transition hover:text-ink-primary active:cursor-grabbing"
          >
            {headerLabel}
          </button>
        ) : headerHref ? (
          <Link
            href={headerHref}
            title={headerTitle}
            className={cn(
              "font-heading text-[14px] uppercase leading-none tracking-wider transition",
              headerActive
                ? "text-ink-primary"
                : "text-ink-tertiary hover:text-ink-primary",
            )}
          >
            {headerLabel}
          </Link>
        ) : (
          <span
            title={headerTitle}
            className="font-heading text-[14px] uppercase leading-none tracking-wider text-ink-tertiary"
          >
            {headerLabel}
          </span>
        )}
        {manageActive && clusterSlug && (
          <button
            type="button"
            onClick={onDeleteCluster}
            disabled={busy}
            aria-label={`Delete category ${headerLabel}`}
            title={`Delete category ${headerLabel}`}
            className="ml-auto rounded p-0.5 text-ink-tertiary opacity-0 transition hover:bg-ink-muted/40 hover:text-ink-primary focus-visible:opacity-100 group-hover/clusterhdr:opacity-100 disabled:opacity-30"
          >
            <Trash2 className="h-3 w-3" strokeWidth={2.25} />
          </button>
        )}
      </div>
      {isOpen && (
        <ul className="mt-1 ml-1.5 flex flex-col gap-px border-l border-ink-muted/60 pl-2.5">
          {group.pages.map((page) => (
            <PageRow
              key={`${group.cluster?.slug ?? "unsorted"}:${page.href}`}
              page={page}
              active={currentPath === page.href}
              clusterSlug={clusterSlug}
            />
          ))}
          {group.pages.length === 0 && manageActive && (
            <li className="px-2 py-1 text-[10px] italic text-ink-tertiary">
              drop pages here
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function NewClusterAffordance() {
  const { createCluster, busy } = useManageMode();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const slug = suggestSlug(trimmed);
    if (!slug) return;
    const r = await createCluster({ slug, title: trimmed });
    if (r.ok) {
      setTitle("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded px-1 py-0.5 text-[14px] uppercase tracking-wider text-ink-tertiary transition hover:text-ink-primary"
      >
        <Plus className="h-3 w-3" strokeWidth={2.5} />
        new category
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-1"
    >
      <input
        ref={inputRef}
        value={title}
        disabled={busy}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (!title.trim()) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setTitle("");
            setOpen(false);
          }
        }}
        placeholder="category name"
        className="min-w-0 flex-1 rounded border border-ink-tertiary bg-bg-default px-1 py-0 font-heading text-[14px] uppercase tracking-wider text-ink-primary outline-none"
      />
    </form>
  );
}

function PageList({
  pages,
  currentPath,
}: {
  pages: WikiPageMeta[];
  currentPath: string | null;
}) {
  return (
    <ul className="flex flex-col gap-px">
      {pages.map((page) => (
        <PageRow
          key={page.href}
          page={page}
          active={currentPath === page.href}
          clusterSlug={null}
        />
      ))}
    </ul>
  );
}

function PageRow({
  page,
  active,
  clusterSlug,
}: {
  page: WikiPageMeta;
  active: boolean;
  clusterSlug: string | null;
}) {
  const router = useRouter();
  const drag = useDragApi();
  const [deleting, setDeleting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const liRef = useRef<HTMLLIElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const startY = useRef(0);

  const draggable = page.category === "concepts";
  const isBeingDragged =
    drag.dragging?.kind === "page" &&
    drag.dragging.slug.join("/") === page.slug.join("/") &&
    drag.dragging.sourceCluster === clusterSlug;

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${page.title}"? This removes ${page.slug.join("/")}.md.`)) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/wiki/${page.slug.join("/")}`, { method: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      alert(`Delete failed: ${res.status} ${await res.text()}`);
      return;
    }
    if (active) router.push("/");
    router.refresh();
  }

  function clearPressTimer() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    longPressed.current = false;
    clearPressTimer();
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setRevealed(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(10);
      }
    }, 500);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (Math.abs(e.touches[0].clientY - startY.current) > 8) {
      clearPressTimer();
    }
  }

  function handleTouchEnd() {
    clearPressTimer();
  }

  function handleLinkClick(e: React.MouseEvent) {
    if (longPressed.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressed.current = false;
    }
  }

  useEffect(() => {
    if (!revealed) return;
    function onPointerDown(e: Event) {
      if (!liRef.current?.contains(e.target as Node)) {
        setRevealed(false);
      }
    }
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [revealed]);

  return (
    <li ref={liRef} className="group relative">
      <Link
        href={page.href}
        draggable={draggable}
        onDragStart={(e) => {
          if (!draggable) return;
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", page.slug.join("/"));
          drag.start({
            kind: "page",
            slug: page.slug,
            sourceCluster: clusterSlug,
          });
        }}
        onDragEnd={() => drag.end()}
        onClick={handleLinkClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={(e) => {
          if (longPressed.current || revealed) e.preventDefault();
        }}
        className={cn(
          "flex items-center gap-1 rounded px-2 py-1 pr-7 leading-snug transition select-none [-webkit-touch-callout:none]",
          active
            ? "bg-accent-lavender text-ink-primary"
            : "text-ink-secondary hover:bg-bg-subtle hover:text-ink-primary",
          draggable && "cursor-grab active:cursor-grabbing",
          isBeingDragged && "opacity-50",
        )}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 transition-opacity",
            active ? "opacity-80" : "opacity-30",
          )}
          strokeWidth={2.25}
        />
        {page.category === "concepts" && (
          <span
            aria-hidden
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              page.sourceKind === "note"
                ? "bg-accent-brown"
                : page.sourceKind === "web"
                  ? "bg-accent-mint"
                  : "bg-ink-tertiary",
            )}
          />
        )}
        <span className="truncate">{page.title}</span>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Delete ${page.title}`}
        title={`Delete ${page.title}`}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-ink-tertiary transition hover:bg-ink-muted/40 hover:text-ink-primary focus-visible:opacity-100 focus-visible:pointer-events-auto disabled:opacity-50",
          revealed
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
        )}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </li>
  );
}

function suggestSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

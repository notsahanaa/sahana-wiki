"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ClusterGroup,
  ClusteredPageEntry,
  WikiClusteredTree,
  WikiPageMeta,
} from "@/lib/wiki";

const CATEGORY_ORDER = ["concepts", "projects", "books"];
const CATEGORY_LABEL: Record<string, string> = {
  concepts: "Concepts",
  projects: "Projects",
  books: "Books",
  uncategorized: "Other",
};

export function TopicTree({ tree }: { tree: WikiClusteredTree }) {
  const pathname = usePathname();
  const categories = Object.keys(tree).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <nav aria-label="Wiki topics" className="flex flex-col gap-5 px-4 py-6 text-sm">
      <Link
        href="/"
        className={cn(
          "font-heading text-2xl leading-none text-ink-primary transition-colors",
          pathname === "/" && "text-ink-primary",
        )}
      >
        sahana-wiki
      </Link>

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
  const containsActive = groups.some(
    (g) =>
      g.pages.some((e) => e.page.href === currentPath) ||
      g.cluster?.page?.href === currentPath,
  );
  const [open, setOpen] = useState(true);
  const isOpen = open || containsActive;

  // If there's exactly one group and it has no cluster, render flat (no inner header).
  const isFlat = groups.length === 1 && groups[0].cluster === null;

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
            <PageList entries={groups[0].pages} currentPath={currentPath} />
          ) : (
            groups.map((g, i) => (
              <ClusterBlock
                key={g.cluster?.slug ?? `unsorted-${i}`}
                group={g}
                currentPath={currentPath}
              />
            ))
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
  const containsActive =
    group.pages.some((e) => e.page.href === currentPath) ||
    group.cluster?.page?.href === currentPath;
  const [open, setOpen] = useState(true);
  const isOpen = open || containsActive;

  const headerLabel = group.cluster?.title ?? "Unsorted";
  const headerTitle = group.cluster?.description || undefined;
  const headerHref = group.cluster?.page?.href;
  const headerActive = headerHref === currentPath;

  return (
    <div>
      <div className="flex items-center gap-1">
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
        {headerHref ? (
          <Link
            href={headerHref}
            title={headerTitle}
            className={cn(
              "font-heading text-[11px] uppercase leading-none tracking-wider transition",
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
            className="font-heading text-[11px] uppercase leading-none tracking-wider text-ink-tertiary"
          >
            {headerLabel}
          </span>
        )}
      </div>
      {isOpen && (
        <ul className="mt-1 ml-1.5 flex flex-col gap-px border-l border-ink-muted/60 pl-2.5">
          {group.pages.map((entry) => (
            <PageRow
              key={`${group.cluster?.slug ?? "unsorted"}:${entry.page.href}`}
              entry={entry}
              active={currentPath === entry.page.href}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PageList({
  entries,
  currentPath,
}: {
  entries: ClusteredPageEntry[];
  currentPath: string | null;
}) {
  return (
    <ul className="flex flex-col gap-px">
      {entries.map((entry) => (
        <PageRow
          key={entry.page.href}
          entry={entry}
          active={currentPath === entry.page.href}
        />
      ))}
    </ul>
  );
}

function PageRow({
  entry,
  active,
}: {
  entry: ClusteredPageEntry;
  active: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const liRef = useRef<HTMLLIElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const startY = useRef(0);
  const page: WikiPageMeta = entry.page;

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
    if (!entry.isPrimary) return;
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
          !entry.isPrimary && "italic",
        )}
        title={!entry.isPrimary ? "Echoed from another cluster" : undefined}
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
        {!entry.isPrimary && (
          <span aria-hidden className="ml-auto pl-1 text-[10px] text-ink-tertiary">
            ↗
          </span>
        )}
      </Link>
      {entry.isPrimary && (
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
      )}
    </li>
  );
}

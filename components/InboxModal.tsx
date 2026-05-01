"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/app/api/inbox/route";
import { useInbox } from "./InboxContext";

function formatCapturedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InboxModal() {
  const {
    items,
    loadingItems,
    modalOpen,
    closeModal,
    ingesting,
    ingestResult,
    ingest,
  } = useInbox();

  const hasItems = items !== null && items.length > 0;
  const ingestDisabled = !hasItems || ingesting;

  return (
    <>
      <div
        onClick={closeModal}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-ink-primary/10 transition-opacity",
          modalOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-label="Inbox"
        aria-modal="true"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-[90vw] flex-col border-l border-ink-muted bg-bg-subtle transition-transform duration-200",
          modalOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-ink-muted px-4 py-3">
          <span className="font-heading text-base uppercase tracking-wider text-ink-tertiary">
            Inbox
          </span>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close inbox"
            className="rounded p-1 text-ink-secondary transition hover:bg-ink-muted/40 hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loadingItems && items === null && (
            <p className="px-3 py-6 text-sm text-ink-tertiary">Loading…</p>
          )}
          {items !== null && items.length === 0 && (
            <p className="px-3 py-6 text-sm text-ink-tertiary">
              📭 Inbox is empty.
            </p>
          )}
          {items !== null && items.length > 0 && (
            <ul className="flex flex-col">
              {items.map((item) => (
                <InboxRow key={item.filename} item={item} />
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-ink-muted px-4 py-3">
          {ingestResult?.kind === "success" && (
            <div className="mb-2 text-xs text-ink-secondary">
              ✅ Ingested {ingestResult.inboxRemoved} item
              {ingestResult.inboxRemoved === 1 ? "" : "s"}
              {ingestResult.wikiPagesTouched > 0 &&
                ` · ${ingestResult.wikiPagesTouched} wiki page${ingestResult.wikiPagesTouched === 1 ? "" : "s"} touched`}
              {ingestResult.commitUrl && (
                <>
                  {" · "}
                  <a
                    href={ingestResult.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-ink-primary"
                  >
                    commit
                  </a>
                </>
              )}
            </div>
          )}
          {ingestResult?.kind === "error" && (
            <p className="mb-2 text-xs text-accent-brown">
              ❌ {ingestResult.message}
            </p>
          )}
          <button
            type="button"
            onClick={ingest}
            disabled={ingestDisabled}
            aria-label="Add inbox items to wiki"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded border border-ink-muted px-3 py-2 text-sm font-medium transition",
              ingestDisabled
                ? "cursor-not-allowed bg-bg-subtle text-ink-tertiary"
                : "bg-bg-primary text-ink-primary hover:bg-ink-muted/30",
            )}
          >
            {ingesting && (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
            )}
            {ingesting ? "Ingesting…" : "Add to Wiki"}
          </button>
          {!ingesting && hasItems && !ingestResult && (
            <p className="mt-2 text-xs text-ink-tertiary">
              Synthesizes inbox items into wiki pages. Takes 30–90 seconds.
            </p>
          )}
        </footer>
      </aside>
    </>
  );
}

function InboxRow({ item }: { item: InboxItem }) {
  const { deletingFilenames, deleteItem } = useInbox();
  const deleting = deletingFilenames.has(item.filename);

  const liRef = useRef<HTMLLIElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const startY = useRef(0);
  const [revealed, setRevealed] = useState(false);

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

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${item.title}" from inbox? It won't be ingested.`)) {
      return;
    }
    await deleteItem(item.filename);
    setRevealed(false);
  }

  const date = formatCapturedAt(item.capturedAt);
  const inner = (
    <>
      <span className="truncate text-sm leading-snug text-ink-primary">
        {item.title}
      </span>
      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-tertiary">
        {date && <span>{date}</span>}
        {item.url && <ExternalLink className="h-3 w-3" strokeWidth={2.25} />}
      </span>
    </>
  );

  const rowClass =
    "flex flex-col rounded px-3 py-2.5 pr-9 transition select-none [-webkit-touch-callout:none]";

  return (
    <li ref={liRef} className="group relative">
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onContextMenu={(e) => {
            if (longPressed.current || revealed) e.preventDefault();
          }}
          className={cn(rowClass, "hover:bg-ink-muted/30")}
        >
          {inner}
        </a>
      ) : (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onContextMenu={(e) => {
            if (longPressed.current || revealed) e.preventDefault();
          }}
          className={rowClass}
        >
          {inner}
        </div>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Delete ${item.title}`}
        title={`Delete ${item.title}`}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-tertiary transition hover:bg-ink-muted/40 hover:text-ink-primary focus-visible:opacity-100 focus-visible:pointer-events-auto disabled:opacity-50",
          revealed || deleting
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
        )}
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
        ) : (
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
      </button>
    </li>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Plus, Trash2, X } from "lucide-react";
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
    view,
    openNewSource,
    closeNewSource,
    ingesting,
    ingestResult,
    ingest,
  } = useInbox();

  const hasItems = items !== null && items.length > 0;
  const ingestDisabled = !hasItems || ingesting;
  const isNewView = view === "new";

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
        aria-label={isNewView ? "New source" : "Inbox"}
        aria-modal="true"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-[90vw] flex-col border-l border-ink-muted bg-bg-subtle transition-transform duration-200",
          modalOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-ink-muted px-4 py-3">
          <nav
            aria-label="Inbox breadcrumb"
            className="flex items-center gap-1.5 font-heading text-base uppercase tracking-wider"
          >
            {isNewView ? (
              <>
                <button
                  type="button"
                  onClick={closeNewSource}
                  className="text-ink-tertiary transition hover:text-ink-primary"
                >
                  Inbox
                </button>
                <span aria-hidden className="text-ink-tertiary/60">
                  ›
                </span>
                <span className="text-ink-tertiary">New source</span>
              </>
            ) : (
              <span className="text-ink-tertiary">Inbox</span>
            )}
          </nav>
          <div className="flex items-center gap-1">
            {!isNewView && (
              <button
                type="button"
                onClick={openNewSource}
                aria-label="Add a new source"
                className="flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium text-ink-primary transition hover:bg-ink-muted/30"
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                New source
              </button>
            )}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close inbox"
              className="rounded p-1 text-ink-secondary transition hover:bg-ink-muted/40 hover:text-ink-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {isNewView ? (
          <NewSourceForm />
        ) : (
          <>
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
          </>
        )}
      </aside>
    </>
  );
}

type CaptureMode = "url" | "text";

function NewSourceForm() {
  const { capturing, addSource, closeNewSource } = useInbox();
  const [mode, setMode] = useState<CaptureMode>("url");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !capturing &&
    (mode === "url" ? url.trim().length > 0 : text.trim().length > 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    const payload =
      mode === "url"
        ? {
            kind: "url" as const,
            url: url.trim(),
            note: note.trim() || undefined,
          }
        : { kind: "text" as const, text: text.trim() };
    const result = await addSource(payload);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Success: reset fields. Context already switched view back to list.
    setUrl("");
    setNote("");
    setText("");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <fieldset
          className="mb-4 inline-flex rounded border border-ink-muted p-0.5"
          disabled={capturing}
        >
          <ModeButton
            label="URL"
            active={mode === "url"}
            onClick={() => setMode("url")}
          />
          <ModeButton
            label="Text"
            active={mode === "text"}
            onClick={() => setMode("text")}
          />
        </fieldset>

        {mode === "url" ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-ink-tertiary">
                URL
              </span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                disabled={capturing}
                autoFocus
                required
                className="rounded border border-ink-muted bg-bg-primary px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-secondary disabled:opacity-60"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-ink-tertiary">
                Caption <span className="normal-case text-ink-tertiary/70">(optional)</span>
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this matters, what to focus on…"
                rows={4}
                disabled={capturing}
                className="resize-y rounded border border-ink-muted bg-bg-primary px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-secondary disabled:opacity-60"
              />
              <span className="text-xs text-ink-tertiary">
                Captured as a “My note” block — strongest signal during synthesis.
              </span>
            </label>
          </div>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-ink-tertiary">
              Full text
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full text of the source…"
              rows={14}
              disabled={capturing}
              autoFocus
              required
              className="resize-y rounded border border-ink-muted bg-bg-primary px-3 py-2 font-mono text-sm text-ink-primary outline-none focus:border-ink-secondary disabled:opacity-60"
            />
          </label>
        )}

        {error && (
          <p className="mt-3 text-xs text-accent-brown">❌ {error}</p>
        )}
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-ink-muted px-4 py-3">
        <button
          type="button"
          onClick={closeNewSource}
          disabled={capturing}
          className="rounded px-3 py-2 text-sm text-ink-secondary transition hover:bg-ink-muted/40 hover:text-ink-primary disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "flex items-center gap-2 rounded border border-ink-muted px-3 py-2 text-sm font-medium transition",
            !canSubmit
              ? "cursor-not-allowed bg-bg-subtle text-ink-tertiary"
              : "bg-bg-primary text-ink-primary hover:bg-ink-muted/30",
          )}
        >
          {capturing && (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          )}
          {capturing ? "Saving…" : "Save to inbox"}
        </button>
      </footer>
    </form>
  );
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded px-3 py-1 text-xs font-medium uppercase tracking-wider transition",
        active
          ? "bg-bg-primary text-ink-primary"
          : "text-ink-tertiary hover:text-ink-primary",
      )}
    >
      {label}
    </button>
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

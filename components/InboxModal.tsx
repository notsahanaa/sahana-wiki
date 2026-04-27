"use client";

import { ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const { items, loadingItems, modalOpen, closeModal } = useInbox();

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
              {items.map((item) => {
                const date = formatCapturedAt(item.capturedAt);
                const inner = (
                  <>
                    <span className="truncate text-sm leading-snug text-ink-primary">
                      {item.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-tertiary">
                      {date && <span>{date}</span>}
                      {item.url && (
                        <ExternalLink className="h-3 w-3" strokeWidth={2.25} />
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={item.filename}>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col rounded px-3 py-2.5 transition hover:bg-ink-muted/30"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex flex-col rounded px-3 py-2.5">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items !== null && items.length > 0 && (
          <footer className="border-t border-ink-muted px-4 py-3">
            <p className="text-xs text-ink-tertiary">
              Run <code className="rounded bg-ink-muted/40 px-1 py-0.5">/wiki-ingest</code> in Slack to synthesize these into the wiki.
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}

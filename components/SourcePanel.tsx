"use client";

import { useState } from "react";
import { X, ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSourcePanel } from "./SourceContext";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SourcePanel() {
  const { activeSource, close } = useSourcePanel();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const open = activeSource !== null;

  async function onDelete() {
    if (!activeSource) return;
    if (
      !confirm(
        `Delete source "${activeSource.title}"? This removes sources/${activeSource.slug}.md.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/sources/${activeSource.slug}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      alert(`Delete failed: ${res.status} ${await res.text()}`);
      return;
    }
    close();
    router.refresh();
  }

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-ink-primary/10 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="complementary"
        aria-label="Source"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-[90vw] flex-col border-l border-ink-muted bg-bg-subtle transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-ink-muted px-4 py-3">
          <span className="font-heading text-base uppercase tracking-wider text-ink-tertiary">
            Source
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close source panel"
            className="rounded p-1 text-ink-secondary transition hover:bg-ink-muted/40 hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {activeSource && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block rounded border px-2 py-0.5 text-xs uppercase tracking-wider",
                  activeSource.kind === "note"
                    ? "border-accent-brown text-accent-brown"
                    : "border-accent-mint text-accent-mint-ink",
                )}
              >
                {activeSource.kind === "note" ? "sahana" : "web"}
              </span>
              {activeSource.date && (
                <span className="text-xs text-ink-tertiary">
                  {formatDate(activeSource.date)}
                </span>
              )}
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                aria-label="Delete source"
                title="Delete source"
                className="ml-auto rounded p-1 text-ink-tertiary transition hover:bg-ink-muted/40 hover:text-ink-primary disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </div>
            <h2 className="mt-2 font-heading text-2xl leading-tight text-ink-primary">
              {activeSource.title}
            </h2>
            {activeSource.kind === "note" ? (
              <div className="wiki-prose mt-4 text-[15px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeSource.body}
                </ReactMarkdown>
              </div>
            ) : (
              activeSource.summary && (
                <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
                  {activeSource.summary}
                </p>
              )
            )}
            {activeSource.tags && activeSource.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {activeSource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-ink-muted px-2 py-0.5 text-xs text-ink-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {activeSource.url && (
              <a
                href={activeSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 border-b-2 border-accent-lavender pb-0.5 text-sm font-medium text-ink-primary transition hover:border-b-4"
              >
                Open original
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {activeSource.notes && (
              <div className="mt-6 border-t border-ink-muted pt-4">
                <span className="font-heading text-xs uppercase tracking-wider text-ink-tertiary">
                  Notes
                </span>
                <div className="wiki-prose mt-2 text-[15px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeSource.notes}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

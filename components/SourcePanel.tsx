"use client";

import { X, ExternalLink } from "lucide-react";
import { useSourcePanel } from "./SourceContext";
import { cn } from "@/lib/utils";

export function SourcePanel() {
  const { activeSource, close } = useSourcePanel();
  const open = activeSource !== null;

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        className={cn(
          "fixed inset-0 z-30 bg-ink-primary/10 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="complementary"
        aria-label="Source"
        className={cn(
          "fixed right-0 top-0 z-40 flex h-full w-[380px] max-w-[90vw] flex-col border-l border-ink-muted bg-bg-subtle transition-transform duration-200",
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
            <h2 className="font-heading text-2xl leading-tight text-ink-primary">
              {activeSource.title}
            </h2>
            {activeSource.date && (
              <p className="mt-1 text-xs text-ink-tertiary">{activeSource.date}</p>
            )}
            {activeSource.summary && (
              <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
                {activeSource.summary}
              </p>
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
          </div>
        )}
      </aside>
    </>
  );
}

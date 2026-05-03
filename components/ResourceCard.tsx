"use client";

import { ExternalLink } from "lucide-react";
import type { SourceData } from "@/lib/wiki";

export function ResourceCard({ data }: { data: SourceData }) {
  if (!data.url) {
    return (
      <div className="my-3 rounded border border-ink-muted px-4 py-3 text-sm text-ink-tertiary">
        {data.title} (no URL)
      </div>
    );
  }
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group my-3 flex items-start justify-between gap-3 rounded border border-ink-muted bg-bg-primary px-4 py-3 no-underline transition hover:border-ink-secondary hover:bg-bg-subtle"
    >
      <div className="min-w-0 flex-1">
        <div className="font-heading text-base text-ink-primary">
          {data.title}
        </div>
        {data.caption && (
          <div className="mt-1 text-sm leading-snug text-ink-secondary">
            {data.caption}
          </div>
        )}
      </div>
      <ExternalLink
        className="mt-1 h-4 w-4 shrink-0 text-ink-tertiary transition group-hover:text-ink-primary"
        strokeWidth={2.25}
      />
    </a>
  );
}

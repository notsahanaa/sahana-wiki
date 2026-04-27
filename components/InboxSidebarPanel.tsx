"use client";

import { Inbox } from "lucide-react";
import { useInbox } from "./InboxContext";

export function InboxSidebarPanel() {
  const { count, openModal } = useInbox();

  return (
    <div className="fixed bottom-0 left-0 z-30 hidden w-[260px] border-t border-ink-muted bg-bg-primary md:block">
      <button
        type="button"
        onClick={openModal}
        aria-label={`Open inbox (${count} un-ingested)`}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-ink-secondary transition hover:bg-ink-muted/30 hover:text-ink-primary"
      >
        <Inbox className="h-5 w-5 shrink-0" strokeWidth={2.25} />
        <span className="font-heading text-sm uppercase tracking-wider">
          Inbox
        </span>
        {count > 0 && (
          <span
            aria-hidden
            className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-lavender px-1.5 text-xs font-medium leading-none text-ink-primary"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    </div>
  );
}

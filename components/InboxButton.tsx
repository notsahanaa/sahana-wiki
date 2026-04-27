"use client";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInbox } from "./InboxContext";

export function InboxButton({ className }: { className?: string }) {
  const { count, openModal } = useInbox();

  return (
    <button
      type="button"
      onClick={openModal}
      aria-label={`Open inbox (${count} un-ingested)`}
      title={`Inbox: ${count} un-ingested`}
      className={cn(
        "relative inline-flex items-center justify-center rounded p-1.5 text-ink-secondary transition hover:bg-ink-muted/40 hover:text-ink-primary",
        className,
      )}
    >
      <Inbox className="h-5 w-5" strokeWidth={2.25} />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-lavender px-1 text-[10px] font-medium leading-none text-ink-primary"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

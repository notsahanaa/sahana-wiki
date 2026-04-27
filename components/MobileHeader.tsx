"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { InboxButton } from "./InboxButton";

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-muted bg-bg-primary px-4 md:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded p-1 text-ink-secondary transition hover:bg-ink-muted/40 hover:text-ink-primary"
      >
        <Menu className="h-5 w-5" strokeWidth={2.25} />
      </button>
      <Link href="/" className="font-heading text-xl text-ink-primary">
        sahana-wiki
      </Link>
      <InboxButton className="ml-auto" />
    </header>
  );
}

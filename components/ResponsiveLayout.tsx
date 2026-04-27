"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MobileHeader } from "./MobileHeader";
import { TopicTree } from "./TopicTree";
import { InboxSidebarPanel } from "./InboxSidebarPanel";
import type { WikiClusteredTree } from "@/lib/wiki";

export function ResponsiveLayout({
  tree,
  children,
}: {
  tree: WikiClusteredTree;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <>
      <MobileHeader onMenuClick={() => setNavOpen(true)} />

      <div className="md:grid md:min-h-screen md:[grid-template-columns:260px_1fr]">
        <div
          onClick={() => setNavOpen(false)}
          aria-hidden
          className={cn(
            "fixed inset-0 z-30 bg-ink-primary/10 transition-opacity md:hidden",
            navOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />

        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-full w-[280px] max-w-[85vw] overflow-y-auto border-r border-ink-muted bg-bg-subtle transition-transform duration-200",
            navOpen ? "translate-x-0" : "-translate-x-full",
            "md:sticky md:z-auto md:h-screen md:w-auto md:max-w-none md:translate-x-0",
          )}
        >
          <TopicTree tree={tree} />
        </aside>

        <main className="min-h-screen pt-14 md:pt-0">{children}</main>
      </div>

      <InboxSidebarPanel />
    </>
  );
}

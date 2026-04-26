"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WikiTree } from "@/lib/wiki";

const CATEGORY_ORDER = ["concepts", "people", "projects", "books"];
const CATEGORY_LABEL: Record<string, string> = {
  concepts: "Concepts",
  people: "People",
  projects: "Projects",
  books: "Books",
  uncategorized: "Other",
};

export function TopicTree({ tree }: { tree: WikiTree }) {
  const pathname = usePathname();
  const categories = Object.keys(tree).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <nav aria-label="Wiki topics" className="flex flex-col gap-5 px-4 py-6 text-sm">
      <Link
        href="/"
        className={cn(
          "font-heading text-2xl leading-none text-ink-primary transition-colors",
          pathname === "/" && "text-ink-primary",
        )}
      >
        sahana-wiki
      </Link>

      <div className="flex flex-col gap-3">
        {categories.map((cat) => (
          <CategorySection
            key={cat}
            label={CATEGORY_LABEL[cat] ?? cat}
            pages={tree[cat]}
            currentPath={pathname}
          />
        ))}
      </div>
    </nav>
  );
}

function CategorySection({
  label,
  pages,
  currentPath,
}: {
  label: string;
  pages: WikiTree[string];
  currentPath: string | null;
}) {
  const containsActive = pages.some((p) => p.href === currentPath);
  const [open, setOpen] = useState(true);
  const isOpen = open || containsActive;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-ink-tertiary transition-colors hover:text-ink-primary"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
        <span className="font-heading text-base uppercase leading-none tracking-wider">
          {label}
        </span>
      </button>

      {isOpen && (
        <ul className="mt-1.5 ml-1 flex flex-col gap-px border-l border-ink-muted pl-3">
          {pages.map((page) => {
            const active = currentPath === page.href;
            return (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 leading-snug transition",
                    active
                      ? "bg-accent-lavender text-ink-primary"
                      : "text-ink-secondary hover:bg-bg-subtle hover:text-ink-primary",
                  )}
                >
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 shrink-0 transition-opacity",
                      active ? "opacity-80" : "opacity-30",
                    )}
                    strokeWidth={2.25}
                  />
                  <span className="truncate">{page.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

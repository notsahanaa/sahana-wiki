import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getWikiTree } from "@/lib/wiki";

export default async function Home() {
  const tree = await getWikiTree();
  const all = Object.values(tree).flat();

  return (
    <article className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
      <p className="font-heading text-sm uppercase tracking-wider text-ink-tertiary">
        Home
      </p>
      <h1 className="mt-1 font-heading text-5xl leading-none text-ink-primary">
        sahana-wiki
      </h1>
      <p className="mt-6 max-w-prose text-base leading-relaxed text-ink-secondary">
        A personal knowledge base. Synthesized markdown pages with internal
        links and source-backed highlights. Click a topic on the left, or pick
        one below.
      </p>

      <div className="mt-10 flex flex-col">
        {all.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="group flex items-baseline justify-between gap-4 border-b border-ink-muted py-3 pr-2 transition hover:bg-bg-subtle"
          >
            <span className="flex items-center gap-2 text-base text-ink-primary">
              <ChevronRight
                className="h-3.5 w-3.5 text-ink-tertiary transition group-hover:text-ink-primary"
                strokeWidth={2.25}
              />
              {page.title}
            </span>
            <span className="font-heading text-xs uppercase tracking-wider text-ink-tertiary">
              {page.category}
            </span>
          </Link>
        ))}
      </div>
    </article>
  );
}

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import { useSourcePanel } from "./SourceContext";
import { cn } from "@/lib/utils";
import type { SourceData } from "@/lib/wiki";

interface Props {
  title: string;
  category: string;
  updated?: string;
  markdown: string;
  sources: Record<string, SourceData>;
}

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

export function WikiArticle({ title, category, updated, markdown, sources }: Props) {
  const { open } = useSourcePanel();

  const sourceList = Object.values(sources).sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <article className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
      <p className="font-heading text-sm uppercase tracking-wider text-ink-tertiary">
        {category}
        {updated && <> · updated {updated}</>}
      </p>
      <h1 className="mt-1 font-heading text-5xl leading-none text-ink-primary">
        {title}
      </h1>

      <div className="wiki-prose mt-8">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ href, children, ...rest }) => {
              const isInternal = href?.startsWith("/wiki") || href === "/";
              if (isInternal && href) {
                return <Link href={href}>{children}</Link>;
              }
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                  {children}
                </a>
              );
            },
            mark: ({ children, ...props }) => {
              const slug = (props as { "data-source"?: string })["data-source"];
              const data = slug ? sources[slug] : undefined;
              if (!data || !slug) {
                return <>{children}</>;
              }
              const className =
                data.kind === "note"
                  ? "source-highlight source-highlight-note"
                  : "source-highlight";
              return (
                <button
                  type="button"
                  onClick={() => open(data)}
                  data-source={slug}
                  className={className}
                  title={data.title}
                >
                  {children}
                </button>
              );
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>

      {sourceList.length > 0 && (
        <section className="mt-12 border-t border-ink-muted pt-6">
          <h2 className="font-heading text-sm uppercase tracking-wider text-ink-tertiary">
            Sources
          </h2>
          <ul className="mt-4 space-y-2">
            {sourceList.map((s) => (
              <li key={s.slug} className="flex items-baseline gap-2.5 text-[15px]">
                <span
                  className={cn(
                    "inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                    s.kind === "note"
                      ? "border-accent-brown text-accent-brown"
                      : "border-accent-mint text-accent-mint-ink",
                  )}
                >
                  {s.kind === "note" ? "sahana" : "web"}
                </span>
                <button
                  type="button"
                  onClick={() => open(s)}
                  className="text-left text-ink-primary underline decoration-ink-muted underline-offset-2 transition hover:decoration-ink-primary"
                >
                  {s.title}
                </button>
                {s.date && (
                  <span className="text-xs text-ink-tertiary">
                    {formatDate(s.date)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

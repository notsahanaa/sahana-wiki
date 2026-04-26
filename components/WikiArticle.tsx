"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import { useSourcePanel } from "./SourceContext";
import type { SourceData } from "@/lib/wiki";

interface Props {
  title: string;
  category: string;
  updated?: string;
  markdown: string;
  sources: Record<string, SourceData>;
}

export function WikiArticle({ title, category, updated, markdown, sources }: Props) {
  const { open } = useSourcePanel();

  return (
    <article className="mx-auto max-w-3xl px-8 py-10">
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
    </article>
  );
}

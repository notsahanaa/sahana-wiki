import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { slugify } from "./utils";

const ROOT = process.cwd();
const WIKI_DIR = path.join(ROOT, "wiki");
const SOURCES_DIR = path.join(ROOT, "sources");

// ---------- Types ----------

export interface WikiPageMeta {
  title: string;
  category: string;
  slug: string[]; // path segments e.g. ["concepts", "llm-as-librarian"]
  href: string; // "/wiki/concepts/llm-as-librarian"
  filePath: string;
  tags?: string[];
  created?: string;
  updated?: string;
}

export interface WikiPage {
  meta: WikiPageMeta;
  rawMarkdown: string;
  processedMarkdown: string;
  sources: Record<string, SourceData>;
}

export interface SourceData {
  slug: string;
  title: string;
  url?: string;
  date?: string;
  summary?: string;
  tags?: string[];
  body: string;
}

export type WikiTree = Record<string, WikiPageMeta[]>;

// ---------- Filesystem walk ----------

async function walkMarkdown(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

// ---------- Page metadata ----------

async function readPageMeta(filePath: string): Promise<WikiPageMeta> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const rel = path.relative(WIKI_DIR, filePath).replace(/\\/g, "/");
  const slug = rel.replace(/\.md$/, "").split("/");
  const category = slug.length > 1 ? slug[0] : "uncategorized";
  const title =
    typeof parsed.data.title === "string"
      ? parsed.data.title
      : slug[slug.length - 1].replace(/-/g, " ");
  return {
    title,
    category,
    slug,
    href: `/wiki/${slug.join("/")}`,
    filePath,
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : undefined,
    created: typeof parsed.data.created === "string" ? parsed.data.created : undefined,
    updated: typeof parsed.data.updated === "string" ? parsed.data.updated : undefined,
  };
}

let cachedPages: WikiPageMeta[] | null = null;

async function getAllPagesMeta(): Promise<WikiPageMeta[]> {
  if (cachedPages && process.env.NODE_ENV === "production") return cachedPages;
  const files = await walkMarkdown(WIKI_DIR);
  const metas = await Promise.all(files.map(readPageMeta));
  metas.sort((a, b) => a.title.localeCompare(b.title));
  cachedPages = metas;
  return metas;
}

export async function getWikiTree(): Promise<WikiTree> {
  const pages = await getAllPagesMeta();
  const tree: WikiTree = {};
  for (const p of pages) {
    if (!tree[p.category]) tree[p.category] = [];
    tree[p.category].push(p);
  }
  return tree;
}

export async function getAllPageHrefs(): Promise<string[]> {
  const pages = await getAllPagesMeta();
  return pages.map((p) => p.href);
}

export async function getAllPages(): Promise<WikiPageMeta[]> {
  return getAllPagesMeta();
}

// Find a page by user-typed topic. Matches exact title, terminal slug, or
// any path-suffix slug ("people/karpathy" or "karpathy").
export async function findPage(topic: string): Promise<WikiPageMeta | null> {
  const pages = await getAllPagesMeta();
  const target = slugify(topic);
  if (!target) return null;
  // Exact title match (slugified) or full-slug match
  const exact = pages.find(
    (p) => slugify(p.title) === target || p.slug.join("/") === target,
  );
  if (exact) return exact;
  // Terminal-segment match (e.g., "karpathy" → "people/andrej-karpathy" if its terminal is karpathy)
  const terminal = pages.find((p) => p.slug[p.slug.length - 1] === target);
  if (terminal) return terminal;
  return null;
}

// Suggest pages whose terminal slug or title contains the typed topic.
// Used when findPage returns null.
export async function findClosestPages(
  topic: string,
  limit = 3,
): Promise<WikiPageMeta[]> {
  const pages = await getAllPagesMeta();
  const target = slugify(topic);
  if (!target) return [];
  const scored = pages
    .map((p) => {
      const term = p.slug[p.slug.length - 1];
      const titleSlug = slugify(p.title);
      let score = 0;
      if (term.startsWith(target) || titleSlug.startsWith(target)) score += 3;
      if (term.includes(target) || titleSlug.includes(target)) score += 2;
      // Substring of target inside the slug also counts as weak match
      for (let len = Math.min(target.length, 4); len >= 3; len--) {
        const head = target.slice(0, len);
        if (term.includes(head) || titleSlug.includes(head)) {
          score += 1;
          break;
        }
      }
      return { page: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((s) => s.page);
}

// ---------- Single page ----------

export async function getWikiPage(slug: string[]): Promise<WikiPage | null> {
  const pages = await getAllPagesMeta();
  const target = pages.find((p) => p.slug.join("/") === slug.join("/"));
  if (!target) return null;

  const raw = await fs.readFile(target.filePath, "utf8");
  const parsed = matter(raw);
  const body = stripLeadingH1(parsed.content, target.title);

  const { markdown, referencedSources } = processMarkdown(body, pages);
  const sources: Record<string, SourceData> = {};
  await Promise.all(
    referencedSources.map(async (slug) => {
      const data = await getSource(slug);
      if (data) sources[slug] = data;
    }),
  );

  return {
    meta: target,
    rawMarkdown: body,
    processedMarkdown: markdown,
    sources,
  };
}

// ---------- Source files ----------

export async function getSource(slug: string): Promise<SourceData | null> {
  const filePath = path.join(SOURCES_DIR, `${slug}.md`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    return {
      slug,
      title: typeof parsed.data.title === "string" ? parsed.data.title : slug,
      url: typeof parsed.data.url === "string" ? parsed.data.url : undefined,
      date: typeof parsed.data.date === "string" ? parsed.data.date : undefined,
      summary:
        typeof parsed.data.summary === "string" ? parsed.data.summary : undefined,
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : undefined,
      body: parsed.content,
    };
  } catch {
    return null;
  }
}

// ---------- Markdown pre-processing ----------

function processMarkdown(
  raw: string,
  allPages: WikiPageMeta[],
): { markdown: string; referencedSources: string[] } {
  const referencedSources = new Set<string>();

  // 1. Source highlights: {{source:slug}}text{{/source}} -> <mark data-source="slug">text</mark>
  let processed = raw.replace(
    /\{\{source:([\w-]+)\}\}([\s\S]*?)\{\{\/source\}\}/g,
    (_match, slug: string, text: string) => {
      referencedSources.add(slug);
      // Escape any literal HTML angle brackets in the text to keep the structure clean.
      const safe = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<mark data-source="${slug}">${safe}</mark>`;
    },
  );

  // 2. Wikilinks: [[Target]] or [[path/Target]] -> [<resolved title>](/wiki/...)
  processed = processed.replace(/\[\[([^\]]+)\]\]/g, (_match, target: string) => {
    const trimmed = target.trim();
    const { href, displayTitle } = resolveWikilink(trimmed, allPages);
    return `[${displayTitle}](${href})`;
  });

  return { markdown: processed, referencedSources: Array.from(referencedSources) };
}

function resolveWikilink(
  target: string,
  allPages: WikiPageMeta[],
): { href: string; displayTitle: string } {
  // Path form: [[concepts/foo]] or [[../../docs/stages/roadmap]]
  if (target.includes("/")) {
    const parts = target.split("/").filter((s) => s && s !== "..");
    const slugged = parts.map(slugify).join("/");
    const href = `/wiki/${slugged}`;
    const match = allPages.find((p) => p.slug.join("/") === slugged);
    return { href, displayTitle: match?.title ?? humanize(parts[parts.length - 1]) };
  }

  // Find by title or by terminal slug across all pages
  const targetSlug = slugify(target);
  const match = allPages.find(
    (p) =>
      slugify(p.title) === targetSlug ||
      p.slug[p.slug.length - 1] === targetSlug,
  );
  if (match) return { href: match.href, displayTitle: match.title };
  // Broken link: render the original target text, but route to slugified path
  return { href: `/wiki/${targetSlug}`, displayTitle: target };
}

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((s) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
}

function stripLeadingH1(body: string, title: string): string {
  const lines = body.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return body;
  const h1Match = lines[i].match(/^#\s+(.+)$/);
  if (!h1Match) return body;
  // Only strip if the H1 text is essentially the same as the page title
  if (slugify(h1Match[1]) !== slugify(title)) return body;
  // Drop the H1 line and any blank lines immediately after
  let j = i + 1;
  while (j < lines.length && lines[j].trim() === "") j++;
  return lines.slice(0, i).concat(lines.slice(j)).join("\n");
}

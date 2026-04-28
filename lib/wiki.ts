import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { slugify } from "./utils";

const ROOT = process.cwd();
const WIKI_DIR = path.join(ROOT, "wiki");
const SOURCES_DIR = path.join(ROOT, "sources");
const CLUSTERS_FILE = path.join(WIKI_DIR, "clusters.yml");

// ---------- Types ----------

export interface WikiPageMeta {
  title: string;
  category: string;
  slug: string[]; // path segments e.g. ["concepts", "llm-as-librarian"]
  href: string; // "/wiki/concepts/llm-as-librarian"
  filePath: string;
  tags?: string[];
  // First entry is the primary (canonical) cluster; later entries are
  // additional memberships echoed in the sidebar.
  clusters?: string[];
  created?: string;
  updated?: string;
  // Aggregate over sources cited by this page. "mixed" when both kinds are
  // present; undefined when the page cites no resolvable source.
  sourceKind?: "note" | "web" | "mixed";
}

export interface ClusterDef {
  slug: string;
  title: string;
  description: string;
  page?: { href: string; title: string };
}

export interface ClusterGroup {
  cluster: ClusterDef | null; // null = "Unsorted" bucket
  pages: ClusteredPageEntry[];
}

export interface ClusteredPageEntry {
  page: WikiPageMeta;
  isPrimary: boolean;
}

export type WikiClusteredTree = Record<string, ClusterGroup[]>;

export interface WikiPage {
  meta: WikiPageMeta;
  rawMarkdown: string;
  processedMarkdown: string;
  sources: Record<string, SourceData>;
}

export interface SourceData {
  slug: string;
  title: string;
  kind: "note" | "web";
  url?: string;
  date?: string;
  summary?: string;
  tags?: string[];
  notes?: string;
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

  const referenced = new Set<string>();
  for (const m of parsed.content.matchAll(/\{\{source:([\w-]+)\}\}/g)) {
    referenced.add(m[1]);
  }
  let hasNote = false;
  let hasWeb = false;
  for (const slug of referenced) {
    const kind = await getSourceKindCached(slug);
    if (kind === "note") hasNote = true;
    else if (kind === "web") hasWeb = true;
  }
  const sourceKind: "note" | "web" | "mixed" | undefined =
    hasNote && hasWeb ? "mixed" : hasNote ? "note" : hasWeb ? "web" : undefined;

  return {
    title,
    category,
    slug,
    href: `/wiki/${slug.join("/")}`,
    filePath,
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : undefined,
    clusters: Array.isArray(parsed.data.clusters)
      ? parsed.data.clusters.filter((c): c is string => typeof c === "string")
      : undefined,
    created: typeof parsed.data.created === "string" ? parsed.data.created : undefined,
    updated: typeof parsed.data.updated === "string" ? parsed.data.updated : undefined,
    sourceKind,
  };
}

const sourceKindCache = new Map<string, "note" | "web" | null>();

async function getSourceKindCached(slug: string): Promise<"note" | "web" | null> {
  if (process.env.NODE_ENV === "production" && sourceKindCache.has(slug)) {
    return sourceKindCache.get(slug)!;
  }
  try {
    const raw = await fs.readFile(path.join(SOURCES_DIR, `${slug}.md`), "utf8");
    const parsed = matter(raw);
    const kind = parsed.data.kind === "note" ? "note" : "web";
    sourceKindCache.set(slug, kind);
    return kind;
  } catch {
    sourceKindCache.set(slug, null);
    return null;
  }
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

// ---------- Cluster manifest ----------

interface RawClusterEntry {
  title?: unknown;
  description?: unknown;
  page?: unknown;
}

interface RawClusterFile {
  clusters?: Record<string, RawClusterEntry>;
}

let cachedManifest: Map<string, ClusterDef> | null = null;

async function loadClusterManifest(): Promise<Map<string, ClusterDef>> {
  if (cachedManifest && process.env.NODE_ENV === "production") {
    return cachedManifest;
  }
  const ordered = new Map<string, ClusterDef>();
  let raw: string;
  try {
    raw = await fs.readFile(CLUSTERS_FILE, "utf8");
  } catch {
    cachedManifest = ordered;
    return ordered;
  }
  const parsed = yaml.load(raw) as RawClusterFile | null;
  if (!parsed || typeof parsed !== "object" || !parsed.clusters) {
    cachedManifest = ordered;
    return ordered;
  }
  const pages = await getAllPagesMeta();
  for (const [slug, entry] of Object.entries(parsed.clusters)) {
    const title = typeof entry.title === "string" ? entry.title : slug;
    const description =
      typeof entry.description === "string" ? entry.description.trim() : "";
    // A cluster page lives at wiki/concepts/clusters/<slug>.md (or any
    // category's clusters/ subfolder). Match by terminal slug.
    const pageMatch = pages.find(
      (p) =>
        p.slug.length >= 2 &&
        p.slug[p.slug.length - 2] === "clusters" &&
        p.slug[p.slug.length - 1] === slug,
    );
    ordered.set(slug, {
      slug,
      title,
      description,
      page: pageMatch
        ? { href: pageMatch.href, title: pageMatch.title }
        : undefined,
    });
  }
  cachedManifest = ordered;
  return ordered;
}

export async function getClusterManifest(): Promise<ClusterDef[]> {
  return Array.from((await loadClusterManifest()).values());
}

// Returns a per-category tree where each category is a list of cluster groups
// (in manifest order). Pages with multiple clusters appear under each one;
// the entry is marked isPrimary=true under their first declared cluster and
// isPrimary=false under the rest. Pages without clusters fall into a final
// "Unsorted" group (cluster: null). Categories without clustered pages get
// a single null-cluster group containing all their pages.
export async function getClusteredTree(): Promise<WikiClusteredTree> {
  const pages = await getAllPagesMeta();
  const manifest = await loadClusterManifest();
  const result: WikiClusteredTree = {};

  // Group by category first.
  const byCategory: Record<string, WikiPageMeta[]> = {};
  for (const p of pages) {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  }

  for (const [category, catPages] of Object.entries(byCategory)) {
    // Hide cluster pages themselves from the regular concept list — they
    // get rendered as cluster headers, not as ordinary children.
    const visible = catPages.filter(
      (p) => !(p.slug.length >= 2 && p.slug[p.slug.length - 2] === "clusters"),
    );
    const anyClustered = visible.some((p) => p.clusters && p.clusters.length > 0);

    if (!anyClustered) {
      result[category] = [{ cluster: null, pages: visible.map((page) => ({ page, isPrimary: true })) }];
      continue;
    }

    const groups: ClusterGroup[] = [];
    for (const def of manifest.values()) {
      const entries: ClusteredPageEntry[] = [];
      for (const page of visible) {
        if (!page.clusters || page.clusters.length === 0) continue;
        const idx = page.clusters.indexOf(def.slug);
        if (idx === -1) continue;
        entries.push({ page, isPrimary: idx === 0 });
      }
      if (entries.length > 0) {
        entries.sort((a, b) => a.page.title.localeCompare(b.page.title));
        groups.push({ cluster: def, pages: entries });
      }
    }

    // Pages with no clusters declared, or pointing at slugs not in the manifest.
    const unsorted: ClusteredPageEntry[] = [];
    for (const page of visible) {
      const hasManifestCluster =
        page.clusters && page.clusters.some((c) => manifest.has(c));
      if (!hasManifestCluster) {
        unsorted.push({ page, isPrimary: true });
      }
    }
    if (unsorted.length > 0) {
      unsorted.sort((a, b) => a.page.title.localeCompare(b.page.title));
      groups.push({ cluster: null, pages: unsorted });
    }

    result[category] = groups;
  }

  return result;
}

export async function getAllPageHrefs(): Promise<string[]> {
  const pages = await getAllPagesMeta();
  return pages.map((p) => p.href);
}

export async function getAllPages(): Promise<WikiPageMeta[]> {
  return getAllPagesMeta();
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
      kind: parsed.data.kind === "note" ? "note" : "web",
      url: typeof parsed.data.url === "string" ? parsed.data.url : undefined,
      date: normalizeDate(parsed.data.date),
      summary:
        typeof parsed.data.summary === "string" ? parsed.data.summary : undefined,
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : undefined,
      notes:
        typeof parsed.data.notes === "string" ? parsed.data.notes : undefined,
      body: parsed.content,
    };
  } catch {
    return null;
  }
}

// YAML parses unquoted ISO dates (date: 2026-04-13) into Date objects, not
// strings. Normalize both to YYYY-MM-DD for display.
function normalizeDate(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return undefined;
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

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
  // Each page belongs to at most one cluster.
  cluster?: string;
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
  pages: WikiPageMeta[];
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
  kind: "note" | "web" | "resource";
  url?: string;
  date?: string;
  summary?: string;
  caption?: string;
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

  // Read singular `cluster:` first; fall back to legacy `clusters: [...]`
  // (taking the first entry) so old frontmatter keeps rendering until it gets
  // migrated by a write.
  let cluster: string | undefined;
  if (typeof parsed.data.cluster === "string" && parsed.data.cluster) {
    cluster = parsed.data.cluster;
  } else if (Array.isArray(parsed.data.clusters)) {
    const first = parsed.data.clusters.find(
      (c): c is string => typeof c === "string" && c.length > 0,
    );
    if (first) cluster = first;
  }

  return {
    title,
    category,
    slug,
    href: `/wiki/${slug.join("/")}`,
    filePath,
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : undefined,
    cluster,
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

const CLUSTERS_YML_HEADER = `# Cluster manifest — source of truth for the sidebar's second-level grouping.
#
# Order here = display order in the sidebar.
# Each concept declares its single membership in its own frontmatter (\`cluster: <slug>\`).
#
# Adding/expanding clusters: see the Ingest contract in CLAUDE.md.
`;

async function readManifestRaw(): Promise<Record<string, RawClusterEntry>> {
  let raw = "";
  try {
    raw = await fs.readFile(CLUSTERS_FILE, "utf8");
  } catch {
    return {};
  }
  const parsed = (yaml.load(raw) as RawClusterFile | null) ?? {};
  if (parsed.clusters && typeof parsed.clusters === "object") {
    return { ...parsed.clusters };
  }
  return {};
}

async function writeManifestRaw(
  clusters: Record<string, RawClusterEntry>,
): Promise<void> {
  const dumped = yaml.dump(
    { clusters },
    { lineWidth: 80, noRefs: true, sortKeys: false },
  );
  await fs.writeFile(CLUSTERS_FILE, CLUSTERS_YML_HEADER + "\n" + dumped, "utf8");
}

// Append a new cluster to wiki/clusters.yml. Preserves order of existing
// entries; appends the new one at the end. Re-prepends the canonical comment
// header (folded-block descriptions and any prior comments are not preserved).
// Returns the slug. Throws if the slug already exists or is invalid.
export async function appendClusterToManifest(input: {
  slug: string;
  title: string;
  description: string;
}): Promise<string> {
  const slug = input.slug.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("invalid slug (must be lowercase kebab-case)");
  }
  const clusters = await readManifestRaw();
  if (slug in clusters) {
    throw new Error(`cluster "${slug}" already exists`);
  }
  clusters[slug] = {
    title: input.title.trim() || slug,
    description: input.description.trim(),
  };
  await writeManifestRaw(clusters);
  return slug;
}

// Rename the human-readable title of an existing cluster. The slug — used by
// page frontmatter — stays put on purpose; renaming the slug would silently
// orphan every page that points at it.
export async function renameClusterInManifest(input: {
  slug: string;
  title: string;
}): Promise<void> {
  const slug = input.slug.trim();
  const title = input.title.trim();
  if (!title) throw new Error("title required");
  const clusters = await readManifestRaw();
  if (!(slug in clusters)) {
    throw new Error(`cluster "${slug}" does not exist`);
  }
  const existing = clusters[slug];
  const description =
    typeof existing?.description === "string" ? existing.description : "";
  clusters[slug] = { title, description };
  await writeManifestRaw(clusters);
}

// Drop a cluster from the manifest and clear `cluster:` from every wiki page
// that pointed at it (those pages slide into "Unsorted" on next render). The
// underlying .md files for the pages stay put — only their frontmatter is
// touched. Returns the slugs of pages that were updated. Throws if the slug
// isn't in the manifest.
export async function deleteClusterFromManifest(
  slugInput: string,
): Promise<{ updatedPages: string[][] }> {
  const slug = slugInput.trim();
  const clusters = await readManifestRaw();
  if (!(slug in clusters)) {
    throw new Error(`cluster "${slug}" does not exist`);
  }
  delete clusters[slug];
  await writeManifestRaw(clusters);

  // Clear the now-stale cluster from any page frontmatter referencing it.
  // Walk via the cached page metas so we don't reparse every file.
  const pages = await getAllPagesMeta();
  const affected = pages.filter((p) => p.cluster === slug);
  const updatedPages: string[][] = [];
  for (const page of affected) {
    let didChange = false;
    await writePageFrontmatter(page.filePath, (data) => {
      const current = typeof data.cluster === "string" ? data.cluster : null;
      if (current !== slug) return data;
      didChange = true;
      const { cluster: _drop, clusters: _legacy, ...rest } = data;
      return { ...rest, updated: new Date().toISOString().slice(0, 10) };
    });
    if (didChange) updatedPages.push(page.slug);
  }
  return { updatedPages };
}

// Rewrite the manifest in the given slug order. The set of slugs must match
// the current manifest exactly — no adds, no removes (use the dedicated
// create endpoint for that). Order in the file = order in the sidebar.
export async function reorderClustersInManifest(order: string[]): Promise<void> {
  const clusters = await readManifestRaw();
  const existing = new Set(Object.keys(clusters));
  const requested = new Set(order);
  if (requested.size !== order.length) {
    throw new Error("reorder list contains duplicates");
  }
  for (const slug of order) {
    if (!existing.has(slug)) {
      throw new Error(`unknown cluster "${slug}"`);
    }
  }
  for (const slug of existing) {
    if (!requested.has(slug)) {
      throw new Error(`reorder list missing cluster "${slug}"`);
    }
  }
  const next: Record<string, RawClusterEntry> = {};
  for (const slug of order) next[slug] = clusters[slug];
  await writeManifestRaw(next);
}

// Bust the in-memory caches after a write to wiki/* or wiki/clusters.yml so
// the next render walks the filesystem fresh. Safe to call in dev (caches
// are already null there) and required in prod.
export function revalidateWikiCaches() {
  cachedPages = null;
  cachedManifest = null;
  sourceKindCache.clear();
}

// Round-trip a page's frontmatter: read, mutate `data`, write back. The
// markdown body is preserved as-is. Returns the new data shape.
//
// Date fields (`created`, `updated`) are normalized to YYYY-MM-DD strings
// before write. YAML parses unquoted ISO dates into Date objects, which
// js-yaml would otherwise re-emit as full ISO timestamps and break the
// existing convention.
export async function writePageFrontmatter(
  filePath: string,
  mutate: (data: Record<string, unknown>) => Record<string, unknown> | void,
): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const next = mutate({ ...parsed.data }) ?? parsed.data;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined) continue;
    clean[k] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
  }
  const out = matter.stringify(parsed.content, clean);
  await fs.writeFile(filePath, out, "utf8");
  return clean;
}

// Resolve a page slug array (e.g. ["concepts","agent-native"]) to its absolute
// .md file path inside wiki/. Returns null if the slug escapes the wiki dir
// or doesn't exist.
export async function resolveWikiFilePath(slug: string[]): Promise<string | null> {
  if (!slug.length) return null;
  for (const seg of slug) {
    if (!seg || seg.includes("..") || seg.includes("/") || seg.includes("\\")) {
      return null;
    }
  }
  const filePath = path.join(WIKI_DIR, ...slug) + ".md";
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(WIKI_DIR) + path.sep)) return null;
  try {
    await fs.access(resolved);
  } catch {
    return null;
  }
  return resolved;
}

// Returns a per-category tree where each category is a list of cluster groups
// (in manifest order). Each page belongs to exactly one cluster (or none).
// Pages without a cluster — or pointing at a slug not in the manifest — fall
// into a final "Unsorted" group (cluster: null). Categories with no clusters
// at all get a single null-cluster group containing all their pages.
//
// In manage/edit mode the sidebar wants to render every cluster, even empty
// ones (so the user can drag pages into them). For categories that have any
// clustered pages, we emit a group per manifest entry — empty groups included.
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
    const anyClustered = visible.some((p) => p.cluster && manifest.has(p.cluster));

    if (!anyClustered) {
      const sorted = [...visible].sort((a, b) => a.title.localeCompare(b.title));
      result[category] = [{ cluster: null, pages: sorted }];
      continue;
    }

    const groups: ClusterGroup[] = [];
    for (const def of manifest.values()) {
      const entries = visible
        .filter((page) => page.cluster === def.slug)
        .sort((a, b) => a.title.localeCompare(b.title));
      groups.push({ cluster: def, pages: entries });
    }

    // Pages with no cluster, or pointing at a slug not in the manifest.
    const unsorted = visible
      .filter((page) => !page.cluster || !manifest.has(page.cluster))
      .sort((a, b) => a.title.localeCompare(b.title));
    if (unsorted.length > 0) {
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
    const rawKind = parsed.data.kind;
    const kind: SourceData["kind"] =
      rawKind === "note" ? "note" : rawKind === "resource" ? "resource" : "web";
    return {
      slug,
      title: typeof parsed.data.title === "string" ? parsed.data.title : slug,
      kind,
      url: typeof parsed.data.url === "string" ? parsed.data.url : undefined,
      date: normalizeDate(parsed.data.date),
      summary:
        typeof parsed.data.summary === "string" ? parsed.data.summary : undefined,
      caption:
        typeof parsed.data.caption === "string" ? parsed.data.caption : undefined,
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

  // 1b. Resource markers (void): {{resource:slug}} -> block-level placeholder
  // that the renderer expands into a ResourceCard. Surrounding blank lines
  // ensure markdown treats the <div> as a block, not inline.
  processed = processed.replace(
    /\{\{resource:([\w-]+)\}\}/g,
    (_match, slug: string) => {
      referencedSources.add(slug);
      return `\n\n<div data-resource="${slug}"></div>\n\n`;
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

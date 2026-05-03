import { slugify } from "@/lib/utils";
import { clipUrl, type ClipResult } from "@/lib/clip";
import { fetchResource } from "@/lib/resource-fetch";

const MAX_SLUG_CHARS = 50;

function timestampPrefix(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}-` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`
  );
}

function trimSlug(s: string): string {
  return slugify(s).slice(0, MAX_SLUG_CHARS).replace(/-+$/, "") || "capture";
}

function firstWords(text: string, n: number): string {
  return text.split(/\s+/).filter(Boolean).slice(0, n).join(" ");
}

function escapeYaml(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
}

export interface BuiltCapture {
  filename: string;
  body: string;
  summary: string;
  preview?: { title: string; byline?: string; excerpt?: string };
}

export interface CaptureContext {
  source: string;
  extras?: Record<string, string>;
}

function renderExtras(extras?: Record<string, string>): string[] {
  if (!extras) return [];
  return Object.entries(extras).map(([k, v]) => `${k}: ${escapeYaml(v)}`);
}

export function buildTextCapture(
  text: string,
  ctx: CaptureContext,
): BuiltCapture {
  const slug = trimSlug(firstWords(text, 6));
  const filename = `${timestampPrefix()}-${slug}-note.md`;
  const front = [
    "---",
    `captured_at: ${new Date().toISOString()}`,
    `source: ${ctx.source}`,
    ...renderExtras(ctx.extras),
    "---",
    "",
  ].join("\n");
  return {
    filename,
    body: front + text + "\n",
    summary: text.length > 80 ? text.slice(0, 77) + "…" : text,
  };
}

export function buildClipCapture(
  clip: ClipResult,
  note: string | undefined,
  ctx: CaptureContext,
): BuiltCapture {
  const slug = trimSlug(clip.title);
  const filename = `${timestampPrefix()}-${slug}-clip.md`;
  const front = [
    "---",
    `captured_at: ${new Date().toISOString()}`,
    `source: ${ctx.source}`,
    ...renderExtras(ctx.extras),
    `url: ${escapeYaml(clip.url)}`,
    `title: ${escapeYaml(clip.title)}`,
    ...(clip.kind === "extracted" && clip.byline
      ? [`byline: ${escapeYaml(clip.byline)}`]
      : []),
    "---",
    "",
  ].join("\n");
  const heading = `# ${clip.title}\n\n[Original](${clip.url})\n\n`;
  const body =
    clip.kind === "extracted"
      ? clip.markdown
      : `_(automatic content extraction failed: ${clip.reason}. Re-clip via Stage 3 browser extension when available.)_`;
  const userNote = note?.trim() ? `\n\n## My note\n\n${note.trim()}\n` : "\n";
  return {
    filename,
    body: front + heading + body + userNote,
    summary:
      clip.kind === "extracted"
        ? `${clip.title}${clip.byline ? ` — ${clip.byline}` : ""}`
        : `${clip.title} (bare reference — extraction failed)`,
    preview:
      clip.kind === "extracted"
        ? { title: clip.title, byline: clip.byline, excerpt: clip.excerpt }
        : { title: clip.title },
  };
}

export async function buildUrlCapture(
  url: string,
  note: string | undefined,
  ctx: CaptureContext,
): Promise<BuiltCapture> {
  const clip = await clipUrl(url);
  return buildClipCapture(clip, note, ctx);
}

export async function buildResourceCapture(
  url: string,
  caption: string,
  ctx: CaptureContext,
): Promise<BuiltCapture> {
  const scan = await fetchResource(url);
  const slug = trimSlug(scan.title || url);
  const filename = `${timestampPrefix()}-${slug}-resource.md`;
  const front = [
    "---",
    `captured_at: ${new Date().toISOString()}`,
    `source: ${ctx.source}`,
    "kind: resource",
    ...renderExtras(ctx.extras),
    `url: ${escapeYaml(url)}`,
    `title: ${escapeYaml(scan.title)}`,
    `scan_kind: ${scan.scan_kind}`,
    ...(scan.byline ? [`byline: ${escapeYaml(scan.byline)}`] : []),
    "---",
    "",
  ].join("\n");
  const heading = `# ${scan.title}\n\n[Original](${url})\n\n`;
  const captionBlock = `## Caption\n\n${caption}\n`;
  const scanBlock = scan.scan_summary
    ? `\n## Scan\n\n${scan.scan_summary}\n`
    : `\n_(no scan content — ${scan.scan_kind === "stub" ? "fetch failed or extraction empty" : "see scan_kind"})_\n`;
  return {
    filename,
    body: front + heading + captionBlock + scanBlock,
    summary: `${scan.title} — ${caption.length > 60 ? caption.slice(0, 57) + "…" : caption}`,
  };
}

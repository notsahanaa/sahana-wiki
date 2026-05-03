// Token-conscious resource scanner.
//
// A resource is "URL + caption". The caption is the primary signal during
// ingest; the URL fetch is supplementary context that synth uses to pick a
// bucket and verify the user's framing. We don't need the full body of every
// page — only enough to know what the thing IS.
//
// Strategy:
//   1. GitHub repo roots (github.com/{owner}/{repo}, optionally /tree/<branch>)
//      → call the GitHub API for repo metadata + README. No HTML clipping.
//   2. Everything else → reuse clipUrl(). Cap the result at MAX_FULL_CHARS.
//      Above that, keep the first SCAN_KEEP_CHARS and mark the result
//      "scan-truncated".
//   3. Failures → "stub": title is the URL, no scan_summary.

import { clipUrl } from "./clip";

const MAX_FULL_CHARS = 20_000;
const SCAN_KEEP_CHARS = 8_000;
const README_KEEP_CHARS = 8_000;

export type ScanKind = "github-repo" | "clip" | "scan-truncated" | "stub";

export interface ResourceScan {
  scan_kind: ScanKind;
  title: string;
  byline?: string;
  scan_summary?: string;
}

export async function fetchResource(url: string): Promise<ResourceScan> {
  const gh = parseGithubRepo(url);
  if (gh) {
    try {
      return await scanGithubRepo(gh);
    } catch (err) {
      // Fall through to the generic clipper if GitHub-specific fetch fails.
      const reason = (err as Error).message;
      const fallback = await scanGenericUrl(url);
      if (fallback.scan_kind === "stub") {
        return { ...fallback, scan_summary: `(github fetch failed: ${reason})` };
      }
      return fallback;
    }
  }
  return scanGenericUrl(url);
}

// ---------- GitHub ----------

interface GithubRepoRef {
  owner: string;
  repo: string;
}

function parseGithubRepo(url: string): GithubRepoRef | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
    return null;
  }
  const segs = parsed.pathname.split("/").filter(Boolean);
  if (segs.length < 2) return null;
  // Accept "/{owner}/{repo}" and "/{owner}/{repo}/tree/<branch>" but not
  // deeper paths that point at a specific file or directory.
  if (segs.length > 2 && segs[2] !== "tree") return null;
  if (segs.length > 4) return null;
  const repo = segs[1].replace(/\.git$/, "");
  return { owner: segs[0], repo };
}

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sahana-wiki",
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function scanGithubRepo(ref: GithubRepoRef): Promise<ResourceScan> {
  const base = `https://api.github.com/repos/${ref.owner}/${ref.repo}`;
  const [meta, readme] = await Promise.all([
    fetchJson<{
      name: string;
      full_name: string;
      description: string | null;
      stargazers_count: number;
      language: string | null;
      license: { name?: string } | null;
      default_branch: string;
      pushed_at: string;
      html_url: string;
    }>(base, ghHeaders()),
    fetchReadme(`${base}/readme`),
  ]);

  const lines: string[] = [];
  if (meta.description) lines.push(meta.description.trim());
  const facts: string[] = [];
  if (meta.language) facts.push(meta.language);
  if (typeof meta.stargazers_count === "number") {
    facts.push(`${meta.stargazers_count.toLocaleString("en-US")}★`);
  }
  if (meta.license?.name) facts.push(meta.license.name);
  if (meta.pushed_at) facts.push(`updated ${meta.pushed_at.slice(0, 10)}`);
  if (facts.length) lines.push(`_${facts.join(" · ")}_`);

  if (readme) {
    lines.push("");
    lines.push("## README");
    lines.push("");
    if (readme.length > README_KEEP_CHARS) {
      lines.push(readme.slice(0, README_KEEP_CHARS).trimEnd());
      lines.push("");
      lines.push(`_[README truncated, ${readme.length - README_KEEP_CHARS} chars omitted]_`);
    } else {
      lines.push(readme);
    }
  }

  return {
    scan_kind: "github-repo",
    title: meta.full_name || `${ref.owner}/${ref.repo}`,
    scan_summary: lines.join("\n"),
  };
}

async function fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

async function fetchReadme(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content || data.encoding !== "base64") return null;
  return Buffer.from(data.content, "base64").toString("utf8");
}

// ---------- Generic URL ----------

async function scanGenericUrl(url: string): Promise<ResourceScan> {
  const clip = await clipUrl(url);
  if (clip.kind === "bare") {
    return { scan_kind: "stub", title: clip.title || url };
  }
  if (clip.markdown.length <= MAX_FULL_CHARS) {
    return {
      scan_kind: "clip",
      title: clip.title,
      byline: clip.byline,
      scan_summary: clip.markdown,
    };
  }
  return {
    scan_kind: "scan-truncated",
    title: clip.title,
    byline: clip.byline,
    scan_summary:
      clip.markdown.slice(0, SCAN_KEEP_CHARS).trimEnd() +
      `\n\n_[scan truncated, ${clip.markdown.length - SCAN_KEEP_CHARS} chars omitted]_`,
  };
}

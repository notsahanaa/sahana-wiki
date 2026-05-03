// Wiki synthesis engine — Stage 4 in spirit; first surface is /wiki-ingest.
//
// Loads CLAUDE.md + index.md as a cached system prompt, hands the model four
// tools (read_file, list_directory, write_file, delete_file), runs the beta
// tool-runner agentic loop, and applies all writes/deletes as one atomic
// commit via the GitHub Git Data API.
//
// Reads go through the GitHub API rather than the deployed function's local
// filesystem so that an /wiki-add capture made seconds earlier is visible
// even if the redeploy hasn't finished. (Safety: PAT is contents-only on this
// one repo.)

import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import matter from "gray-matter";
import {
  commitTree,
  listDirectory as ghListDirectory,
  readFileFromRepo,
  GitHubCommitError,
} from "./github";

export interface SynthOperation {
  type: "write" | "delete";
  path: string;
}

export interface IngestResult {
  summary: string;
  operations: SynthOperation[];
  commitSha?: string;
  commitUrl?: string;
  filesWritten: number;
  filesDeleted: number;
  error?: string;
}

// Whitelisted write/delete targets. Anything outside this is rejected by the
// tool — the LLM cannot rewrite app code, lib/, package.json, etc.
const ALLOWED_WRITE_PATH = /^(wiki\/.+\.md|sources\/.+\.md|inbox\/.+\.md|index\.md|log\.md)$/;
const MAX_OPS_PER_INGEST = 50;

// Cap inbox file size sent to the model. Huge web clips (READMEs, listicles)
// burn time + tokens with diminishing librarian value past the first ~10KB
// of body. Frontmatter and any "## My note" section are always preserved —
// the system preamble flags the user's note as first-class analytical input.
const INBOX_TRUNCATE_AT_CHARS = 15000;
const INBOX_KEEP_BODY_CHARS = 10000;

function readClusterFromFrontmatter(raw: string): string | null {
  try {
    const parsed = matter(raw);
    if (typeof parsed.data.cluster === "string" && parsed.data.cluster) {
      return parsed.data.cluster;
    }
    // Legacy `clusters: [...]` — first entry was canonical.
    if (Array.isArray(parsed.data.clusters)) {
      const first = parsed.data.clusters.find(
        (c): c is string => typeof c === "string" && c.length > 0,
      );
      if (first) return first;
    }
    return null;
  } catch {
    return null;
  }
}

// Returns the human-set cluster slug if the incoming write would change it.
// Empty string when the cluster is preserved (or didn't exist before).
function changedCluster(existing: string, incoming: string): string | null {
  const before = readClusterFromFrontmatter(existing);
  if (!before) return null;
  const after = readClusterFromFrontmatter(incoming);
  return after === before ? null : before;
}

function truncateInboxFile(content: string): string {
  if (content.length <= INBOX_TRUNCATE_AT_CHARS) return content;

  const fmEnd = content.startsWith("---") ? content.indexOf("\n---", 3) : -1;
  const frontmatter = fmEnd === -1 ? "" : content.slice(0, fmEnd + 4);
  const body = fmEnd === -1 ? content : content.slice(fmEnd + 4);

  const noteMatch = body.match(/\n##\s+My\s+note\b[\s\S]*$/i);
  const beforeNote = noteMatch ? body.slice(0, noteMatch.index) : body;
  const note = noteMatch ? noteMatch[0] : "";

  if (beforeNote.length <= INBOX_KEEP_BODY_CHARS) return content;

  const omitted = beforeNote.length - INBOX_KEEP_BODY_CHARS;
  const marker = note
    ? `\n\n_[clip body truncated, ${omitted} chars omitted; user note preserved below]_\n`
    : `\n\n_[clip body truncated, ${omitted} chars omitted]_\n`;

  return frontmatter + beforeNote.slice(0, INBOX_KEEP_BODY_CHARS) + marker + note;
}

const SYNTH_SYSTEM_PREAMBLE = `You are the librarian for sahana-wiki. Your job: ingest each file in inbox/ into the wiki by creating or updating wiki pages, then move the source from inbox/ to sources/.

Workflow per inbox file:

1. Read it (read_file).
2. If the inbox file contains a "## My note" section, treat that note as the strongest signal in the capture. It tells you which angle the user cares about — let it steer which wiki pages you update, which phrases you highlight, and how you frame the synthesis. The note is first-class analytical input, not body content.
3. Scout existing wiki pages that might be related (list_directory on wiki/<category>/, then read candidates). When fetching 2+ candidate pages, prefer read_files (plural) over multiple sequential read_file calls — it's much faster.
4. Decide which 1-5 wiki pages to create or update. Be conservative: don't create new categories without strong reason. Match the voice of existing pages — short paragraphs, declarative, generous {{source:slug}} highlights, [[wikilinks]] to neighbors.
5. Wrap source-grounded phrases in {{source:<slug>}}...{{/source}} where <slug> is the source filename without .md.
6. Use [[path/topic]] (e.g. [[concepts/agent-native]]) or bare [[Topic Title]] for internal links. The renderer accepts both forms; aliased syntax like [[path|alias]] is NOT supported.
7. Move the source from inbox/ to sources/: write_file to a clean sources/<slug>.md path with proper source-style frontmatter — title, url, date, summary, tags, kind, byline if present, and notes if the inbox file had a "## My note" section. Carry the note text into the frontmatter as a multi-line YAML "notes:" block (notes: | followed by indented prose) — drop the "## My note" heading itself, keep just the prose. Omit the notes field entirely when there is no user note. Then delete_file the original inbox/ file.
8. If new wiki pages were created, update index.md to list them under the right category with a one-line description.
9. Append a one-line entry to log.md under today's heading describing this ingest.

After processing all inbox files, emit a brief human-readable summary as your final assistant message — name the inbox files moved and the wiki pages touched. Then stop calling tools.

Constraints:

- write_file is restricted to wiki/, sources/, inbox/, index.md, log.md. Trying elsewhere returns an error.
- delete_file is restricted to inbox/. You can't delete wiki pages or sources.
- If a captured URL duplicates an existing source (same URL field), delete the inbox file and skip — don't create a duplicate source.
- If a capture is too thin (e.g. bare URL with no extracted content) to justify wiki pages, still promote it to sources/ as a stub but don't create concept pages from it.
- Categories are concepts/, projects/, books/, and resources/. Never create wiki/people/ pages. When a source centers on a person, attribute inline via {{source:slug}} highlights and the source-card byline, and weave their ideas into the relevant concepts/ or projects/ page. The body of work is the wiki page; the person is the byline.
- Each concepts page has one cluster, declared as \`cluster: <slug>\` in frontmatter. The human-set cluster is authoritative: when updating an existing wiki page, you MUST keep its existing \`cluster:\` value. If you think a page is mis-categorized, leave it where it is and surface the disagreement in your final summary instead. The write_file tool enforces this — it will reject a wiki page write that changes an existing cluster. Resource pages don't carry a cluster.
- All your writes are batched into ONE commit at the end. The order of write_file / delete_file calls doesn't matter for atomicity.
- The wiki schema (CLAUDE.md), the cluster manifest (wiki/clusters.yml), and the current catalog (index.md) are pre-loaded in this system message. Do NOT call read_file on those — go straight to read_file for inbox files and specific wiki pages you want to inspect or update.
- Inbox files larger than ${INBOX_TRUNCATE_AT_CHARS} chars are truncated before you see them: frontmatter + first ${INBOX_KEEP_BODY_CHARS} chars of body + (if present) the user's "## My note" section. Synthesize from what you can see; don't try to recover truncated content.

## Resource ingest (kind: resource)

If an inbox file's frontmatter has \`kind: resource\`, it represents a URL + user-written caption. Treat it differently from a normal text/URL clip:

- The "## Caption" section is the **primary signal** — it's the user's one-line take on what this thing is. Do not paraphrase it away. The "## Scan" section is supplementary — use it to corroborate the caption and pick the right bucket page. The scan may be partial (github repo metadata + README excerpt, or a truncated clip).
- Write \`sources/<slug>-resource.md\` carrying \`kind: resource\`, \`url\`, \`title\`, \`date\` (today, YYYY-MM-DD), and \`caption\` (the user's caption verbatim) in the frontmatter. Body can be empty or carry a short distilled summary. The slug should end in \`-resource\` so the source filename signals its type.
- Decide which bucket page(s) in \`wiki/resources/\` this resource belongs on. A bucket is a curated list (e.g. \`wiki/resources/agentic-coding-tools.md\`, \`wiki/resources/llm-observability.md\`). Prefer extending an existing bucket. Create a new bucket only when no existing one fits — give it a \`title\` in frontmatter and a one-paragraph description.
- Append a void marker \`{{resource:<slug>-resource}}\` to bucket pages **newest first** within each section heading. Each marker goes on its own line. Do not reorder existing markers — only insert the new one near the top.
- The same resource may appear on multiple bucket pages — that's expected when it spans themes. Do not deduplicate by deleting from one bucket.
- If the caption is rich enough to enrich an existing concepts/ or projects/ page (the user named a specific concept the resource embodies), you may add a \`{{source:<slug>-resource}}...{{/source}}\` highlight there. Do not invent claims that aren't grounded in the caption or scan.
- Bump \`updated:\` on every bucket page you touched. Do not bump \`updated:\` on a concepts/projects page where you only added a wikilink.
- After: delete_file the original inbox/ file. Update index.md to reflect any new bucket pages.

Below are the wiki schema, cluster manifest, and current catalog as your reference.`;

interface SessionResult {
  path: string;
  summary: string;
  pendingWrites: Map<string, string>;
  pendingDeletes: Set<string>;
  error?: string;
}

export async function ingestInbox(inboxPaths: string[]): Promise<IngestResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      summary: "ANTHROPIC_API_KEY missing — set it in Vercel env and redeploy",
      operations: [],
      filesWritten: 0,
      filesDeleted: 0,
      error: "no-api-key",
    };
  }

  if (inboxPaths.length === 0) {
    return {
      summary: "Inbox is empty. Nothing to ingest.",
      operations: [],
      filesWritten: 0,
      filesDeleted: 0,
    };
  }

  // Load CLAUDE.md + index.md + clusters.yml once, share across parallel
  // sessions via the cached system prompt.
  const [claudeMd, indexMd, clustersYml] = await Promise.all([
    readFileFromRepo("CLAUDE.md"),
    readFileFromRepo("index.md"),
    readFileFromRepo("wiki/clusters.yml"),
  ]);
  if (!claudeMd) {
    return {
      summary: "CLAUDE.md not found at repo root",
      operations: [],
      filesWritten: 0,
      filesDeleted: 0,
      error: "no-claude-md",
    };
  }

  const client = new Anthropic({ apiKey });
  const systemText = `${SYNTH_SYSTEM_PREAMBLE}\n\n## Schema (CLAUDE.md)\n\n${claudeMd}\n\n## Cluster manifest (wiki/clusters.yml)\n\n\`\`\`yaml\n${clustersYml ?? "(empty)"}\n\`\`\`\n\n## Catalog (index.md)\n\n${indexMd ?? "(empty)"}`;

  // Fan out: one toolRunner session per inbox path, run in parallel.
  // Each session has its own pending state; we merge into a single commit at
  // the end. Wall time becomes max(per-file) instead of sum(per-file).
  const sessions = await Promise.all(
    inboxPaths.map((path) => runIngestSession({ path, client, systemText })),
  );

  // Merge pending state across sessions.
  // - Writes win over deletes on path collisions (writes are the substantive
  //   output; a delete from a different session is almost certainly stale).
  // - Last session wins on write/write collisions. Practically only index.md
  //   and log.md collide; this is acceptable drift, recoverable on next ingest.
  const mergedWrites = new Map<string, string>();
  const mergedDeletes = new Set<string>();
  for (const s of sessions) {
    for (const [p, c] of s.pendingWrites) {
      mergedWrites.set(p, c);
      mergedDeletes.delete(p);
    }
    for (const p of s.pendingDeletes) {
      if (!mergedWrites.has(p)) mergedDeletes.add(p);
    }
  }

  const summaryParts = sessions.map((s) =>
    s.error
      ? `❌ ${s.path} failed: ${s.error}`
      : sessions.length === 1
        ? s.summary
        : `**${s.path}**\n${s.summary}`,
  );
  const summary = summaryParts.join("\n\n---\n\n");
  const failedCount = sessions.filter((s) => s.error).length;

  // No-op: nothing to commit
  if (mergedWrites.size === 0 && mergedDeletes.size === 0) {
    return {
      summary: `${summary}\n\n_(No changes to commit.)_`,
      operations: [],
      filesWritten: 0,
      filesDeleted: 0,
      error:
        failedCount === sessions.length
          ? `all ${sessions.length} session(s) failed`
          : undefined,
    };
  }

  const changes = [
    ...[...mergedWrites].map(([path, content]) => ({ path, content })),
    ...[...mergedDeletes].map((path) => ({ path, content: null })),
  ];

  try {
    const commit = await commitTree({
      message: `wiki-ingest: ${mergedWrites.size} writes, ${mergedDeletes.size} deletes${inboxPaths.length > 1 ? ` (${inboxPaths.length} files)` : ""}`,
      changes,
    });
    return {
      summary,
      operations: [
        ...[...mergedWrites.keys()].map((path) => ({
          type: "write" as const,
          path,
        })),
        ...[...mergedDeletes].map((path) => ({
          type: "delete" as const,
          path,
        })),
      ],
      commitSha: commit.commitSha,
      commitUrl: commit.htmlUrl,
      filesWritten: commit.filesWritten,
      filesDeleted: commit.filesDeleted,
      error:
        failedCount > 0
          ? `${failedCount}/${sessions.length} session(s) failed; committed the rest`
          : undefined,
    };
  } catch (err) {
    const detail =
      err instanceof GitHubCommitError
        ? `${err.message} · ${err.responseBody}`
        : (err as Error).message;
    return {
      summary,
      operations: [],
      filesWritten: 0,
      filesDeleted: 0,
      error: `commit failed: ${detail}`,
    };
  }
}

async function runIngestSession({
  path: inboxPath,
  client,
  systemText,
}: {
  path: string;
  client: Anthropic;
  systemText: string;
}): Promise<SessionResult> {
  const pendingWrites = new Map<string, string>();
  const pendingDeletes = new Set<string>();
  let opCount = 0;

  // Reads consult pending state first (so the LLM can read back what it just wrote)
  async function effectiveRead(p: string): Promise<string | null> {
    if (pendingDeletes.has(p)) return null;
    const pending = pendingWrites.get(p);
    if (pending !== undefined) return pending;
    return readFileFromRepo(p);
  }

  async function effectiveList(dir: string): Promise<string[]> {
    const trimmed = dir.replace(/\/+$/, "");
    const files = new Set(await ghListDirectory(trimmed));
    const prefix = trimmed + "/";
    for (const w of pendingWrites.keys()) {
      if (w.startsWith(prefix)) {
        const rest = w.slice(prefix.length);
        if (!rest.includes("/")) files.add(rest);
      }
    }
    for (const d of pendingDeletes) {
      if (d.startsWith(prefix)) {
        const rest = d.slice(prefix.length);
        if (!rest.includes("/")) files.delete(rest);
      }
    }
    return [...files].sort();
  }

  // ---------- Tools (closures over per-session pending state) ----------

  const readFileTool = betaZodTool({
    name: "read_file",
    description:
      "Read a file from the repo. Path is repo-relative (e.g. 'wiki/concepts/agent-native.md', 'inbox/foo.md', 'CLAUDE.md', 'index.md', 'log.md'). Returns file contents or '(file not found: ...)' if missing.",
    inputSchema: z.object({
      path: z.string().describe("Repo-relative path"),
    }),
    run: async ({ path }) => {
      try {
        const content = await effectiveRead(path);
        if (content === null) return `(file not found: ${path})`;
        if (path.startsWith("inbox/")) return truncateInboxFile(content);
        return content;
      } catch (err) {
        return `(error reading ${path}: ${(err as Error).message})`;
      }
    },
  });

  const readFilesTool = betaZodTool({
    name: "read_files",
    description:
      "Read multiple files in one call. Use this when scouting 2+ candidate wiki pages — much faster than sequential read_file calls. Returns each file as '## <path>\\n<contents>' joined by '---' separators.",
    inputSchema: z.object({
      paths: z
        .array(z.string())
        .min(1)
        .max(20)
        .describe("Repo-relative paths (1-20)"),
    }),
    run: async ({ paths }) => {
      const results = await Promise.all(
        paths.map(async (p) => {
          try {
            const content = await effectiveRead(p);
            if (content === null) return `## ${p}\n(file not found)`;
            const body = p.startsWith("inbox/")
              ? truncateInboxFile(content)
              : content;
            return `## ${p}\n${body}`;
          } catch (err) {
            return `## ${p}\n(error: ${(err as Error).message})`;
          }
        }),
      );
      return results.join("\n\n---\n\n");
    },
  });

  const listDirectoryTool = betaZodTool({
    name: "list_directory",
    description:
      "List files in a directory. Path is repo-relative without trailing slash (e.g. 'wiki/concepts', 'inbox', 'sources'). Returns one filename per line, or '(empty)'.",
    inputSchema: z.object({
      path: z.string().describe("Repo-relative directory path"),
    }),
    run: async ({ path }) => {
      try {
        const files = await effectiveList(path);
        return files.length === 0 ? "(empty)" : files.join("\n");
      } catch (err) {
        return `(error listing ${path}: ${(err as Error).message})`;
      }
    },
  });

  const writeFileTool = betaZodTool({
    name: "write_file",
    description:
      "Create or overwrite a file. Restricted to wiki/, sources/, inbox/, index.md, log.md. Writes are queued and applied as one commit when ingest finishes.",
    inputSchema: z.object({
      path: z.string().describe("Repo-relative path"),
      content: z.string().describe("Full file contents (markdown)"),
    }),
    run: async ({ path, content }) => {
      if (!ALLOWED_WRITE_PATH.test(path)) {
        return `Error: write rejected. Path '${path}' is outside the allowed set (wiki/*.md, sources/*.md, inbox/*.md, index.md, log.md).`;
      }
      // Cluster guard: the human-set cluster on an existing page survives
      // ingests. Only applies to existing wiki pages; new pages and non-wiki
      // files skip it.
      if (path.startsWith("wiki/") && path.endsWith(".md")) {
        const existing = await effectiveRead(path);
        if (existing !== null) {
          const original = changedCluster(existing, content);
          if (original) {
            return `Error: write rejected. The wiki page '${path}' would change its human-set cluster (was \`${original}\`). Re-issue the write with cluster: ${original} preserved in frontmatter.`;
          }
        }
      }
      if (++opCount > MAX_OPS_PER_INGEST) {
        return `Error: exceeded ${MAX_OPS_PER_INGEST} write/delete ops per ingest. Stop and emit your summary now.`;
      }
      pendingDeletes.delete(path);
      pendingWrites.set(path, content);
      return `Queued write: ${path} (${content.length} chars)`;
    },
  });

  const deleteFileTool = betaZodTool({
    name: "delete_file",
    description:
      "Delete a file. Restricted to inbox/. Used to remove an inbox file after promoting it to sources/.",
    inputSchema: z.object({
      path: z.string().describe("Repo-relative path inside inbox/"),
    }),
    run: async ({ path }) => {
      if (!path.startsWith("inbox/")) {
        return `Error: delete rejected. Path '${path}' is outside inbox/. delete_file only works for inbox files.`;
      }
      if (++opCount > MAX_OPS_PER_INGEST) {
        return `Error: exceeded ${MAX_OPS_PER_INGEST} write/delete ops per ingest. Stop and emit your summary now.`;
      }
      pendingWrites.delete(path);
      pendingDeletes.add(path);
      return `Queued delete: ${path}`;
    },
  });

  let finalMessage: Anthropic.Beta.BetaMessage;
  try {
    finalMessage = await client.beta.messages.toolRunner({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      output_config: { effort: "low" },
      system: [
        {
          type: "text",
          text: systemText,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        readFileTool,
        readFilesTool,
        listDirectoryTool,
        writeFileTool,
        deleteFileTool,
      ],
      messages: [
        { role: "user", content: `Ingest this inbox file:\n- ${inboxPath}` },
      ],
    });
  } catch (err) {
    return {
      path: inboxPath,
      summary: "",
      pendingWrites: new Map(),
      pendingDeletes: new Set(),
      error: (err as Error).message,
    };
  }

  const summary =
    finalMessage.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim() || "(no summary returned by the model)";

  return { path: inboxPath, summary, pendingWrites, pendingDeletes };
}

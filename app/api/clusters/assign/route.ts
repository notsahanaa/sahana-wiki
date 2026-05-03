import {
  computePageMdWithFrontmatter,
  getClusterManifest,
  repoPathForWikiSlug,
  revalidateWikiCaches,
} from "@/lib/wiki";
import { LOG_FILE_REPO_PATH, appendLogLineToContent, today } from "@/lib/wiki-log";
import { persistChanges, readForPersist } from "@/lib/persist";
import type { TreeChange } from "@/lib/github";

// Set the cluster of one or more pages. `clusterSlug: null` clears it
// (page lands in "Unsorted"). Each page belongs to exactly one cluster, so
// this is always a replace, never an add.
interface AssignBody {
  pageSlugs: string[][];
  clusterSlug: string | null;
}

export async function POST(request: Request) {
  let body: AssignBody;
  try {
    body = (await request.json()) as AssignBody;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { pageSlugs, clusterSlug } = body;
  if (!Array.isArray(pageSlugs) || pageSlugs.length === 0) {
    return Response.json({ error: "pageSlugs required" }, { status: 400 });
  }
  if (clusterSlug !== null && (typeof clusterSlug !== "string" || !clusterSlug)) {
    return Response.json(
      { error: "clusterSlug must be a non-empty string or null" },
      { status: 400 },
    );
  }

  if (clusterSlug !== null) {
    const manifest = await getClusterManifest();
    if (!manifest.some((c) => c.slug === clusterSlug)) {
      return Response.json(
        { error: `unknown cluster "${clusterSlug}"` },
        { status: 400 },
      );
    }
  }

  const updated: string[][] = [];
  const skipped: string[][] = [];
  const writes: TreeChange[] = [];

  for (const slug of pageSlugs) {
    if (!Array.isArray(slug) || slug.some((s) => typeof s !== "string")) {
      return Response.json({ error: "malformed pageSlugs entry" }, { status: 400 });
    }
    const repoPath = repoPathForWikiSlug(slug);
    if (!repoPath) {
      skipped.push(slug);
      continue;
    }
    const currentMd = await readForPersist(repoPath);
    if (currentMd === null) {
      skipped.push(slug);
      continue;
    }
    const newMd = computePageMdWithFrontmatter(currentMd, (data) => {
      const current = typeof data.cluster === "string" ? data.cluster : null;
      const { clusters: _legacy, ...rest } = data;
      if (clusterSlug === null) {
        if (current === null && _legacy === undefined) return data;
        const { cluster: _drop, ...withoutCluster } = rest;
        return { ...withoutCluster, updated: today() };
      }
      if (current === clusterSlug && _legacy === undefined) return data;
      return { ...rest, cluster: clusterSlug, updated: today() };
    });
    if (newMd === null) continue;
    writes.push({ path: repoPath, content: newMd });
    updated.push(slug);
  }

  if (writes.length === 0) {
    return Response.json({ updated, skipped });
  }

  const target = clusterSlug ?? "(unsorted)";
  const logLine = `${today()} human cluster op: moved ${updated.length} page${updated.length === 1 ? "" : "s"} → \`${target}\` (${updated.map((s) => s.join("/")).join(", ")})`;
  const currentLog = await readForPersist(LOG_FILE_REPO_PATH);
  const newLog = appendLogLineToContent(currentLog, logLine);

  try {
    await persistChanges({
      message: `clusters: move ${updated.length} page${updated.length === 1 ? "" : "s"} → ${target}`,
      changes: [...writes, { path: LOG_FILE_REPO_PATH, content: newLog }],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "commit failed";
    return Response.json({ error: message }, { status: 500 });
  }

  revalidateWikiCaches();
  return Response.json({ updated, skipped });
}

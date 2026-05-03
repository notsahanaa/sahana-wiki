import {
  getClusterManifest,
  resolveWikiFilePath,
  revalidateWikiCaches,
  writePageFrontmatter,
} from "@/lib/wiki";
import { appendLogLine, today } from "@/lib/wiki-log";

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
  for (const slug of pageSlugs) {
    if (!Array.isArray(slug) || slug.some((s) => typeof s !== "string")) {
      return Response.json({ error: "malformed pageSlugs entry" }, { status: 400 });
    }
    const filePath = await resolveWikiFilePath(slug);
    if (!filePath) {
      skipped.push(slug);
      continue;
    }
    let didChange = false;
    await writePageFrontmatter(filePath, (data) => {
      const current = typeof data.cluster === "string" ? data.cluster : null;
      // Drop legacy clusters[] if present — we're authoritative now.
      const { clusters: _legacy, ...rest } = data;
      if (clusterSlug === null) {
        if (current === null && _legacy === undefined) return data;
        didChange = true;
        const { cluster: _drop, ...withoutCluster } = rest;
        return { ...withoutCluster, updated: today() };
      }
      if (current === clusterSlug && _legacy === undefined) return data;
      didChange = true;
      return { ...rest, cluster: clusterSlug, updated: today() };
    });
    if (didChange) updated.push(slug);
  }

  if (updated.length > 0) {
    const target = clusterSlug ?? "(unsorted)";
    await appendLogLine(
      `${today()} human cluster op: moved ${updated.length} page${updated.length === 1 ? "" : "s"} → \`${target}\` (${updated.map((s) => s.join("/")).join(", ")})`,
    );
  }
  revalidateWikiCaches();

  return Response.json({ updated, skipped });
}

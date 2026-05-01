import {
  getClusterManifest,
  resolveWikiFilePath,
  revalidateWikiCaches,
  writePageFrontmatter,
} from "@/lib/wiki";
import { appendLogLine, today } from "@/lib/wiki-log";

interface AssignBody {
  pageSlugs: string[][];
  clusterSlug: string;
  mode: "add" | "remove";
}

export async function POST(request: Request) {
  let body: AssignBody;
  try {
    body = (await request.json()) as AssignBody;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { pageSlugs, clusterSlug, mode } = body;
  if (!Array.isArray(pageSlugs) || pageSlugs.length === 0) {
    return Response.json({ error: "pageSlugs required" }, { status: 400 });
  }
  if (typeof clusterSlug !== "string" || !clusterSlug) {
    return Response.json({ error: "clusterSlug required" }, { status: 400 });
  }
  if (mode !== "add" && mode !== "remove") {
    return Response.json({ error: "mode must be add or remove" }, { status: 400 });
  }

  if (mode === "add") {
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
      const current = Array.isArray(data.clusters)
        ? data.clusters.filter((c): c is string => typeof c === "string")
        : [];
      if (mode === "add") {
        if (current.includes(clusterSlug)) return data;
        const next = [...current, clusterSlug];
        didChange = true;
        return { ...data, clusters: next, updated: today() };
      }
      // remove
      if (!current.includes(clusterSlug)) return data;
      const next = current.filter((c) => c !== clusterSlug);
      didChange = true;
      if (next.length === 0) {
        const { clusters: _drop, ...rest } = data;
        return { ...rest, updated: today() };
      }
      return { ...data, clusters: next, updated: today() };
    });
    if (didChange) updated.push(slug);
  }

  if (updated.length > 0) {
    await appendLogLine(
      `${today()} human cluster op: ${mode === "add" ? "added" : "removed"} \`${clusterSlug}\` ${mode === "add" ? "to" : "from"} ${updated.length} page${updated.length === 1 ? "" : "s"} (${updated.map((s) => s.join("/")).join(", ")})`,
    );
  }
  revalidateWikiCaches();

  return Response.json({ updated, skipped });
}

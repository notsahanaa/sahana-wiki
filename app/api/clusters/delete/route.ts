import {
  CLUSTERS_FILE_REPO_PATH,
  computeManifestWithDeleted,
  computePageMdWithFrontmatter,
  getAllPages,
  repoPathForWikiSlug,
  revalidateWikiCaches,
} from "@/lib/wiki";
import { LOG_FILE_REPO_PATH, appendLogLineToContent, today } from "@/lib/wiki-log";
import { persistChanges, readForPersist } from "@/lib/persist";
import type { TreeChange } from "@/lib/github";

interface DeleteBody {
  slug: string;
}

export async function POST(request: Request) {
  let body: DeleteBody;
  try {
    body = (await request.json()) as DeleteBody;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const slug = (body.slug ?? "").toString().trim();
  if (!slug) return Response.json({ error: "slug required" }, { status: 400 });

  let newManifest: string;
  const pageWrites: TreeChange[] = [];
  const updatedPages: string[][] = [];
  try {
    const currentManifest = await readForPersist(CLUSTERS_FILE_REPO_PATH);
    newManifest = computeManifestWithDeleted(currentManifest, slug);

    const pages = await getAllPages();
    const affected = pages.filter((p) => p.cluster === slug);
    for (const page of affected) {
      const repoPath = repoPathForWikiSlug(page.slug);
      if (!repoPath) continue;
      const currentMd = await readForPersist(repoPath);
      if (currentMd === null) continue;
      const newMd = computePageMdWithFrontmatter(currentMd, (data) => {
        const current = typeof data.cluster === "string" ? data.cluster : null;
        if (current !== slug) return data;
        const { cluster: _drop, clusters: _legacy, ...rest } = data;
        return { ...rest, updated: today() };
      });
      if (newMd === null) continue;
      pageWrites.push({ path: repoPath, content: newMd });
      updatedPages.push(page.slug);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "manifest write failed";
    return Response.json({ error: message }, { status: 400 });
  }

  const tail =
    updatedPages.length > 0
      ? ` (moved ${updatedPages.length} page${updatedPages.length === 1 ? "" : "s"} to Unsorted: ${updatedPages.map((s) => s.join("/")).join(", ")})`
      : "";
  const logLine = `${today()} human cluster op: deleted cluster \`${slug}\`${tail}`;
  const currentLog = await readForPersist(LOG_FILE_REPO_PATH);
  const newLog = appendLogLineToContent(currentLog, logLine);

  try {
    await persistChanges({
      message: `clusters: delete ${slug}${updatedPages.length > 0 ? ` (move ${updatedPages.length} page${updatedPages.length === 1 ? "" : "s"} → unsorted)` : ""}`,
      changes: [
        { path: CLUSTERS_FILE_REPO_PATH, content: newManifest },
        ...pageWrites,
        { path: LOG_FILE_REPO_PATH, content: newLog },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "commit failed";
    return Response.json({ error: message }, { status: 500 });
  }

  revalidateWikiCaches();
  return Response.json({ ok: true, updatedPages });
}

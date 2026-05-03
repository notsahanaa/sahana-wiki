import {
  CLUSTERS_FILE_REPO_PATH,
  computeManifestWithRename,
  revalidateWikiCaches,
} from "@/lib/wiki";
import { LOG_FILE_REPO_PATH, appendLogLineToContent, today } from "@/lib/wiki-log";
import { persistChanges, readForPersist } from "@/lib/persist";

interface RenameBody {
  slug: string;
  title: string;
}

export async function POST(request: Request) {
  let body: RenameBody;
  try {
    body = (await request.json()) as RenameBody;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const slug = (body.slug ?? "").toString().trim();
  const title = (body.title ?? "").toString().trim();
  if (!slug) return Response.json({ error: "slug required" }, { status: 400 });
  if (!title) return Response.json({ error: "title required" }, { status: 400 });

  let newManifest: string;
  let newLog: string;
  try {
    const [currentManifest, currentLog] = await Promise.all([
      readForPersist(CLUSTERS_FILE_REPO_PATH),
      readForPersist(LOG_FILE_REPO_PATH),
    ]);
    newManifest = computeManifestWithRename(currentManifest, slug, title);
    newLog = appendLogLineToContent(
      currentLog,
      `${today()} human cluster op: renamed cluster \`${slug}\` → "${title}"`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "manifest write failed";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    await persistChanges({
      message: `clusters: rename ${slug} → "${title}"`,
      changes: [
        { path: CLUSTERS_FILE_REPO_PATH, content: newManifest },
        { path: LOG_FILE_REPO_PATH, content: newLog },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "commit failed";
    return Response.json({ error: message }, { status: 500 });
  }

  revalidateWikiCaches();
  return Response.json({ ok: true });
}

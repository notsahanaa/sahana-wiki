import {
  CLUSTERS_FILE_REPO_PATH,
  computeManifestWithCreated,
  revalidateWikiCaches,
} from "@/lib/wiki";
import { LOG_FILE_REPO_PATH, appendLogLineToContent, today } from "@/lib/wiki-log";
import { persistChanges, readForPersist } from "@/lib/persist";

interface CreateBody {
  slug: string;
  title: string;
  description?: string;
}

export async function POST(request: Request) {
  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const slugInput = (body.slug ?? "").toString().trim();
  const titleInput = (body.title ?? "").toString().trim();
  const descriptionInput = (body.description ?? "").toString().trim();
  if (!slugInput) {
    return Response.json({ error: "slug required" }, { status: 400 });
  }
  if (!titleInput) {
    return Response.json({ error: "title required" }, { status: 400 });
  }

  let newManifest: string;
  let newLog: string;
  let slug: string;
  try {
    const [currentManifest, currentLog] = await Promise.all([
      readForPersist(CLUSTERS_FILE_REPO_PATH),
      readForPersist(LOG_FILE_REPO_PATH),
    ]);
    const computed = computeManifestWithCreated(currentManifest, {
      slug: slugInput,
      title: titleInput,
      description: descriptionInput,
    });
    newManifest = computed.yaml;
    slug = computed.slug;
    newLog = appendLogLineToContent(
      currentLog,
      `${today()} human cluster op: created cluster \`${slug}\``,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "manifest write failed";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    await persistChanges({
      message: `clusters: create ${slug}`,
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
  return Response.json({ slug });
}

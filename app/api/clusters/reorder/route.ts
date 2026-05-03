import {
  CLUSTERS_FILE_REPO_PATH,
  computeReorderedManifest,
  revalidateWikiCaches,
} from "@/lib/wiki";
import { LOG_FILE_REPO_PATH, appendLogLineToContent, today } from "@/lib/wiki-log";
import { persistChanges, readForPersist } from "@/lib/persist";

interface ReorderBody {
  order: string[];
}

export async function POST(request: Request) {
  let body: ReorderBody;
  try {
    body = (await request.json()) as ReorderBody;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (
    !Array.isArray(body.order) ||
    body.order.some((s) => typeof s !== "string" || !s)
  ) {
    return Response.json(
      { error: "order must be a non-empty string array" },
      { status: 400 },
    );
  }

  let newManifest: string;
  let newLog: string;
  try {
    const [currentManifest, currentLog] = await Promise.all([
      readForPersist(CLUSTERS_FILE_REPO_PATH),
      readForPersist(LOG_FILE_REPO_PATH),
    ]);
    newManifest = computeReorderedManifest(currentManifest, body.order);
    newLog = appendLogLineToContent(
      currentLog,
      `${today()} human cluster op: reordered clusters → ${body.order.join(", ")}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "manifest write failed";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    await persistChanges({
      message: `clusters: reorder → ${body.order.join(", ")}`,
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

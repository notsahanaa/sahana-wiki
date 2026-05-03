import {
  renameClusterInManifest,
  revalidateWikiCaches,
} from "@/lib/wiki";
import { appendLogLine, today } from "@/lib/wiki-log";

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

  try {
    await renameClusterInManifest({ slug, title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "manifest write failed";
    return Response.json({ error: message }, { status: 400 });
  }

  await appendLogLine(
    `${today()} human cluster op: renamed cluster \`${slug}\` → "${title}"`,
  );
  revalidateWikiCaches();

  return Response.json({ ok: true });
}

import {
  deleteClusterFromManifest,
  revalidateWikiCaches,
} from "@/lib/wiki";
import { appendLogLine, today } from "@/lib/wiki-log";

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

  let updatedPages: string[][];
  try {
    ({ updatedPages } = await deleteClusterFromManifest(slug));
  } catch (err) {
    const message = err instanceof Error ? err.message : "manifest write failed";
    return Response.json({ error: message }, { status: 400 });
  }

  const tail =
    updatedPages.length > 0
      ? ` (moved ${updatedPages.length} page${updatedPages.length === 1 ? "" : "s"} to Unsorted: ${updatedPages.map((s) => s.join("/")).join(", ")})`
      : "";
  await appendLogLine(
    `${today()} human cluster op: deleted cluster \`${slug}\`${tail}`,
  );
  revalidateWikiCaches();

  return Response.json({ ok: true, updatedPages });
}

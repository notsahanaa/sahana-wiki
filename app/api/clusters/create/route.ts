import { appendClusterToManifest, revalidateWikiCaches } from "@/lib/wiki";
import { appendLogLine, today } from "@/lib/wiki-log";

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

  let slug: string;
  try {
    slug = await appendClusterToManifest({
      slug: slugInput,
      title: titleInput,
      description: descriptionInput,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "manifest write failed";
    return Response.json({ error: message }, { status: 400 });
  }

  await appendLogLine(
    `${today()} human cluster op: created cluster \`${slug}\``,
  );
  revalidateWikiCaches();

  return Response.json({ slug });
}

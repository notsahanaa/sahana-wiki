import {
  appendClusterToManifest,
  resolveWikiFilePath,
  revalidateWikiCaches,
  writePageFrontmatter,
} from "@/lib/wiki";
import { appendLogLine, today } from "@/lib/wiki-log";

interface CreateBody {
  slug: string;
  title: string;
  description: string;
  pageSlugs?: string[][];
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

  const updated: string[][] = [];
  const skipped: string[][] = [];
  if (Array.isArray(body.pageSlugs)) {
    for (const ps of body.pageSlugs) {
      if (!Array.isArray(ps) || ps.some((s) => typeof s !== "string")) {
        skipped.push(ps as string[]);
        continue;
      }
      const filePath = await resolveWikiFilePath(ps);
      if (!filePath) {
        skipped.push(ps);
        continue;
      }
      let didChange = false;
      await writePageFrontmatter(filePath, (data) => {
        const current = Array.isArray(data.clusters)
          ? data.clusters.filter((c): c is string => typeof c === "string")
          : [];
        if (current.includes(slug)) return data;
        didChange = true;
        return { ...data, clusters: [...current, slug], updated: today() };
      });
      if (didChange) updated.push(ps);
    }
  }

  const memberSummary =
    updated.length > 0
      ? ` and tagged ${updated.length} page${updated.length === 1 ? "" : "s"} (${updated.map((s) => s.join("/")).join(", ")})`
      : "";
  await appendLogLine(
    `${today()} human cluster op: created cluster \`${slug}\`${memberSummary}`,
  );

  revalidateWikiCaches();

  return Response.json({ slug, updated, skipped });
}

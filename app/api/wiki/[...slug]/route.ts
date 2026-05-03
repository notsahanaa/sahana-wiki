import { repoPathForWikiSlug, revalidateWikiCaches } from "@/lib/wiki";
import { persistChanges, readForPersist } from "@/lib/persist";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const repoPath = repoPathForWikiSlug(slug ?? []);
  if (!repoPath) {
    return new Response("invalid slug", { status: 400 });
  }
  const existing = await readForPersist(repoPath);
  if (existing === null) {
    return new Response("not found", { status: 404 });
  }
  try {
    await persistChanges({
      message: `wiki: delete ${slug.join("/")}`,
      changes: [{ path: repoPath, content: null }],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "commit failed";
    return new Response(message, { status: 500 });
  }
  revalidateWikiCaches();
  return new Response(null, { status: 204 });
}

import { promises as fs } from "node:fs";
import path from "node:path";

const WIKI_DIR = path.join(process.cwd(), "wiki");

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  if (!slug?.length || slug.some((s) => !s || s.includes("..") || s.includes("/"))) {
    return new Response("invalid slug", { status: 400 });
  }
  const filePath = path.join(WIKI_DIR, ...slug) + ".md";
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(WIKI_DIR) + path.sep)) {
    return new Response("path escape", { status: 400 });
  }
  try {
    await fs.unlink(resolved);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return new Response("not found", { status: 404 });
    throw err;
  }
  return new Response(null, { status: 204 });
}

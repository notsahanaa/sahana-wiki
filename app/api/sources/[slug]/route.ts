import { promises as fs } from "node:fs";
import path from "node:path";

const SOURCES_DIR = path.join(process.cwd(), "sources");

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || slug.includes("..") || slug.includes("/")) {
    return new Response("invalid slug", { status: 400 });
  }
  const filePath = path.join(SOURCES_DIR, slug + ".md");
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(SOURCES_DIR) + path.sep)) {
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

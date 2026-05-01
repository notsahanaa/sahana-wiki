import { promises as fs } from "node:fs";
import path from "node:path";
import { commitTree, GitHubCommitError } from "@/lib/github";

export const dynamic = "force-dynamic";

const INBOX_DIR = path.join(process.cwd(), "inbox");

function useGithub(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename: rawFilename } = await params;
  const filename = decodeURIComponent(rawFilename);

  if (
    !filename ||
    !filename.endsWith(".md") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("..") ||
    filename === ".gitkeep"
  ) {
    return Response.json({ error: "invalid filename" }, { status: 400 });
  }

  const repoPath = `inbox/${filename}`;

  if (useGithub()) {
    try {
      const result = await commitTree({
        message: `wiki-inbox: drop ${filename}`,
        changes: [{ path: repoPath, content: null }],
      });
      return Response.json({
        ok: true,
        filename,
        commitSha: result.commitSha,
        commitUrl: result.htmlUrl,
      });
    } catch (err) {
      const detail =
        err instanceof GitHubCommitError
          ? `${err.message} · ${err.responseBody}`
          : (err as Error).message;
      return Response.json({ error: `commit failed: ${detail}` }, { status: 500 });
    }
  }

  // Dev fallback — unlink locally.
  try {
    await fs.unlink(path.join(INBOX_DIR, filename));
    return Response.json({ ok: true, filename });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

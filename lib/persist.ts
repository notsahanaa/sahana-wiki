import { promises as fs } from "node:fs";
import path from "node:path";
import { commitTree, readFileFromRepo, type TreeChange } from "./github";

// On Vercel, /var/task is read-only — every mutation has to go through the
// GitHub Git Data API. On local dev we want changes to land on disk so the
// running tree reflects them without a redeploy. Both paths take the same
// repo-relative TreeChange shape.

function useGithub(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

export async function persistChanges(args: {
  message: string;
  changes: TreeChange[];
}): Promise<void> {
  if (args.changes.length === 0) return;
  if (useGithub()) {
    await commitTree({ message: args.message, changes: args.changes });
    return;
  }
  for (const c of args.changes) {
    const full = path.join(process.cwd(), c.path);
    if (c.content === null) {
      await fs.unlink(full).catch(() => {});
    } else {
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, c.content, "utf8");
    }
  }
}

// Read a repo-relative file. On Vercel reads from GitHub's main branch so the
// "current state" we mutate is consistent with what we're about to commit on
// top of (the deployed bundle may be one or more commits behind). Locally,
// reads from disk.
export async function readForPersist(repoPath: string): Promise<string | null> {
  if (useGithub()) {
    return readFileFromRepo(repoPath);
  }
  try {
    return await fs.readFile(path.join(process.cwd(), repoPath), "utf8");
  } catch {
    return null;
  }
}

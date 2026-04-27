import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { listDirectory, readFileFromRepo } from "./github";

export interface InboxEntry {
  filename: string;
  title: string;
  url: string | null;
  capturedAt: string | null;
  source: string | null;
}

// In production GITHUB_TOKEN is set and we read via the GitHub API so a
// recent /wiki-add commit is visible even before redeploy. In local dev the
// token is typically absent — fall back to the repo's working tree on disk.
function useGithub(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

const INBOX_DIR = path.join(process.cwd(), "inbox");

export async function listInboxFilenames(): Promise<string[]> {
  if (useGithub()) {
    const files = await listDirectory("inbox");
    return files.filter((f) => f.endsWith(".md") && f !== ".gitkeep");
  }
  try {
    const entries = await fs.readdir(INBOX_DIR);
    return entries.filter((f) => f.endsWith(".md") && f !== ".gitkeep");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function readInboxFile(filename: string): Promise<string | null> {
  if (useGithub()) return readFileFromRepo(`inbox/${filename}`);
  try {
    return await fs.readFile(path.join(INBOX_DIR, filename), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function listInboxEntries(): Promise<InboxEntry[]> {
  const filenames = await listInboxFilenames();
  const entries = await Promise.all(
    filenames.map(async (filename): Promise<InboxEntry> => {
      const raw = await readInboxFile(filename);
      const fm = raw ? (matter(raw).data as Record<string, unknown>) : {};
      const capturedRaw = fm.captured_at;
      let capturedAt: string | null = null;
      if (capturedRaw instanceof Date) capturedAt = capturedRaw.toISOString();
      else if (typeof capturedRaw === "string") capturedAt = capturedRaw;
      return {
        filename,
        title: typeof fm.title === "string" && fm.title ? fm.title : filename,
        url: typeof fm.url === "string" ? fm.url : null,
        capturedAt,
        source: typeof fm.source === "string" ? fm.source : null,
      };
    }),
  );
  entries.sort((a, b) => {
    const ta = a.capturedAt ? Date.parse(a.capturedAt) : 0;
    const tb = b.capturedAt ? Date.parse(b.capturedAt) : 0;
    return tb - ta;
  });
  return entries;
}

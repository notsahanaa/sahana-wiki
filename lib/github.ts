export interface CommitResult {
  commitSha: string;
  commitUrl: string;
  htmlUrl: string;
  contentSha: string;
}

export class GitHubCommitError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: string,
  ) {
    super(message);
    this.name = "GitHubCommitError";
  }
}

export interface CommitFileArgs {
  path: string;
  content: string;
  message: string;
  branch?: string;
}

export async function commitFile(args: CommitFileArgs): Promise<CommitResult> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token) throw new GitHubCommitError("GITHUB_TOKEN missing", 0, "");
  if (!repo) throw new GitHubCommitError("GITHUB_REPO missing", 0, "");

  const url = `https://api.github.com/repos/${repo}/contents/${args.path}`;
  const body = {
    message: args.message,
    content: Buffer.from(args.content, "utf8").toString("base64"),
    ...(args.branch ? { branch: args.branch } : {}),
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sahana-wiki",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new GitHubCommitError(
      `GitHub API ${res.status} for ${args.path}`,
      res.status,
      text.slice(0, 500),
    );
  }

  const data = JSON.parse(text) as {
    commit: { sha: string; html_url: string; url: string };
    content: { sha: string };
  };
  return {
    commitSha: data.commit.sha,
    commitUrl: data.commit.url,
    htmlUrl: data.commit.html_url,
    contentSha: data.content.sha,
  };
}

// ---------- Multi-file atomic commit (Git Data API) ----------

export interface TreeChange {
  path: string;
  // Either content (write/update) or null (delete)
  content: string | null;
}

export interface CommitTreeArgs {
  branch?: string; // default: main
  message: string;
  changes: TreeChange[];
}

export interface CommitTreeResult {
  commitSha: string;
  htmlUrl: string;
  filesWritten: number;
  filesDeleted: number;
}

// Apply many writes/deletes as a single commit via the Git Data API.
// Process: get ref → blobs (parallel) → tree (with base_tree for unchanged
// files) → commit → fast-forward ref. One commit, regardless of file count.
export async function commitTree(args: CommitTreeArgs): Promise<CommitTreeResult> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token) throw new GitHubCommitError("GITHUB_TOKEN missing", 0, "");
  if (!repo) throw new GitHubCommitError("GITHUB_REPO missing", 0, "");
  if (args.changes.length === 0) {
    throw new GitHubCommitError("commitTree called with no changes", 0, "");
  }

  const branch = args.branch ?? "main";
  const baseHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sahana-wiki",
    "Content-Type": "application/json",
  };

  const gh = async (
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> => {
    const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      method,
      headers: baseHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new GitHubCommitError(
        `GitHub ${method} ${path} → ${res.status}`,
        res.status,
        text.slice(0, 500),
      );
    }
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  };

  // 1. Current head of branch
  const ref = (await gh("GET", `/git/refs/heads/${branch}`)) as {
    object: { sha: string };
  };
  const baseCommitSha = ref.object.sha;

  // 2. Base commit → tree sha
  const baseCommit = (await gh("GET", `/git/commits/${baseCommitSha}`)) as {
    tree: { sha: string };
  };
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Create blobs for each write (in parallel)
  const writes = args.changes.filter((c) => c.content !== null) as Array<{
    path: string;
    content: string;
  }>;
  const deletes = args.changes.filter((c) => c.content === null);

  const blobs = await Promise.all(
    writes.map(async (w) => {
      const blob = (await gh("POST", "/git/blobs", {
        content: Buffer.from(w.content, "utf8").toString("base64"),
        encoding: "base64",
      })) as { sha: string };
      return { path: w.path, sha: blob.sha };
    }),
  );

  // 4. Create new tree on top of baseTree
  // For writes: { path, mode: '100644', type: 'blob', sha: <blob sha> }
  // For deletes: { path, mode: '100644', type: 'blob', sha: null } — null sha removes
  const treeEntries = [
    ...blobs.map((b) => ({
      path: b.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: b.sha,
    })),
    ...deletes.map((d) => ({
      path: d.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: null,
    })),
  ];

  const newTree = (await gh("POST", "/git/trees", {
    base_tree: baseTreeSha,
    tree: treeEntries,
  })) as { sha: string };

  // 5. Create commit
  const newCommit = (await gh("POST", "/git/commits", {
    message: args.message,
    tree: newTree.sha,
    parents: [baseCommitSha],
  })) as { sha: string; html_url: string };

  // 6. Fast-forward the ref
  await gh("PATCH", `/git/refs/heads/${branch}`, {
    sha: newCommit.sha,
    force: false,
  });

  return {
    commitSha: newCommit.sha,
    htmlUrl: newCommit.html_url,
    filesWritten: writes.length,
    filesDeleted: deletes.length,
  };
}

// ---------- List directory via GitHub Contents API ----------

// Used to list inbox/ at runtime (the deployed function's local fs may be
// stale if a recent /wiki-add commit hasn't redeployed yet).
export async function listDirectory(path: string): Promise<string[]> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token) throw new GitHubCommitError("GITHUB_TOKEN missing", 0, "");
  if (!repo) throw new GitHubCommitError("GITHUB_REPO missing", 0, "");

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sahana-wiki",
    },
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    throw new GitHubCommitError(
      `GitHub list ${path} → ${res.status}`,
      res.status,
      text.slice(0, 500),
    );
  }
  const data = (await res.json()) as Array<{ name: string; type: string }>;
  return data.filter((e) => e.type === "file").map((e) => e.name);
}

// ---------- Read file via GitHub Contents API ----------

export async function readFileFromRepo(path: string): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token) throw new GitHubCommitError("GITHUB_TOKEN missing", 0, "");
  if (!repo) throw new GitHubCommitError("GITHUB_REPO missing", 0, "");

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sahana-wiki",
    },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    const text = await res.text();
    throw new GitHubCommitError(
      `GitHub read ${path} → ${res.status}`,
      res.status,
      text.slice(0, 500),
    );
  }
  const data = (await res.json()) as { content: string; encoding: string };
  if (data.encoding !== "base64") {
    throw new GitHubCommitError(`Unexpected encoding ${data.encoding}`, 0, "");
  }
  return Buffer.from(data.content, "base64").toString("utf8");
}

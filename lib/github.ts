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

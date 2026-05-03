import { promises as fs } from "node:fs";
import path from "node:path";
import { listInboxEntries, type InboxEntry } from "@/lib/inbox";
import { commitFile, GitHubCommitError } from "@/lib/github";
import {
  buildResourceCapture,
  buildTextCapture,
  buildUrlCapture,
  type BuiltCapture,
} from "@/lib/inbox-capture";

export const dynamic = "force-dynamic";
// URL clips fetch the remote page; allow generous time.
export const maxDuration = 60;

export type InboxItem = InboxEntry;

const INBOX_DIR = path.join(process.cwd(), "inbox");

function useGithub(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

export async function GET() {
  try {
    const items = await listInboxEntries();
    return Response.json({ items });
  } catch (err) {
    return Response.json(
      { items: [], error: (err as Error).message },
      { status: 500 },
    );
  }
}

interface UrlPayload {
  kind: "url";
  url: string;
  note?: string;
}

interface TextPayload {
  kind: "text";
  text: string;
}

interface ResourcePayload {
  kind: "resource";
  url: string;
  caption: string;
}

type CapturePayload = UrlPayload | TextPayload | ResourcePayload;

function isUrlPayload(p: unknown): p is UrlPayload {
  return (
    typeof p === "object" &&
    p !== null &&
    (p as { kind?: unknown }).kind === "url" &&
    typeof (p as { url?: unknown }).url === "string"
  );
}

function isTextPayload(p: unknown): p is TextPayload {
  return (
    typeof p === "object" &&
    p !== null &&
    (p as { kind?: unknown }).kind === "text" &&
    typeof (p as { text?: unknown }).text === "string"
  );
}

function isResourcePayload(p: unknown): p is ResourcePayload {
  return (
    typeof p === "object" &&
    p !== null &&
    (p as { kind?: unknown }).kind === "resource" &&
    typeof (p as { url?: unknown }).url === "string" &&
    typeof (p as { caption?: unknown }).caption === "string"
  );
}

export async function POST(request: Request) {
  let payload: CapturePayload;
  try {
    const body = (await request.json()) as unknown;
    if (isUrlPayload(body)) {
      payload = body;
    } else if (isTextPayload(body)) {
      payload = body;
    } else if (isResourcePayload(body)) {
      payload = body;
    } else {
      return Response.json(
        {
          error:
            "invalid payload — expected { kind: 'url', url, note? }, { kind: 'text', text }, or { kind: 'resource', url, caption }",
        },
        { status: 400 },
      );
    }
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const ctx = { source: "web" };
  let capture: BuiltCapture;
  try {
    if (payload.kind === "url") {
      const url = payload.url.trim();
      if (!/^https?:\/\//i.test(url)) {
        return Response.json(
          { error: "URL must start with http:// or https://" },
          { status: 400 },
        );
      }
      capture = await buildUrlCapture(url, payload.note?.trim() || undefined, ctx);
    } else if (payload.kind === "resource") {
      const url = payload.url.trim();
      const caption = payload.caption.trim();
      if (!/^https?:\/\//i.test(url)) {
        return Response.json(
          { error: "URL must start with http:// or https://" },
          { status: 400 },
        );
      }
      if (!caption) {
        return Response.json(
          { error: "caption is required for a resource" },
          { status: 400 },
        );
      }
      capture = await buildResourceCapture(url, caption, ctx);
    } else {
      const text = payload.text.trim();
      if (!text) {
        return Response.json(
          { error: "text cannot be empty" },
          { status: 400 },
        );
      }
      capture = buildTextCapture(text, ctx);
    }
  } catch (err) {
    return Response.json(
      { error: `capture failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  if (useGithub()) {
    try {
      const result = await commitFile({
        path: `inbox/${capture.filename}`,
        content: capture.body,
        message: `web: capture inbox/${capture.filename}`,
      });
      return Response.json({
        ok: true,
        filename: capture.filename,
        summary: capture.summary,
        commitUrl: result.htmlUrl,
      });
    } catch (err) {
      const detail =
        err instanceof GitHubCommitError
          ? `${err.message} · ${err.responseBody}`
          : (err as Error).message;
      return Response.json(
        { error: `commit failed: ${detail}` },
        { status: 500 },
      );
    }
  }

  // Dev fallback — write to local inbox/ directly so the same surface works
  // without GITHUB_TOKEN.
  try {
    await fs.mkdir(INBOX_DIR, { recursive: true });
    await fs.writeFile(
      path.join(INBOX_DIR, capture.filename),
      capture.body,
      "utf8",
    );
    return Response.json({
      ok: true,
      filename: capture.filename,
      summary: capture.summary,
      commitUrl: null,
    });
  } catch (err) {
    return Response.json(
      { error: `local write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

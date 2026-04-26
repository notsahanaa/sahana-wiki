import { waitUntil } from "@vercel/functions";
import { slugify } from "@/lib/utils";
import { clipUrl, type ClipResult } from "@/lib/clip";
import { commitFile, GitHubCommitError } from "@/lib/github";
import { postToResponseUrl } from "@/lib/slack/post";

const URL_RE = /https?:\/\/[^\s)]+/i;
const MAX_SLUG_CHARS = 50;

function timestampPrefix(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}-` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`
  );
}

function trimSlug(s: string): string {
  return slugify(s).slice(0, MAX_SLUG_CHARS).replace(/-+$/, "") || "capture";
}

function firstWords(text: string, n: number): string {
  return text.split(/\s+/).filter(Boolean).slice(0, n).join(" ");
}

function escapeYaml(value: string): string {
  // Quote and escape any embedded quotes / control chars
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
}

interface BuiltCapture {
  filename: string;
  body: string;
  summary: string; // one-liner shown in Slack
  preview?: { title: string; byline?: string; excerpt?: string };
}

function buildTextNote(text: string, ctx: { user: string; channel: string }): BuiltCapture {
  const slug = trimSlug(firstWords(text, 6));
  const filename = `${timestampPrefix()}-${slug}-note.md`;
  const front = [
    "---",
    `captured_at: ${new Date().toISOString()}`,
    "source: slack",
    `slack_user: ${escapeYaml(ctx.user)}`,
    `slack_channel: ${escapeYaml(ctx.channel)}`,
    "---",
    "",
  ].join("\n");
  return {
    filename,
    body: front + text + "\n",
    summary: text.length > 80 ? text.slice(0, 77) + "…" : text,
  };
}

function buildClipNote(
  clip: ClipResult,
  extraNote: string | undefined,
  ctx: { user: string; channel: string },
): BuiltCapture {
  const slug = trimSlug(clip.title);
  const filename = `${timestampPrefix()}-${slug}-clip.md`;
  const front = [
    "---",
    `captured_at: ${new Date().toISOString()}`,
    "source: slack",
    `slack_user: ${escapeYaml(ctx.user)}`,
    `slack_channel: ${escapeYaml(ctx.channel)}`,
    `url: ${escapeYaml(clip.url)}`,
    `title: ${escapeYaml(clip.title)}`,
    ...(clip.kind === "extracted" && clip.byline ? [`byline: ${escapeYaml(clip.byline)}`] : []),
    "---",
    "",
  ].join("\n");
  const heading = `# ${clip.title}\n\n[Original](${clip.url})\n\n`;
  const body =
    clip.kind === "extracted"
      ? clip.markdown
      : `_(automatic content extraction failed: ${clip.reason}. Re-clip via Stage 3 browser extension when available.)_`;
  const userNote = extraNote?.trim() ? `\n\n## My note\n\n${extraNote.trim()}\n` : "\n";
  return {
    filename,
    body: front + heading + body + userNote,
    summary:
      clip.kind === "extracted"
        ? `${clip.title}${clip.byline ? ` — ${clip.byline}` : ""}`
        : `${clip.title} (bare reference — extraction failed)`,
    preview:
      clip.kind === "extracted"
        ? { title: clip.title, byline: clip.byline, excerpt: clip.excerpt }
        : { title: clip.title },
  };
}

export interface AddArgs {
  text: string;
  channelId: string;
  userId: string;
  responseUrl: string;
}

export async function handleAdd(args: AddArgs): Promise<Response> {
  const text = args.text.trim();
  if (!text) {
    return Response.json({
      response_type: "ephemeral",
      text: "Usage: `/wiki-add <text or URL>` — e.g. `/wiki-add https://example.com` or `/wiki-add a thought worth saving`",
    });
  }

  const ctx = { user: args.userId, channel: args.channelId };
  const repo = process.env.GITHUB_REPO;
  const inboxLinkBase = repo ? `https://github.com/${repo}/blob/main/inbox/` : "";

  waitUntil(
    (async () => {
      const urlMatch = text.match(URL_RE);
      let capture: BuiltCapture;
      try {
        if (urlMatch) {
          const url = urlMatch[0];
          const remainder = text.replace(urlMatch[0], "").trim();
          const clip = await clipUrl(url);
          capture = buildClipNote(clip, remainder || undefined, ctx);
        } else {
          capture = buildTextNote(text, ctx);
        }
      } catch (err) {
        await postToResponseUrl(args.responseUrl, {
          response_type: "ephemeral",
          replace_original: true,
          text: `Capture failed before commit: ${(err as Error).message}`,
        });
        return;
      }

      try {
        const result = await commitFile({
          path: `inbox/${capture.filename}`,
          content: capture.body,
          message: `slack: capture inbox/${capture.filename}`,
        });
        const fileLink = inboxLinkBase
          ? `<${inboxLinkBase}${capture.filename}|inbox/${capture.filename}>`
          : `inbox/${capture.filename}`;
        await postToResponseUrl(args.responseUrl, {
          response_type: "in_channel",
          replace_original: true,
          text: `✅ Saved ${fileLink} — _${capture.summary}_ · <${result.htmlUrl}|commit>`,
        });
      } catch (err) {
        const detail =
          err instanceof GitHubCommitError ? `${err.message} · ${err.responseBody}` : (err as Error).message;
        await postToResponseUrl(args.responseUrl, {
          response_type: "ephemeral",
          replace_original: true,
          text: `Commit failed: ${detail}`,
        });
      }
    })(),
  );

  return Response.json({
    response_type: "ephemeral",
    text: "📥 Capturing…",
  });
}

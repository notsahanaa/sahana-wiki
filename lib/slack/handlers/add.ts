import { waitUntil } from "@vercel/functions";
import { commitFile, GitHubCommitError } from "@/lib/github";
import { postToResponseUrl } from "@/lib/slack/post";
import {
  buildTextCapture,
  buildUrlCapture,
  type BuiltCapture,
} from "@/lib/inbox-capture";

const URL_RE = /https?:\/\/[^\s)]+/i;

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
      text: "Usage: `/wiki-add <text or URL [optional notes]>` — e.g. `/wiki-add https://example.com why this matters`, `/wiki-add https://example.com`, or `/wiki-add a thought worth saving`",
    });
  }

  const ctx = {
    source: "slack",
    extras: {
      slack_user: args.userId,
      slack_channel: args.channelId,
    },
  };
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
          capture = await buildUrlCapture(url, remainder || undefined, ctx);
        } else {
          capture = buildTextCapture(text, ctx);
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

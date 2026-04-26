import { waitUntil } from "@vercel/functions";
import { findPage, findClosestPages, getWikiPage, getAllPages } from "@/lib/wiki";
import type { WikiPageMeta } from "@/lib/wiki";
import { postMessage, postToResponseUrl } from "@/lib/slack/post";

const MAX_BODY_CHARS = 2900; // Slack hard cap is ~3000 per message

function publicUrl(): string {
  return (process.env.WIKI_PUBLIC_URL || "https://sahana-wiki.vercel.app").replace(/\/+$/, "");
}

// Convert wiki markdown to Slack-friendly mrkdwn:
//   {{source:slug}}text{{/source}}  →  text
//   [[path/topic]] / [[Topic]]      →  <url|Title>
function toSlackMrkdwn(body: string, allPages: WikiPageMeta[], base: string): string {
  let out = body.replace(
    /\{\{source:[\w-]+\}\}([\s\S]*?)\{\{\/source\}\}/g,
    (_, t: string) => t,
  );
  out = out.replace(/\[\[([^\]]+)\]\]/g, (_, target: string) => {
    const trimmed = target.trim();
    const slug = trimmed.includes("/")
      ? trimmed
          .split("/")
          .filter((s) => s && s !== "..")
          .join("/")
          .toLowerCase()
      : trimmed.toLowerCase();
    const match = allPages.find(
      (p) =>
        p.slug.join("/") === slug ||
        p.slug[p.slug.length - 1] === slug.split("/").pop(),
    );
    const title = match?.title ?? trimmed;
    const href = match ? `${base}${match.href}` : `${base}/wiki/${slug}`;
    return `<${href}|${title}>`;
  });
  return out;
}

function firstSentence(body: string): string {
  // Strip leading frontmatter-ish noise + headings, take first paragraph,
  // then first sentence (cap at 180 chars).
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const first = lines[0] ?? "";
  const cleaned = first
    .replace(/\{\{source:[\w-]+\}\}([\s\S]*?)\{\{\/source\}\}/g, "$1")
    .replace(/\[\[([^\]]+?)\|?([^\]]*)\]\]/g, (_, a, b) => b || a)
    .replace(/[*_`]/g, "");
  const sentenceMatch = cleaned.match(/^(.+?[.!?])(\s|$)/);
  const sentence = sentenceMatch ? sentenceMatch[1] : cleaned;
  return sentence.length > 180 ? sentence.slice(0, 177) + "…" : sentence;
}

export interface DiveArgs {
  text: string;
  channelId: string;
  responseUrl: string;
}

export async function handleDive(args: DiveArgs): Promise<Response> {
  const topic = args.text.trim();
  if (!topic) {
    return Response.json({
      response_type: "ephemeral",
      text: "Usage: `/wiki-dive <topic>` — e.g. `/wiki-dive llm-as-librarian`",
    });
  }

  const page = await findPage(topic);
  if (!page) {
    const suggestions = await findClosestPages(topic, 3);
    const suggestionLine =
      suggestions.length > 0
        ? `Try: ${suggestions.map((p) => `\`${p.slug.join("/")}\``).join(", ")}`
        : "Try `/wiki-list` to see all topics.";
    return Response.json({
      response_type: "ephemeral",
      text: `No page named *${topic}*. ${suggestionLine}`,
    });
  }

  // Ack quickly; do the rich post async via chat.postMessage so we get threading.
  waitUntil(
    (async () => {
      const base = publicUrl();
      const full = await getWikiPage(page.slug);
      if (!full) {
        await postToResponseUrl(args.responseUrl, {
          response_type: "ephemeral",
          replace_original: true,
          text: `Couldn't load *${page.title}*. Try again?`,
        });
        return;
      }

      const allPages = await getAllPages();
      const summary = firstSentence(full.rawMarkdown);
      const parentText = `📄 *${page.title}* — ${summary} · <${base}${page.href}|open>`;

      const parent = await postMessage({
        channel: args.channelId,
        text: parentText,
      });

      const slackBody = toSlackMrkdwn(full.rawMarkdown.trim(), allPages, base);
      const truncated =
        slackBody.length > MAX_BODY_CHARS
          ? slackBody.slice(0, MAX_BODY_CHARS) + `\n\n_…truncated; full body at <${base}${page.href}|the dashboard>._`
          : slackBody;

      if (parent.ok && parent.ts) {
        await postMessage({
          channel: args.channelId,
          text: truncated,
          thread_ts: parent.ts,
        });
        await postToResponseUrl(args.responseUrl, {
          response_type: "ephemeral",
          delete_original: true,
          text: "",
        });
      } else {
        await postToResponseUrl(args.responseUrl, {
          response_type: "ephemeral",
          replace_original: true,
          text: `Couldn't post the page (Slack error: ${parent.error ?? "unknown"}). Open <${base}${page.href}|the dashboard> instead.`,
        });
      }
    })(),
  );

  return Response.json({
    response_type: "ephemeral",
    text: `🔍 Looking up *${page.title}*…`,
  });
}

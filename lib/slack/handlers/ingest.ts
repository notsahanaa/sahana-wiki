import { waitUntil } from "@vercel/functions";
import { listDirectory } from "@/lib/github";
import { ingestInbox } from "@/lib/synth";
import { postToResponseUrl } from "@/lib/slack/post";

export interface IngestArgs {
  responseUrl: string;
}

export async function handleIngest(args: IngestArgs): Promise<Response> {
  // List inbox/ first (cheap GitHub API call). If empty, respond synchronously
  // — no need to even ack-and-async.
  let inboxFiles: string[];
  try {
    inboxFiles = (await listDirectory("inbox")).filter(
      (f) => f.endsWith(".md") && f !== ".gitkeep",
    );
  } catch (err) {
    return Response.json({
      response_type: "ephemeral",
      text: `Couldn't list inbox: ${(err as Error).message}`,
    });
  }

  if (inboxFiles.length === 0) {
    return Response.json({
      response_type: "ephemeral",
      text: "📭 Inbox is empty. Nothing to ingest.",
    });
  }

  // Hand off to synth in the background; ack now so Slack doesn't time out.
  // Synthesis can take 30-120s for a few files.
  waitUntil(
    (async () => {
      const inboxPaths = inboxFiles.map((f) => `inbox/${f}`);
      const result = await ingestInbox(inboxPaths);

      if (result.error) {
        await postToResponseUrl(args.responseUrl, {
          response_type: "ephemeral",
          replace_original: true,
          text: `❌ Ingest failed: ${result.error}\n\n_Partial summary if any:_\n${result.summary}`.slice(0, 2900),
        });
        return;
      }

      // Format the result. Show: count, files moved (write under sources/),
      // pages touched (write under wiki/), commit link, model's summary.
      const sourcesWritten = result.operations
        .filter((o) => o.type === "write" && o.path.startsWith("sources/"))
        .map((o) => o.path);
      const wikiPagesTouched = result.operations
        .filter((o) => o.type === "write" && o.path.startsWith("wiki/"))
        .map((o) => o.path);
      const inboxRemoved = result.operations
        .filter((o) => o.type === "delete" && o.path.startsWith("inbox/"))
        .map((o) => o.path);

      const lines: string[] = [];
      lines.push(`✅ Ingested *${inboxRemoved.length}* item${inboxRemoved.length === 1 ? "" : "s"} from the inbox.`);
      if (sourcesWritten.length > 0) {
        lines.push(`*Sources promoted:* ${sourcesWritten.length}`);
        for (const p of sourcesWritten) lines.push(`    • \`${p}\``);
      }
      if (wikiPagesTouched.length > 0) {
        lines.push(`*Wiki pages touched:* ${wikiPagesTouched.length}`);
        for (const p of wikiPagesTouched) lines.push(`    • \`${p}\``);
      }
      if (result.commitUrl) {
        lines.push(`*Commit:* <${result.commitUrl}|${result.commitSha?.slice(0, 7)}>`);
      }
      lines.push("");
      lines.push("*Summary:*");
      lines.push(result.summary);

      // Slack mrkdwn cap is ~3000 chars/block — truncate generously.
      const text = lines.join("\n").slice(0, 2900);

      await postToResponseUrl(args.responseUrl, {
        response_type: "in_channel",
        replace_original: true,
        text,
      });
    })(),
  );

  return Response.json({
    response_type: "ephemeral",
    text: `🧠 Ingesting *${inboxFiles.length}* inbox item${inboxFiles.length === 1 ? "" : "s"}… this takes 30-90 seconds. I'll post the result in this channel when done.`,
  });
}

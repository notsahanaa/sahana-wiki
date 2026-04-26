import { verifySlackRequest } from "@/lib/slack/verify";
import { handleCommandsList } from "@/lib/slack/handlers/commands";
import { handleList } from "@/lib/slack/handlers/list";
import { handleDive } from "@/lib/slack/handlers/dive";
import { handleAdd } from "@/lib/slack/handlers/add";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verdict = verifySlackRequest(
    request.headers,
    rawBody,
    process.env.SLACK_SIGNING_SECRET,
  );
  if (!verdict.ok) {
    return new Response(`unauthorized: ${verdict.reason}`, { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const command = params.get("command") ?? "";
  const text = params.get("text") ?? "";
  const channelId = params.get("channel_id") ?? "";
  const userId = params.get("user_id") ?? "";
  const responseUrl = params.get("response_url") ?? "";

  switch (command) {
    case "/wiki-commands":
      return handleCommandsList();

    case "/wiki-list":
      return handleList();

    case "/wiki-dive":
      return handleDive({ text, channelId, responseUrl });

    case "/wiki-add":
      return handleAdd({ text, channelId, userId, responseUrl });

    case "/wiki-qna":
      return Response.json({
        response_type: "ephemeral",
        text: "`/wiki-qna` ships in Stage 4 alongside the Anthropic SDK swap (the current spec uses `claude -p` which doesn't run on Vercel). For now, run `/wiki-commands` to see what's live.",
      });

    default:
      return Response.json({
        response_type: "ephemeral",
        text: `Unknown command \`${command}\`. Run \`/wiki-commands\` for the list.`,
      });
  }
}

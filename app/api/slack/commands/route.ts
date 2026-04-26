import { verifySlackRequest } from "@/lib/slack/verify";
import { handleCommandsList } from "@/lib/slack/handlers/commands";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
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

      case "/wiki-list": {
        const { handleList } = await import("@/lib/slack/handlers/list");
        return handleList();
      }

      case "/wiki-dive": {
        const { handleDive } = await import("@/lib/slack/handlers/dive");
        return handleDive({ text, channelId, responseUrl });
      }

      case "/wiki-add": {
        const { handleAdd } = await import("@/lib/slack/handlers/add");
        return handleAdd({ text, channelId, userId, responseUrl });
      }

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
  } catch (err) {
    const e = err as Error;
    console.error("slack route error:", e?.stack || e?.message || String(err));
    return new Response(
      `route error: ${e?.message || String(err)}\n${e?.stack || ""}`.slice(0, 2000),
      { status: 500, headers: { "Content-Type": "text/plain" } },
    );
  }
}

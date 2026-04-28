import { verifySlackRequest } from "@/lib/slack/verify";

export const dynamic = "force-dynamic";
// 300s for /wiki-ingest (LLM agentic loop can take 30-120s). Other commands
// finish in <2s so the longer ceiling is harmless.
export const maxDuration = 300;

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
      case "/wiki-list": {
        const { handleList } = await import("@/lib/slack/handlers/list");
        return handleList();
      }

      case "/wiki-add": {
        const { handleAdd } = await import("@/lib/slack/handlers/add");
        return handleAdd({ text, channelId, userId, responseUrl });
      }

      case "/wiki-ingest": {
        const { handleIngest } = await import("@/lib/slack/handlers/ingest");
        return handleIngest({ responseUrl });
      }

      case "/wiki-inbox": {
        const { handleInbox } = await import("@/lib/slack/handlers/inbox");
        return handleInbox();
      }

      case "/wiki-qna":
        return Response.json({
          response_type: "ephemeral",
          text: "`/wiki-qna` ships later (uses the same synth engine as `/wiki-ingest` but as a Q&A surface).",
        });

      default:
        return Response.json({
          response_type: "ephemeral",
          text: `Unknown command \`${command}\`.`,
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

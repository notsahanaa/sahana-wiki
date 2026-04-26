import { verifySlackRequest } from "@/lib/slack/verify";
import { handleCommandsList } from "@/lib/slack/handlers/commands";

export const dynamic = "force-dynamic";

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

  switch (command) {
    case "/wiki-commands":
      return handleCommandsList();

    case "/wiki-add":
    case "/wiki-list":
    case "/wiki-dive":
    case "/wiki-qna":
      return Response.json({
        response_type: "ephemeral",
        text: `\`${command}\` is planned but not yet implemented. Run \`/wiki-commands\` to see what's available.`,
      });

    default:
      return Response.json({
        response_type: "ephemeral",
        text: `Unknown command \`${command}\`. Run \`/wiki-commands\` for the list.`,
      });
  }
}

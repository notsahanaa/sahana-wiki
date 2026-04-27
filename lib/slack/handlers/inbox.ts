import { listInboxEntries } from "@/lib/inbox";

export async function handleInbox(): Promise<Response> {
  let items;
  try {
    items = await listInboxEntries();
  } catch (err) {
    return Response.json({
      response_type: "ephemeral",
      text: `Couldn't list inbox: ${(err as Error).message}`,
    });
  }

  if (items.length === 0) {
    return Response.json({
      response_type: "ephemeral",
      text: "📭 Inbox is empty.",
    });
  }

  const lines: string[] = [];
  lines.push(
    `📥 Inbox (${items.length} item${items.length === 1 ? "" : "s"}, un-ingested):`,
  );
  for (const item of items) {
    const left = item.url ? `<${item.url}|${item.title}>` : item.title;
    lines.push(`• ${left}`);
  }
  lines.push("");
  lines.push("_Run `/wiki-ingest` to synthesize these into the wiki._");

  return Response.json({
    response_type: "ephemeral",
    text: lines.join("\n").slice(0, 2900),
  });
}

import {
  reorderClustersInManifest,
  revalidateWikiCaches,
} from "@/lib/wiki";
import { appendLogLine, today } from "@/lib/wiki-log";

interface ReorderBody {
  order: string[];
}

export async function POST(request: Request) {
  let body: ReorderBody;
  try {
    body = (await request.json()) as ReorderBody;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (
    !Array.isArray(body.order) ||
    body.order.some((s) => typeof s !== "string" || !s)
  ) {
    return Response.json(
      { error: "order must be a non-empty string array" },
      { status: 400 },
    );
  }

  try {
    await reorderClustersInManifest(body.order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "manifest write failed";
    return Response.json({ error: message }, { status: 400 });
  }

  await appendLogLine(
    `${today()} human cluster op: reordered clusters → ${body.order.join(", ")}`,
  );
  revalidateWikiCaches();

  return Response.json({ ok: true });
}

import { listDirectory } from "@/lib/github";
import { ingestInbox } from "@/lib/synth";

export const dynamic = "force-dynamic";
// Synth tool-loop can take 30-120s for a few inbox items.
export const maxDuration = 300;

export async function POST() {
  let inboxFiles: string[];
  try {
    inboxFiles = (await listDirectory("inbox")).filter(
      (f) => f.endsWith(".md") && f !== ".gitkeep",
    );
  } catch (err) {
    return Response.json(
      { error: `Couldn't list inbox: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  if (inboxFiles.length === 0) {
    return Response.json(
      { error: "Inbox is empty. Nothing to ingest." },
      { status: 400 },
    );
  }

  const inboxPaths = inboxFiles.map((f) => `inbox/${f}`);
  const result = await ingestInbox(inboxPaths);

  if (result.error) {
    return Response.json(
      {
        error: result.error,
        summary: result.summary,
      },
      { status: 500 },
    );
  }

  const sourcesWritten = result.operations.filter(
    (o) => o.type === "write" && o.path.startsWith("sources/"),
  ).length;
  const wikiPagesTouched = result.operations.filter(
    (o) => o.type === "write" && o.path.startsWith("wiki/"),
  ).length;
  const inboxRemoved = result.operations.filter(
    (o) => o.type === "delete" && o.path.startsWith("inbox/"),
  ).length;

  return Response.json({
    summary: result.summary,
    inboxRemoved,
    sourcesWritten,
    wikiPagesTouched,
    commitSha: result.commitSha ?? null,
    commitUrl: result.commitUrl ?? null,
  });
}

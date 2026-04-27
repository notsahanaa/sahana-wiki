import { listInboxEntries, type InboxEntry } from "@/lib/inbox";

export const dynamic = "force-dynamic";

export type InboxItem = InboxEntry;

export async function GET() {
  try {
    const items = await listInboxEntries();
    return Response.json({ items });
  } catch (err) {
    return Response.json(
      { items: [], error: (err as Error).message },
      { status: 500 },
    );
  }
}

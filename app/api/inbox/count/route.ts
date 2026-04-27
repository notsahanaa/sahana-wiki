import { listInboxFilenames } from "@/lib/inbox";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const files = await listInboxFilenames();
    return Response.json({ count: files.length });
  } catch (err) {
    return Response.json(
      { count: 0, error: (err as Error).message },
      { status: 500 },
    );
  }
}

import { promises as fs } from "node:fs";
import path from "node:path";

const LOG_FILE = path.join(process.cwd(), "log.md");

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Append a single bullet line to log.md. Used by mutation routes (cluster
// ops, manual edits) so the canonical timeline reflects human-driven changes
// alongside the LLM-driven ingest entries.
export async function appendLogLine(line: string): Promise<void> {
  const existing = await fs.readFile(LOG_FILE, "utf8").catch(() => "");
  const trimmed = existing.replace(/\s+$/, "");
  await fs.writeFile(LOG_FILE, `${trimmed}\n- ${line}\n`, "utf8");
}

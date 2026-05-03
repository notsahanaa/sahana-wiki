export const LOG_FILE_REPO_PATH = "log.md";

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Pure: take the current log.md contents (or null if missing) and a single
// bullet line, return the new content. The caller is expected to bundle the
// returned string into a TreeChange and ship it as part of a single commit
// alongside whatever else the route is changing.
export function appendLogLineToContent(
  currentLog: string | null,
  line: string,
): string {
  const base = currentLog ?? "";
  const trimmed = base.replace(/\s+$/, "");
  return `${trimmed}\n- ${line}\n`;
}

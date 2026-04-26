export interface WikiCommand {
  name: `/${string}`;
  summary: string;
  status: "live" | "planned";
}

export const WIKI_COMMANDS: readonly WikiCommand[] = [
  {
    name: "/wiki-add",
    summary: "Capture text or a URL into the inbox. URLs are fetched and cleaned with Readability.",
    status: "live",
  },
  {
    name: "/wiki-list",
    summary: "List every wiki topic, nested by category. Read-only.",
    status: "live",
  },
  {
    name: "/wiki-dive",
    summary: "Look up a wiki page by name. Posts title + summary; full body in thread.",
    status: "live",
  },
  {
    name: "/wiki-qna",
    summary: "Ask a question across the wiki. Synthesized answer with citations. (Ships in Stage 4.)",
    status: "planned",
  },
  {
    name: "/wiki-commands",
    summary: "Show this list of available wiki commands.",
    status: "live",
  },
] as const;

export function renderCommandsList(): string {
  const header = "*sahana-wiki — Slack commands*";
  const rows = WIKI_COMMANDS.map((c) => {
    const tag = c.status === "live" ? "" : "  _(not yet implemented)_";
    return `• \`${c.name}\` — ${c.summary}${tag}`;
  });
  return [header, ...rows].join("\n");
}

export function handleCommandsList() {
  return Response.json({
    response_type: "ephemeral",
    text: renderCommandsList(),
  });
}

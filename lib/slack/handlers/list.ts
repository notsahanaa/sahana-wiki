import { getWikiTree } from "@/lib/wiki";

const CATEGORY_ORDER = ["concepts", "people", "projects", "books"];
const CATEGORY_LABEL: Record<string, string> = {
  concepts: "Concepts",
  people: "People",
  projects: "Projects",
  books: "Books",
  uncategorized: "Other",
};

const MAX_PAGES = 30;

function publicUrl(): string {
  return process.env.WIKI_PUBLIC_URL || "https://sahana-wiki.vercel.app";
}

export async function handleList(): Promise<Response> {
  const tree = await getWikiTree();
  const base = publicUrl().replace(/\/+$/, "");
  const cats = Object.keys(tree).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const lines: string[] = ["*sahana-wiki — topics*"];
  let total = 0;
  let truncated = 0;
  for (const cat of cats) {
    const pages = tree[cat];
    if (!pages?.length) continue;
    lines.push(`▾ *${CATEGORY_LABEL[cat] ?? cat}*`);
    for (const page of pages) {
      if (total >= MAX_PAGES) {
        truncated++;
        continue;
      }
      lines.push(`    ▸ <${base}${page.href}|${page.title}>`);
      total++;
    }
  }
  if (truncated > 0) {
    lines.push(`_…and ${truncated} more — view at <${base}|the dashboard>_`);
  }

  return Response.json({
    response_type: "in_channel",
    text: lines.join("\n"),
  });
}

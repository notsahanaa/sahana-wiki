import { getClusteredTree } from "@/lib/wiki";

const CATEGORY_ORDER = ["concepts", "projects", "books"];
const CATEGORY_LABEL: Record<string, string> = {
  concepts: "Concepts",
  projects: "Projects",
  books: "Books",
  uncategorized: "Other",
};

const MAX_PAGES = 40;

function publicUrl(): string {
  return process.env.WIKI_PUBLIC_URL || "https://sahana-wiki.vercel.app";
}

export async function handleList(): Promise<Response> {
  const tree = await getClusteredTree();
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
    const groups = tree[cat];
    if (!groups?.length) continue;
    lines.push(`▾ *${CATEGORY_LABEL[cat] ?? cat}*`);

    const isFlat = groups.length === 1 && groups[0].cluster === null;

    for (const group of groups) {
      if (!isFlat) {
        const headerLabel = group.cluster?.title ?? "Unsorted";
        const headerLink = group.cluster?.page
          ? `<${base}${group.cluster.page.href}|${headerLabel}>`
          : headerLabel;
        lines.push(`    ▸ *${headerLink}*`);
      }
      for (const page of group.pages) {
        if (total >= MAX_PAGES) {
          truncated++;
          continue;
        }
        const indent = isFlat ? "    " : "        ";
        const bullet = isFlat ? "▸" : "•";
        lines.push(
          `${indent}${bullet} <${base}${page.href}|${page.title}>`,
        );
        total++;
      }
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

// jsdom (~10MB) + @mozilla/readability + turndown are loaded LAZILY inside
// clipUrl. Loading them at module top blows past Slack's 3s ack window on
// cold-start serverless invocations even when this file is dynamically
// imported from the route handler.
import type { JSDOM as JSDOMType } from "jsdom";
import type TurndownServiceType from "turndown";

export type ClipResult =
  | {
      kind: "extracted";
      url: string;
      title: string;
      byline?: string;
      excerpt?: string;
      markdown: string;
    }
  | {
      kind: "bare";
      url: string;
      title: string;
      reason: string;
    };

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 sahana-wiki-clipper";

let cachedTurndown: TurndownServiceType | null = null;
async function getTurndown(): Promise<TurndownServiceType> {
  if (cachedTurndown) return cachedTurndown;
  const mod = await import("turndown");
  const Td = mod.default;
  cachedTurndown = new Td({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  return cachedTurndown;
}

export async function clipUrl(url: string): Promise<ClipResult> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      redirect: "follow",
    });
    if (!res.ok) {
      return {
        kind: "bare",
        url,
        title: url,
        reason: `fetch returned HTTP ${res.status}`,
      };
    }
    html = await res.text();
  } catch (err) {
    return {
      kind: "bare",
      url,
      title: url,
      reason: `fetch failed: ${(err as Error).message}`,
    };
  }

  let dom: JSDOMType;
  try {
    const { JSDOM } = await import("jsdom");
    dom = new JSDOM(html, { url });
  } catch (err) {
    return { kind: "bare", url, title: url, reason: `parse failed: ${(err as Error).message}` };
  }

  const docTitle = dom.window.document.title?.trim() || url;

  let article: {
    title?: string | null;
    byline?: string | null;
    excerpt?: string | null;
    content?: string | null;
  } | null;
  try {
    const { Readability } = await import("@mozilla/readability");
    article = new Readability(dom.window.document).parse();
  } catch (err) {
    return { kind: "bare", url, title: docTitle, reason: `readability threw: ${(err as Error).message}` };
  }

  if (!article || !article.content) {
    return { kind: "bare", url, title: docTitle, reason: "readability could not extract content" };
  }

  const turndown = await getTurndown();
  const markdown = turndown.turndown(article.content).trim();
  if (!markdown) {
    return { kind: "bare", url, title: article.title || docTitle, reason: "extracted content was empty" };
  }

  return {
    kind: "extracted",
    url,
    title: (article.title || docTitle).trim(),
    byline: article.byline?.trim() || undefined,
    excerpt: article.excerpt?.trim() || undefined,
    markdown,
  };
}

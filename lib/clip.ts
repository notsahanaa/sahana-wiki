import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

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

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

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

  let dom: JSDOM;
  try {
    dom = new JSDOM(html, { url });
  } catch (err) {
    return { kind: "bare", url, title: url, reason: `parse failed: ${(err as Error).message}` };
  }

  const docTitle = dom.window.document.title?.trim() || url;

  let article: ReturnType<Readability["parse"]>;
  try {
    article = new Readability(dom.window.document).parse();
  } catch (err) {
    return { kind: "bare", url, title: docTitle, reason: `readability threw: ${(err as Error).message}` };
  }

  if (!article || !article.content) {
    return { kind: "bare", url, title: docTitle, reason: "readability could not extract content" };
  }

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

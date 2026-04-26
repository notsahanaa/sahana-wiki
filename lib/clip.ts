// linkedom is ESM-native and small enough to import at module top.
// (We previously used jsdom, which crashed on Vercel because its
// transitive html-encoding-sniffer dep does require() of an ES module.)
//
// Readability and turndown stay lazy: turndown for warm-instance
// caching, readability for consistency.
import { parseHTML } from "linkedom";
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

  let document: Document;
  try {
    // Inject <base> so any relative links in the page resolve against url.
    // linkedom (unlike jsdom) doesn't take a baseURI option directly.
    const htmlWithBase = injectBase(html, url);
    document = parseHTML(htmlWithBase).document as unknown as Document;
  } catch (err) {
    return { kind: "bare", url, title: url, reason: `parse failed: ${(err as Error).message}` };
  }

  const docTitle = document.title?.trim() || url;

  let article: {
    title?: string | null;
    byline?: string | null;
    excerpt?: string | null;
    content?: string | null;
  } | null;
  try {
    const { Readability } = await import("@mozilla/readability");
    // Readability's typings expect lib.dom.d.ts Document; linkedom's
    // Document is structurally compatible at runtime. Cast is safe.
    article = new Readability(document).parse();
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

function injectBase(html: string, url: string): string {
  if (/<base\b[^>]*>/i.test(html)) return html;
  return html.replace(/<head\b[^>]*>/i, (m) => `${m}<base href="${escapeAttr(url)}">`);
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

# sahana-wiki — Adding Sources

A guide for using this wiki: how to feed it new material and what the LLM librarian does with what you give it.

## What this system is

This repo is two things at once:

1. A **personal wiki** — a folder of markdown that an LLM librarian (Claude) maintains.
2. A **Next.js app** that renders that markdown in a Farzapedia-style 3-column viewer.

The wiki content (`wiki/`, `sources/`, `inbox/`, `index.md`, `log.md`) is the primary product. Everything else exists to render it.

## The shape of a source

Every source lives in `sources/<slug>.md` as an **immutable** markdown file with frontmatter plus the captured content. The canonical example is `sources/karpathy-pkm-gist.md`:

```yaml
---
title: Karpathy's PKM Gist — "LLM Wiki: Personal Knowledge Base Pattern"
url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
date: 2026-02-14
summary: One-paragraph synopsis used in the source-card panel.
tags: [pkm, llm, knowledge-management]
---

# Title

…body content (clipped article text, your highlights, your notes)…
```

The `url`, `date`, and `summary` fields drive the right-side source panel that slides in when you click a `{{source:slug}}` highlight in the rendered wiki. The slug is just the filename minus `.md`.

## Two ways to add a web link (Stage 1, manual)

### Option A — drop into `inbox/` first, ingest later

Matches the documented workflow.

1. Save raw clips into `inbox/<slug>.md` with the frontmatter above.
2. Tell the assistant *"ingest the inbox"* and it will:
   - Read each file.
   - Decide which `wiki/*.md` pages to create or update.
   - Sprinkle `{{source:slug}}` highlights and `[[wikilinks]]`.
   - Move the file from `inbox/` into `sources/`.
   - Append a line to `log.md` and update `index.md`.

### Option B — paste links directly to the assistant

Fastest path. Paste URLs (with optional notes on why each one matters) and the assistant will:

1. Fetch each one via WebFetch.
2. Write the source file with proper frontmatter into `sources/`.
3. Run the ingest in the same pass — creating/updating wiki pages, log entry, index entry.

No `inbox/` round-trip needed since you're already in the conversation.

## What the assistant needs from you per link

- The **URL** (required).
- Optionally: a **title override**, **tags**, or a one-line *"why I saved this"* — otherwise it's inferred from the page.
- If a link is paywalled or login-gated, paste the text or a screenshot and the assistant treats it the same way.

## What ingest actually does

This is the "intelligent" part — the assistant doesn't just dump article text. Per link:

**1. Fetch & read.** Pulls the page via WebFetch and reads the actual content, not just the URL.

**2. Write the source file.** `sources/<slug>.md` gets created with:

- Frontmatter (`title`, `url`, `date`, `summary`, `tags`). The `summary` is a one-paragraph synopsis written from the article, used in the right-panel source card.
- Body containing the relevant clipped/condensed content plus structured notes — key claims, definitions, quotes worth grounding highlights on.

**3. Synthesize into the wiki.**

- Reads `index.md` to see what pages already exist.
- Decides which 1–15 `wiki/*.md` pages to create or update. One link about, say, a researcher might touch `people/<them>`, a `concepts/<their-idea>` page, and add a cross-ref on `projects/sahana-wiki` if relevant.
- Matches your existing voice — `wiki/people/andrej-karpathy.md` is the tonal anchor.
- Wraps phrases that came from this source in `{{source:<slug>}}…{{/source}}` so they render as clickable highlights tied back to the source card.
- Adds `[[wikilinks]]` to neighboring pages so the graph stays connected.

**4. Bookkeeping.**

- Updates `index.md` if new pages were created.
- Appends a one-line entry to `log.md`: `2026-04-25 ingested sources/<slug> → updated wiki/...`.

**5. Flags tensions.** If the new source contradicts or supersedes something already in the wiki, the assistant calls that out rather than silently overwriting — so you can decide.

## Things worth knowing up front

- **WebFetch is lossy.** It strips JS-rendered content, paywalls, some PDFs, and Twitter/X threads. If a fetch returns thin content, the assistant will say so and ask for a paste, a Nitter mirror, an archive.org link, or the raw text.
- **The assistant asks before big restructures.** If a link is so substantial it implies renaming pages or splitting categories, that surfaces as a question rather than a silent change.
- **Voice and depth are knobs.** Default register is the current Karpathy/Farzapedia one — concise, declarative, grounded in highlights. Want longer essays, terser stubs, or more/fewer highlights per page? Say so and the assistant adjusts.

## Batching

If you have a lot of links, paste them in batches. The assistant processes each batch end-to-end (fetch → source file → wiki updates → log → index) before starting the next.

If you want sources seeded but not yet woven into wiki pages — e.g., bulk-importing a reading list — say *"sources only"* and the per-page weaving is skipped until you're ready.

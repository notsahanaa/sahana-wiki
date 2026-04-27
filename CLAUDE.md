# Sahana Wiki — Schema & Workflows

This repo is **two things at once**:
1. A **personal wiki** — a folder of markdown that an LLM librarian (you, Claude) maintains.
2. A **Next.js app** that renders that markdown in a Farzapedia-style 3-column viewer.

When working in this repo, treat the wiki content (`/wiki/`, `/sources/`, `/inbox/`, `index.md`, `log.md`) as the *primary product*. The app code (`/app/`, `/components/`, `/lib/`) is the rendering surface for it.

## Repo layout

| Path | Purpose | Editable by |
|---|---|---|
| `wiki/` | Synthesized wiki pages (concepts, projects, books) | LLM librarian |
| `wiki/clusters.yml` | Cluster manifest — slugs, titles, descriptions for the sidebar's second-level grouping | LLM librarian |
| `wiki/concepts/clusters/` | Optional cluster pages (lazy — created only when a cluster earns its own prose) | LLM librarian |
| `sources/` | Immutable raw clips, papers, notes | Append-only |
| `inbox/` | Un-ingested captures from Slack/clipper (Stage 2+) | Auto-emptied during ingest |
| `index.md` | Content catalog: every wiki page by category, one-line summary | LLM librarian |
| `log.md` | Append-only chronological log of ingests/edits/queries | LLM librarian |
| `app/`, `components/`, `lib/` | Next.js viewer code | Sahana + assistant |
| `docs/stages/` | Roadmap & docs about the project | Sahana + assistant |

## Markdown conventions

- **Wikilinks:** `[[concepts/karpathy-pkm]]` or `[[Karpathy]]` — internal navigation between wiki pages. The renderer slugifies and routes to `/wiki/<path>`.
- **Source highlights:** `{{source:karpathy-pkm-gist}}some highlighted phrase{{/source}}` — phrases backed by a specific source. The renderer turns these into clickable highlights; clicking opens the right panel with the source card (date, summary, link).
- **No people pages.** Categories are `concepts/`, `projects/`, and `books/` only — never `wiki/people/`. People are attributed inline via `{{source:...}}` highlights and the source-card byline; their ideas live on the relevant concept or project page.
- **Frontmatter (YAML):**
  ```yaml
  ---
  title: LLM as Librarian
  category: concepts
  tags: [pkm, llm, pattern]
  clusters: [agentic-coding]
  created: 2026-04-25
  updated: 2026-04-25
  ---
  ```
  - `clusters` is an array. **First entry is the primary cluster** (canonical sidebar home). Additional entries echo the page under those clusters with a `↗` glyph.
  - Cluster slugs must exist in `wiki/clusters.yml`. Adding a slug not in the manifest drops the page into "Unsorted".
  - Concepts always declare clusters. Projects and books may omit `clusters` (they render flat).
- **Source files** also use frontmatter:
  ```yaml
  ---
  title: Karpathy's PKM Gist
  url: https://gist.github.com/karpathy/...
  date: 2026-02-14
  summary: One-paragraph synopsis used in the source-card panel.
  notes: |
    Optional. Sahana's own commentary captured alongside the URL via
    `/wiki-add <url> <notes>`. Renders at the bottom of the source card
    under a "Notes" heading. Omit when the user didn't add a note.
  ---
  ```
- **`/wiki-add` syntax:** `/wiki-add <text-or-url>` — a URL alone clips the page; trailing text after a URL is captured as the user's notes on that source. Both the extracted page and the notes are analyzed during synthesis, and the notes survive to the source's `notes:` frontmatter field.

## Workflows

### Ingest (Stage 0 manual / Stage 4 auto)

When a new source lands in `inbox/` or you (Sahana) say "I just read X, integrate it":
1. Read the source file.
2. Read `index.md` and `wiki/clusters.yml` to know what already exists and what clusters mean.
3. Decide which `wiki/*.md` pages to create or update (typically 5–15 pages touch on a single rich source).
4. For each updated page: keep voice consistent, add `{{source:slug}}` highlights wherever the new content is grounded in this source, add `[[wikilinks]]` to neighbors.
5. **Cluster decisions per page (concepts only):**
   - **Joins existing cluster(s):** add slugs to `clusters: [...]` in frontmatter. Multi-membership is fine and encouraged where it earns its keep. No manifest change.
   - **Expands a cluster meaningfully:** when an ingest pushes a cluster's scope (the existing `description:` no longer covers it), rewrite the description in `wiki/clusters.yml`. If the cluster has a page in `wiki/concepts/clusters/<slug>.md`, add a `{{source:...}}` highlight there.
   - **Creates a new cluster:** add an entry to `wiki/clusters.yml` with title + description. Use sparingly — prefer expanding an existing cluster over fragmenting.
6. Move the source from `inbox/` to `sources/` (Stage 4).
7. Append a one-line entry to `log.md`: `2026-04-25 ingested sources/<slug> → updated wiki/concepts/X, wiki/projects/Y`. Include cluster activity when relevant: `... → expanded cluster agentic-coding (added librarian sub-theme)`.
8. Update `index.md` if new pages were created (mirror cluster groupings).

### Query

When Sahana asks "what do my notes say about X?":
1. Search `index.md` first.
2. Read the relevant `wiki/*.md` pages.
3. Synthesize an answer, citing source slugs (`{{source:...}}`).
4. If the answer is substantial and reusable, file it back as a new wiki page or append to an existing one.

### Lint

When asked to audit the wiki:
1. Find contradictions between pages.
2. Find orphan pages (no inbound `[[wikilinks]]`).
3. Find missing cross-references (entities mentioned but not linked).
4. Find superseded claims (older statements contradicted by newer sources).
5. Suggest investigation areas.

## Stage of this project

Currently **Stage 1**: custom viewer working, no automation yet. Synthesis is conversational. See `docs/stages/roadmap.md` for the full plan.

## Important: Next.js 16 codebase

This is Next.js 16 (App Router). Some training-data assumptions are wrong:
- `params` in dynamic routes is now `Promise<...>` — must `await`.
- Default function timeout is 300s.
- Tailwind v4 uses `@import "tailwindcss"` not the old `@tailwind` directives.

When in doubt, check `node_modules/next/dist/docs/`.

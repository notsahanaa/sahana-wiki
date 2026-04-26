# Personal Wiki — Staged Roadmap

> Approved 2026-04-25. Source of truth: `~/.claude/plans/i-want-to-build-bubbly-starlight.md`. This copy lives in the repo for easy reference while building.

## Context

Build a personal knowledge base inspired by Karpathy's PKM pattern (LLM-as-librarian over a folder of markdown), evolving over time into a multi-surface system: Slack-driven capture, a Wikipedia/Farzapedia-style web viewer, agent-readable context for other AI tools, and eventually a hosted web app with Google-Keep-style note input.

The roadmap deliberately starts with Karpathy's raw setup (zero custom code) and adds capabilities in stages. **Each stage is independently useful and shippable.** Stop at whichever stage feels like enough.

Visual anchor: **Farzapedia / emrah.ca / "notes sobre el ahora"** — three-column layout. Left = nested topic tree with current topic highlighted. Center = Wikipedia-style article with internal `[[wikilinks]]` and inline source highlights (`{{source:slug}}...{{/source}}`). Right panel = hidden by default; opens on click of a source-highlight to show that source's date, summary, and link.

LLM cost picture for Stages 0–5 is **$0 extra** — uses the Claude Code subscription via `claude -p` headless invocation. Only Stage 6 (hosted web) requires switching to the Claude API; that swap is one function.

---

## Stage 0 — Raw Karpathy (validation, ~1 weekend)

Folder of markdown + Obsidian + Claude Code. Custom code: zero.
**Exit:** used daily 1–2 weeks; you know where the friction is.

## Stage 1 — Custom viewer (Farzapedia-style web UI) — *current*

Next.js + Tailwind + shadcn/ui. Reads markdown directly from `/wiki/` and `/sources/`. Three-column layout. `next dev` is your viewer. Synthesis still conversational in Claude Code.
**Exit:** you prefer this viewer over Obsidian.

## Stage 2 — Slack as capture surface

Slack Bolt app + `cloudflared tunnel`. DMs/links land in `/inbox/` as markdown. Slash commands list/page/open. Synthesis still manual.
**Exit:** capture friction gone.

## Stage 3 — Browser clipper

Bookmarklet or Chrome extension → `/api/clip` → cleaned markdown into `/inbox/`.
**Exit:** most input is non-manual.

## Stage 4 — Auto-on-save synthesis

Chokidar watches `/inbox/`, queues jobs, spawns `claude -p` with structured prompt to update wiki + log. Subscription-based, no API key.
**Exit:** a week with no manual triggers.

## Stage 5 — Wiki as agent context (your "Phase 2")

MCP server: `list_topics`, `get_page`, `search`, `get_sources_for`, `get_recent_log`. Other agents (openclaw, blog writer, twitter writer, lab agents) wire it in.
**Exit:** another agent measurably improves from reading the wiki.

## Stage 6 — Hosted web app (your "Phase 3")

Vercel deploy, Clerk single-user auth, Vercel Blob storage, Anthropic SDK with prompt caching, Keep-style card input UI in the web app. Slack/clipper repoint to hosted URL.
**Exit:** lose your laptop and still have access.

## Stage 7 — (Optional) Public Farzapedia mode

Per-page visibility flag, public reads, auth-gated writes, permalinks/SEO.
**Exit:** a stranger finds value in something on your wiki.

---

## Tech defaults (locked at Stage 1)

- **Stack:** Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn-style components
- **Markdown:** `react-markdown` + `remark-gfm` + `rehype-raw` + custom transforms for `[[wikilinks]]` and `{{source:slug}}...{{/source}}`
- **LLM (Stages 4–5):** `claude -p` subprocess (Claude Code subscription)
- **LLM (Stage 6+):** `@anthropic-ai/sdk` with prompt caching
- **Slack:** `@slack/bolt` + `cloudflared tunnel`
- **File watcher (Stage 4):** `chokidar`
- **Auth (Stage 6):** Clerk single-user
- **Hosting (Stage 6):** Vercel + Vercel Blob

## Repo layout

```
sahana-wiki/
├── CLAUDE.md             # schema + workflow for the librarian LLM
├── index.md              # nav catalog (LLM-maintained)
├── log.md                # append-only ingest/edit log
├── wiki/                 # LLM-managed wiki pages
├── sources/              # immutable raw clips/notes
├── inbox/                # un-ingested captures (Stage 2+)
├── docs/stages/          # this file
├── app/                  # Next.js viewer
├── components/
└── lib/
```

## Explicit non-goals

No mobile app. No multi-user collab. No real-time collab editing. No native desktop app. No vector DB until search becomes a felt need (revisit at Stage 5). No backwards-compatibility shims when migrating Stage 4 → Stage 6 synthesis.

## Verification per stage

| Stage | Test |
|---|---|
| 0 | Ingest 3 sources via Claude Code, see linked graph in Obsidian |
| 1 | `next dev`, click left tree, click `[[wikilink]]`, click `{{source:...}}` highlight, see right panel populate |
| 2 | DM Slack bot, see `/inbox/` file appear within 2s |
| 3 | Bookmarklet on a real article → cleaned markdown in `/inbox/` |
| 4 | Drop file in `/inbox/`, return to find updated `/wiki/*.md` and `log.md` entry |
| 5 | Another agent calls the MCP server, returns real content |
| 6 | Deploy, log in from phone, add a card, see ingestion |
| 7 | Public page URL viewable without auth |

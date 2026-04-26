---
title: sahana-wiki (this project)
category: projects
tags: [project, pkm, in-progress]
created: 2026-04-25
updated: 2026-04-26
---

# sahana-wiki

This wiki itself. A staged personal knowledge base inspired by Andrej Karpathy's {{source:karpathy-pkm-gist}}LLM-PKM pattern{{/source}}, with a custom Farzapedia-style web viewer instead of Obsidian and a progression toward Slack capture, browser clipping, automatic synthesis, and agent-readable APIs.

## Current stage

**Stage 2** — Slack capture, deployed on Vercel. Next.js 16, Tailwind v4, three-column layout. Live at `https://sahana-wiki.vercel.app`. Slash commands `/wiki-commands`, `/wiki-list`, `/wiki-dive`, `/wiki-add` ship from `#wiki`; captures commit straight to GitHub via the Contents API and trigger an auto-redeploy. Synthesis (turning inbox files into wiki pages) is still conversational — that's Stage 4. `/wiki-qna` waits for Stage 4 too.

## Visual reference

The viewer mimics {{source:farzapedia-screenshot}}Farzapedia and similar personal encyclopedias{{/source}}: categorized left sidebar listing every page, Wikipedia-style center article, plus a right-side **source panel** that opens on click of a `{{source:...}}` highlight.

## What's now in the wiki

The wiki started as an aggregator of *external* sources (Karpathy, Shipper, Klaassen, Parrott — all Every-orbit thinkers). As of {{source:sahana-paradigms-agent-space-2026-04-12}}Sahana's first essay capture from her *paradigms* newsletter on April 12, 2026{{/source}}, it also hosts her own writing as primary source material — and the concept pages [[concepts/hypercreativity]], [[concepts/one-person-studios]], [[concepts/taste-as-skill]], and [[concepts/super-porous-ecosystem]] are all extracted from that essay. The wiki is now both a librarian artifact *and* a publishing surface for the curator.

## Architectural lineage

This project sits at the intersection of three patterns:

- [[concepts/llm-as-librarian]] — Karpathy's PKM gist (one human curator, one LLM librarian, a folder of markdown).
- [[concepts/folder-is-the-agent]] — Klaassen's framing that {{source:klaassen-folder-is-the-agent}}*"a model with enough context"* is itself the agent{{/source}}. The repo's `CLAUDE.md`, `docs/`, and the wiki content together form one folder-agent.
- [[concepts/agent-native]] — Shipper and Claude's principles (parity, granularity, composability). The wiki is files-as-interface by design, which makes it {{source:every-agent-native-guide}}*"more transparent — users can always inspect them"*{{/source}} and lets a future agent gain parity with no extra tool surface.

## Roadmap

See [[../../docs/stages/roadmap]] for the full 8-stage plan (Stage 0 through Stage 7).

## Tech (Stage 1)

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- `react-markdown` + `remark-gfm` + `rehype-raw`
- `gray-matter` for frontmatter
- Markdown files at the repo root in `wiki/` and `sources/` are the source of truth — no DB

## Related

- [[concepts/llm-as-librarian]]
- [[concepts/folder-is-the-agent]]
- [[concepts/agent-native]]
- [[concepts/personal-knowledge-management]]

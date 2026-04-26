---
title: sahana-wiki (this project)
category: projects
tags: [project, pkm, in-progress]
created: 2026-04-25
updated: 2026-04-25
---

# sahana-wiki

This wiki itself. A staged personal knowledge base inspired by [[people/andrej-karpathy]]'s {{source:karpathy-pkm-gist}}LLM-PKM pattern{{/source}}, with a custom Farzapedia-style web viewer instead of Obsidian and a progression toward Slack capture, browser clipping, automatic synthesis, and agent-readable APIs.

## Current stage

**Stage 1** — Custom viewer. Next.js 16, Tailwind v4, three-column layout. Synthesis is still conversational (you tell Claude in this repo to integrate a source, it edits the markdown). No Slack, no automation, no deploy yet.

## Visual reference

The viewer mimics {{source:farzapedia-screenshot}}Farzapedia and similar personal encyclopedias{{/source}}: categorized left sidebar listing every page, Wikipedia-style center article, plus a right-side **source panel** that opens on click of a `{{source:...}}` highlight.

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
- [[people/andrej-karpathy]]
- [[people/kieran-klaassen]]

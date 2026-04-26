---
title: Karpathy's PKM Gist — "LLM Wiki: Personal Knowledge Base Pattern"
url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
date: 2026-02-14
summary: Andrej Karpathy's gist describing a pattern for using an LLM as a librarian over a folder of markdown files. The LLM ingests sources, maintains entity/concept pages, flags contradictions, and is browsed in Obsidian. The pattern is intentionally a blueprint, not a prescription.
tags: [pkm, llm, knowledge-management]
---

# Karpathy's PKM Gist

## Core idea

Build a persistent, AI-maintained knowledge base that **accumulates and synthesizes** information rather than re-deriving it on each query. The LLM acts as a librarian maintaining structured markdown files while the human curates sources and asks questions.

## Three layers in the wiki folder

1. **Raw sources** (immutable) — articles, papers, PDFs stored unchanged.
2. **Wiki layer** (LLM-edited) — entity pages, concept pages, comparisons, summaries.
3. **Schema doc** (`CLAUDE.md` or `AGENTS.md`) — tells the LLM how the wiki is structured and what workflows to follow.

## Two index files

- `index.md` — content-oriented catalog of all pages by category, with one-line summaries.
- `log.md` — append-only chronological record of ingests, queries, and maintenance.

## Tooling Karpathy uses

- **Markdown** for all wiki content
- **Obsidian** as the IDE (graph view, wikilinks)
- **Git** for version control
- Optional: `qmd` (BM25 + vector search), Obsidian Web Clipper, Marp (slides), Dataview plugin

## Three workflows

- **Ingest:** add a source → LLM reads it, updates 5–15 wiki pages, notes contradictions
- **Query:** ask questions → LLM searches index, reads pages, synthesizes answer with citations; good answers get filed back
- **Lint:** periodic health check → LLM finds contradictions, orphans, missing cross-references

## Daily flow (in Karpathy's words)

> "LLM agent open on one side and Obsidian open on the other. The LLM makes edits based on our conversation, and I browse the results in real time."

## What's notably absent

No web app, no Slack, no auto-on-save synthesis, no custom UI, no deploy. Synthesis happens because he asks for it in chat, not on a trigger.

## Why this matters for `sahana-wiki`

This source is the **direct inspiration** for the project. Stage 0 of the roadmap is essentially a literal implementation of Karpathy's pattern. Later stages add a custom viewer (Stage 1), Slack capture (Stage 2), browser clipper (Stage 3), automation (Stage 4), agent context (Stage 5), hosted deploy (Stage 6), and optional public mode (Stage 7).

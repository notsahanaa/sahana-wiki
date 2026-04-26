---
title: LLM as Librarian
category: concepts
tags: [pkm, llm, pattern]
created: 2026-04-25
updated: 2026-04-25
---

# LLM as Librarian

A pattern for personal knowledge management where an LLM agent maintains a folder of markdown files on behalf of a human curator. Articulated by [[people/andrej-karpathy]] in his {{source:karpathy-pkm-gist}}PKM gist{{/source}}.

## The division of labor

| Human does | LLM does |
|---|---|
| Curates sources (decides what to read) | Reads sources |
| Asks questions | Searches, synthesizes, cites |
| Defines schema (what kinds of pages exist) | Files findings into the right pages |
| Reviews periodically | Notes contradictions, flags orphans |

The human owns *taste* and *direction*. The LLM owns *bookkeeping* and *synthesis*.

## Three layers in the wiki

1. **Raw sources** — immutable. Articles, papers, transcripts. Never edited after capture.
2. **Wiki layer** — LLM-edited. Entity pages, concept pages, summaries. Cross-linked.
3. **Schema doc** (`CLAUDE.md`) — tells the LLM how the wiki is structured.

## Three workflows

- **Ingest** — new source → LLM updates 5–15 wiki pages.
- **Query** — question → LLM searches index, synthesizes answer with citations; good answers get filed back as new pages.
- **Lint** — audit → LLM finds contradictions, orphans, missing cross-references, superseded claims.

## How `sahana-wiki` extends this

The pure pattern uses Obsidian as the viewer and Claude Code as the editor. {{source:farzapedia-screenshot}}This project adds a custom Wikipedia-style web viewer{{/source}}, then progressively adds Slack capture, a browser clipper, automatic synthesis, agent-readable APIs, and a hosted deploy. See [[projects/sahana-wiki]].

## Related

- [[concepts/personal-knowledge-management]]
- [[people/andrej-karpathy]]
- [[projects/sahana-wiki]]

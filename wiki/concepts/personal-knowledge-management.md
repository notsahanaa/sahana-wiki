---
title: Personal Knowledge Management
category: concepts
tags: [pkm, productivity, knowledge]
created: 2026-04-25
updated: 2026-04-25
---

# Personal Knowledge Management

The practice of capturing, organizing, and synthesizing one's own knowledge over time. Often shortened to **PKM**.

## The core problem

Most people consume far more information than they retain. Articles read once and forgotten. Insights from books that fade in months. Conversations with experts whose key points blur together. PKM tools and practices try to make consumed information durable and searchable.

## Common patterns

- **Zettelkasten** — atomic notes with bidirectional links (Niklas Luhmann's index-card method, popularized digitally by Roam, Obsidian, Logseq).
- **Tag-based** — Evernote, Bear, Apple Notes; flat collections searched by keyword.
- **Folder-based** — classic file-tree organization.
- **Hybrid** — most modern tools mix these.

## What's new with LLMs

Until recently, organization and synthesis were the human's job. The friction of *maintaining* a PKM was high enough that many systems collapse from neglect. With LLMs that can read, write, and reason about a folder of markdown, much of that maintenance can be offloaded.

[[people/andrej-karpathy]] articulates this most clearly in his {{source:karpathy-pkm-gist}}LLM-as-librarian gist{{/source}}: the human curates sources and asks questions; the LLM maintains the structure.

## Related

- [[concepts/llm-as-librarian]]
- [[concepts/folder-is-the-agent]] — the same insight applied to code repos
- [[concepts/agent-native]] — broader software-architecture frame
- [[projects/sahana-wiki]]

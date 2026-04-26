---
title: Monologue
category: projects
tags: [monologue, every, agent-native, read-later]
created: 2026-04-25
updated: 2026-04-25
---

# Monologue

Every's read-later service (`monologue.to`), run by Naveen Naidu. Comparable to Pocket or Instapaper, but architected differently in the way that matters most for this wiki: it uses a {{source:parrott-four-apps}}folder-based filesystem instead of a traditional database{{/source}}.

## Why it matters

Monologue is the simplest production proof-point for the {{source:every-agent-native-guide}}*"files for legibility, databases for structure — when in doubt, files"*{{/source}} principle. The same agent-native logic that makes a librarian-style markdown wiki tractable makes a folder-backed read-later app tractable.

## Two roles in Every's stack

It's also the **brain-dump tool** Every staff use to talk-to-text into agents. Austin Tedesco's workflow for the {{source:parrott-25-person-four-agents}}campaign reporter agent{{/source}}: brain-dump intent into Monologue → Claude Code builds the DB and pipeline → paste results into Notion → refine when numbers were wrong.

## Related

- [[concepts/agent-native]] — Monologue is a clean instance of the principles
- [[concepts/folder-is-the-agent]] — same pattern, consumer-app surface
- [[projects/every]]
- [[projects/sahana-wiki]] — uses the same files-not-DB choice

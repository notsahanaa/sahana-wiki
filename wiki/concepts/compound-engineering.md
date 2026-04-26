---
title: Compound Engineering
category: concepts
tags: [agent-native, methodology, claude-code]
created: 2026-04-25
updated: 2026-04-25
---

# Compound Engineering

A methodology by Kieran Klaassen for stacking agent-driven workflows so each project's accumulated context (docs, runbooks, sub-agents) compounds across future work. Open-source as `EveryInc/compound-engineering-plugin` (14k+ GitHub stars per the {{source:klaassen-folder-is-the-agent}}folder-is-the-agent essay{{/source}}).

## Connection to folder-as-agent

Compound engineering is the practical scaffold for the [[concepts/folder-is-the-agent]] pattern. Each folder-agent's institutional knowledge feeds the next one; specialized sub-agents (reviewer, planner, component-creator) get refined and ported across projects.

Klaassen runs **44 folder-agents** in production, with Opus 4.6 as the primary model and a custom dispatch layer routing tasks. Trevin Chow is a frequent collaborator on extending the methodology.

## Reach beyond engineering

An upcoming **Compound Engineering Camp** (April 17, mentioned in the {{source:klaassen-folder-is-the-agent}}essay's closing context note{{/source}}) extends the methodology beyond engineering to product managers and founders.

## Worked example: writing

The most concrete non-engineering port is {{source:parrott-board-games-and-ai}}Katie Parrott's writing system{{/source}}. She studied Klaassen's plugin "as a teach" — using board-game vocabulary (components, moves, sequencing, victory conditions) to dissolve the paralysis of staring at a vast technology — and translated:

- Rails reviewer → developmental editor
- Security auditor → fact-checker

Her pipeline runs **brainstorm → interview → outline → draft → review** with specialized critic personas ({{source:parrott-writing-with-ai-harder}}including ones named "Mom," "Hemingway," and "Asshole"{{/source}}), each tuned to one weakness. She also splits **defaults** (baseline standards everyone gets) from **taste** (per-user preferences the engine learns) so the system grows smarter without contaminating other users' profiles. The compounding claim is explicit: {{source:parrott-board-games-and-ai}}*each piece of writing makes the next easier*{{/source}}.

This is also the rebuttal to the discourse that AI-assisted writing equals less thinking — see [[concepts/taste-as-skill]] and {{source:parrott-writing-with-ai-harder}}*"Writing With AI Is Harder Than You Think"*{{/source}}.

## The board-games framing

Worth lifting independently: {{source:parrott-board-games-and-ai}}*"What are the pieces, and what do they do?"*{{/source}} is a usable opener for any compound-engineering project. Inventory components → understand legal moves → notice how moves compound → name the win condition. {{source:parrott-board-games-and-ai}}*"The engine only reveals its flaws when I actually play"*{{/source}} is the reminder that play (real drafts, real bugs, real ingest) is the only way to find them.

## Related

- [[concepts/folder-is-the-agent]] — the architectural pattern this methodology operationalizes
- [[concepts/agent-native]] — the broader framework
- [[concepts/taste-as-skill]] — what compound systems should encode and exercise
- [[concepts/ai-autopilot]] — the failure the panel-of-critics defends against
- [[projects/cora]] — the original codebase the methodology came from (Kieran Klaassen, GM)

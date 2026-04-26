---
title: Compound Engineering
category: concepts
tags: [agent-native, methodology, claude-code]
created: 2026-04-25
updated: 2026-04-25
---

# Compound Engineering

A methodology by [[people/kieran-klaassen]] for stacking agent-driven workflows so each project's accumulated context (docs, runbooks, sub-agents) compounds across future work. Open-source as `EveryInc/compound-engineering-plugin` (14k+ GitHub stars per the {{source:klaassen-folder-is-the-agent}}folder-is-the-agent essay{{/source}}).

## Connection to folder-as-agent

Compound engineering is the practical scaffold for the [[concepts/folder-is-the-agent]] pattern. Each folder-agent's institutional knowledge feeds the next one; specialized sub-agents (reviewer, planner, component-creator) get refined and ported across projects.

Klaassen runs **44 folder-agents** in production, with Opus 4.6 as the primary model and a custom dispatch layer routing tasks. Trevin Chow is a frequent collaborator on extending the methodology.

## Reach beyond engineering

An upcoming **Compound Engineering Camp** (April 17, mentioned in the {{source:klaassen-folder-is-the-agent}}essay's closing context note{{/source}}) extends the methodology beyond engineering to product managers and founders.

## Related

- [[concepts/folder-is-the-agent]] — the architectural pattern this methodology operationalizes
- [[concepts/agent-native]] — the broader framework
- [[people/kieran-klaassen]] — creator
- [[projects/cora]] — the original codebase the methodology came from

---
title: Kieran Klaassen
category: people
tags: [agent-native, cora, compound-engineering, every]
created: 2026-04-25
updated: 2026-04-25
---

# Kieran Klaassen

GM of [[projects/cora]] (Every's AI email assistant) and creator of [[concepts/compound-engineering]]. Originator of the {{source:klaassen-folder-is-the-agent}}"folder is the agent" framing{{/source}} — the engineering-side cousin of [[people/andrej-karpathy]]'s PKM gist.

## The folder-as-agent insight

After three months trying to coordinate agent swarms, Klaassen concluded the bottleneck wasn't agent throughput but {{source:klaassen-folder-is-the-agent}}"AI agents don't have a speed limit, but the person managing them still does."{{/source}} His pivot: instead of orchestrating many agents, give one model rich enough context to act as a specialist. {{source:klaassen-folder-is-the-agent}}"An agent is much simpler: a model with enough context so you don't have to re-explain everything each time you open the chat."{{/source}}

See [[concepts/folder-is-the-agent]] for the pattern.

## Cora's structure

The Cora repo is the canonical folder-agent: a `CLAUDE.md` for conventions, `docs/` for institutional knowledge (architecture, runbooks, investigation logs), and `.claude/agents/` for specialized sub-agents. {{source:klaassen-folder-is-the-agent}}New agent sessions follow a fixed reading order: CLAUDE.md → architecture → assistant report → component creator.{{/source}}

He runs **44 folder-agents** across multiple projects, with Opus 4.6 as the primary model and a custom dispatch layer routing tasks between them.

## Compound engineering

Klaassen's open-source methodology (`EveryInc/compound-engineering-plugin`, 14k+ GitHub stars) for stacking agent-driven workflows. See [[concepts/compound-engineering]].

## Related

- [[projects/cora]] — the email product he runs
- [[concepts/folder-is-the-agent]] — the pattern he named
- [[concepts/compound-engineering]] — his methodology
- [[people/dan-shipper]] — Every founder
- [[concepts/llm-as-librarian]] — the same idea from the PKM angle

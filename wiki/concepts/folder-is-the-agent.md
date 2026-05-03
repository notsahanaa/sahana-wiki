---
title: The Folder Is the Agent
category: concepts
tags:
  - agent-native
  - claude-code
  - pattern
cluster: agentic-ai-parts
created: '2026-04-25'
updated: '2026-05-03'
---

# The Folder Is the Agent

A pattern named by Kieran Klaassen in his {{source:klaassen-folder-is-the-agent}}essay of the same title{{/source}}: a well-structured project folder containing code, docs, runbooks, and a `CLAUDE.md` instructions file *is* an effective AI agent. No orchestration framework needed.

> {{source:klaassen-folder-is-the-agent}}*"The context that this folder gives an AI model makes the generalized model a specialist in whatever task or field you want it to excel in."*{{/source}}

## The failure that produced it

Klaassen spent three months trying to coordinate agent swarms — Claude Code teams, dispatch systems, orchestration frameworks. The failure mode wasn't technical; it was human.

> {{source:klaassen-folder-is-the-agent}}*"AI agents don't have a speed limit, but the person managing them still does."*{{/source}}

The bottleneck is the reviewer, not the worker. So instead of multiplying workers, multiply context.

## What an agent actually is

> {{source:klaassen-folder-is-the-agent}}*"An agent is much simpler: a model with enough context so you don't have to re-explain everything each time you open the chat."*{{/source}}

Context, not orchestration, is the unit of leverage.

## Anatomy

A folder-agent has:

1. **CLAUDE.md / AGENT.md** — conventions, working style, guardrails.
2. **Institutional knowledge** — architecture docs, system design, pipeline specs.
3. **Operational memory** — runbooks, investigation logs.
4. **Specialized sub-agents** — `.claude/agents/` definitions (reviewers, planners, component creators).

{{source:klaassen-folder-is-the-agent}}Cora's actual layout is the canonical reference: CLAUDE.md, docs/developer-docs/, docs/runbooks/, docs/investigations/, .claude/agents/.{{/source}} New agent sessions follow a fixed reading order so they always boot up the same way.

## "Taste" transfer

The folder captures not just facts but {{source:klaassen-folder-is-the-agent}}personality, knowledge, and aesthetic preferences — what Klaassen calls "taste"{{/source}}. New model instances inherit it without retraining or re-prompting.

## Skills, before they were Skills

{{source:klaassen-folder-is-the-agent}}Devs were already using markdown instruction files in project directories long before Anthropic formalized "Skills"{{/source}} as a primitive. Folder-as-agent is the same idea, generalized.

## Relationship to other patterns

| Pattern | Folder is | Used by |
|---|---|---|
| [[concepts/llm-as-librarian]] | A markdown wiki of sources + entity pages | Andrej Karpathy, [[projects/sahana-wiki]] |
| Folder is the agent | A code repo + docs + runbooks | Kieran Klaassen, [[projects/cora]] |
| [[concepts/compound-engineering]] | A composable plugin scaffold | Kieran Klaassen |
| `SOUL.md` (one per user) | A persistent personality + memory file for a Claw | [[projects/openclaw]] (Peter Steinberger) |

All four are the same insight in different domains: **rich shared context beats clever orchestration**. {{source:every-claw-school-guide}}OpenClaw's `SOUL.md`{{/source}} is the variant scoped to a *person* rather than a project — the operational form of the [[concepts/one-person-studios]] *clones-not-employees* idea.

## Why this matters for `sahana-wiki`

`sahana-wiki` is itself a folder-agent: `CLAUDE.md` is the schema doc, `docs/` is the institutional knowledge, the wiki content is operational memory, and the librarian behaviors (ingest/query/lint) are sub-agent personalities. The whole repo is an agent — see [[projects/sahana-wiki]].

## Related

- [[concepts/llm-as-librarian]]
- [[concepts/agent-native]]
- [[concepts/compound-engineering]]
- [[projects/cora]] — Kieran Klaassen's codebase, the canonical reference
- [[projects/openclaw]] — `SOUL.md` is this pattern, scoped to a person

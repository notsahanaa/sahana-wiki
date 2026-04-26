---
title: The Folder Is the Agent
url: https://every.to/source-code/the-folder-is-the-agent
date: 2026-04-13
summary: Kieran Klaassen (Cora GM) on how a well-structured project folder containing code, docs, and CLAUDE.md instructions functions as an effective AI agent — making complex multi-agent orchestration unnecessary. After three months trying agent swarms, he concluded "AI agents don't have a speed limit, but the person managing them still does."
tags: [agent-native, folder-is-the-agent, compound-engineering, kieran-klaassen, cora, claude-code]
---

# The Folder Is the Agent

By **Kieran Klaassen**, GM of Cora. Every Source Code, April 13 2026 (updated April 25 2026).

## Thesis

You don't need agent swarms. *"The context that this folder gives an AI model makes the generalized model a specialist in whatever task or field you want it to excel in."* A well-structured folder = an agent.

## The failed swarm experiment

Three months coordinating multiple agents — Claude Code teams, agent-dispatching systems, orchestration frameworks. Conclusion: managing 10 agents simultaneously exceeds human evaluation capacity. The bottleneck isn't agent throughput; it's the human reviewer.

> *"AI agents don't have a speed limit, but the person managing them still does."*

## What an agent actually is

> *"An agent is much simpler: a model with enough context so you don't have to re-explain everything each time you open the chat."*

Context, not orchestration, is the unit of leverage.

## Anatomy of a folder-agent

Components:

1. **CLAUDE.md / AGENT.md** — conventions, working style, guardrails.
2. **Institutional knowledge** — `docs/developer-docs/`, architecture reports, system design, pipeline specs.
3. **Operational memory** — runbooks, investigation logs from real incidents.
4. **Specialized sub-agents** — `.claude/agents/` definitions (reviewers, planners, component creators).

## Cora's actual structure

```
~/cora/
  CLAUDE.md                    (conventions, Rails patterns, deploy)
  docs/developer-docs/         (architecture, pipeline specs)
  docs/runbooks/               (operational patterns)
  docs/investigations/         (incident learnings)
  .claude/agents/              (specialized agent definitions)
```

**Reading-order protocol** for new agent sessions: `CLAUDE.md → architecture doc → assistant system report → assistant prompt → component-creator agent`.

## Scale

- **44 folder-agents** across multiple projects
- Models: **Opus 4.6 (primary)**, GPT 5.4, Gemini Pro 3.1
- Custom dispatch layer routes tasks between specialized folders

## "Taste" transfer

The folder captures not just knowledge but personality and aesthetic — what Klaassen calls *"taste"* — so new model instances stay consistent with established patterns.

## Skills, before they were Skills

Klaassen notes that developers were already using markdown instruction files in project directories long before Anthropic formalized the **Skills** primitive. Folder-as-agent is the same idea, generalized.

## People & products

- **Kieran Klaassen** — author, Cora GM, creator of *compound engineering* (open-source plugin: `EveryInc/compound-engineering-plugin`, 14k+ GitHub stars)
- **Trevin Chow** — collaborator on compound engineering workflows
- **Cora** — Every's AI email assistant
- Other Every products: Spiral, Sparkle, Monologue
- Upcoming: **Compound Engineering Camp** (April 17, for Every subscribers)

## Why this matters for `sahana-wiki`

This source is a near-direct cousin of the Karpathy gist — same pattern (folder + markdown + LLM agent), framed from the engineering side rather than the PKM side. `sahana-wiki` is itself a folder-agent: `CLAUDE.md` is the schema doc, `docs/` is the institutional knowledge, the wiki content is operational memory. The whole repo is an agent.

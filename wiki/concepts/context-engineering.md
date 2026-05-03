---
title: Context Engineering
category: concepts
tags: [context, agentic-search, rag, harness, vector-search]
cluster: agentic-ai-parts
created: 2026-05-03
updated: 2026-05-03
---

# Context Engineering

{{source:2026-05-03-0119-agentic-search-ai-dev-con-2026-note}}Most AI failures today are not reasoning failures; they are context failures.{{/source}} LLMs are stateless — they know nothing about your org's data, customers, or operational history until something puts that information in front of them. *Context engineering* is the discipline of deciding what gets in front of the model, where it comes from, and when.

## AI = context + reasoning

A useful reduction: an agent is doing two things at any moment.

- **Reading context** — what should I reference right now?
- **Writing context** — where should I store what I just learned?

{{source:2026-05-03-0119-agentic-search-ai-dev-con-2026-note}}Throwing everything into one context leads to context rot.{{/source}} The job of context engineering is to keep the read/write surface clean.

## Context engineering vs. harness engineering

Two layers, often conflated:

- **Context engineering** — the *human* designs what context the agent gets: prompts, retrieval policy, tool surface, memory shape.
- **Harness engineering** — the *harness* (the [[concepts/agent-anatomy]] runtime) does the engineering at runtime: assembling, compressing, retrieving, routing.

The boundary moves over time. As harnesses get smarter, more of what was hand-tuned context engineering becomes automated harness behavior. The architectural choice is which decisions to push into the harness and which to keep in human hands.

## What context engineering involves

The components a working system has to assemble, per {{source:2026-05-03-0119-agentic-search-ai-dev-con-2026-note}}AI Dev Con 2026{{/source}}:

- User prompt
- System prompt
- Compressed history
- Environment state
- Available tools
- Memory system
- Agent-to-agent

This is the {{source:2026-05-03-0130-the-three-components-of-an-agent-note}}runtime layer{{/source}} of [[concepts/agent-anatomy]] viewed from the data side: what the model sees on each turn.

## Agentic search across complexity × info

Agentic search has to span two axes:

|              | **Simple info** (10-page PDF) | **Lots of info** (whole-company data) |
|---|---|---|
| **Simple query** ("capital of India")           | direct lookup | indexed retrieval |
| **Complex query** ("our next strategic move?")  | reasoning over a small corpus | multi-hop search + reasoning at scale |

{{source:2026-05-03-0119-agentic-search-ai-dev-con-2026-note}}Vector similarity search makes scale possible{{/source}}, but where the search runs is now an architectural decision: {{source:2026-05-03-0119-agentic-search-ai-dev-con-2026-note}}for enterprises, pushing agentic search closer to the database is more powerful and saves on costs{{/source}} — fewer round-trips, less data movement, native authorization boundaries.

## The continuous-context prediction

Two predictions worth tracking, from the same talk:

1. **Context becomes continuous, not reset.** {{source:2026-05-03-0119-agentic-search-ai-dev-con-2026-note}}Push and pull, continuously steer{{/source}} — instead of starting fresh each turn.
2. **Continual learning lives in context.** {{source:2026-05-03-0119-agentic-search-ai-dev-con-2026-note}}Weights and knowledge will live in context{{/source}} rather than (only) in the model's parameters. If true, "fine-tuning" becomes more about shaping the harness than retraining the model.

## Where this connects in the wiki

- [[concepts/agent-anatomy]] — context engineering is the runtime's primary responsibility.
- [[concepts/folder-is-the-agent]] — the folder *is* a context-engineering pattern: the file tree is the retrieval surface.
- [[concepts/llm-as-librarian]] — wiki-as-context: the librarian's job is to keep the retrieval surface coherent.
- [[concepts/agent-native]] — second-wave reliability concerns (regulatory, latency, data gravity) are downstream of where context lives.

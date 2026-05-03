---
title: Agent Anatomy — Model, Runtime, Tools
category: concepts
tags: [agent, architecture, runtime, tools, mcp]
cluster: agentic-ai-parts
created: 2026-05-03
updated: 2026-05-03
---

# Agent Anatomy — Model, Runtime, Tools

{{source:2026-05-03-0130-the-three-components-of-an-agent-note}}An agent is not just a model. It is a model inside a system with three distinct parts.{{/source}}

## 1. Model

The reasoning and language engine: decides what to do next. Examples span the full ecosystem — {{source:2026-05-03-0130-the-three-components-of-an-agent-note}}Gemma 4, Qwen, Kimi, MiniMax, and open-weight GPT variants{{/source}} — making the model the most swappable layer of the three.

## 2. Runtime

{{source:2026-05-03-0130-the-three-components-of-an-agent-note}}Manages the loop, context, tool calls, retries, and state.{{/source}} Responsibilities include:

- Prompt assembly
- Tool execution
- Guardrails and recovery
- Integration layer

The runtime is where most of the architectural decisions live: how context is assembled, when to retry, and how failures are surfaced. [[concepts/folder-is-the-agent]] argues that a well-structured folder *is* an effective runtime — context, not orchestration framework, is the unit of leverage. The data side of the runtime — what the model sees on each turn, and where it comes from — is its own discipline: [[concepts/context-engineering]].

## 3. Tools

{{source:2026-05-03-0130-the-three-components-of-an-agent-note}}The external capabilities an agent can call: MCP servers, APIs and CLIs, code execution environments, and custom tools.{{/source}}

MCP (Model Context Protocol) is rapidly becoming the standard interface for wiring tools to runtimes, and appears in [[concepts/super-porous-ecosystem]] as a signal of the composable, swappable atom-economy.

## Why the distinction matters

Conflating "model" with "agent" obscures where capability actually lives. A stronger model improves step 1; better runtime design improves reliability and cost across all steps; richer tools expand what's possible in step 3. Optimizing only the model while ignoring runtime and tools is a common failure mode.

See also:
- [[concepts/context-engineering]] — what the runtime actually engineers
- [[concepts/folder-is-the-agent]] — the folder as runtime
- [[concepts/agent-native]] — software architected for agents as first-class citizens
- [[concepts/agent-native-office]] — runtime concerns (durability, sandbox, eval) at org scale
- [[concepts/compound-engineering]] — stacking folder-agents into reusable scaffolds

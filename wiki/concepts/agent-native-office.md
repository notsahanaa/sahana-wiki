---
title: Agent-Native Office
category: concepts
tags:
  - agent-ops
  - internal-agents
  - mcp
  - observability
  - multiplayer
cluster: agentic-coding
created: '2026-05-03'
updated: '2026-05-06'
---

# Agent-Native Office

What it looks like when an organization runs internal agents the way it runs internal software — continuously, in production, with their own users (other agents) and their own ops surface. From {{source:2026-05-03-0145-agent-native-office-how-do-you-note}}AI Dev Con 2026 — "How do you build and deploy internal agents at your office continuously?"{{/source}}.

## The 2025 → 2026 shift

{{source:2026-05-03-0145-agent-native-office-how-do-you-note}}Building an agent (2025) is easy. Operating one at prod level (2026) isn't.{{/source}} The same shift Sahana's other AI Dev Con notes call the {{source:ai-dev-con-2026-observations}}second wave — from *what is possible* to *what is reliable and secure at scale*{{/source}}, applied specifically to **internal** agents.

## Agents are the new users

The reframing that drives most of the design choices below: {{source:2026-05-03-0145-agent-native-office-how-do-you-note}}agent experience — agents are the new users.{{/source}} Internal tools should be designed to be operated by agents, not just by humans clicking through a GUI. Concretely:

- {{source:2026-05-03-0145-agent-native-office-how-do-you-note}}Expose your data and functionality through MCP{{/source}} — and test it with your own agents, without human GUI manipulation in the loop.
- The litmus test from [[concepts/agent-native]] (parity: whatever the user can do via UI, the agent can do via tools) generalizes: at the org level, *whatever an internal team can do in their tools, an internal agent can do via MCP*.

## Proactive > reactive

{{source:2026-05-03-0145-agent-native-office-how-do-you-note}}Background long-running agents. Chat is only one modality to trigger an agent — event triggers are better.{{/source}} The default mental model of "user types in a chatbox, agent replies" is one shape; production agent ops at an office looks more like a fleet of cron-and-event-driven workers that occasionally surface to a human.

## Durable agents

For agents to live in prod, the runtime needs to survive failures, restarts, and long tool calls:

- {{source:2026-05-03-0145-agent-native-office-how-do-you-note}}Temporal support{{/source}} (durable workflow execution).
- {{source:2026-05-03-0145-agent-native-office-how-do-you-note}}Sandboxes{{/source}} for tool execution.

These are exactly the [[concepts/agent-anatomy]] *runtime* concerns — but at a scale where the runtime is shared infrastructure, not a per-app concern.

## Eval + observability

{{source:2026-05-03-0145-agent-native-office-how-do-you-note}}Offline, online, and living evals.{{/source}} Three timescales:

- **Offline** — pre-deployment regression suites.
- **Online** — A/B and shadow on real traffic.
- **Living** — continuous evals that update as the world (and the agent) changes.

## Multi-modal orgs

{{source:2026-05-03-0145-agent-native-office-how-do-you-note}}Multi-modal orgs are a thing.{{/source}} An organization is not just humans communicating in Slack threads — it includes voice, video, doc-attached comments, code-review state, and the orgs' own MCP-exposed surfaces. The agents have to operate across all of them.

## Multiplayer

The interaction matrix expands from {humans ↔ humans} to all four cells: {{source:2026-05-03-0145-agent-native-office-how-do-you-note}}human-to-human, human-to-agent, agent-to-human, agent-to-agent.{{/source}} The interesting design problems sit in the off-diagonal: an agent that has to coordinate with a human teammate *and* with another team's agent on the same workflow.

## Tooling mentioned

- **Dispatchagents.ai** — surfaced as one of the platforms targeting this problem space.

## Where this fits in the wiki

- [[concepts/agent-native]] — the principles for individual agent-native apps; this page is the org-scale extension.
- [[concepts/agent-anatomy]] — the runtime concerns (durability, sandbox) become shared infrastructure at office scale.
- [[concepts/context-engineering]] — multiplayer and multi-modal orgs raise the stakes for where context lives and how it flows.
- [[concepts/one-person-studios]] — the inverse shape: *one* human running many agents. Agent-native office is *many* humans co-operating with many agents.
- [[concepts/super-porous-ecosystem]] — MCP-exposed internal surfaces are the porous boundary that lets the office agents and outside agents interoperate.

---
title: Agent Native Office (AI Dev Con 2026)
url: ""
date: 2026-05-03
summary: >
  Talk notes from AI Dev Con 2026 on how to build and deploy internal agents
  at an office continuously. 2025 was the easy part (building); 2026 is the
  hard part (operating at prod). Themes: agents are the new users, MCP as
  the data/functionality interface, proactive event-triggered long-running
  agents over reactive chat, durable runtimes (temporal, sandbox), eval +
  observability, multi-modal orgs, and multiplayer interaction (human-to-human,
  human-to-agent, agent-to-agent). Tool mention: Dispatchagents.ai.
tags: [agent-ops, internal-agents, mcp, observability, multiplayer, conferences]
kind: note
---

Talk notes from AI Dev Con 2026 — *Agent Native Office: How do you build and deploy internal agents at your office continuously?*

- Building an agent (2025) is easy; operating it at prod level isn't (2026).
- Agent infra in cloud has to be self-running.
- **Agent experience: agents are the new users.**
- Expose your data and functionality through MCP — test it with your own agents without human GUI manipulation.
- **Proactive > Reactive:** background long-running agents; chat is only one modality to trigger agents (event triggers are better).
- **Durable agents:** Temporal support, sandbox.
- **Eval + observability:** offline, online, and living.
- Multi-modal orgs are a thing.
- **Multiplayer:** human-to-human, human-to-agent, agent-to-agent.
- Tool: Dispatchagents.ai.

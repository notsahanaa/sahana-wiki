---
title: Generative UI
category: concepts
tags: [ui, agents, agentic-ui, llm, frontend]
cluster: paradigms
created: 2026-05-03
updated: 2026-05-03
---

# Generative UI

Generative UI (gen UI) is UI that is produced, composed, or adapted by AI agents at runtime rather than being fully specified in advance by a developer. As agents gain more autonomy, the interface layer becomes something agents and models can also author.

## Three Types

{{source:2026-05-03-0124-generative-ui-3-types-of-gen-note}}**Controlled gen UI** — components are pre-coded; the agent chooses among a fixed catalog of existing UI fragments. The safest, most predictable form.{{/source}}

{{source:2026-05-03-0124-generative-ui-3-types-of-gen-note}}**Declarative gen UI** — components are declared (e.g. React + Zod schemas) with metadata: a description, guidance for when an agent should use them, and the data shape they expect. Google's *a2ui* is an example. Enables a long tail of user-facing and internal services without fully open-ended rendering.{{/source}}

{{source:2026-05-03-0124-generative-ui-3-types-of-gen-note}}**Open gen UI** — the agent writes JavaScript directly, or embeds tool-generated artifacts (e.g. Excalidraw sketches, Mermaid diagrams) inside the chat UI. Maximum expressiveness, lowest guardrails. MCP-hosted tools fit here.{{/source}}

## Future Directions

{{source:2026-05-03-0124-generative-ui-3-types-of-gen-note}}Two threads emerge as priorities for agentic UI: **enablement** (the stack for assembling UI on the fly) and **insights** (new analytics primitives to track what gen UI does and how users respond).{{/source}}

{{source:2026-05-03-0124-generative-ui-3-types-of-gen-note}}**CLUF — Continuous Learning from User Feedback** — a feedback loop where user interactions with generated UI are harvested to improve future generations.{{/source}}

## Related

- [[concepts/agent-native]] — gen UI is the interface layer of agent-native architectures.
- [[concepts/super-porous-ecosystem]] — declarative component catalogs are atoms in a swappable ecosystem.
- [[concepts/taste-as-skill]] — open gen UI pushes authorship toward taste: when the agent can write any UI, what it renders is a reflection of the model's (and curator's) aesthetic judgment.

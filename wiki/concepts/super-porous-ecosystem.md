---
title: Super-Porous Ecosystem
category: concepts
tags: [paradigms, agent-native, ecosystem, mcp]
created: 2026-04-26
updated: 2026-04-26
---

# Super-Porous Ecosystem

Sahana's framing in *paradigms* (see [[projects/sahana-wiki]]): the modern agentic stack lets products be built as **emergent compositions** of independently-developed atoms — and the boundaries between products are collapsing. {{source:sahana-paradigms-agent-space-2026-04-12}}*"In this new agentic stack, products are almost emergent compositions of their individual atoms — prompts, tools, skills, agent orchestration patterns, and products wrapped in mcp."*{{/source}}

## The atoms

| Atom | What it is | Where it comes from |
|---|---|---|
| **Prompts** | The instruction layer | Hand-written, shared in repos, gist'd, copy-pasted |
| **Tools** | Atomic actions an agent can take | Inside the app, or via MCP servers |
| **Skills** | Plain-English tool-combinations | Markdown files in `.claude/skills/` etc. |
| **Agents** | Whole specialized model + context bundles | [[concepts/folder-is-the-agent]]; bought from marketplaces |
| **Products via MCP** | Existing apps exposed to agents over the Model Context Protocol | Vendor-published MCP servers |

## Physical, not chemical

The structural property that makes the ecosystem porous: {{source:sahana-paradigms-agent-space-2026-04-12}}*"These individual parts are physically, not chemically combined. They can be swapped and updated without breaking the rest of the building."*{{/source}}

Compare with previous eras:
- **In-house monoliths** — chemistry; you couldn't pull a piece without rewriting around it.
- **APIs + libraries** — physical-ish, but coordination overhead was high.
- **MCPs + skills + agent marketplaces** — physical at the smallest possible grain. Whole product wrapped behind an MCP, swappable in one config line.

## What this means for the builder

The skill that matters most:

> {{source:sahana-paradigms-agent-space-2026-04-12}}*"The best builders will be the ones who know where to find them, how to combine them, and when to swap them out. So better start hunting down git repos for powerful atoms to borrow."*{{/source}}

It's a curatorial skill, not a synthesis-from-scratch one. Closer to a DJ than a composer.

## Where this connects to other things in the wiki

- The [[concepts/agent-native]] principles (parity, granularity, composability) describe **how** to design atoms so they compose well — the supply side of the ecosystem.
- [[projects/every]]'s "Anton/Max/Strategy Interviewer/Campaign Reporter" agents (`sources/parrott-25-person-four-agents`) are atoms an org composed itself; nothing is bought, but the pattern is the same.
- The [[concepts/folder-is-the-agent]] pattern is one canonical *shape* an atom can take — a folder of context that loads into any model.
- {{source:duffy-market-for-making-ai-better}}*Curated training data is itself becoming an atom in this market — companies sell their operational data to make AI models better at specific domains.*{{/source}} (See `sources/duffy-market-for-making-ai-better`.)

## Risk worth flagging

The atoms aren't all trustworthy. A super-porous ecosystem also means a super-porous attack surface — a malicious skill or MCP server can do real damage inside an agent loop. The curatorial skill includes "is this atom safe to combine," not just "does it compose."

## Related

- [[concepts/agent-native]] — the design principles that make atoms composable
- [[concepts/folder-is-the-agent]] — atoms shaped as folders
- [[concepts/compound-engineering]] — methodology for compounding agent-driven workflows
- [[concepts/taste-as-skill]] — what differentiates curators when atoms are commodity

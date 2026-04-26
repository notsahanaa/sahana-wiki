---
title: Agent-Native
category: concepts
tags: [agent-native, architecture, claude-code]
created: 2026-04-25
updated: 2026-04-25
---

# Agent-Native

Software architected with AI agents as first-class citizens, not bolted on. The agent operates in autonomous loops, atomic tools provide capabilities, and prompts describe goals. Articulated in the {{source:every-agent-native-guide}}Every guide co-authored by [[people/dan-shipper]] and Claude{{/source}}, with field reports from {{source:parrott-four-apps}}four production apps in Parrott's lessons piece{{/source}}.

## Five principles

1. **Parity** — {{source:every-agent-native-guide}}whatever the user can do via UI, the agent can do via tools{{/source}}. Without it, nothing else works.
2. **Granularity** — tools are atomic primitives. Judgment lives in prompts, not bundled into tools.
3. **Composability** — atomic tools + parity means new features come from prompts, not code.
4. **Emergent capability** — agents accomplish unanticipated tasks by composing existing tools. User requests reveal latent demand.
5. **Improvement over time** — apps get better without shipping code, via accumulated context and prompt refinement.

## The litmus test

> {{source:every-agent-native-guide}}*"To change behavior, do you edit prompts or refactor code?"*{{/source}}

In agent-native systems, you edit prompts.

> {{source:every-agent-native-guide}}*"Describe an outcome within your domain that you didn't build a specific feature for. Can the agent accomplish it in a loop? If yes — agent-native. If no — too constrained."*{{/source}}

## Tools and skills

The vocabulary that shows up across the Every pieces:

- **Tools** — small discrete actions (read file, write file, search web, delete item).
- **Skills** — plain-English instructions that compose tools.
- {{source:parrott-four-apps}}*"The smaller and more basic you make each tool, the more creatively the AI combines them. Claude Code is powerful because its core tool — running terminal commands — can do almost anything."*{{/source}}

## Files as universal interface

{{source:every-agent-native-guide}}Files beat databases for many use cases — agents already know file ops, content stays inspectable and portable, sync works naturally, and the structure is self-documenting.{{/source}} Monologue ships this in production with a {{source:parrott-four-apps}}folder-based filesystem instead of a traditional database{{/source}}.

This is also why [[concepts/llm-as-librarian]] works: the wiki *is* the interface.

## Trade-offs (honest)

- **Speed.** Slower than deterministic code due to reasoning overhead.
- **Cost.** {{source:parrott-four-apps}}Cora has had $1,500 days{{/source}} in inference supporting thousands of users.
- **Predictability.** Same request → variable result, complicating security guarantees.
- **The bet.** {{source:parrott-four-apps}}Inference costs drop ~80% every few months{{/source}}; the economics get better.

## Anti-patterns

From the {{source:every-agent-native-guide}}Every guide{{/source}}: agent-as-router (only deciding which feature to call), build-then-bolt-on, request/response thinking instead of loops, defensive tool design, workflow-shaped tools that bundle decisions, orphan UI actions the agent can't reach, context starvation, heuristic completion detection.

## Related

- [[concepts/folder-is-the-agent]] — one specific architectural shape
- [[concepts/llm-as-librarian]] — the PKM-flavored sibling
- [[concepts/compound-engineering]] — Klaassen's methodology built on these ideas
- [[projects/cora]], [[projects/monologue]] — production examples
- [[people/dan-shipper]], [[people/kieran-klaassen]]

---
title: Cora
category: projects
tags: [cora, every, agent-native, email]
created: 2026-04-25
updated: 2026-04-25
---

# Cora

Every's AI email assistant (`cora.computer`), run by Kieran Klaassen. The most-cited example in this wiki of {{source:parrott-four-apps}}production-scale agent-native architecture at non-trivial cost{{/source}}.

## Why it matters

Cora is the codebase that produced [[concepts/folder-is-the-agent]] — Klaassen's {{source:klaassen-folder-is-the-agent}}essay traces the pattern directly to Cora's repo structure{{/source}} and its protocol of feeding a new agent session a fixed reading order (`CLAUDE.md → architecture → assistant report → component creator`).

## Cost honesty

The most striking number from the {{source:parrott-four-apps}}four-apps writeup{{/source}}: **$1,500 days** in inference supporting thousands of users. Every's bet is that {{source:parrott-four-apps}}inference costs drop ~80% every few months{{/source}}, so this is short-term.

## Klaassen's personal stack

Klaassen also runs a Claw named **Klont** — see {{source:every-claw-school-guide}}the OpenClaw guide{{/source}} and [[projects/openclaw]]. Same operator, two architectural shells: Cora is the *folder-is-the-agent* pattern as a product team's repo; Klont is the same pattern scoped to a person, living in a messaging app.

## Related

- [[concepts/folder-is-the-agent]] — pattern derived from this codebase (Kieran Klaassen, GM)
- [[concepts/compound-engineering]] — Klaassen's methodology
- [[concepts/agent-native]]
- [[projects/every]]
- [[projects/openclaw]] — Klaassen's personal Claw (Klont) runs on this framework

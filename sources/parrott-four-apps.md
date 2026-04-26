---
title: How to Build Agent-Native — Lessons From Four Apps
url: https://every.to/source-code/how-to-build-agent-native-lessons-from-four-apps
date: 2026-02-17
summary: Katie Parrott's writeup of Every's first Agent Native Camp, drawing four lessons from four apps (a book scanner, Cora, Sparkle, Monologue). The headline thesis "the AI is the app" — give the agent a few simple tools and let it figure out the rest.
tags: [agent-native, cora, monologue, sparkle, every, katie-parrott]
---

# How to Build Agent-Native: Lessons From Four Apps

By **Katie Parrott** (Every Source Code, Feb 17 2026, updated March 30 2026). Subtitle: *"Start with three simple tools, and let the AI figure out the rest."*

## Thesis

Agent-native architecture is a fundamental shift: AI agents autonomously decide which tools to use and how to combine them, rather than following pre-written code per feature. Built from **basic tools** + **plain-English skills**, not feature flags.

## The four apps

| App | What it shows | Built by |
|---|---|---|
| Dan Shipper's book-scanning demo | Core agent-native loop — scans a page, identifies the book, generates a spoiler-calibrated summary | Dan Shipper |
| **Cora** (cora.computer) | Production-scale agent-native email at non-trivial cost | Kieran Klaassen, GM |
| **Sparkle** (makeitsparkle.co) | Desktop file-organization agent | Every team |
| **Monologue** (monologue.to) | Read-later service backed by a folder-based filesystem instead of a database | Naveen Naidu, GM |

## Four lessons

1. **The AI is the app.** Devs define a small set of basic tools; the agent picks and combines them.
2. **Simpler tools yield smarter results.** *"The smaller and more basic you make each tool, the more creatively the AI combines them. Claude Code is powerful because its core tool — running terminal commands — can do almost anything."*
3. **Rules embed in tools, not instructions.** Safety guardrails need technical enforcement, not pleading prompts.
4. **Keep an experimental sandbox alongside production.** Test agent interactions without attachment to throwaway code.

## Three core principles (echoing the Shipper/Claude guide)

- **Parity** — *"Whatever the user can do, the agent can do."*
- **Granularity** — atomic, single-purpose tools; behavior at the skill (plain-text instruction) level.
- **Composability** — atomic tools + skills = unanticipated functionality.

## Trade-offs

- **Speed:** slower than deterministic code due to agent reasoning overhead.
- **Cost:** Cora has had **$1,500 days** in inference costs supporting thousands of users.
- **Predictability:** same request → variable result, complicating security guarantees.
- **Shipper's bet:** inference costs drop ~80% every few months; long-term economics improve.

## Architecture vocabulary

- **Tools** — small discrete actions (read file, write file, search web, delete item).
- **Skills** — plain-English instructions describing tool combinations.
- *"Claude Code in a trench coat"* — affectionate shorthand for an agent-native app.

## People & products

Dan Shipper, Katie Parrott, Kieran Klaassen, Naveen Naidu. Compared to: Pocket, Instapaper.

## Why this matters for `sahana-wiki`

Monologue's folder-as-backend model is direct evidence that the wiki's *markdown-files-no-DB* choice is a deliberate agent-native pattern, not just simplicity for its own sake.

---
title: OpenClaw
category: projects
tags: [openclaw, claws, agent-native, personal-agents, every]
created: 2026-04-26
updated: 2026-04-26
---

# OpenClaw

An open-source framework for **Claws** — personal AI assistants that live inside the messaging apps you already use (WhatsApp, Telegram, Discord, SMS) instead of behind their own UI. Created by **Peter Steinberger**; documented in Every's {{source:every-claw-school-guide}}*"OpenClaw: A Comprehensive Guide for Beginners"*{{/source}} (Dan Shipper, Willie Williams, R2-C2, Laz).

## What a Claw is

> {{source:every-claw-school-guide}}*"Your Claw shows up in WhatsApp, Telegram, Discord, or SMS — wherever you already talk to people."*{{/source}}

A Claw runs 24/7, has its own persistent personality (a `SOUL.md` file), and — critically — when it can't do something, {{source:every-claw-school-guide}}*"it writes the code to make it happen"*{{/source}} rather than reporting an unsupported integration. That **self-extension** is the difference between a Claw and a chatbot.

## Distinguishing features

| Standard chatbot | Claw |
|---|---|
| Lives behind its own app | Lives in messaging apps you already use |
| Reactive only | Proactive (cron jobs + heartbeat loop) |
| Fixed integrations | Self-modifying — writes code to extend itself |
| Anonymous tone | Per-user personality file (`SOUL.md`) |
| One-shot conversations | Memory + state across days/months |

## Architecture vocabulary

- **`SOUL.md`** — the personality file unique to each user. The [[concepts/folder-is-the-agent]] pattern, scoped to a person.
- **Cron jobs** — scheduled tasks (8 a.m. briefing, Sunday weekly plan).
- **Heartbeat** — background loop that lets the Claw act without prompting.
- **Skills** — extensions vetted from the **ClawHub** registry.
- **Pairing mode** — only paired (known) users can talk to your Claw.
- **Sandboxing** — progressive permission for filesystem / code execution.

## Mindset principles from the guide

> {{source:every-claw-school-guide}}*"It's a collaborator, not an oracle. The best results come from back-and-forth conversation."*{{/source}}

> {{source:every-claw-school-guide}}*"The biggest mistake people make is treating their Claw like a search engine."*{{/source}}

> {{source:every-claw-school-guide}}*"Think about it like you just hired someone."*{{/source}}

The frame: delegation over search, conversation over commands, iteration over perfection.

## Claws in the wild (Every staff)

| Claw | Owner | Role at Every |
|---|---|---|
| **Margot** | Katie Parrott | Staff writer, AI editorial lead |
| **Klont** | Kieran Klaassen | GM, [[projects/cora]] |
| **Zosia** | Brandon Gell | COO |
| **Pip** | Jack Cheng | Contributing editor |

The Margot story is also the centerpiece of {{source:parrott-ai-consumed-my-time}}Parrott's *"AI Was Supposed to Free My Time"*{{/source}} — see [[concepts/ai-overwork]].

## Safety defaults

Because a Claw can write and execute code on your behalf, the guide is firm:

1. Pairing mode on by default.
2. In group chats, require explicit mention.
3. Sandbox progressively — never grant full access on day one.
4. Vet ClawHub skills before installing.
5. Treat **prompt injection** as a real threat; use stronger models for the security loop.

## Where this fits in the wiki

OpenClaw is the canonical example of {{source:klaassen-folder-is-the-agent}}*"the folder is the agent"*{{/source}} extended into a long-running personal context: a `SOUL.md` per user, a cron + heartbeat loop, and code-writing capability. It's also the **communications layer** of the [[concepts/one-person-studios]] pattern — the studio's persistent assistant lives where conversation already happens.

The Claw architecture also pressure-tests the [[concepts/agent-native]] principles. *Parity* gets reframed: parity isn't with a UI you already had, it's with the *messaging affordances* of WhatsApp/Telegram/SMS — text, voice, files, links, group threads. That's an interesting design constraint the wiki should keep on hand.

## Related

- [[concepts/folder-is-the-agent]] — `SOUL.md` is this pattern, scoped to a person
- [[concepts/one-person-studios]] — Claws as the comms layer
- [[concepts/ai-overwork]] — the dark side of always-on personal agents (the Margot incident)
- [[concepts/agent-native]] — the substrate
- [[projects/every]] — staff are the most-documented Claw users
- [[projects/cora]] — Kieran Klaassen runs both

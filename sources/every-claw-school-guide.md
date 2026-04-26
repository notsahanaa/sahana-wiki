---
title: "OpenClaw: A Comprehensive Guide for Beginners"
url: https://every.to/guides/claw-school
date: 2026-04
summary: Every's guide to OpenClaw — the open-source framework for personal AI assistants ("Claws") that live inside the messaging apps you already use (WhatsApp, Telegram, Discord, SMS) instead of behind their own UI. Co-authored by Dan Shipper with Willie Williams, R2-C2, and Laz; OpenClaw itself was created by Peter Steinberger. Frames Claws as 24/7 collaborators that write code to extend themselves, run cron jobs and heartbeats, and develop a per-user personality via a `SOUL.md` file.
tags: [agent-native, openclaw, claws, personal-agents, every, dan-shipper, peter-steinberger]
byline: Dan Shipper, Willie Williams, R2-C2, Laz
---

# OpenClaw: A Comprehensive Guide for Beginners

## What a Claw is

A Claw is a personal AI assistant that *"shows up in WhatsApp, Telegram, Discord, or SMS — wherever you already talk to people."* It runs 24/7, has its own persistent personality (the `SOUL.md` file), and — critically — when it can't do something, *"it writes the code to make it happen"* rather than reporting an unsupported integration. That self-extension is the difference between a Claw and a chatbot.

Claws are operated by Every staff with names like personality cues:
- **Margot** (Katie Parrott)
- **Klont** (Kieran Klaassen, Cora GM)
- **Zosia** (Brandon Gell, COO)
- **Pip** (Jack Cheng, contributing editor)

## What distinguishes Claws from Claude / ChatGPT

| Standard chatbot | Claw |
|---|---|
| Lives behind its own app | Lives in messaging apps you already use |
| Reactive only | Proactive (cron + heartbeat) |
| Fixed integrations | Self-modifying — writes code to extend itself |
| Anonymous tone | Per-user personality file (`SOUL.md`) |
| One-shot conversations | Memory + state across days/months |

## The "claw school" curriculum

Although the guide doesn't formally title it that, the lesson structure functions as a school:

**Beginner**
- Manage a to-do list
- Daily check-ins
- Reactive task reprioritization

**Intermediate**
- Email integration
- Morning briefings
- Smart pattern-based reactions
- Multi-tool connectivity

**Advanced**
- Personality customization
- Project-based collaboration (research → outline → draft a newsletter)
- Phone calls (via Twilio: *"Call [restaurant] and book a table for four at 7 p.m. this Saturday"*)
- Complex workflow automation

## Mindset principles

> *"It's a collaborator, not an oracle. The best results come from back-and-forth conversation."*

> *"The biggest mistake people make is treating their Claw like a search engine."*

> *"Think about it like you just hired someone."*

> *"Your Claw's first try at anything will rarely be exactly what you want."*

The frame: delegation over search, conversation over commands, iteration over perfection, mental-load relief over feature-completeness.

## Architecture vocabulary

- **`SOUL.md`** — the personality file unique to each user.
- **Cron jobs** — scheduled tasks (8 a.m. briefing, Sunday weekly plan).
- **Heartbeat** — a background loop that lets the Claw act without being prompted.
- **Skills** — extensions, vetted from the **ClawHub** registry.
- **Pairing mode** — security: only paired (known) users can talk to your Claw.
- **Sandboxing** — progressive permission for file system / code execution.

## Safety framework

Because a Claw can write and execute code on your behalf, the guide is firm about defaults:

1. Keep pairing mode on. Verify new contacts.
2. Use private channels; in group chats, require an explicit mention.
3. Sandbox progressively — don't grant full file/code access on day one.
4. Vet third-party skills from ClawHub before installing.
5. Prompt-injection is treated as a real threat; stronger models recommended for the security loop.

## Installation paths

1. **Local laptop:** `curl -fsSL https://docs.openclaw.ai/install.sh | bash` (Mac/Linux, ~10 minutes).
2. **Server:** hosting guides at docs.openclaw.ai/install (Fly.io, Hetzner, Google Cloud).
3. **Hosted:** early access via signup form.

## Sample instructions

- *"I want you to manage my to-do list. What do you need from me to set that up?"*
- *"Every morning at 8 a.m., send a message with emails needing responses, calendar conflicts, and weather."*
- *"When I get a flight confirmation, automatically check me in when available."*
- *"Every Sunday evening, review my calendar, to-do list, important emails, and build a weekly plan."*

## Why this matters for `sahana-wiki`

OpenClaw is the canonical example of *"the folder is the agent"* extended into a long-running personal context: a `SOUL.md` per user, a cron + heartbeat loop, and a tool-writing capability — the same pattern Klaassen articulated for Cora, but worn on the user's body instead of the team's repo. It's also the *one-person studio's* communications layer. And the Margot story (Parrott's 1 a.m. configuration session) is the human-cost flip side of the same architecture.

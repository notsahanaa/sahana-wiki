---
title: How We Run a 25-Person Company on Four AI Agents
url: https://every.to/source-code/how-we-run-a-25-person-company-on-four-ai-agents
date: 2026-04-09
summary: Katie Parrott on how Every (25 people, 6 products, a media co, a consultancy) runs operations on four custom Notion-based agents — Anton, Max, the Strategy Interviewer, and the Campaign Reporter — built on three interconnected databases (calendar, tasks, strategy).
tags: [agent-native, every, notion, custom-agents, operations]
---

# How We Run a 25-Person Company on Four AI Agents

By **Katie Parrott**. Every Source Code, April 9 2026 (updated April 24 2026). Partner: Notion.

## Thesis

Custom AI agents on top of interconnected databases eliminate logistical drag. A 25-person company running 6 products + media + consulting can coordinate without manual COO traffic-control.

## The four agents

### 1. Anton — Prioritization
- **Role:** identifies each person's top tasks for the day; posts company-wide priority summary to Slack.
- **Inputs:** strategy doc, OKRs DB, unified calendar, tasks DB, people DB.
- **Owner:** Brandon Gell (COO).

### 2. Max — Meetings → Tasks
- **Role:** ingests meeting transcripts, extracts action items, posts numbered list to Slack; replies with selected numbers create tasks.
- **Inputs:** meetings DB (Notion's built-in transcription), calendar, tasks DB, Slack.
- **Why it exists:** *"Meeting notes have a shelf life of about six hours before everyone forgets what they agreed to do."*

### 3. The Strategy Interviewer
- **Role:** interviews team members about quarterly goals, asks clarifying questions, structures into aligned OKRs.
- **Outcome:** compressed Every's multi-week OKR process into **two days**. Some people pasted existing notes and got polished OKRs in ~10 minutes.

### 4. The Campaign Reporter
- **Role:** posts a daily growth scorecard to Slack — metrics, pace, ahead/behind targets.
- **Inputs:** Notion DBs that pull from PostHog and Stripe via **Notion Workers** (alpha — custom scripts that connect to external APIs).
- **Owner:** Austin Tedesco (Head of Growth). Built end-to-end from terminal in Claude Code.

## The three foundational databases

All four agents draw from the same three Notion DBs:
1. **Calendar** — launches/projects with dates
2. **Tasks** — linked to calendar entries, assigned to people
3. **Strategy doc** — company priorities

Cross-references between these are the entire substrate.

## Lessons

1. **Outcome over process.** *"Describe the outcome, not the steps. Tell the AI what you want to accomplish and let it figure out the implementation. Over-prescribing tends to confuse the model."*
2. **Notion as agent brain.** Power comes from interconnected DBs (strategy + calendar + tasks + people + meetings) all in one system with cross-refs.
3. **Don't write instructions yourself.** Let Notion AI generate them from desired outcomes — or use Claude Code with Notion's API.
4. **Simplicity first.** After planning, ask: *"What's the dumbest, simplest system we could build?"*
5. **Start small, iterate.** Each new agent leverages existing DB structure. Anton came first; the rest followed.
6. **Brain-dump → agent → paste back.** Austin's workflow for the campaign reporter: Monologue brain-dump → Claude Code builds DB and pipeline → paste results into Notion → refine when numbers were wrong.

## People & products

- **Katie Parrott** (author), **Brandon Gell** (COO), **Austin Tedesco** (Head of Growth), **Brian Levin** (product designer at Notion).
- Tools: Notion AI, Notion Workers, Claude Code, Monologue, PostHog, Stripe, Slack, Zoom, Attio, GitHub.
- Context: emerged from Every's first **Custom Agents Camp** (with Notion), 500+ subscribers.

## Why this matters for `sahana-wiki`

This is the operations-layer counterpart to the folder-as-agent pattern: instead of one folder = one specialist, here we have *one DB triple = a substrate for many specialists*. Same insight (rich shared context > clever orchestration), different surface (Notion DBs vs. markdown files). Stage 5–6 of the roadmap (multi-agent surfaces over the wiki) can borrow this directly.

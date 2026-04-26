---
title: What Board Games Taught Me About Working With AI
url: https://every.to/working-overtime/what-board-games-taught-me-about-working-with-ai
date: 2026-02-19
summary: Katie Parrott uses the board-game design vocabulary — components, moves, sequencing, victory conditions — to break a creative paralysis around building a writing agent. Studying Kieran Klaassen's compound engineering plugin "as a teach," she translates Rails-reviewer into developmental-editor and security-auditor into fact-checker, then ships a personal writing system where each piece makes the next easier.
tags: [agent-native, compound-engineering, taste-as-skill, board-games, every, katie-parrott, kieran-klaassen]
byline: Katie Parrott
---

# What Board Games Taught Me About Working With AI

## Central analogy

Board game designers don't teach a game by handing you a strategy. They teach: *"What are the pieces, and what do they do?"* — then moves, then how moves interconnect, then victory conditions. Parrott applies the same teach to AI systems: *map components, then actions, then compounding effects, then the win condition.* This dissolves the paralysis of staring at a vast technology and not knowing where to start.

## Six lessons from board games

### 1. The Teach

Before strategy comes fundamentals. *"What are the pieces, and what do they do?"* For AI work that means: name your agents, commands, skills, configs. You can't compose what you can't name.

### 2. Component mapping

Identify the *categories* (actors, actions, stored knowledge, preferences), then translate domain-specific equivalents. Parrott studied Kieran Klaassen's Rails-focused **compound engineering plugin** and translated:
- Rails reviewer → developmental editor
- Security auditor → fact-checker

### 3. Sequential moves matter

In Catan, a settlement in round two funds a city in round eight. Same in writing: brainstorm → interview → outline → draft → edit. Skipping steps produces *"polished garbage."* This is also why *"a draft built on a bad outline is a fast way to produce polished garbage."*

### 4. Memory and compounding

Sophisticated games reward repeated moves becoming more powerful. Klaassen's system captures insights and resurfaces them. Parrott's writing system splits **defaults** (baseline standards everyone gets) from **taste** (per-user preferences the engine learns) — so the system grows smarter the more she uses it without contaminating other users' profiles.

### 5. Play reveals the rules

> *"The engine only reveals its flaws when I actually play."*

Parrott discovered her taste file was contaminating the user profile only by testing as a user would. *"You don't play perfectly the first time. You fumble through a round, misunderstand a rule, lose badly, and say, 'Okay, now I get it.'"* Iteration beats theoretical planning.

### 6. Victory condition gives meaning

Without explicit win conditions you're just shuffling pieces. Parrott names two nested victories:
- **Tactical:** each piece of writing makes the next easier.
- **Strategic:** *learning to build AI systems* becomes itself a learnable game.

## Memorable lines

- *"What are the pieces, and what do they do?"*
- *"The engine only reveals its flaws when I actually play."*
- *"A draft built on a bad outline is a fast way to produce polished garbage."*
- *"You don't play perfectly the first time. You fumble through a round, misunderstand a rule, lose badly, and say, 'Okay, now I get it.'"*

## Named entities

**People:** Katie Parrott, Kieran Klaassen, Austin Tedesco, Brandon Gell, Natalia Quintero, Nityesh Agarwal, Mike Taylor, Kate Lee.
**Board games:** Settlers of Catan, Ticket to Ride, Codenames, Wingspan.
**AI tools:** Claude Code, Claude Opus, Codex, the compound engineering plugin, ChatGPT projects.
**Concepts:** compound engineering, agent-native architectures, Skills, CLAUDE.md / TASTE.md, plan-work-review-compound loop.

## Practical takeaways

1. **Inventory before building.** Map existing tools by functional category.
2. **Sequence over shortcuts.** Stage workflows; don't jump to the final output.
3. **Split baseline from personalization.** Opinionated defaults vs. learnable per-user taste.
4. **Test early.** Play a round before designing the deluxe version.
5. **Encode taste in a readable file.** A `TASTE.md` the agent can re-read.
6. **Embrace losing.** Fumbling is part of the curriculum.
7. **Define compounding explicitly.** State *how* repeated use should make the system smarter.

## Why this matters for `sahana-wiki`

This is the operational companion to Klaassen's *folder-is-the-agent* and Sahana's *taste-as-skill*. The board-game frame gives non-engineers a concrete workflow for building agentic systems without having to think in code-architecture terms. The split between **defaults** and **taste** is also the cleanest articulation yet of why a wiki like this one (concepts/projects + per-page voice) needs both a librarian and a personal layer.

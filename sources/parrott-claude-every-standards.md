---
title: I Taught Claude Every's Standards. It Taught Me Mine.
url: https://every.to/working-overtime/i-taught-claude-every-s-standards-it-taught-me-mine
date: 2025-08-25
summary: Katie Parrott built a Claude-powered editor evaluating drafts against Every's editorial standards. Extracting structural patterns from canonical pieces and articulating "core principles" (optimistic realism, intellectual generosity, conversational authority) forced her to separate her personal preferences from organizational values. The lesson — *"style is the how, voice is the why"* — is also a methodology: making taste legible to a machine first requires making it legible to yourself.
tags: [taste-as-skill, voice-vs-style, agent-native, compound-engineering, every, katie-parrott, dan-shipper]
byline: Katie Parrott
---

# I Taught Claude Every's Standards. It Taught Me Mine.

## Central thesis

> *"When you can teach taste to a machine, you're forced to make it legible for yourself."*

Encoding editorial standards into an AI system is a mirror. It exposes the difference between stylistic habits and genuine convictions, and makes you decide what your publication actually stands for.

## What Every's standards turned out to be

After analyzing canonical pieces from Dan Shipper and other high-performers, Parrott extracted the standards in two layers:

### Structural patterns

- Strong introductions follow a **rhythm**: *spark first, stakes within 150 words, zoom-out, forward-pointing thesis.*
- Abstraction works best when **grounded in concrete detail**.
- Endings **reframe rather than recap**.

### Core principles (Parrott's additions)

- **Optimistic realism** — avoids cynicism while staying grounded.
- **Intellectual generosity** — argues in ways that invite readers in rather than push them out.
- **Conversational authority** — confidence balanced with humility.

## Method

1. Collect canonical examples from CEO Dan Shipper and high-performing pieces.
2. Ask ChatGPT to identify recurring patterns.
3. Migrate to Claude Opus 4.
4. Use Anthropic's **prompt builder** to convert principles into operational instructions.
5. Load instructions into a Claude project as project files — the system's *"procedural brain."*

## What Parrott learned about her own standards

The headline distinction:

> *"Style is the 'how' — the choices of syntax, rhythm, and imagery that shape the prose. Voice is the 'why' — the convictions that give those stylistic choices meaning."*

By writing standards for a *team* system, she had to separate personal preference from organizational value. Some of her column's rules — start with a personal problem, use personal stakes — *shouldn't* have been universal. Not every good instinct deserves to become a rule.

> *"I had to draw a line between my own preferences and Every's values, deciding which instincts deserved to become rules."*

> *"Without those anchors, the rules risked describing a style, not a voice."*

The discipline: every rule needs a justification rooted in a principle, or it isn't a standard — it's a taste preference dressed up as one.

## Memorable lines

- *"When you can teach taste to a machine, you're forced to make it legible for yourself."*
- *"Style is the 'how'. Voice is the 'why'."*
- *"Without those anchors, the rules risked describing a style, not a voice."*
- *"It felt almost like a pat on the head from a real-life editor."*

## Named entities

**People:** Katie Parrott, Dan Shipper.
**Tools:** Claude, Claude Opus 4, ChatGPT, Claude projects, Anthropic Console, prompt builder.
**Publications/sections:** Every, *Working Overtime* column.
**Concepts:** optimistic realism, intellectual generosity, conversational authority, *spark* (opening device), project files, custom instructions, voice vs. style.

## Practical takeaways

1. **Extract patterns from exemplars.** Have the model find recurring structural and stylistic features before you write the principles down.
2. **Separate style from voice.** *How* (syntax, rhythm) ≠ *why* (conviction). Document both, separately.
3. **Use a prompt builder.** Convert narrative principles into operational instructions.
4. **Distinguish personal preference from organizational standards.** Test: does this apply universally, or only to one writer?
5. **Anchor rules in principles.** Every rule should explain *why*, not just *what*.
6. **Load standards as project context.** Persistent project files beat one-off prompts.
7. **Iterate with real drafts.** The system reveals its flaws only when you run real work through it.

## Why this matters for `sahana-wiki`

This is the canonical method for *taste-as-skill*: not just "have taste," but *encode* taste in a way an agent can use without flattening it. The voice/style distinction is a load-bearing concept the wiki's `taste-as-skill` page should adopt directly. It's also the model for what a `wiki/STANDARDS.md` (or equivalent) might look like — a justification-anchored, machine-readable description of the librarian's editorial principles for synthesizing concepts.

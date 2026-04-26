---
title: Writing With AI Is Harder Than You Think
url: https://every.to/working-overtime/writing-with-ai-is-harder-than-you-think
date: 2026-04-06
summary: Katie Parrott responds to journalists Megan McArdle and Charlotte Alter — who argue *"any portion of [writing] done by AI is less thinking done by you"* — by transparently documenting her multi-stage writing agent. The system runs brainstorm → interview → outline → draft → review with specialized critic personas (one literally named "Asshole") that catch length, pacing, argument soundness, and AI-pattern language. Her counter-argument: writing has always involved revision, borrowed structures, and external input; AI is an evolution of that, and done seriously it demands *more* thinking, not less.
tags: [writing-with-ai, taste-as-skill, compound-engineering, agent-native, every, katie-parrott]
byline: Katie Parrott
---

# Writing With AI Is Harder Than You Think

## Central thesis

> *"Think of it as a very opinionated editorial workflow that happens to be powered by AI."*

The discourse assumes the laziest possible AI workflow: prompt-and-paste. Done seriously, AI-assisted writing is a multi-stage editorial system that requires *more* judgment, not less. Writing has never been binary — drafting and revising, leaning on editors and borrowing structures, following formulas and breaking them. AI is an evolution of that, not a departure from it.

## The discourse Parrott is responding to

- **Megan McArdle** (Washington Post)
- **Charlotte Alter**: *"Research is thinking. Outlining is thinking. Writing is thinking. Any portion of that done by AI is less thinking done by you."*

Parrott's response is to show her work.

## Evolution of her process

| Year | Workflow |
|---|---|
| 2024 | Manual copy-paste between ChatGPT and Google Docs |
| 2025 | Uploaded past essays, built a style guide, trained AI on her voice |
| 2026 | Dedicated writing agent with structured phases and specialized feedback |

## The current pipeline

**Brainstorm** → **Interview** → **Outline** → **Draft** → **Review**

### Brainstorm / interview

The agent asks probing questions: *"Why is this on your mind? How has this shown up in your work? What do you want readers to walk away thinking?"* This forces real reflection.

When the AI suggests irrelevant directions, she declines. *"I say so."* — the assertion of editorial control.

### Panel of critics

Specialized personas, each tuned to one weakness:

- **"Mom"** — encourages, catches what's missing emotionally
- **"Hemingway"** — length and pacing
- **"Asshole"** — argument soundness, no-mercy critique
- A **line editing agent** for sentence-level polish
- A pattern detector flagging AI-generated language tells

These emerged from her identified weaknesses + editorial best practices. Each does one job and only one.

## The counter-argument to "AI = less thinking"

> *"Writing has always involved drafting and revising, leaning on editors and borrowing structures, following formulas and breaking them."*

The critique assumes the laziest possible version. Done well, the editorial workflow makes you *more* accountable to your own thinking — the brainstorm forces articulation, the panel of critics catches what you'd hand-wave past, the explicit stages mean you can't conflate "looks good" with "is good."

## Memorable lines

- *"Think of it as a very opinionated editorial workflow that happens to be powered by AI."*
- *"I say so."*
- *"Writing has always involved drafting and revising, leaning on editors and borrowing structures."*
- (Foil) *"Research is thinking. Outlining is thinking. Writing is thinking."* — Alter

## Named entities

**People:** Katie Parrott, Megan McArdle (WaPo), Charlotte Alter.
**Tools:** Claude, ChatGPT, Google Docs, Parrott's writing agent.
**Concepts:** AI style guide, editorial workflow, feedback personas, AI-pattern detection, line editing agent, the brainstorm → interview → outline → draft → review pipeline.

## Practical takeaways

1. **Build contextual training.** Upload past samples; establish a style guide; train the AI on your voice before it drafts.
2. **Use structured interview phases.** AI-led interviews surface your real thinking through questions about motivation, implications, takeaway.
3. **Specialize the critics.** Distinct personas for clarity, pacing, argument validity, language patterns.
4. **Keep editorial veto.** AI suggests; you decide. *"I say so."*
5. **View AI as editorial infrastructure.** A formalized version of what writers with institutional support already had.
6. **Expect iteration cycles.** Multiple passes through the pipeline; the panel only earns trust by catching things.

## Why this matters for `sahana-wiki`

This is *compound engineering* applied to writing — and the most concrete worked example anywhere in the wiki of someone shipping a personal-scale agent stack for creative work. It's also the rebuttal Sahana would want on hand when the *paradigms* essay is read as cheerleading: serious agent-native writing is a discipline, not an autocomplete. Pair with *ai-autopilot* (the failure mode) and *taste-as-skill* (the underlying skill being exercised).

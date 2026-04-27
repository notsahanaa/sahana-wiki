---
title: Games as Curriculum
category: concepts
tags: [agent-native, training-data, transfer-learning, reinforcement-learning, every]
clusters: [ai-capability]
created: 2026-04-26
updated: 2026-04-26
---

# Games as Curriculum

A claim from {{source:duffy-board-game-trained-ai}}Alex Duffy (Good Start Labs){{/source}}: board games are *curricula* for AI. They reward specific cognitive behaviors — context tracking, priority shifting, alliance management, strategic communication — that turn out to **transfer into seemingly unrelated domains**. Games provide scoring systems and feedback that static text training can't, and the resulting capabilities look like reasoning rather than pattern-matching.

> {{source:duffy-board-game-trained-ai}}*"You become good at whatever the system rewards."*{{/source}} (Rachel Braun)

## The Diplomacy experiment

- **Game:** *Diplomacy*, a WWI simulation with **no randomness** — pure persuasion and alliance management.
- **Model:** **Qwen3-235B** (open-source, Alibaba Cloud).
- **Method:** Reinforcement learning across thousands of rounds; success was clearly scorable.
- **Results:** {{source:duffy-board-game-trained-ai}}>10% improvement on Hanabi and Wordle{{/source}}, plus significant gains on **Tau2** (customer-support conversations) and **AssetOpsBench** (IBM industrial equipment monitoring).

That last result is the bombshell: a model trained on a board game became measurably better at customer support and industrial operations. *Skill transferred across radically different domains.*

## Why the transfer happens

> {{source:duffy-board-game-trained-ai}}*"Games reward tracking context, planning responses, and navigating shifting alliances — exactly the capabilities labs are trying to imbue in their models."*{{/source}}

It's a behavior-shaped curriculum, not a knowledge-shaped one. The capability is portable because the *cognitive habits* are portable.

## A folk version of the same insight

> {{source:duffy-board-game-trained-ai}}*"StarCraft taught me how to cook. You have things that take different amounts of time, and you want them to land at the same time."*{{/source}} (Willie Williams)

> {{source:duffy-board-game-trained-ai}}*"The LLMs spontaneously develop strategies that look like 'reasoning' to humans."*{{/source}} (Andrej Karpathy)

## The bigger framing

> {{source:duffy-board-game-trained-ai}}*"Less scraping the web, more learning by doing."*{{/source}}

Most LLM improvements are still *knowledge* improvements: another trillion tokens, another curated dataset. Duffy's bet is that the next-order improvements come from **environments** — game-like spaces with clear scoring that incentivize the *behaviors* you actually want.

## Where this fits in the wiki

This is the third leg of a triangle on training data:

| Source | Angle |
|---|---|
| [[projects/every]] / {{source:duffy-market-for-making-ai-better}}Duffy's *market for making AI better*{{/source}} | The macro market for high-quality data |
| Duffy's *board game* piece (this concept) | A specific mechanism: games as curricula |
| {{source:parrott-board-games-and-ai}}Parrott's *what board games taught me*{{/source}} | Games as a frame for *individual users* designing personal AI systems |

Duffy + Duffy is about training the model. Parrott is about training *the user's mental model*. Both end up at the same destination: gameplay structures the kind of feedback both AI and humans need to actually improve.

## Practical implications

1. **Curriculum design > scale.** Game-like environments with clear scoring beat another trillion tokens for many capabilities.
2. **Train behaviors, not just facts.** Strategic capability shows up in customer support, industrial ops, planning.
3. **Generate fresh data via play.** Real users in games produce preference data web scraping can't, and fresh evals static benchmarks lack.
4. **Open environments.** {{source:duffy-board-game-trained-ai}}Arcee opened the Diplomacy training environment{{/source}} — anyone can extend it.

## Related

- [[concepts/agent-native]] — what these better-trained models slot into
- [[concepts/compound-engineering]] — the human-side analog: design environments where each loop makes the next one better
- [[projects/every]] — publication
- {{source:duffy-market-for-making-ai-better}}*Duffy's earlier piece*{{/source}} — the macro market for the data this kind of training requires

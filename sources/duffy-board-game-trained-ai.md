---
title: We Trained an AI on a Board Game. It Became a Better Customer Support Agent.
url: https://every.to/playtesting/we-trained-an-ai-on-a-board-game-it-became-a-better-customer-support-agent-299b5938-09dd-4881-803f-aea21f0d461f
date: 2026-02-03
summary: Alex Duffy (Good Start Labs) on fine-tuning Qwen3-235B via reinforcement learning in the no-randomness World War I game *Diplomacy*. Gameplay training improved the model on other games (Hanabi, Wordle, +10%) and — more interesting — on real-world benchmarks: Tau2 customer-support conversations and IBM's AssetOpsBench for industrial equipment monitoring. The bet: games are curricula, and the cognitive habits that win at games (context tracking, alliance management, priority shifting) transfer.
tags: [agent-native, training-data, games-as-curriculum, every, alex-duffy, transfer-learning, reinforcement-learning]
byline: Alex Duffy
---

# We Trained an AI on a Board Game. It Became a Better Customer Support Agent.

## Central thesis

Board games are *curricula*. They reward specific cognitive behaviors — context tracking, priority shifting, strategic communication — that turn out to transfer into seemingly unrelated domains. Games provide scoring systems and feedback that static text training can't, and the result looks like reasoning rather than pattern-matching.

> *"You become good at whatever the system rewards."* — Rachel Braun

## The experiment

- **Game:** *Diplomacy* — a WWI simulation with **no randomness**, requiring persuasion and alliance management.
- **Model:** **Qwen3-235B** (open-source, Alibaba Cloud).
- **Method:** Fine-tuning via reinforcement learning. Thousands of rounds. Success was clearly scorable; the model received feedback on each decision.
- **Companion experiment:** Hundreds of thousands of rounds of the party game *Bad Cards* with 2 million real users, generating data about humor preferences over time.

## Results

| Domain | Result |
|---|---|
| Other games (Hanabi, Wordle) | **>10% improvement** |
| Tau2 (customer support conversations) | Significant improvement |
| AssetOpsBench (IBM industrial ops) | Improved equipment monitoring + maintenance |

Skills generalized across very different domains. The capabilities that emerged from gameplay — *track shifting context, plan responses, navigate evolving alliances* — are exactly what customer support and operational monitoring also reward.

## Memorable lines

- *"You become good at whatever the system rewards."* (Rachel Braun)
- *"StarCraft taught me how to cook. You have things that take different amounts of time, and you want them to land at the same time."* (Willie Williams)
- *"The LLMs spontaneously develop strategies that look like 'reasoning' to humans."* (Andrej Karpathy)
- *"Games reward tracking context, planning responses, and navigating shifting alliances — exactly the capabilities labs are trying to imbue in their models."*
- *"Less scraping the web, more learning by doing."*

## Named entities

**People:** Alex Duffy, Willie Williams, Daniel Rodrigues, Katie Parrott, Rachel Braun, Andrej Karpathy, John F. Kennedy, Henry Kissinger.
**Games:** Diplomacy, Hanabi, Wordle, Bad Cards, StarCraft, Pokémon.
**Models / tools:** Qwen3-235B, Trinity Large (Arcee), Claude, ChatGPT.
**Benchmarks:** Tau2, AssetOpsBench, LM Arena.
**Orgs:** Good Start Labs, Alibaba Cloud, Anthropic, OpenAI, DeepMind, Arcee, IBM, Every.
**Concepts:** reinforcement learning, verifiable tasks, crowdsourced benchmarking, transfer learning.

## Practical implications

1. **Curriculum design > scale.** Game-like environments with clear scoring incentivize desired behaviors more efficiently than another trillion tokens of web text.
2. **Feedback environments matter.** Practice + explicit outcome feedback differs fundamentally from next-token prediction on static datasets.
3. **Skills transfer.** Strategic gameplay capability shows up in customer support, operational monitoring, planning. Train *behaviors*, not just domain facts.
4. **Generate fresh data via play.** Real users in games produce preference data that web scraping can't, and fresh evaluation data that static benchmarks lack.
5. **Combine, don't replace.** Game-RL + traditional pretraining both contribute; neither alone maxes out capability.
6. **Open environments matter.** Arcee opening Diplomacy training environment lets the broader community improve models.

## Why this matters for `sahana-wiki`

Sister piece to Duffy's *market for making AI better* (already in the wiki) and to Parrott's *board games and AI*. Together they form a triangle: (1) Duffy on the *macro market* for high-quality data, (2) Duffy here on a *specific mechanism* (games as curriculum), (3) Parrott on *games as a frame for individual users* designing their own AI systems. The connecting concept is that *playing* — interacting with a system that scores you — generates the kind of structured feedback both models and humans need to actually improve.

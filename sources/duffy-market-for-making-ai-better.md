---
title: The Market for Making AI Better
url: https://every.to/playtesting/the-market-for-making-ai-better
date: 2026-04-10
summary: Alex Duffy (Good Start Labs) on how high-quality, curated training data is becoming a serious market. Specialized small models trained on professional operational datasets can beat frontier models in their domain at lower cost. Reddit, Shutterstock, News Corp already make hundreds of millions licensing data; Mercor, Turing, Handshake, and SID.ai are aggressively buying access to operational data from individuals and companies.
tags: [agent-native, training-data, every, alex-duffy, data-licensing]
---

# The Market for Making AI Better

By **Alex Duffy** (Good Start Labs). Every Playtesting column, April 10, 2026.

## Thesis

The dominant investment thesis — *"scale and compute beat everything else"* — is being challenged by market evidence: specialized models trained on small, high-quality, curated datasets are outperforming frontier models in domain-specific work. **Curated training data is the new growth market**, and any organization with operational datasets is sitting on a salable asset.

## Evidence

- A model trained on **fewer than 2,000 examples** from practicing lawyers, bankers, and consultants beat all but the best frontier models on corporate legal work — at significantly lower cost on open-source infrastructure (case study: AppliedCompute).
- Reddit, Shutterstock, and News Corp generate **hundreds of millions annually** licensing data to AI companies; contracts grow ~20% per year.
- Duffy's friend received an unsolicited inquiry from a data buyer offering compensation for **specific operational metrics** (Dropbox file counts, Zendesk ticket data).

## Players

| Type | Names |
|---|---|
| Data buyers | Mercor, Turing, Handshake, SID.ai |
| Content licensors | Reddit, Shutterstock, News Corp, academic publishers |
| Domain providers | Documentary archives, game studios, enterprise SaaS users |
| Author's company | Good Start Labs (uses *games* to train AI models) |

Mercor was valued at $10B before a security breach (4TB of data lost); competitors are rushing to fill the gap.

## Memorable framings

- **"Input company"** — News Corp's CEO described their organization as *"essentially an input company [for AI]"* — content as primary value, distribution as secondary.
- **Specialized vs. frontier** — frontier LLMs train on internet-scale data; domain models train on concentrated, high-quality professional datasets. Different curves, different cost structures.

## Why this matters for `sahana-wiki`

This is the *supply side* of the agent-native economy that Sahana's essay describes. Her [[concepts/super-porous-ecosystem]] frames products as compositions of swappable atoms (prompts, tools, skills, MCPs, agents). Duffy's piece adds: the **data** that trains those atoms is itself a market, and curated proprietary data may matter more than scale. A wiki like this one — accumulated, structured, high-signal — is exactly the shape of asset Mercor and friends are buying.

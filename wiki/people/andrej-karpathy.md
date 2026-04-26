---
title: Andrej Karpathy
category: people
tags: [ml, ai-researcher, pkm]
created: 2026-04-25
updated: 2026-04-25
---


# Andrej Karpathy

ML researcher and educator; founding member of OpenAI, former Director of AI at Tesla. Originator of the {{source:karpathy-pkm-gist}}LLM-as-librarian PKM pattern{{/source}} this wiki is built on.

## Relevance to this project

Karpathy's gist on personal knowledge management is the direct inspiration for `sahana-wiki`. He describes a workflow where an LLM agent maintains a folder of markdown files, integrating new sources, flagging contradictions, and synthesizing answers — all while the human curates sources and asks questions.

His daily setup: {{source:karpathy-pkm-gist}}"LLM agent open on one side, Obsidian open on the other. The LLM makes edits based on our conversation, and I browse the results in real time."{{/source}}

## Sibling patterns

Karpathy's PKM gist describes the same insight that [[people/kieran-klaassen]] later named {{source:klaassen-folder-is-the-agent}}"the folder is the agent"{{/source}}, framed from the engineering side: a model with enough rich, structured context becomes a specialist without orchestration. The wiki is to PKM what Cora's repo is to email — see [[concepts/folder-is-the-agent]].

## Related

- [[concepts/llm-as-librarian]] — the pattern itself
- [[concepts/folder-is-the-agent]] — the same idea from the eng side
- [[concepts/personal-knowledge-management]] — the broader practice
- [[projects/sahana-wiki]] — this project

---
title: Agentic Search (AI Dev Con 2026)
url: ""
date: 2026-05-03
summary: >
  Talk notes from AI Dev Con 2026 framing context — not reasoning — as the
  hard problem in agentic systems. Distinguishes context engineering (human)
  from harness engineering (automated), argues for pushing agentic search
  closer to the data store at enterprise scale, and predicts continuous-rather-than-reset
  context plus continual learning living *in* context.
tags: [agentic-search, context-engineering, rag, vector-search, harness, conferences]
kind: note
---

Talk notes from AI Dev Con 2026 — *Agentic Search*.

**Why context is the hard problem**
- Most AI failures today are not reasoning failures; they are context failures.
- LLMs are stateless. They have no idea about your org's data, customers, or operational history.
- Context injection bridges the gap: retrieving relevant and current info to provide alongside each query at inference time.
- Vector similarity search makes this possible at scale.
- *Where* that search runs and *where* the data lives is now an architectural decision.

**The problem with context now**
- AI is basically context + reasoning.
- Agents *read* context (what should I reference?) and *write* context (where should I store?).
- Throwing it all into one context leads to context rot.

**What we need**
- **Context Engineering** (human does the engineering) vs. **Harness Engineering** (the harness does the engineering).
- Powerful agents that manage the whole spectrum of agentic search:
  - **Complexity:** simple query (capital of India) vs. complex query (what is the next strategic move our company should make?).
  - **Info:** simple (a 10-page PDF) vs. lots (my whole company's data).
- It is more powerful to push agentic search closer to the database (for enterprises) to save on costs.

**What context engineering involves**
- User prompt
- System prompt
- Compressed history
- Environment state
- Available tools
- Memory system
- Agent-to-agent

**Predictions for the future**
- Context becomes *continuous* (push and pull, continuously steer) rather than full resets.
- Continual learning (weights and knowledge) will live *in* context.

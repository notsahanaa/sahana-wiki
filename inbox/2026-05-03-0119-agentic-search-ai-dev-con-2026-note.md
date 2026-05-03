---
captured_at: 2026-05-03T01:19:33.756Z
source: web
---
Agentic Search
(AI dev con 2026)

Why context is the hard problem
- Most AI failures today are not reasoning failures; they are context failures
- LLMs are stateless. They have no idea about your org's data, customers, operational history
- Context injection bridges the gap: retrieving relevant and current info to provide alongside each query at inference time
- Vector similarity search makes this possible across large scale
- Where that search runs and where the data lives is now an architectural decision

The problem with context now
- AI is basically context + reasoning
- Agents read (what should I reference) and write context (where should I store)
- Throwing it all into one context leads to context rot.

What we need
- Context Eng (human does the Eng), harness Eng (the harness does the Eng)
- Powerful agents that manage the whole spectrum of context search: complexity: simple query (capital of India) vs complex query (What is the next strategic move our company should make)
info: simple (a 10 page PDF) vs lot (my whole company data)
- It is more powerful to push agentic search closer to the database (for enterprises) to save up on costs.

What Context Eng Involves
- User Prompt
- System Prompt
- Compressed History
- Environment State
- Available Tools
- Memory System
- Agent to Agent


Prediction for the future
- Context becomes continuous (push and pull, continuously steer) not full resets
- Continual learning (weighs and knowledge) will live in context

---
title: The Three Components of an Agent
url: ''
date: 2026-05-03
summary: >
  A concise structural breakdown of what an agent actually is: a Model (reasoning engine), a Runtime (loop/context/tool-call manager), and Tools (external capabilities like MCP servers, APIs, code execution). Argues the agent is the whole system, not just the model.
tags: [agent, architecture, runtime, tools, mcp]
kind: note
---

An agent is not just a model. It is a model inside a system with three distinct parts: the **Model** (reasoning/language engine), the **Runtime** (manages loop, context, tool calls, retries, state), and **Tools** (external capabilities — MCP servers, APIs, CLIs, code execution, custom tools).

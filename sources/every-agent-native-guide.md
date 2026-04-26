---
title: Agent-Native Architectures (Every guide)
url: https://every.to/guides/agent-native
date: 2026-04-25
summary: Dan Shipper and Claude's co-authored guide arguing that software should be architected with agents as first-class citizens. Introduces five principles (parity, granularity, composability, emergent capability, improvement over time) and the rule that to change behavior you should edit prompts, not refactor code.
tags: [agent-native, architecture, claude-code, dan-shipper]
---

# Agent-Native Architectures

Co-authored by **Dan Shipper** (Every founder) and **Claude**. Every Guide format. Synthesizes principles tested in Every's products (Reader, Anecdote) plus emerging ideas.

## Core thesis

Software should be architected with agents as first-class citizens, not add-ons. The foundational insight: *"A really good coding agent is actually a really good general-purpose agent."* The architecture powering Claude Code generalizes to file organization, reading lists, and workflow automation.

## Five principles

1. **Parity** — whatever users do via UI, agents do via tools. *"Without it, nothing else matters."*
2. **Granularity** — tools are atomic primitives. Judgment lives in prompts, not bundled into tools.
3. **Composability** — atomic tools + parity means new features come from prompts alone, not new code.
4. **Emergent capability** — agents accomplish unanticipated tasks by composing existing tools. User requests reveal latent demand.
5. **Improvement over time** — apps get better without shipping code, via accumulated context, prompt refinement, and user-level customization.

## The behavior-change litmus test

> *"To change behavior, do you edit prompts or refactor code?"*

In agent-native systems, you edit prompts.

## Files as universal interface

Files beat databases for many use cases because:
- Agents already know file ops (bash primitives).
- Content is inspectable and portable.
- Sync (e.g. iCloud) works naturally.
- Self-documenting structure beats opaque queries.

Proposed shape: entity-scoped directories `{entityType}/{entityId}/`, markdown for human content, JSON for structured data, checkpoint files for session state.

## From primitives to domain tools

Progression: (1) prove architecture with pure primitives (bash, file ops); (2) add domain tools for common patterns (vocabulary anchoring, guardrails, efficiency); (3) graduate to optimized code where performance matters, with primitive fallback.

Rule: domain tools represent **one conceptual user action**.

## Approval framework

Match governance to action type:

| | Easy reversibility | Hard reversibility |
|---|---|---|
| **Low stakes** | Auto-apply (organize files) | Quick confirmation (publish) |
| **High stakes** | Suggest + apply (code changes) | Explicit approval (send email) |

Self-modifying agents must remain legible: visible change log + rollback.

## Mobile patterns (iOS)

- **Checkpoint/resume** — save messages, iteration count, task list when backgrounded.
- **iCloud-first storage** — Container as primary; local Documents as fallback; transparent migration layer.
- **Background execution** — use the ~30s of granted background time to finish current tool call and checkpoint.
- **Storage abstraction** — never expose raw FileManager.

## Implementation patterns

### Context injection — the `context.md` pattern
Single file containing: who I am, user prefs, what exists in the system, recent activity, guidelines.

### Agent-to-UI events
Stream thinking, current tool, tool results, text, status updates. *"Silent agents feel broken. Visible progress builds trust."*

### Explicit completion signals
Don't detect completion heuristically. Use `.success()` (continue), `.error()` (retry), `.complete()` (stop).

### Dynamic capability discovery
Instead of one tool per API endpoint: `list_available_types()` + `read_data(type)`. Agent then accesses things you didn't anticipate.

### CRUD audit
Common failure: shipping `create_note` and `read_notes` but forgetting `update_note`, leaving the agent unable to fix typos.

## Anti-patterns

1. Agent as router (only deciding which feature to call).
2. Build then bolt on agent.
3. Request/response thinking instead of loops pursuing outcomes.
4. Defensive tool design that over-constrains inputs.
5. Encoding edge cases in code rather than letting the agent judge.
6. Workflow-shaped tools that bundle decisions (`analyze_and_organize`).
7. Orphan UI actions the agent can't reach.
8. Context starvation — agent unaware of what's available.
9. Heuristic completion detection.

## The ultimate test

> *"Describe an outcome within your domain that you didn't build a specific feature for. Can the agent accomplish it in a loop? If yes — agent-native. If no — too constrained."*

## Memorable lines

- *"The agent is pursuing an outcome with judgment, not executing a choreographed sequence."*
- *"Files for legibility, databases for structure. When in doubt, files — they're more transparent and users can always inspect them."*
- *"Agent-native product development: build capable foundation, observe what users ask the agent to do, formalize patterns that emerge."*

## Why this matters for `sahana-wiki`

The wiki is already files-as-interface (markdown in folders) and the librarian pattern is parity-by-design (Claude can do anything to the folder a human could). Stage 4–5 of the roadmap (auto-ingest, agent-context APIs) maps directly onto the principles in this guide.

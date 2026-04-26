# Stage 0 — Raw Karpathy (skipped)

> Status: **skipped**. We went straight to Stage 1 on 2026-04-25 instead of validating the pattern in Obsidian first.

## What Stage 0 was meant to be

Karpathy's PKM gist describes a workflow where the wiki is *just a folder of markdown* and the viewer is *just Obsidian*. No custom code. The LLM librarian (Claude Code, in our case) edits files conversationally while the human watches in Obsidian on the other window. The schema doc (`CLAUDE.md`) tells the LLM how to organize.

The plan in `roadmap.md` listed Stage 0 as a 1-weekend validation step before writing any custom code. The point was to find out whether the librarian-LLM pattern actually feels good to use day-to-day for *this* user, before committing engineering time.

## Why we skipped it

Decided in a single back-and-forth on 2026-04-25: when the assistant explained Karpathy's setup and offered (1) plan-as-originally-described or (2) start with Karpathy-style first, the user replied **"yes. use auto mode to build stage one"**.

Implicit reasoning (not asked but consistent with the user's other choices in the conversation):
- The user wanted to see the system, not just simulate it.
- The visual reference (Farzapedia, emrah.ca) was already locked in as the target — Obsidian would have been a *different* visual aesthetic that wouldn't have transferred.
- The user was clear that the project would grow into Slack capture, agent context, and a hosted web app. Obsidian doesn't take you any closer to those.
- Auto mode was active; the user was optimizing for momentum.

This is a calculated skip, not an oversight. Worth flagging the risk: we built UI before validating the underlying workflow. If the librarian pattern turns out to feel wrong in practice, the UI will need rework. Mitigation: Stage 1 is small enough (~600 LOC of components + lib) that rework is cheap.

## What we kept from Stage 0

The Karpathy pattern's *content layer* survived intact and is in the repo today:

| File / dir | Purpose | Karpathy origin |
|---|---|---|
| `CLAUDE.md` | Schema + workflow instructions for the librarian LLM | Karpathy's "schema doc (CLAUDE.md or AGENTS.md)" layer |
| `index.md` | Catalog of every wiki page by category, one-line summaries | Karpathy's `index.md` |
| `log.md` | Append-only chronological log of ingests, queries, maintenance | Karpathy's `log.md` |
| `wiki/` | LLM-managed pages: entities, concepts, projects, books | Karpathy's "wiki layer" |
| `sources/` | Immutable raw clips, papers, notes | Karpathy's "raw sources" |
| `inbox/` | Un-ingested captures (used from Stage 2 onward) | Our addition (Karpathy ingests directly via chat) |

The three workflows (`ingest`, `query`, `lint`) defined in `CLAUDE.md` are lifted near-verbatim from the gist.

## What we replaced

| Karpathy uses | We use | Why |
|---|---|---|
| Obsidian as the viewer | Custom Next.js Wikipedia/Farzapedia-style UI | Visual control + future Slack / agent / hosted versions need a reachable web surface anyway |
| Obsidian's `[[wikilinks]]` and graph | Same `[[wikilinks]]` syntax in markdown, our renderer resolves them | Kept the syntax so files would still be Obsidian-compatible if we ever want to dual-use |
| Manual file ingestion via chat | Same — for now (Stage 1). Slack capture comes in Stage 2, automation in Stage 4 | Keeps Stage 1 small |
| Optional: Obsidian Web Clipper | Stage 3 browser clipper hitting `/api/clip` | Same reason as the viewer — own the surface |
| Optional: `qmd` (BM25/vector search) | Not yet — added at Stage 5 if search becomes a felt need | YAGNI per the roadmap's non-goals |

## Decisions captured for future stages

- The repo will *always* be a folder of markdown at heart. Even at Stage 6 when storage moves to Vercel Blob, markdown stays the source of truth.
- Other agents (Stage 5 — openclaw, blog writer, twitter writer) will read the wiki *as files* (via MCP server tools that walk the filesystem), not via a query language over a DB. This is only possible because we kept Karpathy's file-based layer.
- The schema doc (`CLAUDE.md`) is the single source of truth for "how the wiki is organized". Both interactive Claude Code sessions and future automated `lib/synth.ts` calls read it.

## What we didn't get from skipping

- **No baseline data on real friction points.** We don't know whether the friction is "I can't capture from my phone" or "I can't see the graph" or "I forget what I added". Stage 1 onward learns from *use*, not from controlled experiment.
- **No vibe-check on the librarian pattern itself.** Possible we discover at Stage 4 (auto-synthesis) that the LLM's choices about page boundaries don't match the user's mental model. Cheaper to find out in Obsidian first. Acceptable risk taken.

## If we had built Stage 0

It would have looked like:

```bash
mkdir sahana-wiki && cd sahana-wiki && git init
# Open the folder in Obsidian as a vault.
# Open Claude Code in the same folder.
# Hand-write CLAUDE.md, index.md, log.md.
# Drop a few sources into sources/.
# Tell Claude in chat: "I just added these, integrate them into the wiki."
# Watch the wiki/ files appear in Obsidian as Claude writes them.
# Use it for 1-2 weeks. Note frictions.
```

Total custom code: zero. Total time: ~1 weekend of setup + ~2 weeks of use. We replaced the "use it for 2 weeks" loop with "build the viewer, then use it for 2 weeks." Same observation period, just with our UI.

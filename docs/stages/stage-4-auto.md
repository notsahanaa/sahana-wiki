# Stage 4 — Auto-on-save synthesis

> Status: **planning** (2026-04-26). The synth engine itself landed early as part of Stage 2 (`/wiki-ingest`, commit `af132b3`), so this doc covers (1) how to automate the trigger, (2) cost economics, and (3) design decisions.

## Why this doc spans Stage 2 + Stage 4

`lib/synth.ts` already exists. It's the agentic ingest engine: loads `CLAUDE.md` + `index.md` as a cached system prompt, hands the model four tools (`read_file`, `list_directory`, `write_file`, `delete_file`) backed by the GitHub Contents/Tree API, runs the Sonnet 4.6 tool-runner loop, and batches every write/delete into one atomic GitHub commit.

The `/wiki-ingest` slash command (Stage 2's last shipped piece, see `lib/slack/handlers/ingest.ts`) already exposes this engine manually — you DM `/wiki-ingest` from Slack and the deployed Vercel function runs through the entire inbox.

**The cost analysis below applies to BOTH:**
- **Stage 2's `/wiki-ingest`** — every manual trigger. Already in production. Already requires `ANTHROPIC_API_KEY`.
- **All of Stage 4** — automatic triggers on every capture and/or cron schedule.

You cannot reason about Stage 4 economics without also reasoning about `/wiki-ingest` economics — they run the exact same code path. Whatever model + token cost applies to one applies to the other.

The original roadmap entry for Stage 4 ("chokidar watches `/inbox/`") is now superseded — Stage 2 shipped on Vercel, where there is no persistent disk and no long-running daemon. This doc replaces that line.

## What Stage 4 adds

A **trigger** that fires `ingestInbox()` without a human in the loop. Realistic options:

| Option | Trigger | Latency | Infra | Notes |
|---|---|---|---|---|
| **A. Inline on `/wiki-add`** | Slack capture commits → ingest fires in same `waitUntil` | seconds | none | Per-article. No batching. Loses cross-article context reuse. |
| **B. GitHub webhook on push** | Any push touching `inbox/*.md` → webhook → function | seconds | webhook secret, dedup logic | One chokepoint for Slack + future clipper. More plumbing. |
| **C. Vercel Cron** | `*/N * * * *` lists inbox, ingests batch | 0–N min | minimal | Best for batching + cache hits. Higher latency. |
| **D. Vercel Queues** | `/wiki-add` enqueues, worker drains | seconds | new product surface | Durable, retryable. Overkill at current volume. |

**Recommended: A + C.**

- **A as primary** — instant feedback in Slack (capture lands, ingest result message arrives ~30–90s later).
- **C as safety net** — `*/15 * * * *` cron drains anything stuck in the inbox (a failed inline ingest, a non-Slack capture from a future clipper, etc.). No-op when inbox is empty.
- `/wiki-ingest` slash command stays as a manual override / replay tool.

## The engine (already built)

No new engine work needed. `ingestInbox(paths: string[])` in `lib/synth.ts:68` does the job. Stage 4 is mostly wiring:

- **Trigger A:** `lib/slack/handlers/add.ts` calls `ingestInbox([newPath])` after the capture commit lands, posts the result back to the Slack channel.
- **Trigger C:** new route `app/api/cron/ingest/route.ts` lists `inbox/`, calls `ingestInbox(allPaths)` if non-empty, no-ops otherwise. Add `crons` entry to `vercel.ts` (or `vercel.json`).

Cap work per invocation at 5 inbox files so a backlog doesn't blow the 300s function timeout — overflow waits for the next tick.

## Cost economics

The cost story depends entirely on **which compute path** the synthesis runs under. Three paths exist; they're not mutually exclusive.

### Path 1: Anthropic API (pay-per-token)

This is what `lib/synth.ts` already does. Sonnet 4.6 pricing:

- Input: $3 / M tokens
- Output: $15 / M tokens
- Cache write (5-min ephemeral): 1.25× = $3.75 / M
- Cache read: 0.1× = $0.30 / M

**Per-ingest token shape:**
- System prompt = `CLAUDE.md` + `index.md` ≈ 5–10K tokens today, sent on every call (cached in 5-min window).
- Agentic loop = 8–15 tool round-trips per article, conversation grows each turn.
- Adaptive thinking + `effort: "high"` (set in `lib/synth.ts:228-229`) inflates output.

**Per-article cost:**

| Article shape | Tool rounds | Cost |
|---|---|---|
| Short note, 1–2 wiki touches | 5–7 | ~$0.10–0.20 |
| Typical clipped article, 2–4 wiki touches | 8–12 | ~$0.25–0.45 |
| Rich essay, 5–10 wiki touches | 12–20 | ~$0.50–0.80 |

**Midpoint: ~$0.30/article.**

| Daily rate | Cost/day | Cost/month |
|---|---|---|
| 5/day (current) | ~$1.50 | ~$45 |
| 20/day (Stage 3 realistic) | ~$6 | ~$180 |
| 100/day (heavy clipper, hypothetical) | ~$30 | ~$900 |

**Three big variables:**
1. **Article richness.** A 200-char note ≈ $0.10. A 5K-word essay touching 8 pages ≈ $0.60+. Mix matters more than count.
2. **Cache hits.** Ephemeral cache is 5 min. Cron at ≤4-min interval keeps the system prompt warm; sporadic per-article ingests pay full price each time.
3. **`index.md` size.** Sent on every call. Today ~few KB; after a year of capture could be 30K+ tokens and dominate the bill. **Keep `index.md` lean — one line per page, no prose.**

**Batched vs sequential within one window:**
- 5 articles in 1 ingest call ≈ baseline (cheapest, model reuses intra-call context across articles).
- 5 separate calls within 5 min ≈ +5–15% (cache softens system-prompt overhead).
- 5 separate calls spread over 30+ min ≈ +25–50% (every call pays full system price; no context reuse).

### Path 2: Claude Code Max subscription (current state — manual ingest)

When you ingest by chatting with Claude Code in this terminal (e.g. "I just read X, integrate it"), it runs under your Max subscription. **Marginal $: $0.** Constraint is rate-limit budget, not money.

Each conversational ingest burns ~30–60 model turns and ~50–200K cumulative tokens of session budget. ~100K tokens/ingest as a midpoint.

**5-hour rolling window ("session") limit:**
- **Max 5x** ($100/mo): roughly 1–5M tokens of Sonnet per 5-hour window. **100 ingests = ~10M tokens → hits the wall around ingest #10–30.** Hard error ("rate-limited, retry in N min"), and *all your other Claude Code work in that window is also blocked.*
- **Max 20x** ($200/mo): roughly 5–15M tokens per 5-hour window. **Wall around ingest #50–100.** Possible if articles are short, but tight.

**Weekly limit** (introduced August 2025):
- Max 5x: ~30–100M tokens/week. 100 ingests in a day = **10–33% of weekly budget**. Sustainable 3–7 such days/week before weekly wall.
- Max 20x: ~100–300M tokens/week. 100 ingests/day = **3–10% of weekly**. Comfortable.

**Key takeaway:** **Session is the binding constraint, not weekly.** A 100-ingest burst is bad for the session; the same 100 paced over 16 waking hours (~6/hour) fits easily on either plan.

**Structural caveat:** the Claude Code subscription **cannot run on Vercel.** The `claude` CLI doesn't exist in serverless functions, and there's no way to authenticate the subscription from a function. Subscription-cost ingest is **only available for manual or local-laptop trigger paths.** Stage 4's cloud-hosted auto-ingest cannot use this path.

### Path 3: Local cron + `claude -p` (subscription, automated)

Tiny daemon on your laptop polls GitHub for unprocessed inbox files, runs `claude -p` headless against the local repo to ingest, pushes the result. Uses subscription. $0 marginal cost.

**Pros:**
- $0 marginal cost.
- Automatic when the laptop is on.

**Cons:**
- No ingest while laptop is asleep / traveling.
- Defeats Stage 6 (cloud hosting) — laptop dependency vanishes there, you'd switch to API anyway.
- Dual infrastructure (laptop daemon + Vercel app) is more to maintain.

**When to choose this path:** if you sustain >50/day on Sonnet *and* you don't yet care about Stage 6 *and* your laptop is reliably on during waking hours.

## Cost cutting

The cost numbers above are *baseline* — what the system costs if you ship Stage 4 with no optimization beyond what's already in `lib/synth.ts`. Two clusters of levers can pull per-ingest cost down without trading quality. They compound: combining both gets to roughly half the baseline cost.

### Ingestion batches

Lever: **when does the synth call actually fire?**

The Stage-4 default (trigger A + C) pays per-article: every `/wiki-add` triggers an inline ingest, paying the full system-prompt + setup overhead each time. The savings here come from the **5-min ephemeral cache window** in the Anthropic API — any cluster of ingest calls within 5 min reads the system prompt at 0.1× rate instead of 1× write rate. Sequential calls spread across the day get cache misses every time.

| Trigger config | Latency | Savings vs inline |
|---|---|---|
| Inline-on-`/wiki-add` | seconds | baseline |
| Hourly cron + manual override | up to 1h | 5–15% |
| **Nightly cron + manual override** *(chosen)* | up to 24h | 10–25% |
| Daily $ cap with overflow queue | latency on overflow days | backstop, not direct savings |

**Why nightly is the cheapest config:** the day's captures process in one cache-warm batch, system prompt sent at full price exactly once. Plus, multi-article batches let the model reuse intra-call context — if articles 1 and 3 both touch `concepts/agent-native.md`, the page is loaded once.

**Quality consideration:** batching is invisible to quality at small batch sizes (≤10 articles). Above ~15 in one call, the tool-runner loop runs longer and per-article quality can drift slightly. Mitigation: cap any one `ingestInbox()` call at 10 articles; overflow waits for the next tick.

**Sample math** at 30 articles/day, $0.30/article midpoint ($9/day baseline):
- Inline-on-add: ~$9/day
- Hourly cron: ~$7.65–$8.55/day
- **Nightly cron: ~$6.75–$8.10/day**

Batching alone is a modest lever. Combined with model routing (next subsection), it compounds.

**Manual override stays:** `/wiki-ingest` slash command remains unchanged so urgent captures can bypass the cron and synthesize on-demand.

### Models

Lever: **which model does which part of the pipeline?**

`lib/synth.ts` today runs every step on Sonnet 4.6 ($3 / $15 per M). Haiku 4.5 ($1 / $5 per M) is 3–5× cheaper and more than capable of the mechanical and routing work that surrounds the actual synthesis. The right framing isn't "Haiku as bouncer" — it's "Haiku as prep cook + cleanup crew, so Sonnet only does what Sonnet is uniquely good at."

#### What Sonnet should keep doing

- Writing the wiki prose itself — synthesis voice, phrasing decisions, emphasis.
- Judgment calls about how to integrate a new claim with existing pages.
- Anything where the *writing* quality matters.

#### Pre-Sonnet Haiku roles (Haiku runs first, Sonnet runs less)

- **Pre-routing.** Haiku reads the article + `index.md` and outputs: "Likely affected pages: `concepts/agent-native.md`, `concepts/personal-knowledge-management.md`. Likely new page: `concepts/social-dandelions.md`." Sonnet starts its loop already knowing where to look — skips most of the exploratory `list_directory` + `read_file` scout phase. **Highest-leverage Haiku role; ~15–30% savings, no quality loss.**
- **Pre-planning.** Haiku reads article + suggested neighbors and outputs a structured *change plan*: "Update `agent-native.md`: add section under §Origins. Update `karpathy.md`: append one sentence. Create `social-dandelions.md`." Sonnet executes the plan instead of designing it from scratch. The planning step — usually the most token-heavy reasoning — happens at Haiku rates.
- **Long-article digest.** For articles >5K tokens, Haiku produces a structured "key claims, key quotes, key entities" digest. Sonnet synthesizes from the digest + selective verbatim sections, not the full body. Cuts 30–50% of input tokens on long-form essays without losing what Sonnet needs.
- **Article-type classification.** "This is a person profile / concept essay / tool review." Routes to a tailored system prompt for that page type, instead of one universal prompt.

#### Post-Sonnet Haiku roles (Haiku runs after, Sonnet writes less)

- **`{{source:slug}}` highlight tagging.** Sonnet writes prose without worrying about source tags. Haiku takes the draft + source article and wraps grounded phrases. Pattern-matching at scale — Haiku territory.
- **`[[wikilink]]` insertion.** Sonnet writes flat prose. Haiku takes the draft + list of existing wiki page titles and inserts wikilinks where known titles appear.
- **Source frontmatter generation.** When promoting inbox → sources, Haiku writes the YAML frontmatter (`title`, `date`, `summary`, `tags`, `kind`, `byline`).
- **`index.md` and `log.md` updates.** After Sonnet writes the wiki bodies, Haiku does the catalog and log surgery. Mechanical edits.
- **Cross-page consistency check.** After all writes, Haiku reads new + neighboring pages and flags contradictions ("the new page says X but `concepts/Y.md` already says not-X"). Posts the flag back to Slack — doesn't auto-fix.

#### Bouncer roles (skip Sonnet entirely — heuristic, not even Haiku)

- **URL deduplication.** Before any synth, check if `sources/` already contains a file with the same URL frontmatter. If so, log "duplicate, skipping" and delete the inbox file.
- **Thinness gate.** If extracted body <500 chars, promote inbox → sources as a stub. No Sonnet.
- **`[skip]`-tagged captures** bypass synth entirely, just promote to sources.

#### The shape of the savings

Stacked, the model-routing levers compress Sonnet's job to: *"given this plan and these specific wiki pages, write the prose."* That's the part Sonnet is genuinely better at; everything around it is mechanical and Haiku-able.

Realistic compounding: with most of these, Sonnet's per-article token spend roughly halves. Combined with article preprocessing (shorter inputs) and tighter discipline ("≤3 wiki pages per article unless justified"), the math gets to **~$0.10–0.15/article midpoint** instead of ~$0.30 — a 50–60% reduction without touching quality, because Sonnet is still doing the hard thinking, just on a smaller, better-prepared canvas.

#### Quality risk

Low for prep/cleanup roles — Haiku is genuinely good at routing, classification, pattern-matching. Higher for any role where Haiku's call *constrains* Sonnet's options (e.g., pre-routing misses a wiki page Sonnet should have touched). **Mitigation:** make pre-routing a *hint*, not a hard constraint. Sonnet can still `list_directory` and `read_file` if it disagrees with the route. The hints reduce *typical* exploration, not bound it.

#### What to ship first

Tier-1 candidates (low effort, no quality risk):
1. URL deduplication gate (no model call at all).
2. Thinness gate (no model call at all).
3. Per-ingest cost log line in `log.md` — measurement before optimization.

Tier-2 (after measuring):
4. Pre-routing via Haiku (highest-leverage single addition).
5. Post-Sonnet `{{source}}` and `[[wikilink]]` tagging via Haiku.

Tier-3 (revisit if costs spike or wiki grows large):
6. Pre-planning, long-article digest, cross-page consistency check.

## Recommendation

1. **Default to API path** for Stage 4. Set `ANTHROPIC_API_KEY` in Vercel env (Production + Preview).
2. **Trigger: A + C.** Inline-on-`/wiki-add` for instant feedback, `*/15 * * * *` cron to drain stragglers.
3. **Cost-monitoring line in `log.md`** per ingest, with token usage from the API response: `2026-04-26 ingest: 3 files · 87K input (52K cached) · 4.2K output · ~$0.18`. Free to add, saves guessing later.
4. **Bound work per call** to 5 inbox files per `ingestInbox()` invocation.
5. **Keep manual ingest as fallback.** If API costs ever spike unexpectedly, disable the cron with an env flag and ingest manually from Claude Code again. Reversible.

At your current capture rate (3–5/day), Path 1 costs **$1–3/day, ~$30–90/month** — basically free. The 100/day analysis is for "Stage 3 clipper takes off" scenarios, not the design baseline.

## Open decisions

- **Cron interval.** 15 min (latency-tolerant, fewer invocations) vs 4 min (cache-warm, more frequent). Leaning 15 min — inline trigger handles instant cases.
- **Debounce on inline trigger.** Should `handleAdd` wait 30–60s in case more `/wiki-add`s arrive, so they batch? Probably yes, defer until burst patterns are observed.
- **Slack notification on cron-ingest result.** `/wiki-ingest` posts to the channel. Should auto-cron-ingest do the same, or stay silent unless something fails? Leaning silent-on-success to avoid channel noise.

## Verification plan

1. Manual trigger via `/wiki-ingest` still works on the deployed function (regression check).
2. Drop a markdown file in `inbox/` via direct GitHub commit → cron picks it up within 15 min → wiki gets updated, source promoted to `sources/`, log entry appears.
3. `/wiki-add` from Slack → ingest fires inline → second Slack message reports the synthesis result within ~90s.
4. `log.md` shows token-usage line per ingest.
5. With `ANTHROPIC_API_KEY` deliberately unset, both triggers fail gracefully (already handled in `lib/synth.ts:68-78`).

## Out of scope

- Vector search / embeddings (revisit at Stage 5 if needed).
- Conflict resolution if two ingests race the same wiki page (current GitHub Tree commit fails on stale base SHA — surfaces as an error, manual re-run resolves).
- Multi-model routing (Haiku for triage, Sonnet for synthesis). Optimization for later if costs exceed expectations.
- Human-in-the-loop ingest review before commit. Possible Stage 5+ idea — for now, model writes directly.

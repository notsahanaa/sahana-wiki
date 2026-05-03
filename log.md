# Wiki Log

Append-only chronological log of ingests, queries, and maintenance.

---

## 2026-04-25

- **Bootstrap.** Stage 1 scaffolded: Next.js 16 viewer with three-column Farzapedia-style layout. Seeded `wiki/people/andrej-karpathy`, `wiki/concepts/personal-knowledge-management`, `wiki/concepts/llm-as-librarian`, `wiki/projects/sahana-wiki` from `sources/karpathy-pkm-gist`.
- **Ingest: Every "agent-native" cluster.** Added `sources/every-agent-native-guide`, `sources/parrott-four-apps`, `sources/klaassen-folder-is-the-agent`, `sources/parrott-25-person-four-agents`. Created `wiki/people/{dan-shipper, kieran-klaassen, katie-parrott}`, `wiki/concepts/{agent-native, folder-is-the-agent, compound-engineering}`, `wiki/projects/{every, cora, monologue}`. Cross-linked from existing `wiki/people/andrej-karpathy`, `wiki/concepts/{llm-as-librarian, personal-knowledge-management}`, `wiki/projects/sahana-wiki` (positioned the project as both a librarian-wiki and a folder-agent).
- **Ingest: Notion Custom Agents Camp.** Added `sources/notion-custom-agents-camp` (Every × Notion, April 3 2026, 1-hour virtual, Brian Lovin co-host). Updated `wiki/projects/every` to highlight the camp date and host. Flagged a name-spelling contradiction with `sources/parrott-25-person-four-agents` (Brian Lovin vs. Brian Levin).

## 2026-04-26

- **Stage 2 shipped on Vercel.** Slack capture is live at `https://sahana-wiki.vercel.app/api/slack/commands`. `/wiki-commands`, `/wiki-list`, `/wiki-dive`, `/wiki-add` all working end-to-end. `/wiki-qna` deferred to Stage 4.
- **Ingest: 3 Slack-captured inbox files.**
  - `inbox/2026-04-26-0727-...the-folder-is-the-agent-clip.md` — duplicate of existing `sources/klaassen-folder-is-the-agent`. Discarded without becoming a new source.
  - `inbox/2026-04-26-0728-the-agent-space-an-overview-april-note.md` — Sahana's own essay from her *paradigms* newsletter (April 12, 2026). Promoted to `sources/sahana-paradigms-agent-space-2026-04-12`. Created four new concept pages from it: `wiki/concepts/{hypercreativity, one-person-studios, taste-as-skill, super-porous-ecosystem}`. First time the wiki hosts Sahana's own writing as a primary source — `wiki/projects/sahana-wiki` updated to reflect that shift.
  - `inbox/2026-04-26-0730-...the-market-for-making-ai-better-clip.md` — bare reference to an Alex Duffy article on every.to. Re-fetched via WebFetch and promoted to `sources/duffy-market-for-making-ai-better`. `wiki/projects/every` updated to count it as the 5th Every source.
- **Cross-refs:** `wiki/concepts/agent-native` got a new section weaving in Sahana's user-side framing (interactions cut down, products as evolving entities) and pointers to the four new concept pages.
- **Inbox cleanup:** all three inbox files removed (`git rm`). Inbox is back to empty + `.gitkeep`.
- **Known issue (NOT fixed in this ingest):** `/wiki-add <URL>` consistently bare-references because jsdom's `html-encoding-sniffer` does `require()` of an ES module on Vercel and throws `ERR_REQUIRE_ESM`. Fix candidates: replace jsdom with `linkedom`, or override the transitive dep. Stage 3 (browser clipper) bypasses this entirely, so deferring the decision.
- **Stage 2.5: jsdom → linkedom.** Sahana pushed back on the "defer to Stage 3" call: Slack /wiki-add and the future browser extension cover different surfaces, both need to work. Replaced jsdom with linkedom in `lib/clip.ts` (with `injectBase()` helper to preserve relative-link resolution); dropped jsdom from `next.config.ts` `serverExternalPackages`. Smoke-tested locally on the two URLs that previously bare-referenced — both extract cleanly. Stage 2 retro updated to mark the issue resolved.
- **Bug fix: `/wiki-dive` full-path lookup.** `findPage()` was calling `slugify()` on the whole topic string, which strips `/` since it's not a word char — so `/wiki-dive concepts/one-person-studios` returned "no page named ..." even though the page existed. Extracted a `slugifyPath()` helper that splits on `/` and slugifies each segment. Now you can deep-dive at any level of the hierarchy: terminal slug (`one-person-studios`), full path (`concepts/one-person-studios`), or title (`One Person Studios`). Smoke-tested 7 input variations, all resolve correctly.
- **Ingest: Lewis Kallow on social dandelions.** First inbox capture after the linkedom fix — and it actually extracted (22KB of clean markdown, byline included). Promoted to `sources/kallow-social-dandelions`. Created `wiki/concepts/social-dandelions` (consolidates the central concept + complex contagions + wide bridges) and `wiki/people/lewis-kallow`. Cross-linked from `wiki/concepts/{agent-native, taste-as-skill}` and `wiki/projects/every` (now 6 Every sources). The concept page positions sociology as a sister claim to taste — both are "remaining edges" when code is commoditized.
- **Schema change: dropped the people category.** The librarian now extracts only `concepts/` and `projects/` (plus `books/` reserved). Deleted all 5 `wiki/people/*.md` pages (andrej-karpathy, dan-shipper, katie-parrott, kieran-klaassen, lewis-kallow) and stripped every `[[people/...]]` wikilink across 11 concept/project pages, replacing each with the person's display name as plain text. Attribution now lives inline via `{{source:...}}` highlights and the source-card byline. Updated `lib/synth.ts` system preamble, `CLAUDE.md` schema doc, `components/TopicTree.tsx` + `lib/slack/handlers/list.ts` category arrays, and `index.md` (removed the People section). Stage-1, stage-2, and stage-4 docs updated to match. Rationale: people pages duplicated work the source bylines already do, and the librarian was burning ingest cycles maintaining biographical drift.
- **Ingest: 8-article Every batch (manual, conversational).** Sahana dropped a list of 9 every.to URLs; one (`how-to-build-agent-native-lessons-from-four-apps`) was already covered by `sources/parrott-four-apps`, so 8 new captures. Promoted to:
  - `sources/tina-he-boring-businesses` — Tina He's thesis-column piece on AI-era moats (knowledge compounders, workflow commons, reality's gatekeepers, marketplaces, vertical transformers).
  - `sources/every-claw-school-guide` — Every's OpenClaw "Comprehensive Guide for Beginners" (Shipper + Williams + R2-C2 + Laz; framework by Peter Steinberger).
  - `sources/parrott-ai-consumed-my-time` — *"AI Was Supposed to Free My Time. It Consumed It"*, with the Margot-night anecdote.
  - `sources/parrott-board-games-and-ai` — board-game vocabulary (components/moves/sequencing/victory) as a teach for AI systems.
  - `sources/parrott-claude-every-standards` — encoding Every's editorial standards into Claude; voice vs. style.
  - `sources/duffy-board-game-trained-ai` — Qwen3-235B fine-tuned on *Diplomacy*; >10% gains on other games + transfer to Tau2 (customer support) and AssetOpsBench (industrial ops).
  - `sources/parrott-ai-autopilot` — fluency = truth bias, the duplicate-assignment incident, three cognitive forcing functions.
  - `sources/parrott-writing-with-ai-harder` — multi-stage writing pipeline rebuttal to McArdle/Alter; "Asshole" persona for argument soundness.
- **New wiki pages from this batch (5):**
  - `wiki/concepts/boring-businesses` — Tina He's five archetypes; framed as the demand-side mirror to `super-porous-ecosystem`.
  - `wiki/projects/openclaw` — the framework + Claw vocabulary (`SOUL.md`, cron, heartbeat, ClawHub, pairing mode); table of Every staff Claws (Margot, Klont, Zosia, Pip).
  - `wiki/concepts/ai-overwork` — Parrott's *consumed my time* piece consolidated; explicitly framed as the dark mirror of `hypercreativity`.
  - `wiki/concepts/ai-autopilot` — Parrott's autopilot piece; explicitly framed as the negative-space of `taste-as-skill`. Companion failure to `ai-overwork`.
  - `wiki/concepts/games-as-curriculum` — Duffy on RL-via-games; positioned as the third leg of the training-data triangle (with `duffy-market-for-making-ai-better` and `parrott-board-games-and-ai`).
- **Updated wiki pages (8):**
  - `wiki/concepts/taste-as-skill` — added voice/style section + critic-personas + Parrott encoding methodology + ai-autopilot pointer.
  - `wiki/concepts/compound-engineering` — added "worked example: writing" with Parrott's pipeline + the board-games framing as a usable opener.
  - `wiki/concepts/hypercreativity` — added "the dark mirror" section pointing to `ai-overwork`.
  - `wiki/concepts/super-porous-ecosystem` — added "the demand-side mirror" section pointing to `boring-businesses`.
  - `wiki/concepts/agent-native` — added "parity, reframed: messaging as the UI" (claws) + "oversight failures" (overwork + autopilot).
  - `wiki/concepts/one-person-studios` — added Claws as comms layer + "the cost worth naming" (Margot incident → ai-overwork).
  - `wiki/concepts/folder-is-the-agent` — added `SOUL.md` row to the patterns table; openclaw cross-link.
  - `wiki/projects/every` — bumped from 6 → **15 Every sources** (largest single-publication concentration in the wiki); added "building a serious editorial system" section + Proof tooling note + recurring-byline expansion.
  - `wiki/projects/cora` — added "Klaassen's personal stack" mentioning Klont (his Claw).
- **index.md updated.** Added 4 new concept entries (`boring-businesses`, `games-as-curriculum`, `ai-overwork`, `ai-autopilot`) and 1 new project (`openclaw`). Bumped Every blurb to "fifteen foundational sources." Refined `taste-as-skill` blurb to mention the voice-vs-style distinction.
- **Cross-cutting framings recorded:**
  - Sahana's *super-porous-ecosystem* (supply side) ↔ Tina He's *boring-businesses* (demand side) — the two halves of "where does value go in the agent era."
  - *hypercreativity* ↔ *ai-overwork* — same architecture, opposite mood.
  - *taste-as-skill* ↔ *ai-autopilot* — taste only counts if exercised; autopilot is the failure mode where the muscle atrophies.
  - *folder-is-the-agent* (project-scoped) ↔ *SOUL.md* (person-scoped, OpenClaw) — same pattern, different scope.
- **Notes for future ingests / lint:**
  - `wiki/concepts/llm-as-librarian` still references `{{source:karpathy-pkm-gist}}` and `{{source:farzapedia-screenshot}}` — both source files were deleted upstream of this ingest (visible in `git status`). Pre-existing and unrelated to this batch; flag for next lint pass.
  - Bylines now also include **Tina He** (thesis), **Peter Steinberger** (OpenClaw creator, no Every byline but central to the framework), and (already present) **Alex Duffy** (now 2 sources).

## 2026-04-26 — Cluster taxonomy introduced

- Created `wiki/clusters.yml` with five clusters: agentic-coding, paradigms, moats, anti-patterns, ai-capability.
- Added `clusters: [...]` to all 13 concept frontmatters. Multi-membership where it earns it: super-porous-ecosystem in [paradigms, moats]; ai-overwork and ai-autopilot in [anti-patterns, paradigms].
- Sidebar (TopicTree) now renders concepts grouped by primary cluster, with multi-cluster pages echoed (italic + ↗) under non-primary clusters.
- Cluster pages (`wiki/concepts/clusters/<slug>.md`) are not yet created — lazy upgrade path; sidebar header is plain text until a page exists.
- `index.md` refactored to mirror cluster groupings.
- `CLAUDE.md` ingest contract updated: read `clusters.yml` first; per-page cluster decision (join / expand / create) added as a new step.

## 2026-04-27

- **Removed Slack commands `/wiki-commands` and `/wiki-dive`.** Dropped both cases from `app/api/slack/commands/route.ts`, deleted `lib/slack/handlers/commands.ts` and `lib/slack/handlers/dive.ts`, and pruned the dive-only helpers (`findPage`, `findClosestPages`, `slugifyPath`) from `lib/wiki.ts`. Updated the `/wiki-qna` ack and unknown-command fallback to no longer point at `/wiki-commands`. Live surface is now `/wiki-list`, `/wiki-add`, `/wiki-ingest`, `/wiki-inbox` (+ `/wiki-qna` planned).

## 2026-04-28

- **Ingest: Gigi Levy-Weiss / NFX — "1,000 Simultaneous Experiments."** Promoted to `sources/levy-weiss-1000-experiments`. Updated `wiki/concepts/hypercreativity` (added "company-scale corollary" section: probability math for cheap experiments, EV-shifts-to-edges argument, real risk is under-exploring). Updated `wiki/concepts/one-person-studios` (added "from tools to employees" mental model flip, 12-person → 1,200-person compression, and traits list for orchestrators at scale).
- 2026-05-01 human cluster op: created cluster `ai-taste` and tagged 1 page (concepts/taste-as-skill)
- 2026-05-03 human cluster op: created cluster `agentic-ai-parts`
- 2026-05-03 human cluster op: moved 1 page → `agentic-ai-parts` (concepts/folder-is-the-agent)
- 2026-05-03 human cluster op: moved 1 page → `ai-taste` (concepts/taste-as-skill)
- 2026-05-03 human cluster op: moved 1 page → `ai-capability` (concepts/ai-autopilot)
- 2026-05-03 human cluster op: moved 1 page → `ai-taste` (concepts/ai-autopilot)
- 2026-05-03 human cluster op: moved 1 page → `ai-taste` (concepts/games-as-curriculum)
- 2026-05-03 human cluster op: renamed cluster `paradigms` → "AGENTIC FUTURES"
- 2026-05-03 human cluster op: renamed cluster `ai-taste` → "AI TASTE TRAINING"
- 2026-05-03 human cluster op: renamed cluster `moats` → "MOATS IN THE AI ERA"
- 2026-05-03 human cluster op: reordered clusters → agentic-coding, agentic-ai-parts, paradigms, moats, anti-patterns, ai-capability, ai-taste
- 2026-05-03 human cluster op: reordered clusters → agentic-coding, paradigms, moats, anti-patterns, ai-capability, ai-taste, agentic-ai-parts
- 2026-05-03 human cluster op: reordered clusters → agentic-coding, paradigms, agentic-ai-parts, moats, anti-patterns, ai-capability, ai-taste
- 2026-05-03 human cluster op: reordered clusters → agentic-coding, agentic-ai-parts, paradigms, moats, anti-patterns, ai-capability, ai-taste
- 2026-05-03 human cluster op: reordered clusters → agentic-coding, agentic-ai-parts, ai-taste, paradigms, moats, anti-patterns, ai-capability
- 2026-05-03 human cluster op: created cluster `deletion-test`
- 2026-05-03 human cluster op: moved 1 page → `deletion-test` (concepts/taste-as-skill)
- 2026-05-03 human cluster op: deleted cluster `deletion-test` (moved 1 page to Unsorted: concepts/taste-as-skill)
- 2026-05-03 human cluster op: moved 1 page → `paradigms` (concepts/taste-as-skill)

## 2026-05-03

- **Ingest: Zencoder resource.** Promoted `inbox/2026-05-03-0026-zencoder-the-ai-coding-agent-resource.md` → `sources/zencoder-the-ai-coding-agent-resource.md`. Created new bucket page `wiki/resources/agentic-coding-tools.md`. Updated `index.md` to add Resources section.

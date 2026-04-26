# Wiki Log

Append-only chronological log of ingests, queries, and maintenance.

---

## 2026-04-25

- **Bootstrap.** Stage 1 scaffolded: Next.js 16 viewer with three-column Farzapedia-style layout. Seeded `wiki/people/andrej-karpathy`, `wiki/concepts/personal-knowledge-management`, `wiki/concepts/llm-as-librarian`, `wiki/projects/sahana-wiki` from `sources/karpathy-pkm-gist`.
- **Ingest: Every "agent-native" cluster.** Added `sources/every-agent-native-guide`, `sources/parrott-four-apps`, `sources/klaassen-folder-is-the-agent`, `sources/parrott-25-person-four-agents`. Created `wiki/people/{dan-shipper, kieran-klaassen, katie-parrott}`, `wiki/concepts/{agent-native, folder-is-the-agent, compound-engineering}`, `wiki/projects/{every, cora, monologue}`. Cross-linked from existing `wiki/people/andrej-karpathy`, `wiki/concepts/{llm-as-librarian, personal-knowledge-management}`, `wiki/projects/sahana-wiki` (positioned the project as both a librarian-wiki and a folder-agent).
- **Ingest: Notion Custom Agents Camp.** Added `sources/notion-custom-agents-camp` (Every × Notion, April 3 2026, 1-hour virtual, Brian Lovin co-host). Updated `wiki/projects/every` to highlight the camp date and host. Flagged a name-spelling contradiction with `sources/parrott-25-person-four-agents` (Brian Lovin vs. Brian Levin).

## 2026-04-26

- **Stage 2 shipped on Vercel.** Slack capture is live at `https://sahana-wiki.vercel.app/api/slack/commands`. `/wiki-commands`, `/wiki-list`, `/wiki-dive`, `/wiki-add` all working end-to-end. `/wiki-add` writes commits to `inbox/` via the GitHub Contents API. `/wiki-qna` deferred to Stage 4.
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

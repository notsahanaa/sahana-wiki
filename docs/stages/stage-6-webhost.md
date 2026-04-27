# Stage 6 — Hosted Web App (analysis & lean plan)

> Companion to `roadmap.md`. Captures (a) what Stage 6 actually adds beyond the existing Vercel deploy, and (b) what a minimum-viable "Lean Stage 6" looks like for three concrete capture/edit/chat goals.

## Goals driving this stage

1. Add notes from mobile via a card-input UI
2. Edit notes (page body, sidebar names, etc.) from mobile and web
3. Chat with the wiki — Q&A and AI-assisted reorganization

## What Stage 6 adds vs. what's already done

The current Vercel build is just the viewer running in production. Stage 6 layers on four things that are not done yet.

| Stage 6 ingredient | Already done? | What it gives you |
|---|---|---|
| Vercel deploy | ✓ yes | Read the wiki from any device |
| Clerk single-user auth | ✗ no | Gate writes so randos can't edit |
| Vercel Blob storage | ✗ no | Persist new content without a git commit/push |
| Keep-style card input UI | ✗ no | Add notes from the web UI (not just Slack) |
| Synthesis on Anthropic SDK (not `claude -p` CLI) | ✗ no | Run the librarian on Vercel — laptop doesn't need to be on |

Verification line in `roadmap.md` nails the gap: *"Deploy, log in from phone, add a card, see ingestion."* The phone can already read the wiki via vercel.app; it cannot write or trigger synthesis.

## Lean Stage 6 — minimum viable build for the three goals

| Goal | What I need | What I have |
|---|---|---|
| Add notes from mobile (card UI) | Web UI for input + API route that writes + auth + a place writes can land | Nothing — all four missing |
| Edit docs/sidebar names from mobile | Web UI for editing + API route that writes + auth + a place writes can land | Nothing — all four missing |
| Chat with the wiki (Q&A + reorganize) | Anthropic SDK call from server + auth (so chat costs aren't open to the world) + write path for "reorganize" | Nothing — all missing |

### Components to add (lean version)

1. **Auth** — single password compared in middleware against `process.env.WIKI_PASSWORD`, stored in a signed cookie. ~30 lines. Skip Clerk for now; upgrade later if Google login etc. is needed.
2. **Write storage** — Git as storage. API routes commit + push to this repo via the GitHub API (`@octokit/rest`). Vercel auto-rebuilds on push. No new storage layer; the wiki = the git repo stays true. Trade-off: every edit triggers a ~30–60s rebuild — fine for adding a card, awkward for chat-driven bulk edits.
3. **LLM on the server** — swap `lib/synth.ts` from `claude -p` CLI to `@anthropic-ai/sdk` (CLI doesn't run on Vercel). Same swap powers the chat feature. Default model Claude Sonnet 4.6, prompt caching on `CLAUDE.md` + `index.md` per the roadmap's tech defaults.
4. **UI surfaces** — card-input modal (goal 1), inline edit mode for pages and sidebar names (goal 2), chat panel (goal 3).

### Explicitly deferred (vs. full Stage 6)

- **Clerk** — single password is enough for one user. Add Clerk only when multi-provider login or session management starts mattering.
- **Vercel Blob** — git-as-storage is enough until chat-driven reorgs feel slow. Add Blob only when commit-per-edit latency hurts.
- **Hybrid `git ∪ blob` rendering** — only relevant once Blob exists.

### When to escalate from Lean to Full

Goal 3 (chat to reorganize) is the most likely to outgrow git-as-storage. A chat that renames 5 files and edits 3 pages = ~8 commits + 8 rebuilds. Acceptable for occasional reorgs; painful for daily use. When that pain is felt, add Vercel Blob with hybrid-source rendering (viewer reads `git ∪ blob`, periodic flush from blob → git).

## Open questions for execution

- Auth UX: password prompt on first visit and remember-me cookie, or always-prompt for writes only?
- Edit UX: WYSIWYG markdown vs. raw markdown textarea? (Raw is cheaper to ship; WYSIWYG is friendlier on mobile.)
- Chat scope: Q&A-only first, then add reorg actions behind explicit confirmation? Or one-shot reorg from day one?

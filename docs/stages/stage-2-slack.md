# Stage 2 — Slack Capture & Read

> Status: **shipped 2026-04-25** (initial Vercel deploy), handlers + ingest loop completed **2026-04-26**. The deployed app at `https://sahana-wiki.vercel.app` hosts both the dashboard and the Slack endpoint.

## Deployment mode

The original spec (below) targeted local dev behind a cloudflared tunnel. The shipped version skips the tunnel and runs directly on Vercel. Implications worth knowing before reading the rest:

- **No tunnel.** Slack POSTs straight to `https://sahana-wiki.vercel.app/api/slack/commands`.
- **Read-only deployed filesystem.** `/wiki-add` cannot write to disk on Vercel. Instead it commits new files to `inbox/` via the **GitHub Contents API** (`lib/github.ts`), and the resulting push to `main` triggers Vercel to redeploy. The dashboard naturally reflects new content within ~1 minute.
- **`/wiki-qna` is deferred to Stage 4.** Its current spec uses the `claude -p` CLI which is not available on Vercel functions. Stage 4 promotes synthesis to the Anthropic SDK; `/wiki-qna` ships then. The route currently returns a graceful "deferred" stub for it.

The detailed plan that produced this implementation is at `~/.claude/plans/we-re-currently-building-stage-wondrous-abelson.md`.

## Goal

Capture knowledge into the wiki and read from it without leaving Slack. The wiki content folder remains the source of truth — Slack is a thin interface over it.

## Channel

One channel: `#wiki`. Single-user (you), single-workspace.

## Commands

All operations are explicit slash commands. Free messages in `#wiki` are ignored — no LLM classifier on every post, no question-mark heuristics.

| Command | Args | Action |
|---|---|---|
| `/wiki-add` | `<text or URL>` | Capture. Writes a new markdown file to `/inbox/`. URL args are fetched and cleaned with Readability before saving. |
| `/wiki-list` | *(none)* | Lists every wiki topic, nested by category, with the same chevron tree the viewer uses. Read-only — no LLM call. |
| `/wiki-dive` | `<topic>` | Looks up the named wiki page. Posts title + summary in the parent, full body in-thread. Read-only. |
| `/wiki-qna` | `<question>` | Q&A across the wiki. Runs through `lib/synth.ts` (initially `claude -p` headless). Posts a synthesized answer with citations. |
| `/wiki-commands` | *(none)* | Static help — prints every command above with a one-line summary. No LLM call. The pre-determined list lives in `lib/slack/handlers/commands.ts` (`WIKI_COMMANDS`); update it when adding a command. |

## Reply pattern

Two mechanisms in play, used differently per command:

- **`response_url`** (per-command, valid for 30 min, 5 follow-ups max). No bot token needed; can't thread.
- **`chat.postMessage`** (Slack Web API, requires `SLACK_BOT_TOKEN`). Can thread.

Per-command:

- `/wiki-commands`, `/wiki-list` — synchronous JSON response only. No follow-up.
- `/wiki-dive` — synchronous ephemeral ack ("🔍 Looking up …"); then via `waitUntil`: `chat.postMessage` for the title+summary parent, `chat.postMessage` for the body in thread, `response_url` to delete the ephemeral.
- `/wiki-add` — synchronous ephemeral ack ("📥 Capturing…"); then via `waitUntil`: `response_url` with `replace_original: true` and `response_type: "in_channel"` to post the "✅ Saved …" message with the inbox-file link + GitHub commit link. No threaded metadata reply (kept simple for v1).

## Repo additions (what actually shipped)

```
sahana-wiki/
├── app/api/slack/
│   └── commands/route.ts              # slash command receiver (POST handler)
├── lib/slack/
│   ├── verify.ts                      # signing-secret HMAC check (timing-safe)
│   ├── post.ts                        # response_url + chat.postMessage helpers
│   └── handlers/
│       ├── commands.ts                # /wiki-commands — static registry of all commands
│       ├── add.ts                     # /wiki-add → inbox/<timestamp>-<slug>-{note,clip}.md
│       ├── list.ts                    # /wiki-list → Slack mrkdwn category tree
│       └── dive.ts                    # /wiki-dive → page lookup + threaded body
├── lib/github.ts                      # GitHub Contents API client (commitFile)
├── lib/clip.ts                        # URL fetch + Readability (lazy-loaded jsdom)
├── next.config.ts                     # serverExternalPackages for jsdom/readability/turndown
└── inbox/                             # already exists (gitkeep'd from Stage 1)
```

**Deferred to Stage 4** (NOT in this stage's repo):
- `lib/slack/handlers/qna.ts` — `/wiki-qna` returns a deferral stub from `route.ts` instead.
- `lib/synth.ts` — synthesis swap point. Ships when `/wiki-qna` does.
- `app/api/slack/events/route.ts` — Slack Events API webhook. Ships when auto-ingest does.

## Slack app setup (one-time)

1. Create app at `api.slack.com/apps` → "From scratch" → name `sahana-wiki`.
2. **Bot token scopes** (OAuth & Permissions):
   - `commands` — register slash commands
   - `chat:write` — post messages
   - `chat:write.public` — post in channels the bot isn't a member of (optional; we'll add the bot to `#wiki` anyway)
3. **Slash commands** (Slash Commands page) — create five, all pointed at the same Request URL:
   - `/wiki-add` → `https://sahana-wiki.vercel.app/api/slack/commands`
   - `/wiki-list` → same URL
   - `/wiki-dive` → same URL
   - `/wiki-qna` → same URL (returns deferral stub for now)
   - `/wiki-commands` → same URL
4. Install to your workspace.
5. Add the bot to `#wiki` (or DM it directly — slash commands work workspace-wide).
6. Copy **Signing Secret** and **Bot User OAuth Token** into Vercel project env (Production + Preview):
   ```
   SLACK_SIGNING_SECRET=...
   SLACK_BOT_TOKEN=xoxb-...
   GITHUB_TOKEN=github_pat_...      # fine-grained, Contents:Read+Write on this repo only
   GITHUB_REPO=notsahanaa/sahana-wiki
   ```
7. Trigger a Vercel redeploy after adding env vars (a fresh `git push` works) so the running function picks them up.

## Tunneling (NOT USED in shipped version)

> The shipped Stage 2 deploys directly to Vercel and skips this section entirely. Kept for reference if you ever want to run Stage 2 commands locally for development.

For local development, Slack must reach a public URL via:

- **`cloudflared tunnel --url http://localhost:3010`** — quick ephemeral URL. Re-paste into Slack each restart.
- **Named tunnel** (recommended): `cloudflared tunnel create wiki-dev` → routes `wiki-dev.<your-domain>` to localhost. Stable URL, no re-paste.

In production, the tunnel is replaced by the Vercel deploy.

## Implementation details

### Signature verification (`lib/slack/verify.ts`)

Slack signs every request: HMAC-SHA256 of `v0:{timestamp}:{rawBody}` using the signing secret. Reject if:
- Signature mismatch
- Timestamp older than 5 minutes (replay protection)

Implement as a 15-line helper. Call from each route before dispatch.

### Slash command receiver (`app/api/slack/commands/route.ts`)

The shipped route uses **dynamic imports** for handler modules and a **try/catch** that returns the raw exception text (truncated to 2KB) in the response body. Both were added to debug Vercel-runtime issues during development; both are kept because they're cheap and useful.

```ts
// Sketch of the actual route
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const verdict = verifySlackRequest(request.headers, rawBody, process.env.SLACK_SIGNING_SECRET);
    if (!verdict.ok) return new Response(`unauthorized: ${verdict.reason}`, { status: 401 });

    const params = new URLSearchParams(rawBody);
    const command = params.get("command") ?? "";
    // ...extract text, channelId, userId, responseUrl...

    switch (command) {
      case "/wiki-commands": return handleCommandsList();
      case "/wiki-list":     { const { handleList } = await import("@/lib/slack/handlers/list"); return handleList(); }
      case "/wiki-dive":     { const { handleDive } = await import("@/lib/slack/handlers/dive"); return handleDive({ ... }); }
      case "/wiki-add":      { const { handleAdd } = await import("@/lib/slack/handlers/add"); return handleAdd({ ... }); }
      case "/wiki-qna":      return Response.json({ response_type: "ephemeral", text: "/wiki-qna ships in Stage 4..." });
      default:               return Response.json({ response_type: "ephemeral", text: `Unknown command ${command}` });
    }
  } catch (err) {
    return new Response(`route error: ${(err as Error).message}\n${(err as Error).stack || ""}`.slice(0, 2000),
      { status: 500, headers: { "Content-Type": "text/plain" } });
  }
}
```

**Why dynamic imports:** static imports of `lib/slack/handlers/add.ts` transitively pulled `jsdom` into the route module's startup, which crashed the function load on Vercel — see `## What didn't work` in `docs/stages/stage-2-vercel.md`. Dynamic imports keep the route handler load lightweight and only pay the heavy import cost on the command path that needs it.

### `/wiki-add` handler

1. Detect URL via regex (`/https?:\/\/[^\s)]+/i`). If a URL is present, it becomes the clip target; remaining text becomes a `## My note` section appended to the body.
2. **URL:** dynamic-import `lib/clip.ts`, call `clipUrl(url)` → fetch HTML → `jsdom` → Readability → `turndown` markdown (all jsdom/readability/turndown loaded lazily inside `clipUrl`, after the Slack ack has already gone). Filename: `inbox/YYYY-MM-DD-HHMM-<title-slug>-clip.md`.
3. **Text-only:** filename: `inbox/YYYY-MM-DD-HHMM-<first-words-slug>-note.md`. No `lib/clip.ts` import at all on this path — instant.
4. Frontmatter on every inbox file:
   ```yaml
   ---
   captured_at: 2026-04-26T07:27:43.595Z
   source: slack
   slack_user: "U0APS6XP1E0"
   slack_channel: "C0AV4RQJUG3"
   url: "..."          # only for clips
   title: "..."        # only for clips
   byline: "..."       # only for extracted clips with a byline
   ---
   ```
5. **Commit:** call `lib/github.ts` `commitFile()` → `PUT /repos/{owner}/{repo}/contents/{path}` with base64 body. Returns commit URL. Each commit triggers Vercel auto-deploy via the GitHub integration.
6. **Slack response flow:**
   - Synchronous ack: `{ response_type: "ephemeral", text: "📥 Capturing…" }`.
   - In the `waitUntil` callback: `postToResponseUrl(responseUrl, { response_type: "in_channel", replace_original: true, text: "✅ Saved <inbox-file> — _<summary>_ · <commit>" })` once the commit lands.
   - On failure: post the exception detail back via `response_url` so the user sees what broke.
7. **Bare-reference fallback** (clips only): if Readability can't extract content (paywall, JS-only page, current jsdom error on Vercel), the clip file is still saved with `url` + `title` only and the body says "automatic content extraction failed: <reason>. Re-clip via Stage 3 browser extension when available."

### `/wiki-list` handler

1. Call `getWikiTree()` (from existing `lib/wiki.ts`).
2. Format as a single Slack `mrkdwn` block (not blocks API — simpler). Unicode chevrons `▾` for category headers and `▸` for pages match the viewer's left tree.
3. Each page is a Slack link to `${WIKI_PUBLIC_URL}<href>` (set to `https://sahana-wiki.vercel.app` in Vercel env).
4. Truncate at 30 pages with `…and N more — view at <dashboard>` tail.
5. Returns synchronously; `response_type: "in_channel"` so everyone in the channel sees it.

### `/wiki-dive` handler

1. Resolve `<topic>` via `findPage()` in `lib/wiki.ts` (added during this stage — exact title match → terminal slug match → null).
2. **No match:** synchronous ephemeral reply: `"No page named *<topic>*. Try: \`<slug1>\`, \`<slug2>\`, \`<slug3>\`"` — top-3 by `findClosestPages()` (slug-prefix + substring scoring). Falls back to "Try `/wiki-list` to see all topics" if no near matches.
3. **Match:** synchronous ephemeral ack `"🔍 Looking up *<title>*…"`. Inside `waitUntil`:
   - `chat.postMessage` for the parent: `"📄 *<title>* — <first-sentence-summary> · <viewer-link>"`.
   - `chat.postMessage` for the body in thread (`thread_ts: parent.ts`). Body is the page markdown with `{{source:slug}}…{{/source}}` flattened to plain text and `[[wikilinks]]` rewritten to `<deployed-url|Title>` Slack links.
   - `postToResponseUrl({ delete_original: true })` to remove the ephemeral ack.
4. **Body length cap:** 2,900 chars (Slack hard limit ~3,000 per message). Longer bodies get truncated with `"…truncated; full body at <dashboard>."`.
5. **First-sentence summary:** `firstSentence()` strips frontmatter/headings, takes the first paragraph, cuts at the first sentence terminator or 180 chars.

### `/wiki-qna` handler — *deferred to Stage 4*

The route currently returns a stub:

```
/wiki-qna ships in Stage 4 alongside the Anthropic SDK swap (the
current spec uses `claude -p` which doesn't run on Vercel). For now,
run /wiki-commands to see what's live.
```

**Why deferred:** the original `/wiki-qna` design spawns `claude -p` via Node `child_process` against the local repo. The `claude` CLI isn't installed on Vercel functions, so this can't run on the deployed app at all. Stage 4 swaps `lib/synth.ts` to the Anthropic SDK; `/wiki-qna` ships then.

The full spec (claude -p prompt, citation format, etc.) is preserved in the version-controlled history of this doc and can be revived directly when Stage 4 starts.

### `lib/synth.ts` — *not built; Stage 4*

The synthesis swap point planned for the original Stage 2. Not built. When `/wiki-qna` ships in Stage 4, `synthesize({ system, user, maxTokens })` will go straight to the Anthropic SDK with prompt caching on `[CLAUDE.md, index.md]`. Default model: Sonnet 4.6. `ANTHROPIC_API_KEY` added to Vercel env at that point.

## Environment variables

Set in Vercel Project → Settings → Environment Variables (Production + Preview):

```
SLACK_SIGNING_SECRET=...                 # Slack app → Basic Information
SLACK_BOT_TOKEN=xoxb-...                 # Slack app → OAuth & Permissions
GITHUB_TOKEN=github_pat_...              # fine-grained PAT, Contents:Read+Write only
GITHUB_REPO=notsahanaa/sahana-wiki       # owner/repo for /wiki-add commits
WIKI_PUBLIC_URL=https://sahana-wiki.vercel.app  # used in Slack page links
# ANTHROPIC_API_KEY=sk-ant-...           # not yet — added when /wiki-qna and synth.ts ship in Stage 4
```

`.env.example` mirrors these for documentation. Never commit `.env.local`.

After adding env vars to Vercel, trigger a redeploy (any new push to `main` works) so the running function picks them up — Vercel doesn't auto-redeploy on env changes.

## Verification (as actually run, 2026-04-26)

| Step | Status | Evidence |
|---|---|---|
| Vercel deploy Ready, dashboard at `/` returns 200 | ✅ | `curl -I https://sahana-wiki.vercel.app/` → `HTTP 200`, ~656ms TTFB |
| Existing wiki page renders | ✅ | `curl -I https://sahana-wiki.vercel.app/wiki/people/andrej-karpathy` → `HTTP 200` |
| `/api/slack/commands` reachable, verify runs | ✅ | `curl -X POST .../api/slack/commands` (no signature) → `HTTP 401 unauthorized: missing-headers` |
| `/wiki-commands` in Slack | ✅ | Ephemeral list; four commands marked **live**, `/wiki-qna` marked planned |
| `/wiki-list` in Slack | ✅ | Category tree matched dashboard sidebar; links opened in browser |
| `/wiki-dive llm-as-librarian` | ✅ | Title + first sentence in channel; full body in thread; wikilinks clickable |
| `/wiki-add hello world from slack` | ✅ | Capture appeared at `inbox/2026-04-26-...-note.md`; commit link in Slack opened the GitHub commit |
| `/wiki-add https://every.to/source-code/the-folder-is-the-agent` | ⚠ partial | File saved as bare reference — Readability extraction failed at runtime. See "Risks & known issues" below. |
| `/wiki-qna who is karpathy?` | ✅ (stub) | Returned the Stage 4 deferral message |
| Tampered signature | ✅ | `unauthorized: bad-signature` |
| Stale timestamp (>5 min) | ✅ (smoke-tested locally) | `unauthorized: stale` |
| End-to-end ingest loop | ✅ | 3 captures from Slack `#wiki` → committed to `inbox/` → pulled locally → ingested into wiki pages → pushed → dashboard reflected the new pages within ~1 min

## Out of scope for Stage 2

- Auto-synthesis on capture (still manual via `claude -p` in the repo) — that's Stage 4
- Browser clipper as a separate ingest path — Stage 3 (will reuse `lib/clip.ts`)
- Multi-user permissions, sharing, or workspace-wide install
- Rich Slack block forms or modals
- Notifications / proactive messages from the bot
- Persisting Slack thread history into the wiki (a thread = ephemeral interaction; only `/wiki-add`-ed content lands in `/inbox/`)

## Risks & known issues

| Risk / issue | Status | Mitigation |
|---|---|---|
| Slack 3s response window | ✅ handled | Synchronous ephemeral ack from every handler; real work in `waitUntil` callback. Confirmed working through one cold-start incident (jsdom transitive) which we fixed via dynamic import + lazy load. |
| `claude -p` not available on Vercel | ✅ handled (by deferring) | `/wiki-qna` returns a stub; ships in Stage 4 with the Anthropic SDK swap. |
| Inbox spam from accidental commands | ✅ acceptable | Each inbox file has full Slack-source attribution in frontmatter (`slack_user`, `slack_channel`, `captured_at`). Trivial to `git rm` later. |
| jsdom `ERR_REQUIRE_ESM` on Vercel (URL clips) | ✅ resolved 2026-04-26 | Replaced jsdom with `linkedom` in `lib/clip.ts`. linkedom is ESM-native (no broken `html-encoding-sniffer` transitive), bundles cleanly, and is structurally compatible with `@mozilla/readability`. Smoke-tested locally against both URLs that previously bare-referenced — both now extract cleanly (~12-18KB of markdown each, bylines and excerpts intact). Live on Vercel since commit (see `stage-2-vercel.md` "What didn't work" for the resolution paragraph). |
| Subscription credit drain (Stage 4) | n/a yet | Stage-4 concern; addressed when `lib/synth.ts` is built. |
| GitHub PAT leaks via Vercel env | low | Fine-grained PAT scoped to `Contents: Read+Write` on this repo only, 90-day expiry. Never logged. Stored encrypted by Vercel. |
| Vercel build minutes from `/wiki-add` | low | Free tier is 6,000 min/mo; ~30s × 100 captures/mo ≈ 50 min. Plenty of headroom. |
| Inbox files accumulate without ingest | open | The "ingest synthesis" step is still manual (Sahana asks Claude in Code). Stage 4 (auto-ingest) closes this loop. Until then, inbox can build up — currently fine for personal use at observed capture rates. |

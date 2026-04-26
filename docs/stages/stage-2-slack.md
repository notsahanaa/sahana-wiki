# Stage 2 — Slack Capture & Read

> Status: planned, not built. Stage 1 (custom viewer) shipped 2026-04-25.

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

Always threaded. Channel stays scrollable.

- The slash command response posts an `in_channel` parent message (one short line: "✅ Added: …" or "🔍 Looking up …").
- Anything longer (the page body for `/wiki-dive`, the Q&A answer for `/wiki-qna`, parsed metadata for `/wiki-add`) goes as a `chat.postMessage` reply with `thread_ts` set to the parent.

## Repo additions

```
sahana-wiki/
├── app/api/slack/
│   ├── commands/route.ts          # slash command receiver
│   └── events/route.ts            # placeholder, used in Stage 4
├── lib/slack/
│   ├── verify.ts                  # signing-secret HMAC check
│   ├── post.ts                    # tiny chat.postMessage wrapper around the bot token
│   └── handlers/
│       ├── add.ts                 # /wiki-add → /inbox/*.md
│       ├── list.ts                # /wiki-list → nested blocks
│       ├── dive.ts                # /wiki-dive → page lookup + body
│       └── qna.ts                 # /wiki-qna → claude -p synthesis
├── lib/synth.ts                   # synthesis surface — claude -p now, Anthropic SDK later (also used by Stage 4)
├── lib/clip.ts                    # URL fetch + Readability extraction (also used by Stage 3)
└── inbox/                         # already exists (gitkeep'd from Stage 1)
```

## Slack app setup (one-time)

1. Create app at `api.slack.com/apps` → "From scratch" → name `sahana-wiki`.
2. **Bot token scopes** (OAuth & Permissions):
   - `commands` — register slash commands
   - `chat:write` — post messages
   - `chat:write.public` — post in channels the bot isn't a member of (optional; we'll add the bot to `#wiki` anyway)
3. **Slash commands** (Slash Commands page) — create five:
   - `/wiki-add` → request URL `https://<tunnel>/api/slack/commands`
   - `/wiki-list` → same URL
   - `/wiki-dive` → same URL
   - `/wiki-qna` → same URL
   - `/wiki-commands` → same URL
4. Install to your workspace.
5. Add the bot to `#wiki`.
6. Copy **Signing Secret** and **Bot User OAuth Token** into `.env.local`:
   ```
   SLACK_SIGNING_SECRET=...
   SLACK_BOT_TOKEN=xoxb-...
   ```

## Tunneling (dev only)

Slack must reach a public URL. Two options:

- **`cloudflared tunnel --url http://localhost:3010`** — quick ephemeral URL. Re-paste into Slack each restart.
- **Named tunnel** (recommended): `cloudflared tunnel create wiki-dev` → routes `wiki-dev.<your-domain>` to localhost. Stable URL, no re-paste.

In Stage 6 (hosted) the tunnel goes away; Slack hits the Vercel URL directly.

## Implementation details

### Signature verification (`lib/slack/verify.ts`)

Slack signs every request: HMAC-SHA256 of `v0:{timestamp}:{rawBody}` using the signing secret. Reject if:
- Signature mismatch
- Timestamp older than 5 minutes (replay protection)

Implement as a 15-line helper. Call from each route before dispatch.

### Slash command receiver (`app/api/slack/commands/route.ts`)

```ts
// Pseudocode
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySlackSignature(req.headers, raw)) return new Response("bad sig", { status: 401 });
  const params = new URLSearchParams(raw);
  const command = params.get("command");        // "/wiki-add"
  const text = params.get("text") ?? "";        // user-typed args
  const channelId = params.get("channel_id");
  const userId = params.get("user_id");

  // Slack expects a response within 3s. We immediately ack with a parent message,
  // then do the real work async and post follow-ups via the Web API.
  switch (command) {
    case "/wiki-add":  return handleAdd(text, channelId, userId);
    case "/wiki-list": return handleList(channelId);
    case "/wiki-dive": return handleDive(text, channelId);
    case "/wiki-qna":  return handleQna(text, channelId);
    default: return Response.json({ text: `unknown command ${command}` });
  }
}
```

For commands whose work fits in <2s (`/wiki-add` text, `/wiki-list`), respond synchronously with the parent message. For commands that may take longer (`/wiki-add` URL fetch, `/wiki-qna`), respond immediately with `🔍 Working…` and post the real result via `chat.postMessage` with `thread_ts` once done.

### `/wiki-add` handler

1. Detect URL via regex (`/^https?:\/\//`). If multiple URLs in args, take the first; the rest become note body.
2. **URL:** call `lib/clip.ts` → fetch HTML → Readability → markdown. Filename: `inbox/2026-04-25-1530-<slug-from-title>-clip.md`.
3. **Text:** filename: `inbox/2026-04-25-1530-<first-words-slug>-note.md`.
4. Frontmatter on every inbox file:
   ```yaml
   ---
   captured_at: 2026-04-25T15:30:00Z
   source: slack
   slack_user: <user_id>
   slack_channel: <channel_id>
   url: <only for clips>
   title: <only for clips>
   ---
   ```
5. Reply: parent `✅ Added: <title or first 60 chars>`. Thread: `Saved to inbox/<filename>` + the parsed metadata.

### `/wiki-list` handler

1. Call `getWikiTree()` (from existing `lib/wiki.ts`).
2. Format as Slack blocks: one `section` per category with a `mrkdwn` body. Use unicode chevrons `▾` for category headers and `▸` for pages so the visual matches the viewer's left tree.
3. Each page is a Slack link to `http://localhost:3010<href>`. (In Stage 6 this becomes the public URL.)
4. If the total tree is huge, truncate to top 30 pages and append `…and N more · /wiki-list all`. (Punt the `all` flag until needed.)

### `/wiki-dive` handler

1. Resolve `<topic>` against the same lookup `[[wikilink]]` resolution uses (`resolveWikilink` in `lib/wiki.ts` — refactor it out if needed).
2. **No match:** post `No page named "<topic>". Try: <three closest by Levenshtein/slug-prefix>`.
3. **Match:** parent message: `📄 *<page title>* — <one-line summary> · <link to viewer>`. Thread: full markdown body, with `{{source:slug}}…{{/source}}` flattened to plain text and `[[wikilinks]]` rewritten as Slack links to the viewer.
4. The "one-line summary" is just the first sentence of the body (regex on first paragraph, cut at first `.` or 100 chars).

### `/wiki-qna` handler

1. Parent message: `🔍 Looking through your wiki…` (use `response_type: in_channel`).
2. Call `synthesize()` from `lib/synth.ts`. The build-time implementation spawns `claude -p` from a Node `child_process` with `cwd = repo root` and stdin payload:
   ```
   You are answering a question against a personal wiki.
   The wiki schema and workflows are in CLAUDE.md (read it first).
   The catalog of all pages is in index.md.
   
   Question: <user's question>
   
   Read whatever wiki/ pages are relevant. Answer concisely.
   Cite sources as (see [[path/slug]]) after each claim.
   Format the answer as Slack mrkdwn (no #, *bold* not **bold**, dashes for lists).
   ```
3. The agent has filesystem access (it's running in this repo, obeying `CLAUDE.md`), so it picks pages itself — no manual selector needed during build/test.
4. When done (typical: 5–20s), post a thread reply with the answer.
5. On timeout (>60s) or error: post the error in the thread, log to `log.md`.

### `lib/synth.ts` — the swap point

One function: `synthesize({ system, user, maxTokens }): Promise<string>`. Used identically by `/wiki-qna` (Stage 2) and the auto-ingest job (Stage 4).

- **Now (build & test):** body spawns `claude -p` with the prompt on stdin. No env var, no API key. Costs go against the Claude Code subscription.
- **Later (daily use):** swap the body to `@anthropic-ai/sdk`. System prompt becomes `[CLAUDE.md, index.md]` with `cache_control: { type: "ephemeral" }` (5-min cache window). Default model: Sonnet 4.6. Add `ANTHROPIC_API_KEY` to env. Set monthly cap on the Anthropic console.

Callers are unaffected. Migration is ~20 LOC inside `lib/synth.ts` plus an env var.

## Environment variables

```
SLACK_SIGNING_SECRET=...
SLACK_BOT_TOKEN=xoxb-...
WIKI_PUBLIC_URL=http://localhost:3010   # used in Slack message links; swap to hosted URL in Stage 6
# ANTHROPIC_API_KEY=sk-ant-...          # not yet — added when we promote synth.ts to the SDK
```

Add to `.env.local` and `.env.example`. Never commit `.env.local`.

## Verification

| Step | Test |
|---|---|
| App installed, bot in `#wiki` | Tunnel responds 200 to Slack URL verification challenge |
| `/wiki-add hello world` | File `inbox/<timestamp>-hello-world-note.md` exists with `source: slack` frontmatter; bot posted ✅ in #wiki |
| `/wiki-add https://example.com` | File `inbox/<timestamp>-...-clip.md` exists with extracted body + URL frontmatter |
| `/wiki-list` | Bot posts nested category tree matching the viewer's left sidebar; links open the viewer |
| `/wiki-dive llm-as-librarian` | Bot posts page title + summary in #wiki; full body in thread; viewer link works |
| `/wiki-dive doesnotexist` | Bot posts "no page named ... try: …" with closest matches |
| `/wiki-qna who is karpathy?` | Bot posts "🔍 Looking…", then thread reply with synthesized answer + at least one `[[wikilink]]` citation |
| Bad signing secret | Route returns 401, no side effects |
| Replay attack (old timestamp) | Route returns 401 |

## Out of scope for Stage 2

- Auto-synthesis on capture (still manual via `claude -p` in the repo) — that's Stage 4
- Browser clipper as a separate ingest path — Stage 3 (will reuse `lib/clip.ts`)
- Multi-user permissions, sharing, or workspace-wide install
- Rich Slack block forms or modals
- Notifications / proactive messages from the bot
- Persisting Slack thread history into the wiki (a thread = ephemeral interaction; only `/wiki-add`-ed content lands in `/inbox/`)

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Slack 3s response window | Always ack immediately; do real work in a non-awaited promise that posts via `chat.postMessage` |
| `claude -p` rate-limited or hung | Hard 60s timeout in `lib/synth.ts`; post error to thread; log to `log.md`. (When promoted to SDK: same 60s timeout + one retry on 429/5xx with backoff.) |
| Subscription credit drain during heavy use | The whole reason `lib/synth.ts` exists as a swap point — promote to SDK before this becomes daily use. |
| Ephemeral tunnel URL changes | Use named cloudflared tunnel for a stable URL; `.env.local` documents the URL |
| Inbox spam from accidental commands | Each inbox file has full Slack source attribution in frontmatter; trivial to delete |
| URL clipper hits paywall / requires JS | First pass: server-side fetch + Readability. If a site needs JS, fail gracefully and save just the URL + title; user can clip via Stage 3 browser extension later |

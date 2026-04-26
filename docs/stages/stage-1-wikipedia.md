# Stage 1 — Custom Viewer (Farzapedia-style)

> Status: **shipped 2026-04-25**. Local-only, dev server on port 3010.

## What we built

A Next.js 16 web app that renders the markdown wiki as a three-column Wikipedia-style viewer. Live at `http://localhost:3010` via `npm run dev`. No DB, no auth, no deploy. Reads markdown directly from `/wiki/`, `/sources/`, and `/inbox/` at the repo root.

### Layout

| Column | Width | Contents |
|---|---|---|
| **Left** | 260px sticky | `TopicTree` — collapsible category sections (Concepts, People, Projects, Books) with chevrons; current page highlighted in lavender |
| **Center** | fluid, max-w 720px | `WikiArticle` — title in VT323, body in SF Pro with inline `[[wikilinks]]` (lavender underline) and `{{source:...}}` highlights (mint marker) |
| **Right** | 380px slide-in | `SourcePanel` — fixed-position drawer, hidden by default; opens with backdrop on source-highlight click; title, date, summary, tags, link to original |

Background: 24px dot-grid radial-gradient on the body for the bullet-journal feel. Sidebar and panel use a flat `--bg-subtle` so the dot grid doesn't compete with the lavender chip on the active item.

### Files added

```
app/
├── layout.tsx              # VT323 + Geist Mono fonts, AppShell wrapper
├── page.tsx                # Home: list of all pages
├── globals.css             # Design tokens, dot grid, .wiki-prose, .source-highlight
└── wiki/[...slug]/page.tsx # Dynamic wiki page (await params per Next 16)
components/
├── AppShell.tsx            # Server component, grid layout + provider wrap
├── TopicTree.tsx           # Client, usePathname for highlight, chevron collapsibles
├── WikiArticle.tsx         # Client, react-markdown + custom mark/a components
├── SourcePanel.tsx         # Client, drawer with backdrop + Escape-to-close
└── SourceContext.tsx       # Client, panel state via React context
lib/
├── wiki.ts                 # Filesystem walk, frontmatter, [[wikilinks]] + {{source:...}} processing
└── utils.ts                # cn() helper, slugify()
docs/
├── design-system.md        # Tokens, typography, surfaces, color usage rules
└── stages/
    ├── roadmap.md          # 8-stage roadmap (mirror of approved plan)
    └── stage-2-slack.md    # Next stage spec
```

Plus CNA-generated config (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`).

### Design system

Documented in full at `docs/design-system.md`. Anchored decisions:
- White only (dark mode out of scope until Stage 6).
- Headings in **VT323** (pixel monospace, retro), body in **SF Pro** via `-apple-system`.
- Two highlight colors: **`#c1bbdd` lavender** (active sidebar, wikilink underline, focus ring), **`#9ee5dd` mint** (source highlights — the marquee feature).
- All other text in `--ink-{primary,secondary,tertiary}` grays.
- Dot grid background, no card shadows, borders only.

## Decisions made (with alternates and tradeoffs)

### 1. Skip Stage 0, build the viewer first

Alternates: (a) start in Obsidian per Karpathy's pattern, (b) build a minimal viewer from day 1.
Chose (b). The user wanted to see the system, not simulate it. See `stage-0-karpathy.md` for the longer accounting.

### 2. Input model — Google-Keep cards + browser clipper (deferred)

Chosen in conversation: "google keep style notes cards (for user added) and browser clipper (for non user added)". For Stage 1 specifically, neither input UI was built — the wiki was hand-seeded with markdown files. The Keep-style card composer lands at Stage 6; the browser clipper lands at Stage 3.

### 3. Primary verb — "explore by topic / graph, like a real wiki"

Alternates considered: browse-cards (Pinterest-style), search-and-ask (LLM chat), all-three. The user picked "explore by topic / graph (wiki style)" for the MVP, with later levels adding the others.

### 4. Topic-page layout — Wikipedia 3-column

Alternates considered (offered with ASCII previews):
- **Wikipedia article style** ✓ chosen
- Synthesis on top, Pinterest-style card grid below
- Graph-first with cards on click
- Notion/Tana-style blocks

User confirmed via reference screenshots of `farzapedia` and `emrah.ca` and `notes sobre el ahora`. Anchored on the Farzapedia look. Right panel was clarified to be source-card-on-click only (no permanent TOC, no permanent graph view) after a brief discussion.

### 5. Storage — markdown files at the repo root, no DB

Alternates considered: SQLite, markdown + SQLite hybrid index. Markdown won because:
- Phase 2 of the roadmap (agents reading the wiki) is dramatically easier if files are the source of truth.
- The wiki should be portable to Obsidian if we ever want it back.
- Search is not yet a felt need; revisit at Stage 5.

### 6. Stack — Next.js 16 + TypeScript + Tailwind v4

Alternates considered: Astro static + tiny Node bot, Python (FastAPI) + HTML viewer. Next.js won for: one process for both API routes (Stage 2+) and the viewer; trivial `vercel deploy` at Stage 6; aligns with the user's plugin ecosystem (Vercel skills are loaded). The user accepted via the "use auto mode to build stage one" reply rather than re-debating.

### 7. LLM for synthesis — `claude -p` headless during build/test

Alternates considered: Anthropic API from day one, fully manual synthesis (no automation ever). The user explicitly said *"i would rather pay $20 for an api and have it burn slower than burn $20 of my subscription credit"* — but for Stage 1 specifically, no synthesis is happening at all (Stage 4's job). The decision matters first at Stage 2's `/wiki-qna`. We baked in `lib/synth.ts` as the swap point: `claude -p` body now, Anthropic SDK body later. Captured in `roadmap.md` and `stage-2-slack.md`.

### 8. Markdown parsing — `react-markdown` + `remark-gfm` + `rehype-raw`

Alternates considered:
- **Custom remark plugin** for `[[wikilinks]]` and `{{source:...}}` — cleaner long-term, more upfront work.
- **Pre-process the markdown text with regex** then let react-markdown render — what we did. Faster to build. Trade: handling edge cases (nested highlights, code blocks containing the syntax) is harder later.

For MVP, regex preprocessing was enough. If we hit edge cases, the upgrade path is a custom remark plugin.

### 9. Source highlight color — mint (`#9ee5dd`), not yellow

The first version used yellow `#fef08a` (looks like a marker pen). The user's design-system update specified two accent colors (`#c1bbdd` lavender, `#9ee5dd` mint) and no yellow. Mint became the source-highlight stripe; lavender became the active-sidebar chip and the wikilink underline. This shifted the marquee feature's color from "highlighter pen" to a softer, more current palette.

### 10. Chevrons in the menu

User explicitly asked for chevron indicators of nesting. Implemented: each category section has a `ChevronDown`/`ChevronRight` toggle (state per session, not persisted), and each page item carries a small low-opacity `ChevronRight` (full-opacity when active). Categories containing the current page stay open even after collapse, so navigation never hides the active item.

### 11. Typography — VT323 + SF Pro

Alternates considered: a single sans (Geist Sans, which CNA shipped). Chose VT323 for headings to land the bullet-journal-meets-terminal feel the user described. SF Pro via `-apple-system` rather than a webfont keeps the body fast and native-looking on macOS (the only platform we're targeting at Stage 1).

## What didn't work / pivots during the build

### `gstack-browse` couldn't see `bun`

The first verification attempt was via the gstack browser tool. Its subprocess kept failing with `Executable not found in $PATH: "bun"`, even after exporting PATH and creating canonical symlinks at `~/.bun/bin/bun`. The browse server seems to spawn from a sanitized env. Worked around by using headless Google Chrome directly (`Chrome.app/Contents/MacOS/Google Chrome --headless --screenshot=...`) — produced a clean PNG that confirmed the layout, fonts, chevrons, mint highlight, and lavender chip all rendered correctly.

Not worth fixing for now. If we use gstack-browse again later, the fix is probably to install `bun` via the official installer (not the npm-global package), which lands the binary as a real executable named `bun` (not `bun.exe`).

### Tailwind `prose` class needed an extra plugin

First pass at `WikiArticle` used `prose prose-zinc max-w-none dark:prose-invert`. That requires `@tailwindcss/typography`, which wasn't installed. Switched to a custom `.wiki-prose` class with hand-written styles in `globals.css`. Trade: a bit more CSS to maintain, but full control over typography (e.g. the lavender underline on links, the mint marker on `<mark>`) and no plugin dependency.

### Duplicate H1

The page header rendered the title from frontmatter as a styled big H1. The markdown body for every page also started with `# Title` (a Karpathy-style convention). Result: each page showed the title twice — once big and styled, once tiny and VT323. Fixed by adding `stripLeadingH1(body, title)` in `lib/wiki.ts`: drop the leading H1 if it slugifies to the same string as the frontmatter title. Side benefit: makes the markdown files compatible with both viewers (the H1 is preserved on disk for Obsidian users).

### Wikilinks displayed as raw paths

`[[people/andrej-karpathy]]` was rendering as the literal text `people/andrej-karpathy` in the article body. Fixed by changing `resolveWikilink` to return `{ href, displayTitle }` and passing the resolved page's title as the link text. Now `[[people/andrej-karpathy]]` shows as **Andrej Karpathy**. Broken links still show the original target text.

### CNA-generated `CLAUDE.md` was a placeholder

`create-next-app@latest` shipped a `CLAUDE.md` containing just `@AGENTS.md` (a one-line alias to `AGENTS.md`, which has Next.js 16 framework warnings). We needed `CLAUDE.md` to be the wiki schema doc per Karpathy's pattern. Overwrote it with the wiki schema content; the Next.js 16 warnings are now in the schema doc's bottom section ("Important: Next.js 16 codebase").

### Next.js 16 `params` is a `Promise`

Confirmed by reading `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` before writing the dynamic route. Trip-up if you assume Next 13/14 behavior; trivial fix (`const { slug } = await params`).

### Sanitized PATH issue with bash subshells

Twice during verification, a `for` loop calling `curl` reported `command not found: curl` even though `which curl` worked in the surrounding shell. Cause: the `for` loop's body was being eval'd in a subshell with a different PATH. Fix: use absolute paths (`/usr/bin/curl`, `/usr/bin/grep`) in pipelines. Worth remembering for any future verification scripts.

## Verification (final, end of Stage 1)

| Boundary | Evidence |
|---|---|
| TS clean | `tsc --noEmit` → 0 errors |
| Dev server | `Ready in 197ms`, Next 16.2.4 + Turbopack on :3010 |
| All routes 200 | `/`, `/wiki/concepts/llm-as-librarian`, `/wiki/concepts/personal-knowledge-management`, `/wiki/people/andrej-karpathy`, `/wiki/projects/sahana-wiki` |
| Missing → 404 | `/wiki/does/not/exist` → 404 |
| TopicTree renders | `aria-label="Wiki topics"` + 3 chevron-down + 4 chevron-right SVGs |
| SourcePanel mounted off-screen | `aria-label="Source"` + `translate-x-full` |
| Source highlights are buttons | `<button data-source="karpathy-pkm-gist" class="source-highlight" title="Karpathy's PKM Gist…">PKM gist</button>` |
| Wikilinks resolve | `[[people/andrej-karpathy]]` → `href="/wiki/people/andrej-karpathy"` and shows "Andrej Karpathy" as the link text |
| Design tokens compiled | `#c1bbdd`, `#9ee5dd`, `#0a0a0a`, `#fafaf9`, `#e7e5e4`, `#a3a3a3` all present in compiled CSS |
| Dot grid present | `radial-gradient(var(--bg-dot) 1px, transparent 1px)` in body styles |
| VT323 loaded | `<html class="vt323_dfae625b-module__YIsBIW__variable …">` |
| No console errors / warnings | Dev log shows clean 200/404s, sub-50ms application-code times after warmup |
| Visual confirmation | Headless Chrome screenshot shows expected three-column layout, fonts, chevrons, lavender chip on active item, mint highlight on `PKM gist` |

## Things deliberately not built

- Footnotes / citation list at the bottom of articles (source highlights are inline only)
- Permanent right-hand TOC or "On this page"
- Graph visualization (Karpathy gets it free in Obsidian; we don't have it)
- Search bar
- Tag pages (the `tags:` frontmatter is stored but not surfaced)
- Edit-in-browser (the LLM and a code editor are the editing surface)
- Mobile-specific layout (the 3-column collapses ungracefully below ~900px wide; mobile is Stage 6 if at all)

## Open questions for next stages

- Does the LLM produce wiki page edits that respect the `{{source:slug}}` convention reliably, or do we need stronger prompt scaffolding in `CLAUDE.md`? (Find out in Stage 2 once `/wiki-qna` is live, definitively in Stage 4.)
- Will the chevron-collapsible categories be useful or annoying when the wiki has 50+ pages? Currently default-open; revisit if it gets noisy.
- Source-highlight density: the seed pages use them sparingly. Does it stay readable when a wiki page is half mint-highlighted? Re-evaluate after a real ingest run.

## Pointers

- Roadmap: `docs/stages/roadmap.md`
- Design system: `docs/design-system.md`
- Stage 0 retrospective: `docs/stages/stage-0-karpathy.md`
- Stage 2 plan: `docs/stages/stage-2-slack.md`

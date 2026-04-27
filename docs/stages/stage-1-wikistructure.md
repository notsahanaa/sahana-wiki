# Stage 1 — Wiki Structure (Clusters)

> Status: **shipped 2026-04-26**. Local-only, sidebar live at `http://localhost:3010/`.

## What we built

A second level of grouping inside the existing Stage 1 sidebar. Concepts are no longer a flat alphabetical list — they're grouped under named clusters (Agentic Coding, Agent-Native Paradigms, Moats & Defensibility, Anti-Patterns, AI Training & Capability), in a curated order, with full multi-membership support.

Three places see the new structure:

1. **Sidebar (`components/TopicTree.tsx`)** — concepts grouped under cluster headers; multi-cluster pages echoed under each cluster they belong to (italic, with a `↗` glyph).
2. **Slack `/wiki-list` (`lib/slack/handlers/list.ts`)** — same hierarchy rendered in mrkdwn so `/wiki-list` mirrors the web view.
3. **`index.md`** — refactored to mirror the cluster groupings; serves as the librarian's quick-reference.

### Files added / changed

```
wiki/
├── clusters.yml                       # NEW. Cluster manifest: slug → title + description + optional page link.
└── concepts/
    ├── *.md                           # 13 concept files. Each got a clusters: [...] frontmatter line.
    └── clusters/                      # (reserved, empty for now) lazy upgrade path for cluster pages.
lib/
└── wiki.ts                            # NEW types: ClusterDef, ClusterGroup, ClusteredPageEntry, WikiClusteredTree.
                                       # NEW functions: loadClusterManifest(), getClusterManifest(), getClusteredTree().
                                       # WikiPageMeta gained clusters?: string[].
components/
├── AppShell.tsx                       # Switched to getClusteredTree().
└── TopicTree.tsx                      # Rewritten to consume the clustered shape and render echoes.
lib/slack/handlers/
└── list.ts                            # Rewritten to render clusters in Slack output.
CLAUDE.md                              # Ingest workflow updated: read clusters.yml; per-page cluster decision.
index.md                               # Sectioned by cluster.
log.md                                 # Restructure entry appended.
package.json                           # Added js-yaml + @types/js-yaml.
```

## Decisions made (with alternates and tradeoffs)

The user wrote: *"i want the clusters to be formed dynamically. everytime i input new data, it joins an existing cluster if relevant, or sometimes leads to the cluster expanding meaningfully. one concept could, possibly, exist in multiple clusters. one time set up token cost is fine by me, but i don't want very high ongoing ingestion cost."* Three hard constraints — dynamic clustering, multi-membership, low ongoing cost — drove every decision below.

### 1. The shape of the data: pattern 1+4 vs 2 vs 2+4

Three structural shapes were on the table. Naming them the way they were named in the brainstorm:

- **Pattern 1+4 — nested folders + cluster pages.** Move concept files into subdirs (`wiki/concepts/agentic-coding/agent-native.md`). Each cluster also gets its own page at `wiki/concepts/agentic-coding/index.md` (or sibling). Membership = file location. Reorganizing = `git mv`.
- **Pattern 2 — `cluster:` field only.** Files stay flat. Each concept declares `cluster: agentic-coding` in frontmatter. Cluster headers in the sidebar are just labels — there's no page to click to.
- **Pattern 2+4 — `clusters:` field + cluster pages.** Files stay flat. Concepts declare a list of cluster slugs in frontmatter. Clusters can also have their own pages at `wiki/concepts/clusters/<slug>.md` when they earn enough prose to deserve one.

Tradeoff matrix:

|  | **1+4** | **2** | **2+4** |
|---|---|---|---|
| Multi-membership | ❌ one file → one folder | ❌ scalar field | ✅ array field, native |
| Restructure cost | high (file moves + wikilink rewrites) | trivial (1 line per file) | trivial (1 line per file) |
| Cluster names are *things* | ✅ folder + page | ❌ dead labels | ✅ optional pages, lazy |
| Single source of truth | ✅ filesystem | ✅ frontmatter | ⚠️ frontmatter + manifest |
| URL/wikilink churn on rename | yes — every child path changes | no | no |
| Ongoing ingest tax | +10–15% (longer paths, folder reads) | ~0% | ~5% |

**Why patterns 1 and 1+4 were ruled out.** The user's multi-membership requirement is hard. A file lives in one folder. Symlinks would muddy git, and "primary folder + symlink elsewhere" gives the same dual-source problem as 2+4 with worse ergonomics.

**Why pattern 2 alone wasn't enough.** A scalar `cluster:` field can't express multi-membership at all. Even widening it to `clusters: [...]` (call this "pattern 2 prime") would leave cluster names as dead text in the sidebar — there'd be no place to write *about* a cluster. For a personal wiki where the librarian's job is to articulate ideas, dead headers feel wrong.

**Why pattern 2+4 won.** It's the only shape that satisfies all three constraints simultaneously:

1. Multi-membership: the `clusters: [...]` array carries it natively.
2. Dynamic clustering: per-ingest cost is reading one ~1KB manifest file plus the same wiki pages I'd read anyway. Restructuring a concept = editing one frontmatter line.
3. Optional cluster pages: when a cluster's prose earns its keep (multiple sources, real synthesis), it can be promoted to `wiki/concepts/clusters/<slug>.md`. Until then, the sidebar header stays a plain label. No upfront cost; organic upgrade.

The redundancy concern about 2+4 (the cluster field + cluster page filename both assert the same relationship) is real but minor. They do different jobs: the field declares *membership*, the page is the *destination* when a header is clicked. Renaming a cluster requires touching both, but that's a once-in-a-while operation, and the frontmatter array can be find-replaced.

### 2. Order of `clusters: [...]` is significant

First entry = primary (canonical) cluster. Rest = echoes. The sidebar shows the page in italic with a `↗` glyph under non-primary clusters; delete buttons only appear in the primary slot to avoid duplicate destructive actions.

Alternative considered: alphabetical "primary by inferred weight." Rejected — too magical; the librarian has explicit intent and should encode it in the frontmatter order.

### 3. The cluster manifest lives in `wiki/clusters.yml`, not in markdown

Considered alternatives:

- **Embed in `index.md`** as headings + bullet structure. Parser reads it. Rejected — too implicit, easy to break by editing prose, and `index.md` is supposed to be a *catalog*, not a schema.
- **Distribute across concept frontmatter** (no manifest at all). Cluster names + descriptions inferred from the concepts that mention them. Rejected — descriptions can't live nowhere; we need a curated home for them.
- **`wiki/clusters.yml`** ✓ chosen. One file. Hand-curated. Cheap to read on every ingest (~1KB). Order in the file = display order in the sidebar. Cluster pages, when they exist, are auto-detected by location (`wiki/concepts/clusters/<slug>.md`) — the manifest doesn't need to track them explicitly.

### 4. The 5 starting clusters

Inferred from the existing 13 concepts and `index.md`'s informal sections:

| Cluster | Description | Members (primary) | Echoes |
|---|---|---|---|
| `agentic-coding` | How software gets built when AI agents are first-class. | agent-native, compound-engineering, folder-is-the-agent, llm-as-librarian | — |
| `paradigms` | New shapes of creating, working, and living that the agent stack makes possible. | hypercreativity, one-person-studios, super-porous-ecosystem, taste-as-skill | ai-autopilot, ai-overwork |
| `moats` | Where durable advantage collects when the model layer commoditizes. | boring-businesses, social-dandelions | super-porous-ecosystem |
| `anti-patterns` | Failure modes of the agent-native era. | ai-autopilot, ai-overwork | — |
| `ai-capability` | How AI gets good — curricula, transfer learning, substrates. | games-as-curriculum | — |

Multi-membership earned its keep three places:
- `super-porous-ecosystem` — primary `paradigms` (it's Sahana's framing), echoed in `moats` (it describes the new competitive landscape).
- `ai-autopilot` — primary `anti-patterns`, echoed in `paradigms` (taste-as-skill failure).
- `ai-overwork` — primary `anti-patterns`, echoed in `paradigms` (hypercreativity gone wrong).

`ai-capability` is a singleton today. Kept as its own cluster on the bet that it'll grow as more training/RL sources come in.

### 5. Cluster pages: not built up-front

Patterns 1+4 and 2+4 both *allow* cluster pages, but only 2+4 lets you defer them. We chose to defer all five. The sidebar shows headers as plain bold labels until a page exists at `wiki/concepts/clusters/<slug>.md` — at which point `loadClusterManifest()` auto-detects it and the header becomes a link. Zero code change to promote.

This is the lazy-upgrade-path argument: cluster pages are wiki pages, and writing a wiki page is a real synthesis act. Forcing five new pages today would either produce thin filler or block the structural change. Promoting a cluster to a page is a librarian decision per cluster, not a structural decision.

### 6. Slack `/wiki-list` mirrors the sidebar

The Slack handler was using `getWikiTree()` (flat). It now uses `getClusteredTree()` and renders cluster headers with the same `↗` echo glyph. The `MAX_PAGES` cap was bumped from 30 to 40 to make room for echoed entries.

`/wiki-list` is the librarian's view-from-Slack of what exists; it should match what the web sidebar shows. They share the same data layer now (`getClusteredTree()`), so future cluster changes propagate automatically.

### 7. Ingest contract changes (CLAUDE.md)

The Stage 1 ingest workflow had 7 steps. Step 5 was added:

> 5. **Cluster decisions per page (concepts only):**
>    - **Joins existing cluster(s):** add slugs to `clusters: [...]` in frontmatter. No manifest change.
>    - **Expands a cluster meaningfully:** rewrite the `description:` in `wiki/clusters.yml`. If the cluster has a page, add a `{{source:...}}` highlight there.
>    - **Creates a new cluster:** add an entry to `wiki/clusters.yml` with title + description. Use sparingly — prefer expanding an existing cluster over fragmenting.

"Expanding meaningfully" is intentionally vague. Concrete signals: the existing description doesn't quite cover the new content; multiple recent additions share an unnamed sub-theme; or a cluster page (when one exists) gains a fresh `{{source:...}}` highlight. The librarian flags the proposed cluster change in the ingest summary so Sahana can override.

## How it works (mechanics)

### Data layer (`lib/wiki.ts`)

New types:

```ts
interface ClusterDef {
  slug: string;
  title: string;
  description: string;
  page?: { href: string; title: string };  // present when wiki/.../clusters/<slug>.md exists
}

interface ClusterGroup {
  cluster: ClusterDef | null;             // null = "Unsorted" bucket
  pages: ClusteredPageEntry[];
}

interface ClusteredPageEntry {
  page: WikiPageMeta;
  isPrimary: boolean;                     // false = echoed in non-primary cluster
}

type WikiClusteredTree = Record<string, ClusterGroup[]>;
```

`loadClusterManifest()` reads `wiki/clusters.yml` once (cached in production) via `js-yaml`, walks all pages to find ones at `<category>/clusters/<slug>.md`, and attaches them to the matching `ClusterDef.page`.

`getClusteredTree()` does the actual grouping:

1. Bucket all pages by `category`.
2. For each category, hide the cluster pages themselves (they render as headers, not children).
3. If no page in the category declares any `clusters`, return a single anonymous group → flat rendering. (This is what Projects gets today.)
4. Otherwise, walk the manifest in order. For each cluster, find every page whose `clusters` array contains its slug; mark `isPrimary = (clusters[0] === slug)`.
5. Any page whose declared clusters are all unknown to the manifest, or that declares nothing, falls into a final "Unsorted" group.

### Sidebar (`components/TopicTree.tsx`)

Two-level rendering:

- **CategorySection** is the existing top-level toggle.
- **ClusterBlock** is new — second-level toggle, header, and indented page list. Falls back to a flat `PageList` when the category has only one anonymous group.
- **PageRow** received an `entry: ClusteredPageEntry` prop. When `isPrimary === false` it renders italic, adds the `↗` glyph, and hides the delete button.

Cluster header rendering rules:
- If `cluster.page` is set → header is a `<Link href={cluster.page.href}>`.
- Otherwise → plain `<span>` with `cluster.description` as a `title=` tooltip.

### Slack (`lib/slack/handlers/list.ts`)

Indents shift one level when clusters are present:

```
▾ *Concepts*
    ▸ *Agentic Coding*
        • <url|Agent-Native>
        • <url|Compound Engineering>
        ...
    ▸ *Agent-Native Paradigms*
        • <url|AI Autopilot> ↗
        ...
▾ *Projects*
    ▸ <url|Cora>
    ▸ <url|Every>
    ...
```

When a cluster has a page, its header becomes `<url|Cluster Title>` instead of `*Cluster Title*`. Same data path as the web sidebar.

### `index.md` and `log.md`

`index.md` is sectioned by cluster (using `###` headings inside the `## Concepts` section). It's still a catalog, not a schema — the schema lives in `clusters.yml`. The mirror is convention, not enforcement.

`log.md` got a new entry under `## 2026-04-26 — Cluster taxonomy introduced` recording the manifest creation, the per-concept frontmatter additions, and the sidebar/Slack/CLAUDE.md changes.

## What didn't work / pivots during the build

### Plan-mode initial draft proposed pattern 2 alone

The first plan recommended shipping pattern 2 (`cluster: agentic-coding` scalar) immediately and adding cluster pages later. Rejected by Sahana with the multi-membership constraint — a single string can't express "this concept is both a paradigm and an anti-pattern." Plan was rewritten around 2+4 with array-valued `clusters:`. Lesson: the simplest shape isn't always the right shape; always reflect requirements back before assuming "minimum" is "minimal."

### `gstack-browse` couldn't see `bun` (again)

Same symptom as Stage 1's verification: the gstack browser tool spawns a subprocess that doesn't find bun in PATH. Worked around by extracting the rendered sidebar HTML directly with `curl` + a Python regex stripper. Confirmed all 5 cluster headers in declared order, plus three `↗` echoes in the right slots.

### Plan-mode "push to main" block

Mid-conversation, the harness started blocking commits/pushes to `main` ("bypasses PR review"). Earlier pushes in this session worked fine; the rule tightened. Routed around by asking the user to authorize in-line. This is harness-specific, not a code issue, but worth flagging if Stage 2+ tries to ship via cron/auto.

## Open follow-ups

- **Cluster pages.** Five clusters today, zero pages. As ingests accumulate `{{source:...}}` highlights that *describe* a cluster (vs the concepts inside it), promote those clusters to `wiki/concepts/clusters/<slug>.md`. Likely first candidates: `agentic-coding` (the foundational pattern set) and `paradigms` (Sahana's own framing).
- **Cluster validation script.** Right now, an unknown cluster slug in a frontmatter array silently lands in "Unsorted." A small `tsx` script that diffs `clusters.yml` keys against frontmatter usage would catch typos. Cheap to write; not critical until the librarian starts misfiring.
- **Cluster reordering UX.** The manifest's order = display order. Editing YAML by hand is fine for 5 clusters, will get tedious at 15+. The brainstorm called out `/wiki-organize` as a Slack-side command for conversational reorganization (option #6 in the original idea pool). Not built; deferred until ergonomics demand it.
- **Books category.** Empty today. When books arrive, they may want their own clusters (e.g. by topic, by author, by reading status). The data layer already supports per-category clustering — `getClusteredTree()` checks for cluster signal independently per category.
- **Index.md / clusters.yml drift.** `index.md` is hand-maintained to mirror the manifest. If they drift, `index.md` wins for prose, `clusters.yml` wins for schema. A future lint rule could surface mismatches.

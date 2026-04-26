# sahana-wiki — Design System

The visual language for the wiki viewer. Stage 1 onwards.

## Vibe

Clean, modern, white. A bullet-journal-meets-terminal feel: pixelated retro headings against a clean sans body, sitting on a subtle dot-grid background. Color is used sparingly, only for highlights — the page itself stays calm.

## Core tokens

```
--bg-primary:       #ffffff   /* page background */
--bg-dot:           #e7e5e4   /* dot grid color, ~stone-200 */
--bg-subtle:        #fafaf9   /* sidebar / panel surfaces */

--ink-primary:      #0a0a0a   /* near-black, body + headings */
--ink-secondary:    #525252   /* gray-600, secondary text */
--ink-tertiary:     #a3a3a3   /* gray-400, captions, dates, category eyebrows */
--ink-muted:        #d4d4d4   /* borders, dividers */

--accent-lavender:  #c1bbdd   /* highlight A — selected items, focus, soft accent */
--accent-mint:      #9ee5dd   /* highlight B — source-highlights, the marquee feature */
```

## Typography

| Role | Font | Notes |
|---|---|---|
| Headings (h1–h4) | **VT323** | Pixel-monospace retro. Looks like a hand-labeled bullet journal section. Loaded via `next/font/google`. |
| Sidebar category labels | **VT323** | Same retro heading feel for menu sections. |
| Body | **SF Pro** | macOS native. Falls back to `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`. |
| Code | **Geist Mono** | Inherited from CNA scaffold. |

Type scale (body baseline 16px / 1.65 line-height):

- h1 — 2.5rem VT323, ink-primary
- h2 — 1.75rem VT323, ink-primary, with a thin lower border
- h3 — 1.25rem VT323, ink-primary
- Eyebrow / category label — 0.75rem VT323, ink-tertiary, uppercase, +1px tracking
- Body — 1rem SF Pro, ink-primary
- Caption / date — 0.75rem SF Pro, ink-tertiary

## Surfaces

### Page background

```css
background-color: var(--bg-primary);
background-image: radial-gradient(var(--bg-dot) 1px, transparent 1px);
background-size: 24px 24px;
background-position: -1px -1px;
```

A 24px dot grid. Subtle. Should be visible but never dominant.

### Sidebar / right panel

Solid `--bg-subtle` with no dot grid (so the active row's lavender chip pops cleanly).

## Color usage

- **Text:** only ink tokens. No blues, no greens.
- **Internal wikilinks:** `--ink-primary` with a 2px lavender underline (`text-decoration-color: var(--accent-lavender); text-decoration-thickness: 2px; text-underline-offset: 3px`). Hover: underline thickens to 4px.
- **External links:** `--ink-primary` with a dotted gray underline.
- **Source highlights** (`{{source:slug}}…{{/source}}`): mint background marker stripe (`--accent-mint`) running across the lower 45% of the line — keeps the marker-pen feel but in mint instead of yellow. On hover the stripe fills the full line height.
- **Active sidebar item:** lavender chip background (`--accent-lavender` at full opacity, ink-primary text, 2px rounded).
- **Hover sidebar item:** `--bg-subtle` background, ink-primary text.

## Spacing

Stick to 4-px-grid increments: 4, 8, 12, 16, 24, 32, 48. Article content uses 32px horizontal padding, 40px top/bottom.

## Layout

3-column grid (Stage 1 spec):

- **Left** — 260px sidebar, sticky full-height. Topic tree, category sections collapsible via chevron.
- **Center** — fluid, max-width 720px article column, centered with margin-auto.
- **Right** — 380px slide-in drawer (fixed-position, hidden by default). Slides in from the right when a source-highlight is clicked.

## Iconography

Lucide icons throughout. Size: 16px in line with text, 14px for sidebar chevrons. Color: `--ink-secondary` by default, `--ink-primary` on hover/active.

Specific:
- `ChevronDown` / `ChevronRight` — sidebar category sections (open vs collapsed)
- `X` — close button on the source panel
- `ExternalLink` — alongside the "Open original" link in the source panel

## Dark mode

**Out of scope for Stage 1.** White-only. Reconsider at Stage 6 (hosted).

## Don'ts

- No drop shadows on cards or tiles. Borders only.
- No blue. The Tailwind blue-500 was removed.
- No emojis in UI chrome.
- No yellow highlight (deprecated — replaced by mint).
- No bordered "card" containers around list items. Hover is the affordance.

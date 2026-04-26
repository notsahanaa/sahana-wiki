---
title: Farzapedia — Farza's Personal Encyclopedia
url: https://twitter.com/FarzaTV
date: 2026-04-25
summary: Screenshot reference for the visual style of this wiki. Wikipedia-style layout with a categorized left sidebar of all topics in the encyclopedia, a center article with Contents/TOC and internal links, and clean typography.
tags: [design-reference, wiki-ui]
---

# Farzapedia

A personal-encyclopedia project Farza built. Used as the **visual anchor** for the `sahana-wiki` viewer.

## What we copied

- Categorized left sidebar (Navigation, Artifacts, Assessments, Audiences, Books, etc.) listing every page, with the current page highlighted.
- Wikipedia-style center article: title, infobox-ish header, inline Contents block, body with internal links rendered as standard blue underlined links.
- Clean serif body, sans-serif headings (we are using Geist instead of Wikipedia's stack).

## What we added

- **Source highlights** — phrases in the body that are grounded in a specific source render as a distinct highlight; clicking them opens a right-side panel with the source card. This is *not* in Farzapedia.
- A right-side panel that's hidden by default and slides in on click.

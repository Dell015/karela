# Website assets

**Last updated:** 2026-10-09. The July version of this file listed seven
screenshot slots. They are gone: the phone screens on the page are now built
in HTML and CSS (`css/screens.css` and three `<template>`s in `index.html`),
so the page needs no app screenshots.

All fonts and images are local (the CSP allows nothing else). Keep the page
light for mid-range Android on prepaid data.

## What's in `assets/`

| File | What it is | Size |
|---|---|---|
| `img/ani-run.webp`, `ani-walk.webp`, `ani-idle.webp` | Ani sprite sheets, 8 frames of 256 by 336 each, used with the `.sprite` classes | about 50 KB each |
| `img/ani-face.webp` | Ani's face | 16 KB |
| `img/karela_word-logo.png` | Wordmark in the nav and footer | 16 KB |
| `img/icon.png` | Apple touch icon | 32 KB |
| `img/favicon.png` | Favicon | 4 KB |
| `img/randel.webp`, `yshia.webp` (Trishia), `steven.webp`, `sander.webp` | Team photos, 480 by 480, see-through background | about 20 KB each |
| `img/og-placeholder.png` | **Placeholder** link-preview image (see below) | 20 KB |
| `img/coach.png` | Not used by the page (BACKLOG P2-9) | 28 KB |
| `fonts/Excon-*.woff2` | Excon, six weights | |
| `fonts/GochiHand.woff2` | Ani's handwritten notes (`.note`) | |

## Still needed

| Asset | File | Size | Where |
|---|---|---|---|
| Link-preview image | `img/og.png` | 1200 by 630, under about 150 KB | `<meta property="og:image">` in `index.html` (search `TODO(assets)`), then delete `og-placeholder.png` |

Team photos: new ones go in `img/` as 480 by 480 webp, like the four already there.

## Ani sprites

The sprites are rendered from `assets/3d/female_final.glb` (the app's Ani
model) with three.js in headless Chromium. If the model changes, re-render
them rather than editing them by hand, and frame the camera from the union of
each clip's bounding boxes so her head is never cut off. The render script
isn't saved in the repo yet (BACKLOG P2-11).

## Before adding any image

- Convert to WebP and compress, for example:
  `npx @squoosh/cli --webp '{"quality":82}' -d website-v2/assets/img/ <input>`
- Give every `<img>` a `width`, `height` and descriptive `alt`.
- Don't copy app images into the site as they are. Resize and compress them
  first.

# Karela website: backlog and handoff

What the landing page (`website-v2/`) still needs, written so anyone can pick
it up cold. Each item says what is missing, where it lives and what "done"
looks like.

**Last updated:** 2026-10-09. This replaces the 2026-07-31 backlog, which
described an earlier version of the page (screenshot placeholders,
`placeholders.css`, `components.css`, a stat strip). Those are gone; see
"Done since the July backlog" below. The old text is in git history.

The house rules for the page (CSP, no frameworks, design rules, voice,
accessibility floor, how to test) are in the repo's `CLAUDE.md` under
"The landing page". Read that first.

---

## Where things stand

The page is built: 11 sections (hero, problem, system, ghost, Ani tour,
Bayanihan, compare, built for the Philippines, waitlist, survey, team), three
phone screens drawn in HTML and CSS from `<template>`s, Ani sprites rendered
from the 3D model, one fixed background that blends palettes as you scroll,
and Netlify and Vercel configs with a strict CSP.

What's left is mostly outside the code: switching on the two form backends,
real artwork for link previews, a privacy page, and store links at launch.

| Priority | Meaning |
|---|---|
| **P0** | Needed before showing the page to anyone outside the team |
| **P1** | Needed before a public launch |
| **P2** | Polish |
| **P3** | Later |

---

## P0

### P0-1. Waitlist and survey don't save anything yet

**Where:** `website-v2/js/config.js`, `WAITLIST.endpoint` and `SURVEY.endpoint`
(both `""`).

Both forms are finished: validation, keyboard use, screen-reader messages,
sending and error states. While the endpoint is empty they say plainly that
nothing was saved. They never fake a success.

The backend is ready to set up:
- `website-v2/backend/supabase-site.sql` creates the `waitlist` and
  `survey_responses` tables in a **new** Supabase project made only for the
  site. Anyone can add a row; nobody can read, change or delete rows with the
  public key. You read the data in the Supabase dashboard.
- The CSP in `netlify.toml` and `vercel.json` already allows
  `https://formspree.io` and `https://*.supabase.co` in `connect-src`. Once
  you pick one, you can narrow it to that exact origin.

**Steps (Supabase):** create a new project, run `backend/supabase-site.sql`,
then fill in `endpoint` and `headers` as the comments in `config.js` show.
**Never use the mobile app's project or its `EXPO_PUBLIC_SUPABASE_ANON_KEY`.**

**Steps (Formspree):** create two forms, paste their URLs as the endpoints.

**Done looks like:** a real email on the waitlist and a real survey
submission each show up as a row, and the success message shows. Also test
the "not connected" message (empty endpoint) and the validation message.

### P0-2. Two offline claims are ahead of the app

**Where:** `index.html`, the compare table ("Does it work offline?") and the
"Built for the Philippines" section ("Tracking runs offline in SQLite and
syncs ... Every event carries a UUID").

Update 2026-10-11: the app's run outbox is built (C7): runs are saved on the
phone with a UUID and sync when online. It still needs a device test. Ani,
map tiles and civic reports still need a connection, so "Fully" in the
compare table is the owner's call (`docs/QA_REPORT.md`, section 7).

**Done looks like:** either the app's run outbox is built (C7), or the two
lines say it is planned. The owner decides which. The page hasn't been
changed.

---

## P1

### P1-3. No real link-preview image

**Where:** `assets/img/og-placeholder.png`, search `TODO(assets)` in
`index.html`.

The 1200 by 630 image is a placeholder. Any link shared on Messenger,
Facebook or X shows it, and those are the main sharing channels here.

**Done looks like:** real artwork at `assets/img/og.png` (keep it small, under
about 150 KB), the `og:image` meta tag pointing at it, the `TODO(assets)`
comment removed, and the placeholder file deleted.

### P1-4. No privacy policy page

The waitlist says "Privacy policy coming soon." Once the forms save email
addresses, RA 10173 needs a published privacy notice: what is collected, why,
how long it's kept, and how to ask for deletion. `docs/aboutkarela.md`
section 23 has the substance. NPC registration as a personal information
controller is also needed before public launch (section 23).

**Done looks like:** `website-v2/privacy.html` using the same CSS (start each
extra page with its own doctype, charset and viewport), linked from the
waitlist note and the footer, with the "coming soon" text removed. Privacy
claims phrased "by design" and matching `docs/aboutkarela.md`.

### P1-5. Store links at launch

**Where:** `config.js`, `STORE_LINKS` (both `null`); the "App Store soon" and
"Google Play soon" labels in the waitlist section of `index.html`.

**When the app ships:** set the real store URLs and drop the "soon" labels.
Official badge artwork must come from Apple and Google; their guidelines
don't allow recreations.

### P1-6. Point the host at `website-v2/`

The old `website/` folder was deleted on 2026-10-08. The Netlify or Vercel
project must now publish `website-v2/` (both config files live in that
folder).

---

## P2

### P2-12. Keep the demo in step with the app

**Where:** `js/demo-data.js` and `js/demo.js`.

The demo copies the app's screens, rules and prices by hand: the streak
tiers, quest XP, squad and guild rules, shop prices, the Scout Pass track,
Ani's quick-reply answers. When one changes in the app (`services/store.ts`,
the `karela_*_rules()` SQL, `services/ai/demoReplies.ts`, a screen's
layout), change the demo too. The game art in `assets/demo/` is copied from
`assets/images/game/`.

**Done looks like:** the demo matches the app at each release.


### P2-7. Team section (photos added 2026-10-09)

**Where:** `#team` in `index.html`. Four people show with photos
(`assets/img/randel.webp`, `yshia.webp` for Trishia, `steven.webp`,
`sander.webp`, 480 by 480, about 20 KB each). Qarisha Collado and Cyduanne
Biraquit were taken off the page for now at the owner's request (2026-10-09).
To add someone back: copy a `<li class="member member--x">` block, add a
480 by 480 webp, and use a free colour class (`member--d` coral and
`member--e` sky are unused). From 760 px wide the grid shows 4 per row;
with 5 or 6 people, check that the last row looks right.

### P2-8. Ghost and consensus visuals are illustrations

The ghost chart and the consensus animation explain the ideas correctly but
are drawn, not made from real data. Once there are real (anonymised) runs and
verified reports, they could be plotted from that data. Keep the page light:
no map library or tiles on load.

### P2-9. Unused image

`assets/img/coach.png` (28 KB) isn't used by the page or the CSS. Delete it,
or use it.

### P2-10. Fonts could be subset

All seven fonts are WOFF2 already. Subsetting to Latin would make them
smaller still. Low priority.

### P2-11. Save the sprite render script

The Ani sprites (`ani-run`, `ani-walk`, `ani-idle`, `ani-face`) were rendered
from `assets/3d/female_final.glb` with three.js in headless Chromium, but the
script isn't in the repo (only the app's game-art script,
`scripts/render-game-art/`, is). Saving it means the sprites can be
re-rendered when the model changes, as `CLAUDE.md` asks.

---

## P3

- **P3-12.** Tagalog version of the page, once the app has Tagalog.
- **P3-13.** A page for LGU coordinators and partners (`docs/aboutkarela.md`
  section 24).
- **P3-14.** Devlog for the thesis and for search.
- **P3-15.** A short demo video, lazy-loaded behind a click, kept small for
  prepaid data.

---

## Done since the July backlog

- **App demo (2026-10-11):** `demo.html` runs a copy of the app in the
  browser with demo data (Randel's made-up account): Home, a fast-forwarded
  run with the ghost, civic reports and pins, the run summary, Quests, Ani
  (pre-written answers), Squad / Guild / Territory, Shop, Scout Pass,
  Progress, Calendar, Profile and Customize Ani. Phone frame on laptops, a
  Full screen button on phones. Nothing is saved. Linked from the hero
  ("Try the app"), the new "Try it" section after the tour, and the menu.
  Files: `demo.html`, `css/demo.css`, `js/demo-data.js` (all the demo
  numbers and Ani's answers), `js/demo.js`, `assets/demo/`.

- **Phone screens:** the 7 screenshot placeholders and `placeholders.css` are
  gone. The Ani, civic and streak phone screens are built in HTML and CSS
  (`css/screens.css`, three `<template>`s), sized in `cqw` so they scale as
  one piece.
- **Invented numbers removed:** the old stat strip with illustrative numbers
  (`TODO(stats)`) is gone. The hero says "In development. Piloting in
  Tuguegarao City."
- **Survey:** real questions from the Karela research team in `config.js`;
  the "Sample questions" badge is off (`showSampleBadge: false`).
- **Form backend ready:** `backend/supabase-site.sql` for a separate site
  project, and the CSP already allows the form origins.
- **Ani on the page:** 8-frame webp sprite sheets (about 50 KB each) and a
  face image, plus a few handwritten Taglish notes in Gochi Hand.
- **Interactive pieces:** Resonance chart you can drag through a run, ghost
  chart, sticky phone tour, consensus animation, streak slider that drives
  the phone screen, safety tier selector that shifts the page palette, run
  scrollbar tracker.
- **Background:** one fixed background blends palettes by scroll position
  (`data-palette` on each section), so sections have no hard edges.
- **Fonts:** all WOFF2, self-hosted.
- **Accessibility and performance work from July** (contrast, skip link,
  keyboard-scrollable regions, menu dialog semantics, image payload from
  about 1 MB to under 100 KB, 404 page) carried over.

---

## Decided against

Do not "fix" these without revisiting the decision.

| Left out | Why |
|---|---|
| Analytics snippets | The CSP allows no outside scripts, and `CLAUDE.md` rules them out. Revisit only with a self-hosted, cookieless option and a privacy-page update. |
| Store download buttons before launch | Linking to a missing store page is worse than an honest waitlist. |
| Testimonials, "trusted by" logos, user counts | No users or signed partners yet. Inventing them is dishonest and easy to catch. |
| Popups and exit-intent modals | Hostile, and the page already has a waitlist. |
| Cookie banner | No cookies, no trackers. |
| Frameworks, build tools, CDNs | One page, no build step, no supply-chain risk. The CSP blocks CDNs anyway. |
| Live map on load | Needs a key, adds weight, and needs a consent story. |
| Health claims ("burn X calories") | Ani gives general wellness coaching only. The page keeps the same restraint. |

---

## Before any deploy

```bash
# Serve locally (pick one)
npx serve website-v2
python -m http.server 8770 --directory website-v2

# JS parses
node --check website-v2/js/main.js
node --check website-v2/js/config.js

# Leftover TODOs (only TODO(assets) for the og image should remain until P1-3)
grep -rn "TODO" website-v2/ --include=*.html --include=*.css --include=*.js
```

Then the manual checks in `CLAUDE.md`: widths 320, 390, 768, 1024, 1440 and
1920 with no sideways scroll; no console errors; reduced motion still gives a
complete page; keyboard through nav, menu, run tracker, Resonance slider, tier
selector, forms and survey; both form messages.

---

## Deploy

No build step. Point any static host at `website-v2/`.

- **Netlify:** `website-v2/netlify.toml`
- **Vercel:** `website-v2/vercel.json`
- **GitHub Pages:** works, but can't send the security headers, so the CSP is
  lost.

Both configs set long caching for `assets/`, no caching for HTML, and these
headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`
and the CSP. When a form endpoint is chosen, keep `connect-src` in **both**
files in step.

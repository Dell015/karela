# Karela Website — Backlog & Handoff

> **Purpose of this document.** Everything the showcase site needs that is not
> done yet, written so that any human or AI agent can pick it up cold. Every
> item states what is missing, where it lives, why it was deferred, and exactly
> what "done" looks like.
>
> **Status:** Phases 1–6 of the build are complete. The site is functional,
> responsive, accessible, and deployable, with Netlify and Vercel configs
> committed. What remains is real content (screenshots, copy, numbers) and one
> backend decision.
>
> **Last updated:** 2026-07-31

---

## How to read this document

| Priority | Meaning |
|---|---|
| **P0** | Site is misleading, broken, or embarrassing without this. Fix before showing anyone outside the team. |
| **P1** | Site works but converts poorly. Fix before any public launch or pitch. |
| **P2** | Polish. Improves quality but nothing breaks without it. |
| **P3** | Nice to have / future expansion. |

Every code location is given as a path relative to the repo root, with the
search string to find it.

---

## Quick orientation for a new agent

```
karela/
├── website/                 <- the showcase site (this document's subject)
│   ├── index.html           <- single page, 11 sections, all content inline
│   ├── css/
│   │   ├── tokens.css       <- design system, ported from styles/designSystem.ts
│   │   ├── base.css         <- fonts, reset, utilities, reveal animations
│   │   ├── components.css   <- nav, buttons, cards, footer
│   │   ├── sections.css     <- per-section layouts (hero through team)
│   │   └── placeholders.css  <- DELETE THIS FILE once all assets land
│   ├── js/
│   │   ├── config.js        <- ALL tunable settings live here. Start here.
│   │   └── main.js          <- nav, reveals, interactive widgets
│   ├── assets/
│   │   ├── fonts/           <- Excon family, self-hosted (6 weights)
│   │   └── img/             <- logos, favicon, OG placeholder
│   ├── ASSETS.md            <- asset manifest + swap instructions
│   ├── BACKLOG.md           <- this file
│   ├── netlify.toml         <- deploy + security headers + caching
│   └── vercel.json          <- same, for Vercel
└── aboutkarela.md           <- source of truth for ALL site copy (41 sections)
```

**Run it locally:**
```bash
npx http-server website -p 8080
# then open http://127.0.0.1:8080
```

There is no build step, no package.json, and no dependencies. Editing a file
and refreshing the browser is the entire dev loop.

**Golden rule when committing:** this repo has unrelated uncommitted work in
the app source. Only ever `git add website/`. Never `git add .` or `git add -A`.

---

## P0 — Blocking issues

### P0-1. Waitlist form does not submit anywhere

**Where:** `website/js/config.js` → `WAITLIST.endpoint` (currently `""`)
**Search:** `WAITLIST_ENDPOINT`

The waitlist form is fully built: it validates email format, handles keyboard
submission, manages focus, announces errors to screen readers via an ARIA live
region, and shows loading/success/error states. It does not post anywhere,
because no backend has been chosen.

**Current behaviour when unconfigured:** the form validates the email, then
displays an honest fallback message pointing the user to the GitHub repo. It
does **not** pretend to have saved the address. This was a deliberate choice —
silently dropping signups would be worse than admitting the form is not live.

**To make it work, pick one:**

**Option A — Formspree (fastest, ~10 minutes)**
1. Create a form at https://formspree.io, copy the endpoint URL.
2. Set `endpoint` in `website/js/config.js`:
   ```js
   WAITLIST: { endpoint: "https://formspree.io/f/YOUR_ID", method: "POST" }
   ```
3. Done. The existing `fetch` call already sends `{ email, source, timestamp }`
   as JSON and handles the response.

**Option B — Separate Supabase project (owns the data, ~1 hour)**
1. Create a **new** Supabase project. Do **not** reuse the app's project.
2. Run this SQL:
   ```sql
   create table public.waitlist (
     id          uuid primary key default gen_random_uuid(),
     email       text not null unique,
     source      text,
     created_at  timestamptz not null default now()
   );

   alter table public.waitlist enable row level security;

   -- Anonymous visitors may insert, and nothing else.
   create policy "anon can join waitlist"
     on public.waitlist for insert to anon with check (true);

   -- No select/update/delete policy = nobody can read the list via the
   -- anon key. Read it from the Supabase dashboard or with the service key.
   ```
3. Set the endpoint to `https://<project>.supabase.co/rest/v1/waitlist` and add
   the new project's anon key to `WAITLIST.headers`.

> **SECURITY — do not skip.** The app's `EXPO_PUBLIC_SUPABASE_ANON_KEY` must
> never appear in `website/`. The app's anon key grants access to user
> profiles, missions, and civic nodes under its RLS policies. A marketing page
> is a public, unauthenticated surface; putting that key in it widens the
> app's attack surface for zero benefit. Use a separate project.

**Done looks like:** submitting a valid email inserts a row you can see in the
backend, and the success state renders. Test with a real address.

---

### P0-2. Every app screenshot is a placeholder

**Where:** 7 slots in `website/index.html`
**Search:** `ph__flag`

No screenshots of the app exist in the repo. Each slot renders an on-brand
dashed panel naming the exact file and dimensions required. The site looks
intentional, but a visitor cannot see the product — which defeats the purpose
of a showcase site.

Full manifest, capture commands, and compression settings: **`ASSETS.md`**.

Highest impact first:
1. Active run with ghost pacing (hero)
2. Ani chat conversation
3. Civic report / CivicHUD
4. Dashboard
5. Quests
6. Progress graph

**Done looks like:** `css/placeholders.css` is deleted, its `<link>` removed
from `index.html`, and no `ph__flag` matches remain.

---

### P0-3. All statistics are illustrative, not measured

**Where:** `website/js/config.js` → `STATS`
**Search:** `TODO(stats)`

The hero stat strip and the Civic Engine counters show plausible-looking
numbers. **These are not real measurements.** The app is in development with no
pilot data collected yet.

They are centralised in one config object specifically so they can be replaced
or removed in one edit, and each is labelled in the UI as a design target
rather than an achieved result.

**Do one of these before any public launch:**
- Replace with real pilot numbers once Tuguegarao data exists, or
- Delete the stat strip entirely (`data-stats` block in `index.html`), or
- Keep them but ensure the "design target" framing stays visible.

Publishing invented metrics as achievements is a real reputational and legal
risk, especially for a thesis project. Do not remove the qualifying label
without replacing the numbers.

---

## P1 — Needed before public launch

### P1-4. ~~Nav logo is 657 KB~~ — RESOLVED 2026-07-31

The source `karela_word-logo.png` was a **4388 × 4388 square canvas** being
rendered at 120 × 30 CSS pixels, almost entirely transparent padding. It was
trimmed to its actual content bounds (4344 × 764, a true 5.69:1 ratio) and
resampled to 360 × 63 with bicubic interpolation.

**657 KB → 12 KB, a 98.1% reduction.**

The markup `width`/`height` attributes were also wrong — they said 120 × 30
(4:1), which did not match the real 5.69:1 ratio and would have caused the
logo to render squashed or shifted once dimensions were respected. Now 171 × 30
in the nav and 159 × 28 in the footer.

`icon.png` was also 1024 × 1024 at 393 KB while only serving as the
`apple-touch-icon`; resized to 180 × 180, now 30 KB. Unused `fire.png` removed.

**Total image payload: 1,077 KB → 89 KB.**

Still worth doing if you have vector source: an SVG wordmark would be roughly
4 KB and scale perfectly. Also still true — **never ship**
`assets/images/karelala.png` (25 MB) or `karela_logo.png` (2.3 MB) to the web.

---

### P1-5. No real Open Graph image

**Where:** `website/assets/img/og-placeholder.png`
**Search:** `TODO(assets)` in `index.html`

A 1200×630 placeholder was generated programmatically so the meta tag resolves
instead of 404ing. It literally says "PLACEHOLDER" on it. Any link shared to
Facebook, Messenger, X, or Discord will show it.

Given Messenger and Facebook are the primary sharing channels in the
Philippines, this matters more than it would elsewhere.

**Done looks like:** real 1200×630 artwork at `img/og.png`, meta tag updated,
validated at https://www.opengraph.xyz.

---

### P1-6. No analytics

Nothing measures whether the site converts. Recommended: Plausible or Umami
(both privacy-respecting, cookieless, and therefore consistent with the RA
10173 posture the app takes; neither needs a cookie banner).

Events worth tracking: waitlist submit success, waitlist submit failure, scroll
depth past each section, streak-slider interaction, nav link clicks.

Add the snippet to `index.html` before `</head>`. Do **not** add Google
Analytics without also adding a consent banner.

---

### P1-7. No privacy policy or terms page

The site collects email addresses. Under RA 10173, a personal information
controller needs a published privacy notice stating what is collected, why, how
long it is retained, and how to request deletion.

`aboutkarela.md` §23 already contains the substance — it needs to become a
page. Create `website/privacy.html` reusing the same CSS, and link it from the
footer (a placeholder link with `aria-disabled` is already there).

Also noted in §23: NPC registration as a personal information controller is
required prior to public launch.

**This is a legal requirement, not a nice-to-have, once the form goes live.**

---

### P1-8. Store badges are intentionally disabled

**Where:** `website/index.html`, hero and waitlist sections
**Search:** `data-store-badge`

The app is not published (`aboutkarela.md` line 5: `Status: Active_Development`,
v3.1). App Store and Play Store badges are built and styled but rendered with
`aria-disabled="true"` and a "Coming soon" label, so they are visible as intent
without being a broken promise.

**When the app ships:** remove `aria-disabled`, set the real store URLs in
`config.js` → `STORE_LINKS`, and drop the "Coming soon" label. Official badge
artwork must come from Apple and Google — their brand guidelines prohibit
recreations, and the current implementation uses text-and-icon stand-ins
rather than fake badges for exactly this reason.

---

### P1-9. Team section has no photos

**Where:** `website/index.html`, `#team`

Six members, six circular placeholders showing initials. Initials-in-a-circle
is a legitimate permanent design choice, so this is only P1 if you want
photos.

`assets/images/sir-sander.jpg` already exists in the app repo for Sander
Sedano. Needed: 400×400 square crops for Randel, Trishia, Steven, Qarisha, and
Cyduanne, saved to `website/assets/img/team/`.

---

## Resolved during the phase 1–6 build

Logged so nobody re-investigates a fixed problem. Each was found by audit
rather than assumed.

| Issue | Finding | Fix |
|---|---|---|
| **Contrast failure** | `--text-faint: #555555` measured **2.61:1** against `--bg`, far below the WCAG AA 4.5:1 minimum for body text — and it was applied to roughly ten small-text elements (captions, fine print, table footnotes, input placeholders). | Raised to `#7a7a7a` (**4.53:1**). Original preserved as `--text-faint-app` for reference. Three hardcoded `fill="#555"` SVG axis labels updated to match. |
| **Invalid `dl` markup** | The hero stat list emitted `<dd>` before `<dt>`, which violates the HTML definition-list content model. | Reordered to `dt` then `dd`, with `flex-direction: column-reverse` keeping the number visually on top. A screen reader now reads "Max streak multiplier: 3.0×". |
| **Meaningless ARIA** | `aria-disabled="true"` was set on non-interactive `<span>` elements (store badges, privacy note). ARIA states only apply to elements with interactive roles. | Replaced with a `.store-badge--soon` class; state is conveyed by the visible "Coming soon" text. |
| **Keyboard-inaccessible scroll regions** | The comparison table and both formula blocks scroll horizontally on narrow viewports but could not be reached or scrolled by keyboard (WCAG 2.1.1). | Added `tabindex="0"`, `role="region"`, and descriptive `aria-label` to all three. |
| **Skip link did not move focus** | `#main` was not focusable, so the skip link scrolled without transferring focus. | Added `tabindex="-1"` to `<main>`. |
| **Focus-trapped menu lacked dialog semantics** | The mobile menu traps focus but was a plain `<div>`, so assistive tech had no signal it was modal. | Added `role="dialog"` and `aria-modal="true"`. |
| **Oversized images** | Logo was a 4388×4388 canvas at 657 KB rendered at 120×30; `icon.png` was 1024×1024 at 393 KB for a 180px slot. | Trimmed, resampled, and corrected aspect ratios. Image payload **1,077 KB → 89 KB**. |

Also added in the same pass: `prefers-contrast: more` support (brighter
secondary text, solid borders, glow orbs removed), and `forced-colors: active`
support — gradient-clipped text renders **invisible** in Windows High Contrast
mode because its fill is transparent, so `--webkit-text-fill-color` is restored
to `currentColor` there.

---

## P2 — Polish

### P2-10. Ghost System and Civic Engine diagrams are CSS/SVG approximations

**Where:** `#ghost` and `#civic` in `index.html`

Both sections are hand-built SVG and CSS animations that communicate the
concept correctly but are illustrative, not generated from real data.

- **Ghost System:** shows the effort-decay curve
  `P(t) = P_baseline × e^(−λ × max(0, t − t_fatigue))` from §10.2 as a hand-drawn
  SVG path, with a static PB ghost shown for contrast. Plotting a real curve
  from actual run data would be more honest and more impressive.
- **Civic Engine:** animates three report pins converging into a verified
  cluster (§12.2 spatial consensus, ε = 15–30 m, minPts = 3). It is a loop, not
  a real map.

**Upgrade path:** export anonymised real data from the SQLite `ghost_routes`
table and plot it, and/or embed a real Tuguegarao map (MapLibre GL + free
CARTO dark tiles fits the palette and needs no API key).

---

### P2-11. No favicon set beyond a single 32px PNG

Add `apple-touch-icon` at 180×180, `favicon.svg`, and a `site.webmanifest` with
theme colour `#0d0d0d`.

---

### P2-12. Excon is served as OTF, not WOFF2

Six OTF files at roughly 32 KB each. WOFF2 typically cuts that by 40–50% and is
supported by every browser in use today.

```bash
npx ttf2woff2 < Excon-Regular.otf > Excon-Regular.woff2
```

Then add WOFF2 first in each `@font-face` `src` list, keeping OTF as fallback.
Also consider subsetting to Latin only.

Only Black (900) and Regular (400) are preloaded — that is deliberate, since
preloading all six would compete with the hero render.

---

### P2-13. No 404 page

Add `website/404.html`. Both Netlify and Vercel serve it automatically.

---

### P2-14. Single-language only

The app plans Tagalog and Ibanag support (`README.md` "Add i18n framework").
The site is English-only. For a Tuguegarao beachhead, a Tagalog toggle would
likely lift conversion.

All copy is inline in `index.html`, so this would mean either a second
`index-tl.html` or extracting strings to JSON with a small runtime swap.
Deferred as a larger architectural decision.

---

### P2-15. Reduced-motion coverage is broad-brush

`base.css` kills nearly all animation under
`@media (prefers-reduced-motion: reduce)`, and `main.js` skips observers
entirely. This is correct and safe, but blunt — some non-vestibular animations
(colour fades, opacity) could be preserved for users who only object to motion.
Low priority; current behaviour is the safe default.

---

## P3 — Future

- **P3-16.** Interactive 3D Ani model. `assets/miku_chibi.glb` (1.8 MB) and
  `test_3dmodel/female_final.glb` (1.2 MB) exist. `<model-viewer>` would work
  but adds roughly 300 KB of JS — needs lazy loading behind a click, and the
  1.8 MB payload is hostile to the prepaid-data audience the app targets.
- **P3-17.** LGU / partner landing page. §24 describes a B2B model; a dedicated
  page for LGU coordinators (persona "Mang Ben") would serve a different buyer
  with different needs.
- **P3-18.** Blog or devlog for SEO and thesis documentation.
- **P3-19.** Real-time waitlist counter, once there are numbers worth showing.
- **P3-20.** Video demo replacing the hero screenshot. Highest-converting asset
  for an app site, and also the most work.
- **P3-21.** Press kit page — logos, screenshots, boilerplate.

---

## Deliberate omissions

Things a reviewer might flag as missing that were **decided against**, with
reasoning. Do not "fix" these without revisiting the decision.

| Omitted | Why |
|---|---|
| Download buttons linking to stores | App is not published. Linking to a dead store page is worse than an honest waitlist. |
| Testimonials / user quotes | No users yet. Fabricating social proof is dishonest and easy to catch. |
| "Trusted by" LGU logos | No signed partnerships. Implying government endorsement without it carries real risk. |
| Newsletter popup / exit-intent modal | Hostile UX, and the page already has two waitlist CTAs. |
| Cookie banner | No cookies are set, and no third-party trackers are loaded. A banner would be theatre. Revisit if analytics are added. |
| A JS framework | Zero dependencies means zero supply-chain risk, no build step, and any team member can edit it. The site is one page. |
| Tailwind or a CSS framework | The design system already exists in `styles/designSystem.ts`. Porting it to CSS variables keeps the site and app in sync; a framework would fight that. |
| Live GPS / map embed on load | Costs an API key, adds significant weight, and needs a consent story. The animated SVG communicates the concept at a fraction of the cost. |
| Precise health claims ("burn X calories") | `aboutkarela.md` §16 is explicit that Ani avoids medical claims. Site copy mirrors that restraint. |

---

## Verification checklist

Run before any deploy.

```bash
# 1. Serve locally
npx http-server website -p 8080

# 2. JS parses
node --check website/js/main.js
node --check website/js/config.js

# 3. No unresolved placeholders (should be 0 before public launch)
grep -c "ph__flag" website/index.html

# 4. No TODOs left in shipped code
grep -rn "TODO" website/ --include=*.html --include=*.css --include=*.js
```

Manual checks:
- [ ] Tab through the whole page — focus ring always visible, order logical
- [ ] Open mobile menu with keyboard, confirm Tab stays trapped, Esc closes
- [ ] Set OS to "reduce motion", reload, confirm nothing animates
- [ ] Resize from 320 px to 2560 px, confirm no horizontal scroll at any width
- [ ] Run Lighthouse — target 95+ on all four categories
- [ ] Screen reader pass (NVDA or VoiceOver) on the waitlist form
- [ ] Validate at https://validator.w3.org
- [ ] Check contrast on lime `#7CF205` text — it needs dark ink `#04210A` on
      bright fills, which `tokens.css` provides as `--on-bright`

---

## Deploy

No build step. Point any static host at `website/`.

**Netlify** — `website/netlify.toml` is committed and ready.
**Vercel** — `website/vercel.json` is committed and ready.
**GitHub Pages** — repo Settings → Pages → deploy from `main`, folder
`/website`. Note that Pages cannot serve the custom headers in those config
files.

Both configs set long-lived immutable caching for `assets/`, no-cache for HTML,
and the security headers below.

**Security headers already configured:** `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
and a `Content-Security-Policy`.

> **CSP warning.** The policy is currently restrictive:
> `default-src 'self'`. When you add a waitlist endpoint or analytics, you
> **must** add those origins to `connect-src` and `script-src` or the requests
> will be silently blocked by the browser. This is the single most likely cause
> of "the form worked locally but not in production".

---

## Source-of-truth map

Every claim on the site traces to `aboutkarela.md`. When editing copy, check
the source section first.

| Site section | Source |
|---|---|
| Hero tagline | line 2 — "A Better You, One Quest at a Time." |
| Hero subhead | line 3 — the thesis one-liner |
| The Problem | §2 (line 99) |
| Two Tracks / Resonance | §1 (line 76), §14 (line 595) |
| Ghost System | §10 (line 345), §10.2 decay function (line 371), §17 (line 758) |
| Meet Ani | §16 (line 650) — quest generation, body-aware coaching, limitations |
| Civic Engine | §12 (line 448), §12.2 consensus (line 479), §12.3 decay (line 506) |
| Bayanihan Protocol | §21 (line 917) — safety tiers, quest tables, PoI verification |
| Progression | §17 (line 740) — XP, streak multiplier, dual currency |
| Why Not Strava | §4 (line 129) |
| Built for the Philippines | §8 offline sync (line 306), §23 privacy (line 992) |
| Team | §41 (line 1978) |

**Design tokens** come from `styles/designSystem.ts`, ported to
`website/css/tokens.css`. If a colour changes in the app, change it there and
re-port — do not let the two drift.

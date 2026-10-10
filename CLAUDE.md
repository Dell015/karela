# Karela

Karela is a hybrid fitness and civic app: adaptive running plus crowdsourced reports of real problems in the city (blocked drains, broken roads). It is a thesis and portfolio project for the Philippine startup ecosystem. The pilot city is Tuguegarao City, Cagayan Valley.

The repo holds two separate things. Keep them apart.

1. **The mobile app** (repo root): Expo SDK 57, React Native 0.86, React 19, TypeScript, expo-router (file-based), Supabase (with PostGIS), expo-sqlite for offline-first, Gemini for the Ani coach.
2. **The landing page** (`website-v2/`): plain HTML, CSS and JS. No framework, no build step, no npm.

When a task mentions "the site", "the landing page" or "the page", it means `website-v2/`. Only touch the app when the task clearly says so.

## Hard rules (never break these)

- **Never read, print, log or commit `.env`.** It holds real keys. Use `.env.example` when you need to know what exists.
- **Never put any app key in `website-v2/`.** In particular never paste `EXPO_PUBLIC_SUPABASE_ANON_KEY`, the Gemini key or the weather key there. Site forms (waitlist, survey) must use a **separate** Formspree form or a **separate** Supabase project.
- Do not run destructive commands (`git reset --hard`, `git clean`, `rm -rf`, force-push) without asking first.
- Do not commit or push unless asked. When committing, stage only the files for the task (`git add website-v2/`), never `git add -A`.
- Do not edit `node_modules/`, `android/`, `.expo/` or `app-example/`.
- Do not invent facts about the project. If a number, claim or feature is not in `docs/aboutkarela.md`, `README.md` or the code, ask. In particular, **do not state where the name "Karela" comes from.** The owner has not said.
- Privacy claims must stay accurate. Phrase them as "by design" and match `docs/aboutkarela.md` (RA 10173 Data Privacy Act, raw GPS stays on the phone, Privacy Zones, account deletion within 72 hours).

## Where things are

| What | Where |
| --- | --- |
| Full vision, algorithms, research framework | `docs/aboutkarela.md` (large, search it, do not read it whole) |
| Setup, structure, env vars | `README.md` |
| Computation formulas | `docs/COMPUTATIONS.md` |
| Expo SDK upgrade history | `docs/SDK_UPGRADE_LOG.md` |
| Screens | `app/` (`app/drawer/*` is the main app) |
| Components | `components/` (`PlayerCard`, `QuestCard`, `CivicHUD`, `AniConsole`, ...) |
| Business logic | `services/` (for example `streakMultiplier.ts`) |
| Design tokens | `styles/designSystem.ts`, `theme.ts` |
| Database | `supabase/*.sql`, run in order (`schema.sql`, `02_...`, `03_...`, `04_...`) |
| Landing page | `website-v2/` |
| 3D models the app loads | `assets/3d/*.glb` (sources: `assets/3d/source/`, not bundled) |
| Karela icons (SVG) | `components/icons/KarelaIcon.tsx`: use for Karela concepts (Gems, streak, squad, guild...); keep standard icons for back/close/settings |
| Shop and badge art | `assets/images/game/*.webp`, re-render with `node scripts/render-game-art/render.mjs` (needs Chrome + Python), map in `services/gameArt.ts` |
| Shop, squads, guilds, territory | server rules in `supabase/10_...` to `13_...`; app side in `services/shop.ts`, `squads.ts`, `guilds.ts`, `territory.ts`, `buffs.ts`; screens `app/drawer/shop.tsx`, `app/drawer/guilds.tsx` + `components/guild/` |
| Status and to-do list | `docs/QA_REPORT.md` |

## The mobile app

Commands (run from the repo root):

```bash
npm install --legacy-peer-deps   # the flag is required (datetimepicker peer conflict)
npm start                        # Expo dev server
npm run android | ios | web
npm run lint
npm run type-check               # tsc --noEmit
npm test                         # jest
```

Conventions:

- Follow the existing file-based routing in `app/`. Do not add a second navigation system.
- Take colors, spacing and type from `styles/designSystem.ts`. Do not hard-code new hex values in screens.
- Offline first: tracking must keep working with no signal and sync later. Every synced event carries a UUID so syncing twice never double-counts. Keep that property when touching sync code.
- Target low and mid-range Android and prepaid data. Avoid heavy dependencies, big images and chatty network calls.
- Run `npm run type-check` and `npm run lint` after changing app code, and report anything you could not fix.
- Ani gives general wellness coaching only. She never diagnoses. Keep that wording in any prompt or copy you touch.

## Game and safety design (shared vocabulary)

Use these terms the same way in code, UI and site copy.

- **Ani**: the AI coach and mascot. Female character, 3D model `assets/3d/female_final.glb` (made by Cyduanne Biraquit and the team). The model may be used publicly. There is no credit line yet, so do not add one unless asked.
- **Ghost**: a pace target built from how the user actually runs, not from their personal best.
- **Resonance**: reads how the body is doing (stamina) against what the app asks of the user (civic requests) and adjusts.
- **Quests**: fitness quests and civic quests. Civic work counts equally to running.
- **Streak multiplier**: tiers by day. 1 to 3 is 1.0x, 4 to 6 is 1.2x, 7 to 13 is 1.5x, 14 to 29 is 2.0x, 30 and up is 3.0x (the cap). The source of truth is `services/streakMultiplier.ts`. If the code and the site disagree, the code wins.
- **Bayanihan protocol**: the disaster response mode. Safety tiers 0 to 4 (Normal, Watch, Warning, Hard lock, Recovery). Its most important rule is a limit on itself: **Karela must never be the reason someone gets hurt.** In a storm the app stops asking users to run.
- **Civic reports**: confirmed by neighbours, expire when they go stale, and exported as verified data local governments can use.
- **Protected day**: a day the streak survives without a run, from a Streak Freeze (used automatically), a Streak Repair (bought the day after one missed day) or a squad's Collective Shield. It keeps the streak alive but doesn't add to it. The server counts streaks (`settle_streak`).
- **Squads and guilds**: a squad is 3 to 12 people (create at Level 3, join with a 6-character code). A squad with 5,000 Squad XP founds a guild of up to 10 squads. Numbers live in `karela_squad_rules()` / `karela_guild_rules()` in the SQL, not in the app.
- **Territory**: guilds win landmarks (250 m circles) by distance run inside them each month. Only the km inside a circle leaves the phone, never the route.
- **Gems** are earned by playing and can also be bought with money (Gem packs; owner decision 2026-10-09). The **Scout Pass** is the paid 90-day season pass with a reward track. Prices, the season and the track live in `services/store.ts`. Purchases are screens only until store billing is built (`STORE_OPEN = false`): never fake a purchase. Whether bought Gems may buy competitive items (Territory Boost, streak items) is still undecided. Cosmetics are visual only.

## The landing page (`website-v2/`)

### Run and test

There is no build. Serve the folder and open it:

```bash
npx serve website-v2        # or: python -m http.server 8770 --directory website-v2
```

Before calling any change done, check:

- 320, 390, 768, 1024, 1440 and 1920px wide: no horizontal scroll, nothing cut off.
- The browser console has no errors.
- Reduced motion (`prefers-reduced-motion`) still gives a complete, readable page.
- Keyboard: tab through the nav, menu, scrollbar tracker, Resonance slider, tier selector, forms and survey.
- If you touched a form, test both the "no endpoint" message and the validation message.

### Structure

- `index.html`: all sections plus three `<template>`s for the phone screens.
- `css/tokens.css`: palette, type scale, radii, spacing. **Change values here first.**
- `css/base.css`: reset, background layer, nav, buttons, sprites, run tracker, `.grad`.
- `css/screens.css`: the phone mockups, built in HTML and CSS (sized in `cqw` so they scale as one piece).
- `css/sections.css`: every page section.
- `js/config.js`: **everything you are likely to edit**: survey questions and endpoint, waitlist endpoint, store links, streak tiers, GitHub link.
- `js/main.js`: one IIFE with numbered modules (scroll engine, nav, Resonance chart, ghost chart, tour, consensus, streak, tiers, waitlist, survey, run scrollbar, year).
- `demo.html` + `css/demo.css` + `js/demo.js`: the app rebuilt for the browser, all demo data. `js/demo-data.js` holds every demo number and Ani's answers; keep it in step with the app (BACKLOG P2-12).

### Hard constraints

- **CSP is strict** (`netlify.toml`, `vercel.json`): `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `font-src 'self'`, `img-src 'self' data:`, `connect-src 'self'`. So: **no inline scripts, no CDNs, no external fonts, no analytics snippets.** All fonts and images are local.
- When a form endpoint is added (Formspree or a separate Supabase project), add only that origin to `connect-src` in **both** `netlify.toml` and `vercel.json`.
- No frameworks, no build tools, no new npm dependencies for the site.
- Build all DOM from data with `createElement` and `textContent`. Never `innerHTML` with user or config text.
- Mobile first: use `min-width` media queries only. (The original page broke on phones because a 1280px rule sat after a 1024px rule.)
- Keep the page light. It must run well on mid-range Android over prepaid data. Do not add large images, video or heavy libraries. Sprites are 8-frame webp sheets (about 30 to 50 KB each).
- Progressive enhancement: content must be readable without JS. Scripts add a `.js` class, and CSS that hides things for animation is scoped under `.js`.

### Design rules

The goal: it must not look AI-generated. These rules come from the owner.

- Keep the palette: lime `#7CF205`, teal `#209F77`, aqua, sky, orange, coral on green-black surfaces. Do not introduce new accent colors. Use the Karela gradient (lime to aqua to teal, class `.grad`) for the few words that carry a heading's point. Use it on a short phrase, not on every heading.
- Headings are white (`--ink`). No one-word accent trick on every heading.
- No ALL-CAPS eyebrow labels above headings, no numbered markers (01, 02, 03) unless the content is truly a sequence, no "A · B · C" meta strings, no arrow added to every link.
- Do not turn content into rows of identical rounded cards with the same shadow. Vary the structure (rules, columns, whole-width statements). Radii vary on purpose (`--r-xs` to `--r-lg`).
- Motion is purposeful. One orchestrated moment (the hero ghost echo) plus motion that answers a user action. Do not add fade-up-on-scroll to every section or hover effects on everything.
- Transitions between sections must be seamless. Sections are transparent over one fixed background that blends palettes by scroll position (`data-palette` on each section). Do not give a section its own opaque background.
- Voice: plain, specific, honest, sentence case. Say "Join the waitlist", not "Submit". Errors say what happened and what to do. No hype, no invented numbers.
- Placeholder content is labeled as such. The survey shows an orange "Sample questions" note until `showSampleBadge` is set to `false`. The waitlist and survey say plainly that nothing was saved until an endpoint is set. Never fake a success.
- Accessibility floor: visible focus, `prefers-reduced-motion`, `forced-colors`, `prefers-contrast`, 4.5:1 text contrast, tap targets of at least 44px on phones.

### Ani on the page

- Sprites are rendered from the GLB with three.js in headless Chromium and saved as `assets/img/ani-run.webp`, `ani-walk.webp`, `ani-idle.webp` (8 frames, 256 by 336 each) plus `ani-face.webp`. Use them with the `.sprite` classes (`--fh` sets the height).
- Re-render rather than hand-edit if the model changes. Frame the camera from the union of the clip's bounding boxes so heads never clip.
- Ani's handwritten notes use the Gochi Hand font (`.note`), in Taglish, short and friendly (for example "tara, takbo!"). Use them sparingly, a handful on the whole page.

### Still to do (see `website-v2/BACKLOG.md`)

- Survey and waitlist endpoints. The survey questions are final, and `website-v2/backend/supabase-site.sql` is ready for a separate Supabase project; only the endpoints in `config.js` are missing.
- Two offline claims on the page are ahead of the app (runs aren't saved offline yet). Build the app's run outbox or soften the lines; the owner decides.
- Real og image (`assets/img/og-placeholder.png` is a placeholder).
- Privacy policy page (the waitlist copy says "coming soon").
- Store links when the app is published.
- Point the host at `website-v2/` (the old `website/` folder was deleted on 2026-10-08).

## Working with the owner

- Randel is new to Claude Code. Explain what you are about to do in plain words, and say what changed and where when you finish.
- "Ask me questions" means: list **all** the questions you need up front so the idea is fully understood, then wait.
- Prefer small, reviewable changes. Tell the owner about anything you could not test.
- Windows machine: use forward slashes in code and quote paths with spaces.

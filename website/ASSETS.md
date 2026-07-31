# Website Assets — Placeholder Manifest

Every asset the site needs but does not have yet is rendered as an on-brand
placeholder (dashed lime border, diagonal hatch, "PLACEHOLDER" corner flag)
showing the asset name and target dimensions.

**Find every slot:** search `website/` for `ph__flag` or `TODO(assets)`.

## How to swap a placeholder for a real asset

Replace the `<div class="ph ...">` block with an `<img>`:

```html
<!-- before -->
<div class="ph ph--phone" role="img" aria-label="Placeholder for ...">
  <span class="ph__flag">Placeholder</span>
  ...
</div>

<!-- after -->
<img
  src="assets/img/screens/active-run.webp"
  alt="Karela active run screen showing ghost pacing against the runner's route"
  width="1080"
  height="2340"
  loading="lazy"
/>
```

Keep the `alt` text descriptive — it is what screen-reader users get instead of
the image.

## Needed assets

### Priority 1 — blocks conversion

| Slot | File to create | Dimensions | Where |
|---|---|---|---|
| Active run / ghost pacing | `img/screens/active-run.webp` | 1080 × 2340 | Hero |
| Screen recording of a run | `img/video/run-demo.mp4` + `.webm` | 1080 × 1920, 10–15s, < 3 MB | Hero |
| Social preview card | `img/og-placeholder.png` → `img/og.png` | 1200 × 630 | `<meta og:image>` |

### Priority 2 — feature sections

| Slot | File to create | Dimensions | Where |
|---|---|---|---|
| Dashboard | `img/screens/dashboard.webp` | 1080 × 2340 | How It Works |
| Ani chat | `img/screens/ani-chat.webp` | 1080 × 2340 | Meet Ani |
| Civic report / HUD | `img/screens/civic-report.webp` | 1080 × 2340 | Civic Engine |
| Quests | `img/screens/quests.webp` | 1080 × 2340 | Progression |
| Progress graph | `img/screens/progress.webp` | 1080 × 2340 | Progression |

### Priority 3 — team section

Six portraits at 400 × 400, cropped square, named `img/team/<firstname>.webp`:
Randel, Trishia, Steven, Qarisha, Cyduanne, Sander.

`assets/images/sir-sander.jpg` already exists in the app repo and can be reused
for Sander.

## Capturing screenshots

```bash
# From the repo root
npm run web           # then use browser devtools device mode at 1080x2340
# or
npx expo run:android  # then use the emulator's screenshot button
```

## Before committing images

Convert to WebP and compress. `assets/images/karelala.png` is **25 MB** and must
never ship to the web as-is.

```bash
npx @squoosh/cli --webp '{"quality":82}' -d website/assets/img/screens/ <input>
```

Target budget: each screenshot under 150 KB, hero video under 3 MB.

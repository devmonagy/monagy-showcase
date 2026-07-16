# Responsive / Cross-Browser Fixes — 2026-07-16

Record of every resolution/viewport issue found and fixed in one working session
(branch `fix/cross-browser-root-scale`), so there's a clear reference for what was
tested and why each fix looks the way it does. Read the individual commit messages
on this branch for full technical detail — this file is the map, not the territory.

## Quick index

| Area | Problem | Fixed in |
|---|---|---|
| Whole site | Chrome vs Edge root font-size drift on 1920px monitors | `583ffb4` |
| Hero (cube/badge) | Size bump leaked onto mobile, should've been desktop-only | `81188e4` |
| Projects section | "Selected Works" heading buried under navbar; Launch App button overflow | `6e3a921` |
| Hero + Projects | Chrome/Edge spacing mismatch; Hero overflow on laptop heights | `5018fe5` |
| Projects section | Description truncation → interactive HUD reveal (new feature) | `693e07e`, `9b3db75`, `539d70d`, `f4ebcd7` |
| Hero section | Fully visible from 220px height up through desktop | `d3a8eaf` |
| Hero section | Scroll cue overlapping Download Resume button on mobile; 428x926 overflow | `c0c6b0a` |

## Resolutions verified (zero overflow, zero overlap, confirmed by measurement — not eyeballed)

| Resolution | Device / scenario | Tier |
|---|---|---|
| 220×480 → 320×220 | Extreme stretch target | Ultra-compact (name/tagline/CTA only) |
| 375×812 | Mobile portrait (iPhone SE/standard) | Tight, full content |
| 390×844 | Mobile portrait (iPhone 12/13/14) | Tight, full content |
| 428×926 | Mobile portrait (iPhone 14/15 Pro Max) | Tight, full content (see note below) |
| 812×375 | Mobile landscape | Compact (bio+tags, no marquee/badge) |
| 800×480 | screenfly.org target | Compact |
| 960×600 | screenfly.org target | Compact |
| 1024×600 | screenfly.org target | Compact |
| 1024×768 | Laptop | Tight, full content |
| 1280×720 | Laptop | Tight, full content |
| 1366×768 | Laptop | Tight, full content |
| 1440×900 | Desktop | Roomy, full content |
| 1920×1080 | Desktop monitor | Roomy, full content (also where the Chrome/Edge font-size bug lived) |

## The core mechanism: height-tiered spacing (Hero)

`HeroSection.tsx`'s padding/margins/visibility are keyed to **viewport height**
(`min-height`/`max-height` media queries), not width. The overflow was always a
height problem — a 1366×768 laptop and an 812×375 landscape phone hit the exact
same failure mode for opposite reasons (wide-but-short vs narrow-but-short).

Four tiers, smallest height first:
- **Base** (no media query, assumes ~220-320px): hides marquee, badge, bio,
  tags, scroll cue. Shows only label/name/tagline/button. There's no padding
  trim that fits everything else into that little space legibly.
- **`min-height:400px`**: restores bio (one paragraph) + tags.
- **`min-height:620px`**: restores marquee, badge, second bio paragraph.
- **`min-height:900px`**: restores original roomy spacing — **but gated behind
  `sm:` (width≥640) too**, not height alone. A narrow-but-tall phone
  (428×926) crosses 900px height without having the horizontal room roomy
  spacing assumes, which is what caused the 98px overflow fixed in `c0c6b0a`.

Projects section (`ProjectsSection.tsx`) uses a parallel but width-tiered system
(`sm:` / `min-[900px]:` / `min-[1800px]:`) since its overflow driver is the pinned
horizontal card layout, which genuinely is width-dependent.

## Gotchas hit along the way (useful if this needs revisiting)

1. **`min-[1920px]:` / `min-height:` thresholds that sit exactly on a common
   resolution are unsafe** — a real 1920-wide monitor can read `innerWidth`
   as 1920 in Chrome but ~1912 in Edge (scrollbar-gutter reservation
   differs), so the *same monitor* crosses the threshold in one browser and
   not the other. Always pick a threshold with real buffer (`1800px`, not
   `1920px`).
2. **Tailwind's `text-*` utilities bundle their own `line-height`.** A plain
   `leading-relaxed` next to a responsive `text-base` can silently lose the
   cascade once that breakpoint activates, because the prefixed utility is
   emitted later in the generated stylesheet. Force the intended value with
   `!leading-relaxed` when this matters.
3. **Compound variants (`sm:[@media(...)]:`) don't reliably win the cascade**
   against simpler single-arbitrary-variant rules (`[@media(...)]:`) either
   — same root cause as #2. Use `!important` when a compound variant needs
   to override a tier that would otherwise also match.
4. **Turbopack's CSS cache can go stale on a newly-added arbitrary-value
   class** — the class exists in the DOM but no rule gets generated for it.
   Symptom: `getComputedStyle` shows the *old* value despite the new class
   being present. Fix: stop the dev server, `rm -rf .next`, restart. Hit
   this twice today.
5. **Elements positioned independently (`absolute`) can overlap elements in
   normal flow** even when both "fit" the viewport individually — the Hero
   scroll cue vs Download Resume button overlap wasn't caught by pure
   overflow measurement, only by explicitly measuring both rects against
   each other.

## Verification method

Every fix in this list was confirmed with real DOM measurement in a live
browser (`getBoundingClientRect`, `Range.getClientRects()` for text-level
checks), not visual inspection alone — screenshots were used to confirm
*legibility/quality*, not correctness.

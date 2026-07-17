# "SIGNAL" — Hero Overhaul + Site-Wide FX Layer — 2026-07-16

Record of the animation/creative pass done ahead of the GSAP Showcase
submission, so a fresh session (human or Claude) picking up this repo has a
complete picture of what changed, why, and where to touch it next. This file
is the map, not the territory — read the referenced components for full
implementation detail, and see `RESOLUTION_FIXES.md` for the responsive/
cross-browser pass that happened earlier the same day (unrelated, no overlap).

## The creative premise

The whole site already reads as a *transmission being received* — terminal/
HUD motifs throughout (System Boot preloader, the Projects "Full
Transmission" scramble popover, targeting-reticle corner brackets, ghost
outline typography, the wireframe cube). This pass leans into that on-brand
language rather than bolting on generic "cool" effects:

- **The hero name is the signal locking in** — flips up from nothing, hollow
  outline chars solidifying as they land.
- **Glitches are interference** — brief, rare, unmistakable RGB-split bursts.
- **Scramble decode is the terminal's native voice** — reused sparingly on
  the small mono kicker labels only.
- **Film grain is the transmission's texture** — now animated, reads as
  live static instead of a frozen overlay.

Deliberately sparse placement throughout — see "Placement map" below. The
brief was explicitly "not everywhere, only where it earns its place."

## New files

| File | Purpose |
|---|---|
| `app/components/fx/constants.ts` | `SCRAMBLE_CHARS` — single source of truth for the decode glyph set, shared by `DescriptionReveal` and `ScrambleLabel` so every scramble effect site-wide reads as one system. |
| `app/components/fx/GlitchText.tsx` | RGB-split glitch primitive. Exports `playGlitchBurst(real, cyanClone, violetClone)` (the raw timeline builder — used directly by HeroSection's hand-built name clones) and a `<GlitchText trigger="enter"\|"hover">` wrapper component (used everywhere else). Transform/opacity/clip-path only — see "Perf guardrails" below. |
| `app/components/fx/ScrambleLabel.tsx` | One-shot scramble decode for small mono labels, built on GSAP's official `ScrambleTextPlugin`. `trigger="mount"` (with a `delay`) or `trigger="enter"` (ScrollTrigger one-shot). `aria-label` + `sr-only` twin so screen readers get the real text, never scramble glyphs. |

## `HeroSection.tsx` — full rewrite of the name's behavior

**This was the single biggest fix, and it wasn't cosmetic:** the *old* hero
entrance played on a fixed `delay: 0.15` from mount, which is fully inside
the preloader's ~2.85s cover window — meaning no visitor ever actually saw
the entrance animate. It had already finished and settled before the
curtain lifted. The new version delays its whole choreography to
`ENTRANCE_AT = 2.75s`, timed against the preloader's own exit sequence (see
the comment above that constant in `HeroSection.tsx` for the exact math), so
the entrance is now the first thing a visitor watches.

The name ("Mohamed Nagy.") is a five-layer stack under real CSS
`perspective`, all sharing one `<NameLines>` sub-component so every copy's
typography can never drift out of sync:
1. Two `aria-hidden` outline "echo" copies at `translateZ(-3rem)` /
   `translateZ(-6rem)` — the depth-shadow that slides against the solid name
   when the stack tilts.
2. Two `aria-hidden` glitch clones (cyan / violet — the same chromatic pair
   as the preloader's counter text-shadow) that flash during interference
   bursts.
3. The real `<h1>`, split into masked characters via GSAP's `SplitText`
   (`type: "chars", mask: "chars", autoSplit: true`).

Four-act life, all in one `useGSAP` scoped to the section:

1. **Entrance** — chars flip up from `rotationX: -85deg` through their masks
   on a custom ease (`CustomEase.create("signalLock", ...)` — fast attack,
   ~11% overshoot, long settle; reads as a mechanical "snap into place").
   Each char starts with the `.char-hollow` class (outline-only, see
   `globals.css`) and the class is removed at ~55% of that char's flight —
   a one-time class toggle, not a per-frame color tween. The instant the
   last char lands, `playGlitchBurst` fires once ("signal acquired"), then
   the two depth echoes fade in.
2. **Idle** — on fine pointers (`gsap.matchMedia(FINE_POINTER_QUERY)`), the
   whole stack tilts toward the cursor via `gsap.quickTo` on
   `rotationX`/`rotationY` (±5°), normalized against `window.innerWidth/
   innerHeight` — deliberately NOT `getBoundingClientRect` in the mousemove
   handler (house perf rule). Touch devices get a slow perpetual ±1.5°–2°
   sway instead so the depth stack still reads as 3D.
3. **Interference** — `playGlitchBurst` refires every 6–9s
   (`gsap.utils.random`, re-armed from inside its own `delayedCall`
   callback so the cadence never becomes a metronome), skipped while the
   name is mid-scatter or the tab is hidden.
4. **De-rez** — a scrub `ScrollTrigger` (same trigger/start/end as the
   existing ghost-strip/parallax triggers) scatters each char to a
   per-char-stable random `x`/`y`/`rotation` with `opacity → 0` as the hero
   scrolls away, and reassembles on scroll back up. Echoes fade out early in
   the same scroll span (ghosts go first, then the signal itself breaks
   apart).

`SplitText`'s `onSplit` callback is also where re-splits (font load,
viewport resize — `autoSplit: true` handles both) are handled: if the show
already played, chars just land in their resting pose and the scatter
trigger is rebuilt against the fresh char elements, rather than replaying
the entrance.

The "Software Developer" kicker line now decodes via `<ScrambleLabel
trigger="mount" delay={ENTRANCE_AT + 0.25}>` instead of a plain mask slide.

Reduced motion: the existing early-return branch (unchanged pattern) — name
renders as flat static text, no split/tilt/glitch/scatter, echoes land at
their resting opacity instantly.

**Layout was not touched.** Every height-tier / clamp / media-query class
from the `RESOLUTION_FIXES.md` pass is untouched; `SplitText` only wraps
characters *inside* the existing `<h1>`, and the depth-stack echoes/clones
are `absolute inset-0` siblings that contribute zero layout. Verified at all
five tiers post-change — see "Verification" below.

## Placement map (the "sparse on purpose" list)

**`ScrambleLabel`** (mono kicker labels only — the terminal's native voice):
- Hero kicker "Software Developer" (`trigger="mount"`)
- `ExperienceSection.tsx` — "2018 — Present"
- `ProjectsSection.tsx` — "Scroll"
- `PersonalTelemetrySection.tsx` — "Live feeds"
- `ContactSection.tsx` — "Get In Touch"

**`GlitchText`** (display type + primary actions only):
- Hero name — loop mode + entrance punctuation (hand-built via
  `playGlitchBurst`, not the wrapper component — see above)
- One `trigger="enter"` burst on each big section heading: "Where I've
  Worked" (Experience), "Selected Works" (Projects), "Off The Clock"
  (Telemetry), "Let's Talk." (Contact)
- `trigger="hover"` on button label spans **only** — Download Resume
  (Hero), Launch App (Projects, per-project), the email CTA (Contact). The
  glitch wraps the inner label text, never the anchor itself:
  `MagneticLink`/the magnetic email handler already own that element's
  `transform` for the magnetic pull, and CSS/GSAP fighting over the same
  transform is an established anti-pattern in this codebase (see
  `MagneticLink.tsx`'s own doc comment).

Everything else — nav, chips, body copy, footer — is deliberately untouched.
Negative space is what makes the bursts read as intentional instead of
noisy.

## Film grain — now animated

`globals.css`: new `.grain-animated` class + `@keyframes grainShift` —
`transform: translate(...)` jumps between 8 offsets on `steps(1)` at
~1.25fps-per-step (0.8s cycle / 8 steps), reading as real film stock's
frame-churn instead of a frozen texture. The grain layer itself
(`app/page.tsx` and `Preloader.tsx`) is oversized (`inset: -25%`, i.e. 150%
coverage) so the translation never exposes an edge. Transform-only on a
`fixed`/`absolute` layer — compositor cost only, never a repaint (same class
of rule as the existing "never animate `filter`/`text-shadow`" guardrails
below). Disabled under `prefers-reduced-motion` (added to the existing
reduced-motion block in `globals.css`).

## New `globals.css` support classes

- `.grain-animated` / `@keyframes grainShift` — see above.
- `.glitch-clone` — forces every descendant to inherit the clone's own
  accent color and strips `text-outline` strokes, so headings built from
  hollow outlined words (`text-outline-volt`) glitch as solid color
  silhouettes instead of momentarily invisible transparent glyphs.
- `.char-hollow` — the hero name's mid-flight hollow-outline state (same
  stroke recipe as the existing `.text-outline`), removed per-char as each
  one locks into place.

## Perf / a11y guardrails honored (all pre-existing house rules)

- Animate only `transform` / `opacity` / `clip-path` — never `filter` or
  `text-shadow` (the repo's established Lighthouse "non-composited
  animations" fix — see `.otc-title-glow`'s comment in `globals.css` for
  the original incident this rule comes from).
- No `getBoundingClientRect()` inside a `mousemove` handler — the hero tilt
  reads `window.innerWidth/innerHeight` instead (see `MagneticLink.tsx` for
  the established pattern of caching rects outside the hot path).
- No CSS transitions layered on a GSAP-owned transform.
- `gsap.matchMedia()` for fine-pointer vs. touch branching — the hero tilt
  effect never binds on touch at all, matching `MagneticLink`'s existing
  fine-pointer gating via `FINE_POINTER_QUERY` (`SmoothScroll.tsx`).
- rem-based echo `translateZ` offsets ride the fluid root scale
  (`globals.css`'s 2560px+ breakpoint) automatically, same as the cube/badge
  sizing already does.
- Reduced motion fully respected everywhere a new effect was added — see
  each component's own early-return / prop-gated branch.

## Verification performed

- `tsc --noEmit` and `npm run lint` clean.
- Full entrance choreography, tilt, interference cadence, and scroll de-rez
  + reassembly confirmed via live DOM measurement (inline transform/opacity
  state, not eyeballing) in the embedded preview browser.
- All five `RESOLUTION_FIXES.md` tiers re-measured after this change —
  375×812, 812×375, 1024×600, 1366×768, 1920×1080 — zero overflow, zero
  overlap, height-tier ladder intact, root font-size still 16px at 1920
  (i.e. correctly below the 2560px fluid-scale threshold).
- Reduced-motion path confirmed: static name, no split/glitch/scramble/grain
  motion, full text present.

### Gotcha hit during verification (useful if this needs revisiting)

The embedded Claude Code Browser pane throttles `requestAnimationFrame` to
roughly 1fps whenever it isn't being actively rendered — measured 15 rAF
ticks across 14.5s of wall time. GSAP's lag-smoothing means a 2.75s timeline
delay can appear to take 80+ seconds, which looks exactly like a frozen/
broken animation but is purely an artifact of that pane, not the code. CSS
keyframe animations (like the grain) are unaffected — only JS/GSAP-driven
timelines stall. To verify time-based GSAP choreography in that pane:
navigate, then fire screenshots back-to-back with no `wait` between them
(keeps rAF alive), or measure element state directly via `javascript_tool`
rather than trusting a single wait+screenshot. A real visitor's tab is
unaffected.

## Branch history

Built on `feat/hero-signal-fx` off `master` (`d437f17`), then merged
directly to `master` per request — this repo's usual flow is one PR per
branch (see `git log --merges`), but this session skipped that step on
explicit instruction so a second Claude session could pick up the finished
state on `master` immediately.

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

---

## Follow-up pass — same day, second session (feedback round)

Owner feedback on the pass above, and what changed. Supersedes the
matching bullets earlier in this file:

- **Hero Act 2 rewritten**: the cursor-following tilt is REMOVED by
  request. The depth stack now runs the slow autonomous ±2° sway on every
  device (it was touch-only before) — without some rotation the translateZ
  echoes hide entirely behind the solid name.
- **Marquee hover = momentum stop, not pause()**: the loop's own timeScale
  is tweened to 0 on enter (power3.out, ~1.1s coast) and back to 1 on
  leave. `stoppedRef` gates the scroll-velocity handlers' timeScale writes
  — the old hard `pause()` also silently ate every velocity boost, which
  is why the bottom band (where the cursor tends to rest) felt like it
  never sped up on scroll.
- **`playGlitchBurst` has options now**: `power` (step count / chromatic
  throw / skew snaps scale with it) and `materialize` (real text starts
  invisible, flickers in as scanline bands, locks whole — end state always
  fully visible, safe to re-fire). Heading enters use
  `{ power: 2, materialize: true }`.
- **Every enter-triggered effect repeats**: GlitchText and ScrambleLabel
  dropped `once: true` for onEnter + onEnterBack with a ~900ms throttle.
  Headings re-materialize and labels re-decode on every pass, both
  directions.
- **Navbar rebuilt** (`Navbar.tsx`): logo server-renders as
  "Mohamed Nagy." and ScrambleText-folds the middle letters to an empty
  string at ENTRANCE_AT+2.1s (tweenLength shrinks the text so M/N/. slide
  together on the browser's own inline layout — no measured offsets),
  landing on "MN." with a glitch burst; hovering the monogram decodes the
  full name back out (fine pointer only). Plus: scroll-progress hairline
  under the bar, active-section magic-line under the desktop links
  (rect-based measurement — offsetLeft lies once the load-in leaves
  transforms on the li's), scramble-on-hover link labels, GlitchText on
  the Resume button, and a mobile hamburger → fullscreen overlay (solid
  bg, NO backdrop-filter — WebKit compositor history) with staggered
  masked links and scroll lock. Header uses transition-colors, never
  transition-all: GSAP owns its transform for the drop-in.
- **Experience deck is draggable on desktop** (fine pointer only):
  Draggable + InertiaPlugin on each `.exp-card`, inertia end pinned to
  {0,0} so every throw boomerangs home with real momentum; press brings
  the card's wrap to the front (zIndex counter — wraps get
  position:relative set BEFORE the pins are created so it works in both
  pin states) and it stays there, so the stack can be reshuffled. Velocity
  tilt while dragging (quickTo rotation from deltaX). Affordances: a
  "⠿ drag me" chip per card (fine-pointer media variant) and the custom
  cursor ring morphs into a dashed DRAG badge over cards
  (`data-cursor="drag"` — see CustomCursor).
- **Contact entrance rebuilt**: outline line mask-slides, "Let's Talk."
  is now hand-built like the hero name (glitch clones + SplitText masked
  chars on the shared signalLock ease from `fx/constants`), burst fires
  as the last char locks, supports rise in its wake; whole timeline
  restarts on every enter/enterBack (desktop). Touch keeps
  always-visible content + a repeating materialize burst. GOTCHA that bit
  once already: initial hidden states MUST be standalone `gsap.set`s, not
  the timeline's fromTo immediateRender — SplitText's font-load re-split
  reverts the returned timeline, and revert restores pre-TWEEN state,
  which un-hid the outline line until the sets became that state.

Verified this round: tsc + eslint clean; live DOM measurement in the
embedded pane (rAF throttled to ~1Hz there — state-based assertions, not
smoothness): hero chars settle clean + sway runs, logo folds to "MN." on
schedule, contact initial states survive re-splits and the full
choreography plays on entry, drag follows pointer → carries momentum →
boomerangs home with zIndex bump, mobile overlay opens/locks scroll/closes
via link tap with zero nav overflow at 375px, magic line lands
pixel-exact. NOT yet eyeballed in a real browser: marquee glide feel and
the burst/scramble visual quality — check those on a real screen.

Session note: Next.js 16 refuses to run two dev servers for the same
project dir (singleton lock). If another chat's server owns it, that
server is serving THIS working tree with HMR — verify against its port
instead of fighting the lock.

---

## Second follow-up pass — same day, third round (bug reports on the FX pass)

Three concrete bugs the owner found by actually using the site, fixed
this round:

- **Nav highlighting was flat wrong.** The old approach was one
  independent `ScrollTrigger` per nav link with a generic "top 50% /
  bottom 50%" viewport-center heuristic — wrong on two counts: it read
  as active at creation time before layout/pins had settled (Contact lit
  on a cold load), and it's fundamentally incompatible with Projects,
  which is *pinned* — its box never moves in the viewport while its own
  horizontal scrub runs, so a "center crossed 50%" check could only ever
  catch one instant, not the whole pinned span. Replaced with a single
  `onUpdate` on the existing progress-bar ScrollTrigger that checks raw
  `self.scroll()` against precomputed section boundaries every frame;
  Projects reads its own pin's live `.start`/`.end` (via
  `ScrollTrigger.getById("projects-pin")`, set in ProjectsSection) so it
  stays lit for the section's entire traversal. `s <= 1` clears
  `activeHref` to null so nothing is lit at the very top — first pixel of
  scroll lights About. The magic-line underline had its own follow-up bug:
  it only *moved* on `activeHref` change and did nothing when it went
  null, so it stayed glowing under "About" at scroll 0 even after the
  text-color fix landed — now hides on null too.
- **Double horizontal-scroll indicator.** Removed the local bar under
  Projects entirely (it read as a redundant second bar directly under the
  header's own hairline). Relocated the same feedback INTO the header:
  a segment overlay on the hairline, positioned via
  `projectsPin.start/end` vs `ScrollTrigger.maxScroll(window)`, that fills
  0→1 as you scrub through the section and brightens while you're
  actually inside it.
- **Experience cards buried under the header.** Caused by the drag
  feature added this same day: `gsap.set(wraps, {position:"relative"})`
  was added before creating the pins so z-index (bring-dragged-card-
  to-front) would take effect. But each wrap already carries an inline
  `top` offset meant to apply ONLY once GSAP switches it to
  `position:fixed` on pin — forcing `relative` beforehand made that same
  `top` value shift the wrap while merely static too (relative honors
  top/left, static ignores them), pulling the whole pre-pin deck up
  under the fixed header. Fix: don't force position at all — a card is
  only ever grabbable once its wrap is already pinned (fixed, which
  z-index already honors), so the explicit relative was both wrong and
  unnecessary.

**Gotcha reconfirmed this round:** window.scrollTo() while ScrollSmoother
is active sets the *target*, not the rendered position — the smoother
lerps toward it (smooth:1.2 = ~1.2s settle), and that lerp is itself
gated by the pane's throttled rAF, so checking DOM state immediately
after a programmatic scroll reads the OLD position. Same fix as always:
either wait for the lerp (several seconds) or fire back-to-back
screenshots to keep rAF alive and re-check.

---

## Third follow-up pass — feedback round on the second pass

- **Deck drag regression root-caused for real.** The second pass's fix
  (dropping the forced `position:relative` on `.exp-card-wrap`) restored
  the top space but silently killed the drag's z-order: inside
  ScrollSmoother the pins are TRANSFORM-based (the wrap never becomes
  position:fixed), and `z-index` on a static element is ignored while a
  transformed element paints above static siblings — so bring-to-front
  was dead AND later cards slid up BEHIND pinned ones. Correct fix:
  `gsap.set(wraps, { position: "relative", top: 0 })` — positioned at all
  times (paint order + z-index work in every pin state) with the inline
  `top` (which exists only for the touch path's position:sticky) zeroed
  out so the resting layout never shifts. Desktop pin offsets come from
  the trigger start strings, not the inline top. Verified: pins at
  84/102/120px below the viewport top, drag + throw + persistent
  bring-to-front all working.
- **Hero name replays on scroll-return**: a `start: "top -25%"`
  ScrollTrigger's onLeaveBack re-runs the char flip-up (yPercent/
  rotationX only — composes with the scatter scrub which owns
  x/y/rotation/opacity), re-clipping the SplitText masks for the flight
  and unclipping after, ending on a glitch burst. The continuous
  sway/interference loop is untouched. Guarded by `entrancePlayed` and a
  1.5s throttle; chars/masks read from closure refs updated per re-split.
- **Nav top-of-page rule hardened**: a second, independent check in the
  native `scroll` listener (the one that sets the `scrolled` header
  style) forces activeHref null at scrollY <= 2 — two separate systems
  agreeing is what makes "nothing lit at the very top, always" true.
- **Header hairline's Projects segment removed** per feedback (kept only
  the plain overall-progress hairline). The `projects-pin` ScrollTrigger
  id stays — active-link tracking still reads it.
- **Project title hover fill**: `.proj-title-fill` (globals.css) — an
  accent-colored twin of the title floods in behind a SLANTED clip-path
  edge on hover (per-card `--proj-accent`), paired with the GlitchText
  hover burst on the same title. clip-path only; instant (no sweep) under
  reduced motion.
- **Contact kicker + "Got a project?" smoothing**: the kicker's decode
  was a self-triggered `<ScrambleLabel trigger="enter">` whose own
  trigger fired well before the master reveal — the decode finished
  behind an invisible parent, then the parent faded in over settled text
  ("it's just there"). Now the kicker rises through an overflow mask
  and its ScrambleText decode is a child of the master timeline; the
  outline line got a slower, longer rise; the master trigger moved from
  72% to 62% so the first beats play where they can actually be seen.
  Touch path: the kicker decode rides the same enter/enterBack callback
  as the punch line's materialize burst.

### Feedback fixes on the third pass

- **Hero scroll-return = burst only.** The full char flip-up replay read
  as too much; onLeaveBack now fires just the power-2 materialize burst
  (no char movement, composes with the scatter scrub). The
  currentChars/currentMasks plumbing went with it.
- **Projects title layout regression fixed**: `w-max` on the h3 made its
  grid min-content contribution the full single-line title width, which
  stretched the copy column and crushed the image beside it. The hover
  host is now an INNER `inline-block` span (`.proj-title`) — shrink-wraps
  and wraps like plain text; never put width classes on that h3.
- **Transmission word-lock** (`DescriptionReveal`): both the clamped
  description and the Full Transmission popover render the same
  `data-w`-indexed word spans; on desktop, with the popover open,
  hovering word i outside locks onto word i inside — accent inversion +
  outline ring + a transform-only snap (`.dr-word-hot`, globals.css;
  `display:inline-block` only while hot since inline boxes ignore
  transforms), with a dotted accent underline pairing cue on the outside
  word (`.dr-word-src`). Class toggles on refs, not React state — no
  re-render per pointer twitch. The popover decode still churns: each
  span shows its slice of the scrambling string until it settles.
  `useLastLineEnd` now measures `selectNodeContents(p)` with a
  zero-width-rect filter, since the paragraph's first child is a span,
  not a text node.

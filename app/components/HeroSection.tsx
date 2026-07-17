"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { BIO_PARAGRAPHS, SITE, TECH_STACK } from "../data/content";
import MagneticLink from "./MagneticLink";
import ScrambleLabel from "./fx/ScrambleLabel";
import GlitchText, { playGlitchBurst } from "./fx/GlitchText";
import { SIGNAL_LOCK_EASE } from "./fx/constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  // Each name char snaps up past its resting pose and locks back, reading
  // as a mechanical "click into place" that power4 can't produce. Curve
  // lives in fx/constants — ContactSection's closing beat uses it too.
  CustomEase.create("signalLock", SIGNAL_LOCK_EASE);
}

// When the hero's visible choreography begins, in seconds after mount.
// The preloader's exit starts sliding at ~2.37s and fully clears by ~3.27s
// (1.5s counter + 0.24s color punch + overlapped 0.5s wipes + 0.1s gap +
// 0.9s slide — see Preloader.tsx), revealing the page bottom-up. Starting
// at 2.75s puts the name chars mid-flight exactly as the curtain edge
// passes the viewport center, so the entrance is SEEN — the previous
// version auto-played at 0.15s and had always fully settled behind the
// curtain, meaning no visitor ever actually watched it. Still a plain
// mount-time delay, no cross-component "preloader done" signal: that
// pattern was tried and sometimes never fired on real mobile devices,
// leaving the hero permanently invisible (see git history). Worst case
// today — a stalled preloader riding the 6s safety net — the choreography
// finishes unseen and the curtain lifts on a settled hero, which is
// exactly the old behavior, never a hidden one.
// Exported: the navbar sequences its own load-in and logo morph against
// the same curtain timing.
export const ENTRANCE_AT = 2.75;

// The name rendered identically for the real h1, the two depth echoes, and
// the two glitch clones — five copies, one source of truth. All typography
// classes live on the shared wrapper (font metrics inherit), so the copies
// can never drift out of alignment.
//
// whitespace-nowrap is load-bearing, not defensive: as raw text each line
// is one unbreakable word, but SplitText wraps every character in its own
// inline-block mask, which creates a legal break opportunity BETWEEN
// every letter — on real phones (390-430px), where the size clamp was
// tuned against raw-text width with near-zero slack, that let "Mohamed"
// wrap to "Mohame / d" mid-word (while the unsplit echo copies behind it
// stayed on one line, doubling the mess). nowrap on the line makes a
// mid-name break impossible in both the split and unsplit states; the
// clamp's trimmed vw term (see the wrapper below) supplies the slack so
// nowrap never clips instead.
function NameLines() {
  return (
    <>
      <span className="block whitespace-nowrap">Mohamed</span>
      <span className="block whitespace-nowrap">
        Nagy<span className="text-[var(--accent-volt)]">.</span>
      </span>
    </>
  );
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const echoVoltRef = useRef<HTMLDivElement>(null);
  const echoWhiteRef = useRef<HTMLDivElement>(null);
  const glitchCyanRef = useRef<HTMLDivElement>(null);
  const glitchVioletRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const nameEl = nameRef.current;
      const cyan = glitchCyanRef.current;
      const violet = glitchVioletRef.current;
      const echoes = [echoVoltRef.current, echoWhiteRef.current].filter(
        Boolean,
      ) as HTMLDivElement[];
      const echoRest = [0.35, 0.18];

      // Entrance, glitch loop, tilt, and scroll de-rez are all non-essential
      // motion — under reduced-motion, land everything in its resting state
      // instantly. The name is never SplitText-split in this branch, so it
      // stays one static block of real text.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(".hero-line", { yPercent: 0 });
        gsap.set(".hero-fade", { opacity: 1, y: 0 });
        gsap.set(".hero-badge", { scale: 1, rotate: 0 });
        echoes.forEach((el, i) => gsap.set(el, { opacity: echoRest[i] }));
        return;
      }

      // ---- Initial states, set immediately at mount ----
      // The choreography is delayed until the curtain lifts (ENTRANCE_AT),
      // so start states must be applied NOW — a fromTo's start values only
      // land when its tween begins, which would leave everything visible in
      // its resting pose during the bottom-up curtain reveal and then snap
      // hidden to animate in.
      gsap.set(".hero-line", { yPercent: 110 });
      gsap.set(".hero-fade", { opacity: 0, y: 26 });
      gsap.set(".hero-badge", { scale: 0, rotate: -40 });
      gsap.set(echoes, { opacity: 0 });

      const mountedAt = performance.now();
      let entrancePlayed = false;
      let scatterTween: gsap.core.Tween | null = null;
      let scatterProgress = 0;
      let glitchCall: gsap.core.Tween | null = null;

      // Act 4 — scroll de-rez: the name's chars scatter and dissolve as the
      // hero releases into the page, then reassemble scrolling back up.
      // Function-based values are evaluated once per char at creation, so
      // every char keeps its own stable scatter target across the scrub.
      // x/y/rotation/opacity never collide with the entrance's
      // yPercent/rotationX — the two compose. Rebuilt on every re-split
      // (font load / resize) because the char elements are replaced.
      const buildScatter = (chars: Element[]) => {
        scatterTween?.scrollTrigger?.kill();
        scatterTween?.kill();
        scatterTween = gsap.to(chars, {
          x: () => gsap.utils.random(-40, 40),
          y: () => gsap.utils.random(-140, -50),
          rotation: () => gsap.utils.random(-30, 30),
          opacity: 0,
          ease: "power1.in",
          stagger: 0.02,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
            onUpdate: (self) => {
              scatterProgress = self.progress;
            },
          },
        });
        // The outline echoes dissolve early in the same scroll span —
        // ghosts fade first, then the signal itself breaks apart.
        gsap.to(echoes, {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "40% top",
            scrub: 0.8,
          },
        });
      };

      // Act 3 — interference: a ~220ms RGB-split burst on the name every
      // 6–9s, re-armed with a fresh random delay each cycle so it never
      // reads as a metronome. Skipped while the name is de-rezzed (the
      // plain-text clones would flash a fully assembled name over the
      // scattered chars) and while the tab is hidden.
      const armGlitchLoop = () => {
        glitchCall = gsap.delayedCall(gsap.utils.random(6, 9), () => {
          if (
            nameEl &&
            cyan &&
            violet &&
            scatterProgress < 0.05 &&
            document.visibilityState === "visible"
          ) {
            playGlitchBurst(nameEl, cyan, violet);
          }
          armGlitchLoop();
        });
      };

      // Act 1 — entrance: chars flip up through their masks from a flat
      // -85° pose, hollow-outlined, and "lock" to solid fill as each one
      // lands (class toggle at ~55% of each char's flight — a one-time
      // paint, not a per-frame color tween). autoSplit re-splits on font
      // load and resize; onSplit is the documented home for the animation
      // so SplitText can revert/rebuild it cleanly each time.
      if (nameEl && cyan && violet) {
        SplitText.create(nameEl, {
          type: "chars",
          mask: "chars",
          autoSplit: true,
          charsClass: "hero-char",
          onSplit(self) {
            // SplitText's aria:auto labels the h1 with its raw textContent,
            // which concatenates the two block lines into "MohamedNagy." —
            // pin the properly spaced name instead (re-applied per split;
            // autoSplit re-runs this on font load / resize).
            nameEl.setAttribute("aria-label", "Mohamed Nagy.");
            if (entrancePlayed) {
              // Re-split after the show (viewport resize, late font swap):
              // land chars in their final pose, unclip the fresh masks so
              // the scroll scatter can fly chars out of them, and rebuild
              // the scatter against the replacement char elements.
              gsap.set(self.chars, { yPercent: 0, rotationX: 0, opacity: 1 });
              (self.masks as HTMLElement[]).forEach(
                (m) => (m.style.overflow = "visible"),
              );
              buildScatter(self.chars);
              return;
            }

            self.chars.forEach((c) => c.classList.add("char-hollow"));

            const STAGGER = 0.045;
            const CHAR_DUR = 0.85;
            // Absolute wall-clock anchor, not a fixed delay: if a font-load
            // re-split rebuilds this timeline mid-wait, a fixed delay would
            // push the entrance later by the elapsed time.
            const startIn = Math.max(
              0.1,
              ENTRANCE_AT - (performance.now() - mountedAt) / 1000,
            );

            const tl = gsap.timeline({ delay: startIn });
            tl.fromTo(
              self.chars,
              { yPercent: 120, rotationX: -85, transformOrigin: "50% 100%" },
              {
                yPercent: 0,
                rotationX: 0,
                duration: CHAR_DUR,
                ease: "signalLock",
                stagger: STAGGER,
              },
            );
            // Fill-lock moment per char, timed into each one's flight.
            self.chars.forEach((c, i) => {
              tl.call(
                () => c.classList.remove("char-hollow"),
                undefined,
                i * STAGGER + CHAR_DUR * 0.55,
              );
            });
            // "Signal acquired" punctuation the instant the last char
            // settles, then the depth echoes breathe in behind the name
            // and the interference loop arms.
            tl.call(() => {
              playGlitchBurst(nameEl, cyan, violet);
            });
            tl.to(
              echoes,
              {
                opacity: (i) => echoRest[i],
                duration: 0.9,
                ease: "power2.out",
                stagger: 0.12,
              },
              "+=0.15",
            );
            tl.call(() => {
              entrancePlayed = true;
              (self.masks as HTMLElement[]).forEach(
                (m) => (m.style.overflow = "visible"),
              );
              buildScatter(self.chars);
              armGlitchLoop();
            });
            return tl;
          },
        });

        // Signal re-lock: after the initial show, scrolling back up to
        // the hero re-fires the full-power interference burst — same
        // repeat-on-return language as every other heading, and
        // deliberately NOT a replay of the whole char flip-up (tried;
        // read as too much on every return). materialize flickers the
        // name back in through scanline bands without moving a single
        // char, so it composes cleanly with the scatter scrub easing the
        // chars home at the same time. Fires on onLeaveBack of a start
        // 25% past the top, i.e. the moment the name is mostly back in
        // frame on the way up.
        let lastReplay = 0;
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top -25%",
          onLeaveBack: () => {
            const now = performance.now();
            if (!entrancePlayed || now - lastReplay < 1500) return;
            lastReplay = now;
            playGlitchBurst(nameEl, cyan, violet, {
              power: 2,
              materialize: true,
            });
          },
        });
      }

      // Supporting cast — kicker line, tagline, bio/tags/button fades, badge
      // pop — sequenced around the name build. (The kicker's text decode is
      // ScrambleLabel's own mount-delayed tween; this just runs its mask
      // slide.)
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        delay: ENTRANCE_AT,
      });
      tl.to(".hero-line", { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.05)
        .to(
          ".hero-fade",
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 },
          0.55,
        )
        .to(
          ".hero-badge",
          { scale: 1, rotate: 0, duration: 0.8, ease: "back.out(1.6)" },
          0.85,
        );

      // Act 2 — live hologram: a slow perpetual sway on the whole name
      // stack (solid + translateZ echoes) keeps the depth readable as 3D.
      // Autonomous on every device — the earlier cursor-following tilt was
      // removed by request, and the depth echoes hide almost entirely
      // behind the solid name without SOME rotation, so the sway is what
      // keeps the hologram alive.
      gsap.to(tiltRef.current, {
        rotationY: 2,
        rotationX: -1.5,
        duration: 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Ghost strip drifts forever — full words stay readable as they roll
      // through, instead of one oversized word clipping to "DEVE".
      gsap.to(".hero-ghost-track", {
        xPercent: -50,
        ease: "none",
        duration: 28,
        repeat: -1,
      });

      // Scroll parallax on top of the entrance: ghost strip sinks, content
      // drifts — depth cue as the hero releases into the page.
      gsap.to(".hero-ghost", {
        yPercent: 40,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
      gsap.to(".hero-inner", {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });

      // delayedCalls re-armed from inside their own callbacks are created
      // outside this context's synchronous capture — kill the live one by
      // hand.
      return () => {
        glitchCall?.kill();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="about"
      ref={sectionRef}
      // Spacing tiers are keyed to viewport HEIGHT (min-height media
      // queries), not width — this section's overflow was never a width
      // problem. A 1366x768 laptop and an 812x375 landscape phone hit the
      // exact same failure mode (content taller than the viewport, so the
      // button/tags/marquee/scroll-cue render below the fold) despite
      // being nowhere near each other on width, and a 375x812 *portrait*
      // phone overflowed too even though it's plenty wide — because the
      // old fix only touched sm:-and-up, leaving mobile's base classes at
      // their original roomy values. Four tiers, smallest assumed height
      // first (mobile-first, but for height): base has no media query at
      // all — it's what a genuinely tiny viewport (a windowed browser
      // down around 220-320px tall) gets, and at that size there simply
      // isn't room for the marquee, badge, bio, or tags without either
      // hiding something or rendering it all illegibly — so this tier
      // hides them (see the individual elements below) rather than
      // pretending "everything, just smaller" was ever going to work.
      // min-height:400px restores bio+tags. min-height:620px restores
      // the marquee+badge and is otherwise identical in spirit to the
      // laptop-height tier from the earlier Projects/Hero fix (verified
      // down to ~717px there). min-height:900px is the original roomy
      // spacing — but gated behind sm: (width>=640) everywhere it
      // appears below, unlike the other tiers: roomy assumes a wide
      // desktop-style column where bio text and tags wrap efficiently.
      // A narrow phone that happens to be very tall — 428x926 (iPhone
      // 14/15 Pro Max), which crosses 900px height despite being only
      // 428px wide — doesn't have that horizontal room, so the same
      // spacing let both bio paragraphs and the tag list wrap into
      // enough extra lines to overflow by 98px. sm: caps that device at
      // the tight (620px) tier regardless of its height, which is what
      // it actually needs.
      //
      // pt is split from pb and NOT part of the height-tier ladder: it's
      // pinned to the fixed navbar's own height (h-16/h-20, i.e. 64/80px)
      // at every tier, growing only at the roomy 900px+ end. Using a
      // single symmetric py here — as the first pass of this fix did —
      // "worked" at every height down to about 620px purely by luck:
      // flex+justify-center adds its own slack above/below whenever
      // content is shorter than the viewport, which incidentally pushed
      // the label down clear of the navbar even with too little real
      // padding. At true minimum height that slack is zero (content
      // exactly fills the viewport), and py-3 alone left the "Software
      // Developer" label overlapping the navbar by ~41px at 812x375 —
      // confirmed by measuring both elements' rects, not by eye.
      className="relative min-h-screen flex flex-col justify-center px-5 sm:px-6 md:px-8 pt-16 sm:pt-20 sm:[@media(min-height:900px)]:!pt-28 pb-1 [@media(min-height:400px)]:pb-2 [@media(min-height:620px)]:pb-8 sm:[@media(min-height:900px)]:!pb-28 overflow-hidden"
    >
      {/* Ghost outline strip — massive, behind everything, loops forever
          and parallax-sinks on scroll so full words stay readable.
          Hidden below 620px height: purely decorative, and at that
          height it's the first thing that has to go to fit the content
          that actually matters (name, tagline, CTA) inside the fold. */}
      <div
        className="hidden [@media(min-height:620px)]:block hero-ghost absolute bottom-[4%] left-0 w-full overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        <div className="hero-ghost-track flex w-max whitespace-nowrap">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              className="text-outline block font-[family-name:var(--font-syne)] font-extrabold text-[clamp(3rem,16vw,20rem)] leading-none tracking-tighter pr-10"
            >
              DEVELOPER — ENGINEER — CREATOR —&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Spinning circular badge — sm+ is fixed larger than the plain w-32
          base: this is the ~1.25x scale it used to render at under the old
          1920px fluid-root-scale breakpoint (see globals.css), kept as the
          permanent size by request after that breakpoint was fixed to stop
          firing inconsistently across browsers on ordinary 1080p monitors.
          Mobile (below sm) never crossed that old breakpoint in the first
          place, so it stays at the original w-24 size unchanged. Hidden
          below 620px height for the same reason as the marquee above —
          decorative, lowest priority when space is this tight. */}
      <div className="hidden [@media(min-height:620px)]:block hero-badge absolute top-24 right-3 sm:top-28 sm:right-10 md:right-16 w-24 h-24 sm:w-[10rem] sm:h-[10rem] pointer-events-none select-none">
        <div className="absolute inset-0 animate-[spinSlow_16s_linear_infinite]">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <path
                id="badge-circle"
                d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
              />
            </defs>
            <text
              style={{
                // Values here are in the SVG's own user-coordinate space
                // (viewBox 0 0 100 100): the browser scales this text
                // together with the circle path whenever the rendered box
                // size differs from the viewBox, so it already grows in
                // lockstep with the w-24/w-32 wrapper under the fluid root
                // scale — no separate fix needed here.
                fontSize: "10px",
                fill: "var(--accent-volt)",
                letterSpacing: "2.4px",
                fontFamily: "var(--font-body)",
                textTransform: "uppercase",
              }}
            >
              <textPath href="#badge-circle">
                Select projects • Based in NYC •
              </textPath>
            </text>
          </svg>
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-[var(--accent-volt)] text-xl sm:text-[1.5625rem]">
          ↓
        </span>
      </div>

      <div className="hero-inner max-w-4xl mx-auto w-full relative z-10">
        <div className="overflow-hidden mb-0 [@media(min-height:620px)]:mb-3">
          <span className="hero-line inline-flex items-center gap-3 font-mono text-xs sm:text-sm text-[var(--accent-volt)] tracking-widest uppercase font-semibold">
            <span className="w-8 h-px bg-[var(--accent-volt)]" />
            {/* Decodes as the curtain clears — timed just after the mask
                slide above starts, so the label slides up already mid-
                scramble. */}
            <ScrambleLabel
              text="Software Developer"
              trigger="mount"
              delay={ENTRANCE_AT + 0.25}
            />
          </span>
        </div>

        {/* THE NAME — a five-layer 3D stack under real perspective:
              · two aria-hidden outline echoes at translateZ(-3rem/-6rem),
                the "depth shadow" that slides against the solid name as
                the stack tilts toward the cursor,
              · two aria-hidden glitch clones (cyan/violet — the preloader
                counter's chromatic pair) that flash during interference
                bursts,
              · the real h1, SplitText-split into masked chars for the
                flip-up entrance and the scroll de-rez scatter.
            All typography classes live HERE on the shared wrapper so every
            copy inherits identical metrics and can never drift out of
            alignment. rem-based z-offsets ride the fluid root scale.

            clamp() keeps the longest line ("Mohamed") narrower than the
            max-w-4xl column at every viewport — fixed sizes clipped the
            final letters behind the reveal masks. 10.8vw, trimmed from
            the 11.2vw the raw-text pass had verified: SplitText's
            per-char inline-block masks measure a whisker wider than the
            same word as plain text, and 11.2vw had been tuned against
            plain text with near-zero slack on phones — the overflow
            surfaced as "Mohamed" wrapping mid-word (see NameLines). The
            trim restores real slack so the nowrap'd line fits with room
            at every phone width instead of clipping.

            Every tier is additionally wrapped in
            min(..., calc((100vw-2.5rem)/8.45)): the hard "can the word
            physically fit" cap. The clamps' rem FLOORS exist to keep the
            name legible on short viewports, but a floor is width-blind —
            at 240px wide (feature-phone tier) the compact floor's 28px
            "Mohamed" measured 34px wider than the container, and a
            280px-wide Galaxy-Fold cover screen would overflow the main
            tier's 2.4rem floor the same way. 8.45 is the split name's
            measured width ratio (~8.36em for "Mohamed" in Syne extrabold
            at tracking-tighter, SplitText masks included) plus slack;
            2.5rem is the mobile px-5 padding. The cap only ever binds
            below ~400px width — everywhere else the vw/rem terms are
            smaller anyway.

            The vw term is purely width-driven, so on a wide-but-short
            viewport it can render at ~90px regardless of having very
            little height to work with — the single biggest contributor
            left once the navbar-clearance and section-padding fixes
            above still didn't close the gap at 800x480/960x600/1024x600.
            max-height:619px (matching the section's own compact/ultra-
            compact tiers, i.e. everywhere shorter than the "full
            content" 620px tier) swaps in a smaller clamp so the name
            stays legible without dominating a tight budget. */}
        <div
          className="relative font-[family-name:var(--font-syne)] font-extrabold text-[min(clamp(2.4rem,10.8vw,6.75rem),calc((100vw-2.5rem)/8.45))] [@media(max-height:619px)]:text-[min(clamp(1.75rem,7vw,3.5rem),calc((100vw-2.5rem)/8.45))] [@media(max-height:269px)]:!text-[min(clamp(1.25rem,5vw,2rem),calc((100vw-2.5rem)/8.45))] leading-[0.95] tracking-tighter"
          style={{ perspective: "56.25rem" }}
        >
          <div
            ref={tiltRef}
            className="relative"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              ref={echoVoltRef}
              aria-hidden="true"
              className="text-outline-volt absolute inset-0 opacity-0 pointer-events-none select-none"
              style={{ transform: "translateZ(-3rem)" }}
            >
              <NameLines />
            </div>
            <div
              ref={echoWhiteRef}
              aria-hidden="true"
              className="text-outline absolute inset-0 opacity-0 pointer-events-none select-none"
              style={{ transform: "translateZ(-6rem)" }}
            >
              <NameLines />
            </div>
            <div
              ref={glitchCyanRef}
              aria-hidden="true"
              className="glitch-clone absolute inset-0 opacity-0 pointer-events-none select-none"
              style={{ color: "var(--accent-cyan)" }}
            >
              <NameLines />
            </div>
            <div
              ref={glitchVioletRef}
              aria-hidden="true"
              className="glitch-clone absolute inset-0 opacity-0 pointer-events-none select-none"
              style={{ color: "var(--accent-violet)" }}
            >
              <NameLines />
            </div>
            <h1 ref={nameRef} className="relative text-[var(--text-contrast)]">
              <NameLines />
            </h1>
          </div>
        </div>

        <div className="overflow-hidden mt-2 [@media(min-height:620px)]:mt-3 sm:[@media(min-height:900px)]:!mt-6">
          {/* max-height:399px drops to text-sm: at the default text-xl,
              the full tagline wraps to 2 lines on a narrow-and-extremely-
              short viewport (measured 56px at 480x220 — over a quarter of
              the entire usable budget there for one line of text
              wrapping to two), which single-line text-sm avoids
              entirely. */}
          <p className="hero-line font-[family-name:var(--font-syne)] font-bold text-xl sm:text-2xl md:text-3xl [@media(max-height:399px)]:!text-sm text-[var(--accent-cyan)] tracking-tight">
            {SITE.tagline}
          </p>
        </div>

        {/* Hidden below 400px height — see the section-level comment for
            why. text-sm throughout (not sm:text-base) below 900px height:
            the old width-based bump to text-base made body copy bigger
            exactly on the wide-but-short viewports (800-1024px wide,
            480-600px tall) this fix targets, which is the opposite of
            what a tight height budget needs. Second paragraph additionally
            hidden below 620px — one paragraph reads as a complete thought
            on its own; both together is what needs the marquee/badge's
            headroom back. */}
        <div className="hidden [@media(min-height:400px)]:block hero-fade mt-2 [@media(min-height:620px)]:mt-5 sm:[@media(min-height:900px)]:!mt-8 max-w-xl space-y-2 sm:[@media(min-height:900px)]:!space-y-4 text-sm sm:[@media(min-height:900px)]:!text-base leading-tight [@media(min-height:620px)]:leading-normal sm:[@media(min-height:900px)]:!leading-relaxed text-[var(--text)]">
          {BIO_PARAGRAPHS.map((p, i) => (
            <p
              key={i}
              className={
                i === 0 ? undefined : "hidden [@media(min-height:620px)]:block"
              }
            >
              {p}
            </p>
          ))}
        </div>

        {/* Single hero-fade wrapper keeps this one entry in the entrance
            stagger regardless of which layout below is showing. Mobile/
            tablet wraps the full list naturally; desktop (min-[900px])
            forces the frontend/backend split from TECH_STACK's own order
            into an explicit 4-on-top, 3-on-bottom grid instead of leaving
            it to whatever the container's width happens to wrap. Hidden
            below 400px height — see the section-level comment. */}
        <div className="hidden [@media(min-height:400px)]:block hero-fade mt-1 [@media(min-height:620px)]:mt-2 sm:[@media(min-height:900px)]:!mt-6 max-w-xl font-mono text-[0.6875rem] sm:text-xs">
          <ul className="flex flex-wrap gap-2 min-[900px]:hidden">
            {TECH_STACK.map((tech) => (
              <li
                key={tech}
                className="px-3 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text)]"
              >
                {tech}
              </li>
            ))}
          </ul>

          <div className="hidden min-[900px]:flex min-[900px]:flex-col gap-2">
            <ul className="flex gap-2">
              {TECH_STACK.slice(0, 4).map((tech) => (
                <li
                  key={tech}
                  className="px-3 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text)]"
                >
                  {tech}
                </li>
              ))}
            </ul>
            <ul className="flex gap-2">
              {TECH_STACK.slice(4).map((tech) => (
                <li
                  key={tech}
                  className="px-3 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text)]"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hero-fade mt-2 [@media(min-height:620px)]:mt-3 sm:[@media(min-height:900px)]:!mt-8">
          <MagneticLink
            href={SITE.resumeUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-[var(--accent-volt)] text-[var(--accent-volt-ink)] px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-widest"
          >
            {/* Hover glitch rides the label span, not the anchor —
                MagneticLink owns the anchor's transform entirely. */}
            <GlitchText trigger="hover">Download Resume</GlitchText>
            <span aria-hidden="true">↓</span>
          </MagneticLink>
        </div>
      </div>

      {/* Scroll cue — hidden below 400px height, same reasoning as bio/tags
          above: at that height it's competing directly with content that
          matters more (name, tagline, CTA) for the same few remaining
          pixels.

          Below sm (mobile): in normal flow, right after the button,
          instead of absolute+bottom-8. Independently pinning it near the
          section's bottom edge while the button (in flow, vertically
          centered along with the rest of hero-inner) grows toward that
          same edge is exactly what let them collide — measured 32px of
          overlap between "Scroll" and the button at 375x812. Flowing it
          in after the button can never overlap, by construction, rather
          than chasing another pixel offset that only holds at one
          height. sm+ keeps the original absolute-centered-at-the-bottom
          positioning — untouched, not reported as broken there. */}
      <div className="hidden [@media(min-height:400px)]:flex relative mt-1 sm:mt-0 sm:absolute sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 hero-fade flex-col items-center gap-2 pointer-events-none">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-[var(--text)] opacity-80">
          Scroll
        </span>
        <span className="w-px h-6 sm:h-10 bg-gradient-to-b from-[var(--accent-volt)] to-transparent animate-pulse" />
      </div>
    </section>
  );
}

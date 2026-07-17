"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useGSAP } from "@gsap/react";
import { EXPERIENCES } from "../data/content";
import { FINE_POINTER_QUERY } from "./SmoothScroll";
import GlitchText from "./fx/GlitchText";
import ScrambleLabel from "./fx/ScrambleLabel";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin, useGSAP);
}

// Three color-blocked looks cycling down the stack: solid volt, dark with a
// cyan frame, solid cyan. Solid cards carry near-black ink for contrast.
const CARD_LOOKS = [
  {
    bg: "var(--accent-volt)",
    ink: "var(--accent-volt-ink)",
    sub: "rgba(10, 14, 2, 0.72)",
    pillBorder: "rgba(10, 14, 2, 0.3)",
    chipBg: "rgba(10, 14, 2, 0.9)",
    chipInk: "var(--accent-volt)",
    rotate: "-0.6deg",
    numberClass: "text-[var(--accent-volt-ink)] opacity-[0.12]",
  },
  {
    bg: "var(--card-bg)",
    ink: "var(--text-contrast)",
    sub: "var(--text)",
    pillBorder: "rgba(255, 255, 255, 0.16)",
    chipBg: "var(--accent-cyan)",
    chipInk: "var(--accent-cyan-ink)",
    rotate: "0.6deg",
    numberClass: "text-outline opacity-60",
    border: "1px solid rgba(51, 232, 255, 0.4)",
  },
  {
    bg: "var(--accent-cyan)",
    ink: "var(--accent-cyan-ink)",
    sub: "rgba(2, 19, 23, 0.72)",
    pillBorder: "rgba(2, 19, 23, 0.3)",
    chipBg: "rgba(2, 19, 23, 0.9)",
    chipInk: "var(--accent-cyan)",
    rotate: "-0.4deg",
    numberClass: "text-[var(--accent-cyan-ink)] opacity-[0.12]",
  },
];

export default function ExperienceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // The fade/rise-in is non-essential decorative motion; the stacked
      // pin below is the section's actual layout mechanism (its own
      // touch fallback is native CSS position:sticky, no JS motion at
      // all), so that one stays regardless of this preference.
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.utils.toArray<HTMLElement>(".exp-card").forEach((card) => {
        if (reduceMotion) {
          gsap.set(card, { opacity: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          card,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%" },
          },
        );
      });

      // Stacked-deck pin — desktop (fine pointer) only, mirroring exactly
      // where ScrollSmoother is active: position:sticky misbehaves inside
      // the smoother's transformed content wrapper, so pins stand in for
      // it there. Touch devices skip the smoother entirely and use native
      // position:sticky instead (globals.css) — compositor-driven, so the
      // deck can't lag or flicker mid-scroll the way JS pinning does.
      const mm = gsap.matchMedia();
      mm.add(FINE_POINTER_QUERY, () => {
        const wraps = gsap.utils.toArray<HTMLElement>(".exp-card-wrap");
        // Every wrap must be POSITIONED at all times, not just while
        // pinned: inside ScrollSmoother the pins are transform-based, and
        // a transformed element paints above still-static siblings while
        // z-index on a static element is silently IGNORED — so without
        // this, later cards slid up BEHIND already-pinned ones and the
        // drag's bring-to-front zIndex (onPress below) was completely
        // dead. But plain `position: relative` alone is what once buried
        // the deck under the fixed header: each wrap carries an inline
        // `top` that exists solely for the TOUCH path's position:sticky
        // (globals.css), and relative honors it as a layout shift. The
        // desktop pins get their offsets from the trigger start strings
        // below instead, so top:0 here costs nothing — positioned wraps,
        // zero shift. (Reverted by this matchMedia context if the
        // pointer condition ever flips, so sticky's inline top survives.)
        gsap.set(wraps, { position: "relative", top: 0 });
        // Wraps are hit-TRANSPARENT; only the cards themselves take
        // pointer events. Each wrap carries 48px of bottom padding
        // (pb-8/12 — pinned-deck breathing room) plus whatever area its
        // rotated card doesn't cover, and once a wrap has been
        // bring-to-fronted its zIndex keeps it above later siblings
        // FOREVER — from then on its invisible padding band floated over
        // the next card's peeking strip and swallowed every pointer event
        // there. That was the "sometimes a card just can't be grabbed"
        // bug: a dead rectangle you could see straight through. With
        // wraps out of hit-testing entirely, hits land on whatever card
        // is actually PAINTED under the cursor — if an edge is visible,
        // it's grabbable, by construction.
        gsap.set(wraps, { pointerEvents: "none" });
        // 140 (was 104, was 84): the inline `top` values are tuned for
        // the TOUCH path's sticky under mobile's h-16 (64px) header. The
        // desktop header is h-20 (80px), and the owner wants real
        // daylight between it and the stack — 140 gives 60px of air.
        // Fixed HERE in the trigger start strings only — position/top on
        // the wraps stays exactly as above; the time this clearance was
        // "fixed" by touching the wraps' positioning it killed the drag
        // z-order, and the two knobs were never actually coupled.
        const PIN_TOP = 140;
        const PIN_STEP = 18;
        const lastOffset = PIN_TOP + (wraps.length - 1) * PIN_STEP;
        wraps.forEach((wrap, i) => {
          ScrollTrigger.create({
            trigger: wrap,
            start: `top ${PIN_TOP + i * PIN_STEP}px`,
            endTrigger: wraps[wraps.length - 1],
            end: `top ${lastOffset}px`,
            pin: true,
            pinSpacing: false,
          });
        });
        // The pin-SPACERS get the same hit-transparency as the wraps via
        // a CSS rule (`#experience .pin-spacer` in globals.css) rather
        // than a JS set here: the spacers don't exist yet at this point
        // in the effect (ScrollTrigger materializes them on its first
        // refresh), so an imperative set raced their creation and
        // silently no-oped. Why they must be hit-transparent at all:
        // ScrollTrigger clones the wrap's layout styles onto its spacer,
        // so our position:relative makes each spacer a POSITIONED,
        // transparent, full-width flow box — later in DOM than every
        // earlier wrap, therefore painting (and hit-testing) ABOVE them.
        // Measured live: wrap2's spacer covered the viewport down to
        // exactly card1's peeking strip and swallowed every pointer
        // event on it.

        // The deck is a hands-on toy: every card is grabbable at any
        // scroll position (fully stacked or barely peeking), rides the
        // cursor with a velocity tilt, and — because inertia's end is
        // pinned to each card's own home (center for the front card, a
        // persisted stick-out slot for buried ones) — every throw
        // boomerangs back with real momentum. Grabbing brings the card to
        // the deck's front and it STAYS there, so the stack can be
        // reshuffled to peek at covered cards. Desktop-only by design
        // (this mm block): on touch, any drag would fight native scroll
        // on the same gesture.
        let zTop = 20;
        const bringToFront = (wrap: HTMLElement) => {
          // The counter must never climb into the fixed header's z-50:
          // enough grabs in one session and reshuffled cards would start
          // painting OVER the navbar. Renormalize instead of capping —
          // compress the wraps' current values back down to base while
          // keeping their visual order, then stack on top as usual.
          if (zTop >= 44) {
            const ordered = [...wraps].sort(
              (a, b) =>
                (Number(gsap.getProperty(a, "zIndex")) || 0) -
                (Number(gsap.getProperty(b, "zIndex")) || 0),
            );
            zTop = 20;
            ordered.forEach((w) => gsap.set(w, { zIndex: ++zTop }));
          }
          gsap.set(wrap, { zIndex: ++zTop });
        };
        const cards = gsap.utils.toArray<HTMLElement>(".exp-card");
        // Cards re-opt into hit-testing (their wraps are pointer-events:
        // none — see above), and their resting rotations are captured
        // once up front: the fan/peek below tween rotation, so reading it
        // live mid-gesture would capture a fanned value as "base".
        gsap.set(cards, { pointerEvents: "auto" });
        const baseRots = new Map<HTMLElement, number>();
        cards.forEach((c) =>
          baseRots.set(c, Number(gsap.getProperty(c, "rotation")) || 0),
        );
        // Stick-out offsets are EARNED, not preloaded: the deck loads
        // flush-aligned (every card at x:0, edges lined up left and right
        // — the resting look the owner asked back for), and a card only
        // gains a persistent sideways offset the first time a grab fans
        // it out. From then on it KEEPS that offset — release returns it
        // to its stuck-out slot, never to flush center, so anything a
        // grab once revealed stays visibly (and actually) grabbable. The
        // previous pass instead baked the fan into the load-time layout,
        // which the owner explicitly walked back: aligned at rest,
        // sticky after interaction.
        const FAN_X_BASE = 24;
        const FAN_X_STEP = 12;
        const baseXs = new Map<HTMLElement, number>();
        cards.forEach((c) => baseXs.set(c, 0));
        // Called at the top of every press: the grabbed card's home
        // becomes center-front (0), and any still-flush buried card gets
        // dealt a persistent slot on whichever side currently holds
        // fewer cards — so the buried set always splits left/right and
        // every edge clears the front card's silhouette. Cards that
        // already own a slot keep it (side AND magnitude), so reshuffles
        // never yank a card across the deck.
        const assignFanSlots = (pressed: HTMLElement) => {
          const others = cards.filter((c) => c !== pressed);
          let left = others.filter((o) => (baseXs.get(o) ?? 0) < 0).length;
          let right = others.filter((o) => (baseXs.get(o) ?? 0) > 0).length;
          others.forEach((o) => {
            if ((baseXs.get(o) ?? 0) !== 0) return;
            const dir = left <= right ? -1 : 1;
            const k = dir < 0 ? left++ : right++;
            baseXs.set(o, dir * (FAN_X_BASE + FAN_X_STEP * k));
          });
          baseXs.set(pressed, 0);
        };
        // Front-of-deck history: releasing a grab peeks the card that was
        // JUST covered (the previous front), not everything.
        const deck: { front: HTMLElement | null; prev: HTMLElement | null } = {
          front: null,
          prev: null,
        };
        // The newly-buried card leans out FURTHER from its own persisted
        // slot, holds a beat, then elastically settles back to that slot
        // (not to center) — "I'm still back here, grab me." Rotation
        // direction follows the card's own resting tilt; the extra lean
        // follows its own slot's side so the motion reads as an accent
        // on the deck's existing geometry, not a contradicting shove.
        const peekBuried = (c: HTMLElement) => {
          const b = baseRots.get(c) ?? 0;
          const bx = baseXs.get(c) ?? 0;
          const rotDir = b >= 0 ? 1 : -1;
          const xDir = bx === 0 ? 1 : Math.sign(bx);
          gsap
            .timeline()
            .to(c, {
              x: bx + 30 * xDir,
              rotation: b + 2.2 * rotDir,
              duration: 0.4,
              ease: "power3.out",
              overwrite: "auto",
            })
            .to(
              c,
              {
                x: bx,
                rotation: b,
                duration: 1.1,
                ease: "elastic.out(1, 0.55)",
              },
              "+=0.5",
            );
        };
        const draggables = cards.map((card) => {
          const wrap = card.closest<HTMLElement>(".exp-card-wrap");
          const others = cards.filter((c) => c !== card);
          const baseRot = baseRots.get(card) ?? 0;
          const rotTo = gsap.quickTo(card, "rotation", {
            duration: 0.25,
            ease: "power2.out",
          });
          return Draggable.create(card, {
            type: "x,y",
            // Inertia's x target reads the card's CURRENT persisted
            // offset at release time (a function, not a value captured at
            // create time — baseXs changes with every press now): the
            // grabbed card's home is set to 0 on press, so a throw
            // boomerangs it to center-front, while any card thrown from a
            // stuck-out slot would land back in that slot.
            inertia: {
              x: { end: () => baseXs.get(card) ?? 0 },
              y: { end: 0 },
            },
            // Snap tuning: default inertia lets a hard throw glide for
            // well over a second before wandering home. Higher resistance
            // + a capped duration + near-zero overshoot slack means every
            // throw still carries real momentum but the card is back in
            // its slot fast — the deck reads as spring-loaded, not
            // floaty.
            throwResistance: 2600,
            maxDuration: 0.9,
            minDuration: 0.25,
            overshootTolerance: 0.15,
            // The site hides the native cursor (body cursor:none) — the
            // custom ring already shows DRAG over cards, so keep
            // Draggable from re-imposing its default `move` cursor.
            cursor: "none",
            activeCursor: "none",
            onPress() {
              if (wrap) bringToFront(wrap);
              // Deal out persistent slots BEFORE the fan tweens read
              // them: this press is what turns any still-flush buried
              // card's stick-out from a temporary reaction into where it
              // now lives.
              assignFanSlots(card);
              deck.prev = deck.front;
              deck.front = card;
              // Grabbed card lifts; the REST of the deck FANS OUT —
              // sideways slides along each card's own slot with a touch
              // of extra tilt, like spreading a hand of cards with your
              // thumb. Every buried card's side edge slides clear of the
              // front card's silhouette, which is both the "press is
              // live" state and a literal display of everything that can
              // be grabbed next (any painted sliver is a hit target —
              // see the wraps' pointer-events comment above).
              // Transform-only.
              gsap.to(card, {
                scale: 1.035,
                duration: 0.2,
                ease: "power3.out",
                overwrite: "auto",
              });
              others.forEach((o) => {
                // Push FURTHER out along each card's own permanent
                // stick-out side (not a fresh alternating pattern) — the
                // press accentuates the resting fan instead of
                // overriding it, so cards never contradict where they
                // just were. The sideways push is decorative flourish;
                // the scale step-back alone still communicates press
                // state under reduced motion.
                const bx = baseXs.get(o) ?? 0;
                const xDir = bx === 0 ? 1 : Math.sign(bx);
                gsap.to(o, {
                  scale: 0.98,
                  ...(reduceMotion
                    ? {}
                    : {
                        x: bx + 18 * xDir,
                        rotation: (baseRots.get(o) ?? 0) + 1.3 * xDir,
                      }),
                  duration: 0.45,
                  ease: "power3.out",
                  overwrite: "auto",
                });
              });
            },
            onDrag(this: Draggable) {
              // Per-event pointer delta → a paper-being-yanked tilt.
              rotTo(baseRot + gsap.utils.clamp(-10, 10, this.deltaX * 0.65));
            },
            onRelease() {
              rotTo(baseRot);
              // back.out gives the settle a tiny elastic kiss as the
              // inertia boomerang lands — "placed", not "faded back".
              gsap.to(card, {
                scale: 1,
                duration: 0.45,
                ease: "back.out(2)",
                overwrite: "auto",
              });
              // Deck settles back to each card's PERSISTED slot — never
              // to flush center. The press accent (the extra push past
              // the slot) relaxes, but the slot itself, dealt on this or
              // any earlier press, is where the card now lives: once a
              // grab has revealed an edge, that edge stays out and stays
              // grabbable. Before any first grab, none of this runs and
              // the deck sits flush-aligned as loaded.
              others.forEach((o) => {
                gsap.to(o, {
                  scale: 1,
                  x: baseXs.get(o) ?? 0,
                  rotation: baseRots.get(o) ?? 0,
                  duration: 0.5,
                  ease: "power3.out",
                  overwrite: "auto",
                });
              });
              // …except the card this grab just covered, which peeks out
              // once before settling (created after the tuck tween so its
              // overwrite wins for that one card). Decorative — skipped
              // under reduced motion.
              if (!reduceMotion && deck.prev && deck.prev !== card)
                peekBuried(deck.prev);
            },
          })[0];
        });

        return () => {
          draggables.forEach((d) => d.kill());
        };
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="relative py-20 sm:py-28 md:py-32 px-5 sm:px-6 md:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-12 sm:mb-16">
          <h2 className="font-[family-name:var(--font-syne)] font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tighter text-[var(--text-contrast)] leading-none">
            {/* One interference burst as the heading lands in view — same
                signal language as the hero name's glitch loop. */}
            <GlitchText trigger="enter">
              Where I&rsquo;ve
              <br />
              <span className="text-outline-volt">Worked</span>
            </GlitchText>
          </h2>
          <ScrambleLabel
            text="2018 — Present"
            trigger="enter"
            className="hidden sm:block font-mono text-[0.625rem] uppercase tracking-[0.3em] text-[var(--text)] opacity-80 pb-2"
          />
        </div>

        {/* Sticky stack: each card pins near the top and the next one slides
            up over it, edges peeking in a deck. */}
        <div className="relative">
          {EXPERIENCES.map((exp, i) => {
            const look = CARD_LOOKS[i % CARD_LOOKS.length];

            return (
              <div
                key={exp.id}
                // Padding, NOT margin: ScrollTrigger's pin-spacers swallow
                // margins on pinned elements (pinSpacing: false), which let
                // the deck overflow the section's bottom padding and butt
                // against the marquee below. Padding sits inside the pinned
                // box, so the spacing survives pinning.
                className="exp-card-wrap pb-8 sm:pb-12"
                style={{ top: `${84 + i * 18}px` }}
              >
                <article
                  data-cursor="drag"
                  className="exp-card relative overflow-hidden rounded-3xl p-6 sm:p-10 md:p-14 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
                  style={{
                    backgroundColor: look.bg,
                    color: look.ink,
                    border: look.border,
                    transform: `rotate(${look.rotate})`,
                  }}
                >
                  {/* Giant index number */}
                  <span
                    className={`absolute -top-4 sm:-top-8 right-4 sm:right-8 font-[family-name:var(--font-syne)] font-extrabold text-[8rem] sm:text-[13rem] leading-none tracking-tighter pointer-events-none select-none ${look.numberClass}`}
                    aria-hidden="true"
                  >
                    0{i + 1}
                  </span>

                  {/* Drag affordance — fine-pointer devices only, matching
                      exactly where Draggable binds. The cursor ring also
                      morphs into a DRAG badge over the card (CustomCursor),
                      this chip is the always-visible hint. */}
                  <span
                    aria-hidden="true"
                    className="hidden [@media(hover:hover)_and_(pointer:fine)]:inline-flex absolute bottom-4 right-5 sm:bottom-6 sm:right-8 items-center gap-2 font-mono text-[0.5625rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border select-none"
                    style={{ color: look.sub, borderColor: look.pillBorder }}
                  >
                    <span className="text-[0.6875rem] leading-none">⠿</span>
                    Drag me
                  </span>

                  <div className="relative z-10 grid md:grid-cols-[1fr_1.3fr] gap-6 md:gap-12">
                    <div>
                      <span
                        className="inline-block font-mono text-[0.625rem] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: look.chipBg,
                          color: look.chipInk,
                        }}
                      >
                        {exp.range}
                      </span>
                      <h3 className="mt-5 font-[family-name:var(--font-syne)] font-extrabold text-3xl sm:text-4xl md:text-5xl leading-[1.02] tracking-tight">
                        {exp.role}
                      </h3>
                      <a
                        href={exp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block font-mono text-xs sm:text-sm uppercase tracking-widest underline underline-offset-4 decoration-2 hover:opacity-70 transition-opacity"
                        style={{ color: look.sub }}
                      >
                        {exp.company}
                      </a>
                      <p
                        className="mt-6 text-sm sm:text-base leading-relaxed max-w-sm"
                        style={{ color: look.sub }}
                      >
                        {exp.summary}
                      </p>
                    </div>

                    <div className="flex flex-col justify-between gap-6">
                      <ul className="space-y-3 text-[0.8125rem] sm:text-sm leading-relaxed">
                        {exp.details.map((d, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="font-mono font-bold shrink-0">
                              →
                            </span>
                            <span style={{ color: look.sub }}>{d}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-1.5">
                        {exp.skills.map((s) => (
                          <span
                            key={s}
                            className="font-mono text-[0.5625rem] sm:text-[0.625rem] uppercase tracking-wider px-2.5 py-1 rounded-full border"
                            style={{ borderColor: look.pillBorder }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

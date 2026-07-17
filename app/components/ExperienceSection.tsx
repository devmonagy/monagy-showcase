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
        // Wraps stay position:static in their resting state on purpose —
        // do NOT force position:relative here. Each wrap carries an inline
        // `top` offset meant to apply only once GSAP switches it to
        // position:fixed on pin; forcing relative beforehand makes that
        // same top value shift the element WHILE static too (relative
        // honors top/left, static ignores them), pulling the whole
        // pre-pin deck up under the fixed header. z-index bring-to-front
        // (onPress below) still works without this: a card is only
        // grabbable once its wrap is already on-screen and pinned
        // (fixed — a positioned value z-index already honors).
        const lastOffset = 84 + (wraps.length - 1) * 18;
        wraps.forEach((wrap, i) => {
          ScrollTrigger.create({
            trigger: wrap,
            start: `top ${84 + i * 18}px`,
            endTrigger: wraps[wraps.length - 1],
            end: `top ${lastOffset}px`,
            pin: true,
            pinSpacing: false,
          });
        });

        // The deck is a hands-on toy: every card is grabbable at any
        // scroll position (fully stacked or barely peeking), rides the
        // cursor with a velocity tilt, and — because inertia's end is
        // pinned to 0,0 — every throw boomerangs back into its slot with
        // real momentum. Grabbing brings the card to the deck's front and
        // it STAYS there, so the stack can be reshuffled to peek at
        // covered cards. Desktop-only by design (this mm block): on touch,
        // any drag would fight native scroll on the same gesture.
        let zTop = 20;
        const draggables = gsap.utils
          .toArray<HTMLElement>(".exp-card")
          .map((card) => {
            const wrap = card.closest<HTMLElement>(".exp-card-wrap");
            const baseRot = Number(gsap.getProperty(card, "rotation")) || 0;
            const rotTo = gsap.quickTo(card, "rotation", {
              duration: 0.4,
              ease: "power2.out",
            });
            return Draggable.create(card, {
              type: "x,y",
              inertia: { x: { end: 0 }, y: { end: 0 } },
              // The site hides the native cursor (body cursor:none) — the
              // custom ring already shows DRAG over cards, so keep
              // Draggable from re-imposing its default `move` cursor.
              cursor: "none",
              activeCursor: "none",
              onPress() {
                if (wrap) gsap.set(wrap, { zIndex: ++zTop });
                gsap.to(card, {
                  scale: 1.02,
                  duration: 0.25,
                  ease: "power2.out",
                });
              },
              onDrag(this: Draggable) {
                // Per-event pointer delta → a paper-being-yanked tilt.
                rotTo(baseRot + gsap.utils.clamp(-9, 9, this.deltaX * 0.55));
              },
              onRelease() {
                rotTo(baseRot);
                gsap.to(card, { scale: 1, duration: 0.4, ease: "power2.out" });
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

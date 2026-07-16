"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BIO_PARAGRAPHS, SITE, TECH_STACK } from "../data/content";
import MagneticLink from "./MagneticLink";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Entrance slide/fade, the infinite ghost-strip drift, and the
      // scroll-parallax depth cue are all non-essential motion — under
      // reduced-motion, land every element in its resting state instantly
      // instead of animating into it, and skip the perpetual drift/parallax
      // entirely rather than just slowing it down.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(".hero-line", { yPercent: 0 });
        gsap.set(".hero-fade", { opacity: 1, y: 0 });
        gsap.set(".hero-badge", { scale: 1, rotate: 0 });
        return;
      }

      // Plays immediately on mount, delay and all — the preloader covers
      // the page for ~2.85s (1.3s counter + 0.55s curtain + 0.9s slide),
      // comfortably longer than this ~2s timeline, so it's already fully
      // settled by the time the curtain lifts. A previous version built
      // this paused and released it via a `play` prop tied to the
      // preloader's onComplete — one more cross-component signal that had
      // to fire correctly, and on real mobile devices it sometimes didn't,
      // leaving the hero permanently invisible. Auto-playing here has no
      // such dependency.
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        delay: 0.15,
      });

      tl.fromTo(
        ".hero-line",
        { yPercent: 110 },
        { yPercent: 0, duration: 1.2, stagger: 0.12 },
      )
        .fromTo(
          ".hero-fade",
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 },
          "-=0.7",
        )
        .fromTo(
          ".hero-badge",
          { scale: 0, rotate: -40 },
          { scale: 1, rotate: 0, duration: 0.8, ease: "back.out(1.6)" },
          "-=0.6",
        );

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
      // spacing for genuinely spacious viewports (desktop monitors, tall
      // mobile portrait).
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
      className="relative min-h-screen flex flex-col justify-center px-5 sm:px-6 md:px-8 pt-16 sm:pt-20 [@media(min-height:900px)]:pt-28 pb-1 [@media(min-height:400px)]:pb-2 [@media(min-height:620px)]:pb-8 [@media(min-height:900px)]:pb-28 overflow-hidden"
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
            Software Developer
          </span>
        </div>

        {/* clamp() keeps the longest line ("Mohamed") narrower than the
            max-w-4xl column at every viewport — fixed sizes clipped the
            final letters behind the reveal masks. The 11.2vw term is
            purely width-driven, so on a wide-but-short viewport it can
            render at ~90px regardless of having very little height to
            work with — the single biggest contributor left once the
            navbar-clearance and section-padding fixes above still didn't
            close the gap at 800x480/960x600/1024x600. max-height:619px
            (matching the section's own compact/ultra-compact tiers, i.e.
            everywhere shorter than the "full content" 620px tier) swaps
            in a smaller clamp so the name stays legible without
            dominating a tight budget. */}
        <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[clamp(2.4rem,11.2vw,6.75rem)] [@media(max-height:619px)]:text-[clamp(1.75rem,7vw,3.5rem)] [@media(max-height:269px)]:!text-[clamp(1.25rem,5vw,2rem)] leading-[0.95] tracking-tighter text-[var(--text-contrast)]">
          <span className="overflow-hidden block">
            <span className="hero-line block">Mohamed</span>
          </span>
          <span className="overflow-hidden block">
            <span className="hero-line block">
              Nagy<span className="text-[var(--accent-volt)]">.</span>
            </span>
          </span>
        </h1>

        <div className="overflow-hidden mt-2 [@media(min-height:620px)]:mt-3 [@media(min-height:900px)]:mt-6">
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
        <div className="hidden [@media(min-height:400px)]:block hero-fade mt-2 [@media(min-height:620px)]:mt-5 [@media(min-height:900px)]:mt-8 max-w-xl space-y-2 [@media(min-height:900px)]:space-y-4 text-sm [@media(min-height:900px)]:text-base leading-tight [@media(min-height:620px)]:leading-normal [@media(min-height:900px)]:leading-relaxed text-[var(--text)]">
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
        <div className="hidden [@media(min-height:400px)]:block hero-fade mt-1 [@media(min-height:620px)]:mt-2 [@media(min-height:900px)]:mt-6 max-w-xl font-mono text-[0.6875rem] sm:text-xs">
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

        <div className="hero-fade mt-2 [@media(min-height:620px)]:mt-3 [@media(min-height:900px)]:mt-8">
          <MagneticLink
            href={SITE.resumeUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-[var(--accent-volt)] text-[var(--accent-volt-ink)] px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-widest"
          >
            Download Resume
            <span aria-hidden="true">↓</span>
          </MagneticLink>
        </div>
      </div>

      {/* Scroll cue — hidden below 400px height, same reasoning as bio/tags
          above: at that height it's competing directly with content that
          matters more (name, tagline, CTA) for the same few remaining
          pixels. */}
      <div className="hidden [@media(min-height:400px)]:flex hero-fade absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-[var(--text)] opacity-80">
          Scroll
        </span>
        <span className="w-px h-10 bg-gradient-to-b from-[var(--accent-volt)] to-transparent animate-pulse" />
      </div>
    </section>
  );
}

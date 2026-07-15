"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BIO_PARAGRAPHS, SITE, TECH_STACK } from "../data/content";
import MagneticLink from "./MagneticLink";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
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
      className="relative min-h-screen flex flex-col justify-center px-5 sm:px-6 md:px-8 py-24 sm:py-28 overflow-hidden"
    >
      {/* Ghost outline strip — massive, behind everything, loops forever
          and parallax-sinks on scroll so full words stay readable */}
      <div
        className="hero-ghost absolute bottom-[4%] left-0 w-full overflow-hidden pointer-events-none select-none"
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

      {/* Spinning circular badge */}
      <div className="hero-badge absolute top-24 right-3 sm:top-28 sm:right-10 md:right-16 w-24 h-24 sm:w-32 sm:h-32 pointer-events-none select-none">
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
        <span className="absolute inset-0 flex items-center justify-center text-[var(--accent-volt)] text-xl">
          ↓
        </span>
      </div>

      <div className="hero-inner max-w-4xl mx-auto w-full relative z-10">
        <div className="overflow-hidden mb-3">
          <span className="hero-line inline-flex items-center gap-3 font-mono text-xs sm:text-sm text-[var(--accent-volt)] tracking-widest uppercase font-semibold">
            <span className="w-8 h-px bg-[var(--accent-volt)]" />
            Software Developer
          </span>
        </div>

        {/* clamp() keeps the longest line ("Mohamed") narrower than the
            max-w-4xl column at every viewport — fixed sizes clipped the
            final letters behind the reveal masks. */}
        <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[clamp(2.4rem,11.2vw,6.75rem)] leading-[0.95] tracking-tighter text-[var(--text-contrast)]">
          <span className="overflow-hidden block">
            <span className="hero-line block">Mohamed</span>
          </span>
          <span className="overflow-hidden block">
            <span className="hero-line block">
              Nagy<span className="text-[var(--accent-volt)]">.</span>
            </span>
          </span>
        </h1>

        <div className="overflow-hidden mt-4 sm:mt-6">
          <p className="hero-line font-[family-name:var(--font-syne)] font-bold text-xl sm:text-2xl md:text-3xl text-[var(--accent-cyan)] tracking-tight">
            {SITE.tagline}
          </p>
        </div>

        <div className="hero-fade mt-8 max-w-xl space-y-4 text-sm sm:text-base leading-relaxed text-[var(--text)]">
          {BIO_PARAGRAPHS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <ul className="hero-fade mt-6 flex flex-wrap gap-2 max-w-xl font-mono text-[0.6875rem] sm:text-xs">
          {TECH_STACK.map((tech) => (
            <li
              key={tech}
              className="px-3 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text)]"
            >
              {tech}
            </li>
          ))}
        </ul>

        <div className="hero-fade mt-8">
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

      {/* Scroll cue */}
      <div className="hero-fade absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-[var(--text)] opacity-70">
          Scroll
        </span>
        <span className="w-px h-10 bg-gradient-to-b from-[var(--accent-volt)] to-transparent animate-pulse" />
      </div>
    </section>
  );
}

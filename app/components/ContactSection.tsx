"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { SITE, SOCIALS } from "../data/content";
import { FINE_POINTER_QUERY } from "./SmoothScroll";
import GlitchText, { playGlitchBurst } from "./fx/GlitchText";
import ScrambleLabel from "./fx/ScrambleLabel";
import { SIGNAL_LOCK_EASE } from "./fx/constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  CustomEase.create("signalLock", SIGNAL_LOCK_EASE);
}

// 12-ray starburst — rotates slowly behind the headline stack.
const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

export default function ContactSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLSpanElement>(null);
  const punchRealRef = useRef<HTMLSpanElement>(null);
  const punchCyanRef = useRef<HTMLSpanElement>(null);
  const punchVioletRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const real = punchRealRef.current;
      const cyan = punchCyanRef.current;
      const violet = punchVioletRef.current;

      // Desktop-only reveals: on touch devices this content stays visible
      // from first paint — real phones repeatedly failed to fire these
      // ScrollTriggers on time, leaving the section blank mid-scroll.
      const mm = gsap.matchMedia();
      mm.add(FINE_POINTER_QUERY, () => {
        if (reduceMotion || !real || !cyan || !violet) {
          // Static under reduced motion — nothing was hidden, nothing
          // needs revealing.
          return;
        }

        // Initial hidden states as standalone sets, NOT the timeline's
        // fromTo immediateRender: the timeline is reverted/rebuilt by
        // SplitText on every re-split (font load, resize), and a revert
        // restores each target's PRE-TWEEN state — these sets are that
        // state, so the content stays hidden across rebuilds. Same
        // pattern (and reason) as HeroSection's mount-time sets.
        gsap.set(".contact-reveal-pre", { opacity: 0, y: 24 });
        gsap.set(outlineRef.current, { yPercent: 112 });
        gsap.set(".contact-reveal", { opacity: 0, y: 44 });

        // The section ARRIVES as one continuous transmission instead of
        // fading in over already-visible text: kicker decodes, the outline
        // line slides up through its mask, then "Let's Talk." flips up
        // char-by-char on the hero's own signalLock snap and a full
        // interference burst punctuates the landing while the supporting
        // content rises in its wake. toggleActions restarts the whole
        // choreography every time the section returns to view — same
        // repeat-on-enter language as the heading glitches site-wide.
        SplitText.create(real, {
          type: "chars",
          mask: "chars",
          autoSplit: true,
          onSplit(self) {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 72%",
                toggleActions: "restart none restart none",
              },
            });
            // immediateRender is explicit on every fromTo: the start
            // states must land at CREATION (content hidden before the
            // section is reached — desktop only, this whole branch is
            // fine-pointer), not at first play.
            tl.fromTo(
              ".contact-reveal-pre",
              { opacity: 0, y: 24 },
              {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power3.out",
                immediateRender: true,
              },
              0,
            )
              .fromTo(
                outlineRef.current,
                { yPercent: 112 },
                {
                  yPercent: 0,
                  duration: 0.9,
                  ease: "power4.out",
                  immediateRender: true,
                },
                0.08,
              )
              .fromTo(
                self.chars,
                {
                  yPercent: 120,
                  rotationX: -85,
                  transformOrigin: "50% 100%",
                },
                {
                  yPercent: 0,
                  rotationX: 0,
                  duration: 0.8,
                  ease: "signalLock",
                  stagger: 0.04,
                  immediateRender: true,
                },
                0.22,
              )
              .call(
                () => {
                  playGlitchBurst(real, cyan, violet, { power: 1.6 });
                },
                undefined,
                // Right as the last char locks in.
                0.22 + (self.chars.length - 1) * 0.04 + 0.8 * 0.75,
              )
              .fromTo(
                ".contact-reveal",
                { opacity: 0, y: 44 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.9,
                  ease: "power3.out",
                  stagger: 0.1,
                  immediateRender: true,
                },
                0.7,
              );
            return tl;
          },
        });
      });

      // Touch: content never hides, but the punch line still gets the full
      // interference burst on every pass into view — burst end-state is
      // always fully visible, so a late/missed trigger costs a beat of
      // flair, never content.
      mm.add("(hover: none), (pointer: coarse)", () => {
        if (reduceMotion || !real || !cyan || !violet) return;
        let last = 0;
        const burst = () => {
          const now = performance.now();
          if (now - last < 900) return;
          last = now;
          playGlitchBurst(real, cyan, violet, { power: 2, materialize: true });
        };
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top 75%",
          onEnter: burst,
          onEnterBack: burst,
        });
      });
    },
    { scope: sectionRef },
  );

  // Matches MagneticLink's own reduced-motion guard — this is a hand-rolled
  // equivalent of that shared component's pull effect, so it should respect
  // the same preference.
  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, {
      x: dx * 0.25,
      y: dy * 0.35,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 overflow-hidden"
    >
      {/* Rotating starburst behind the headline */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130vw] max-w-[56.25rem] aspect-square pointer-events-none select-none opacity-[0.1]"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full animate-[spinSlow_50s_linear_infinite]"
        >
          {RAYS.map((deg) => (
            <path
              key={deg}
              d="M100 100 L95 8 L105 8 Z"
              fill="var(--accent-volt)"
              transform={`rotate(${deg} 100 100)`}
            />
          ))}
        </svg>
      </div>

      {/* Ambient corner glows */}
      <div className="ambient-orb absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[30rem] max-h-[30rem] rounded-full bg-[var(--accent-cyan)] opacity-[0.08] blur-[120px] pointer-events-none" />
      <div className="ambient-orb absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[30rem] max-h-[30rem] rounded-full bg-[var(--accent-volt)] opacity-[0.08] blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-5 sm:px-6">
        <span className="contact-reveal-pre inline-flex items-center gap-3 font-mono text-xs sm:text-sm text-[var(--accent-volt)] tracking-widest uppercase font-semibold mb-6">
          <span className="w-8 h-px bg-[var(--accent-volt)]" />
          <ScrambleLabel text="Get In Touch" trigger="enter" />
          <span className="w-8 h-px bg-[var(--accent-volt)]" />
        </span>

        {/* The heading is its own choreography (see useGSAP above), not part
            of the shared reveal groups: outline line slides through a mask,
            then the punch line's chars flip up SplitText-masked on the
            hero's signalLock ease with hand-built glitch clones — the same
            construction as the hero name, closing the site on the language
            it opened with. */}
        <h2 className="font-[family-name:var(--font-syne)] font-extrabold tracking-tighter leading-[0.95]">
          {/* pb/-mb pair keeps the mask from shaving the descenders of
              "project?" at this tight leading. */}
          <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
            <span
              ref={outlineRef}
              className="block text-[clamp(1.9rem,6.5vw,4.5rem)] uppercase"
              style={{
                color: "transparent",
                WebkitTextStroke: "1.5px rgba(247,247,245,0.55)",
              }}
            >
              Got a project?
            </span>
          </span>
          <span className="contact-punch relative block text-[clamp(3.4rem,13vw,10rem)] text-[var(--accent-volt)] uppercase">
            <span
              ref={punchCyanRef}
              aria-hidden="true"
              className="glitch-clone absolute inset-0 opacity-0 pointer-events-none select-none"
              style={{ color: "var(--accent-cyan)" }}
            >
              Let&rsquo;s Talk.
            </span>
            <span
              ref={punchVioletRef}
              aria-hidden="true"
              className="glitch-clone absolute inset-0 opacity-0 pointer-events-none select-none"
              style={{ color: "var(--accent-violet)" }}
            >
              Let&rsquo;s Talk.
            </span>
            <span ref={punchRealRef} className="relative block">
              Let&rsquo;s Talk<span className="text-[var(--accent-cyan)]">.</span>
            </span>
          </span>
        </h2>

        <p className="contact-reveal mt-6 max-w-lg text-sm sm:text-base text-[var(--text)] leading-relaxed">
          I&rsquo;m employed full-time and selective with freelance — but the
          right project always gets my attention. Pitch something
          interesting, or just talk shop.
        </p>

        {/* Giant magnetic gradient capsule */}
        <a
          href={`mailto:${SITE.email}`}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          className="contact-reveal group mt-10 sm:mt-14 inline-flex items-center gap-4 sm:gap-6 rounded-full pl-7 pr-3 py-3 sm:pl-12 sm:pr-4 sm:py-4 font-[family-name:var(--font-syne)] font-bold text-[clamp(0.95rem,3.2vw,1.6rem)] text-[var(--accent-volt-ink)] transition-shadow duration-300 hover:shadow-[0_0_70px_rgba(214,255,63,0.35)]"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-volt), var(--accent-cyan))",
          }}
        >
          {/* Hover glitch rides the label span, not the anchor — the
              anchor's transform belongs to its own magnetic handlers. */}
          <GlitchText trigger="hover">{SITE.email}</GlitchText>
          <span className="flex items-center justify-center w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-[var(--bg)] text-[var(--accent-volt)] text-lg sm:text-2xl rotate-45 group-hover:rotate-0 transition-transform duration-300">
            ↑
          </span>
        </a>

        {/* Meta strip: availability + socials */}
        <div className="contact-reveal mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[0.625rem] sm:text-xs uppercase tracking-widest text-[var(--text)]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-volt)] animate-pulse" />
            NYC · Select Freelance
          </span>
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent-volt)] transition-colors duration-200"
            >
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>

    </section>
  );
}

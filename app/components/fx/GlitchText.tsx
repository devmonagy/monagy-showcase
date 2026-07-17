"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Builds and plays one ~220ms RGB-split glitch burst: the cyan/violet clones
 * flash on with opposite x offsets while clip-path slices jump between
 * random horizontal bands, and the real text micro-jitters. Discrete .set()
 * steps (not eased tweens) are the point — the hard snapping IS the glitch;
 * easing would read as wobble. Transform / opacity / clip-path only, per the
 * repo rule (never animate filter or text-shadow — see globals.css notes).
 *
 * Exported separately from the component so HeroSection can drive the same
 * burst on its own hand-built name clones (the name's DOM is too specialized
 * — SplitText chars, depth echoes — to wrap in <GlitchText>).
 */
export function playGlitchBurst(
  real: HTMLElement,
  cyan: HTMLElement,
  violet: HTMLElement,
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const STEP = 0.055;
  const STEPS = 4;

  const slice = () => {
    const top = gsap.utils.random(0, 70);
    const height = gsap.utils.random(8, 30);
    return `inset(${top}% 0 ${Math.max(0, 100 - top - height)}% 0)`;
  };

  for (let i = 0; i < STEPS; i++) {
    const t = i * STEP;
    tl.set(cyan, { opacity: 1, x: gsap.utils.random(-7, -2), y: gsap.utils.random(-2, 2), clipPath: slice() }, t);
    tl.set(violet, { opacity: 1, x: gsap.utils.random(2, 7), y: gsap.utils.random(-2, 2), clipPath: slice() }, t);
    tl.set(real, { x: gsap.utils.random(-2, 2) }, t);
  }
  const end = STEPS * STEP;
  tl.set(cyan, { opacity: 0, x: 0, y: 0 }, end);
  tl.set(violet, { opacity: 0, x: 0, y: 0 }, end);
  tl.set(real, { x: 0 }, end);
  return tl;
}

interface GlitchTextProps {
  children: React.ReactNode;
  /**
   * "enter" — one burst when scrolled into view (once).
   * "hover" — one burst on pointerenter of the nearest <a>/<button> ancestor
   *           (falls back to the wrapper itself), throttled to ~600ms, so a
   *           button label glitches when the button is hovered — not only
   *           when the cursor happens to cross the label span.
   */
  trigger: "enter" | "hover";
  /** Extra classes on the wrapper (e.g. "block" for multi-line headings). */
  className?: string;
}

/**
 * RGB-split glitch wrapper. Renders `children` three times: the real copy
 * plus two aria-hidden clones in the preloader counter's chromatic pair
 * (cyan / violet — same interference language, one system). Clones sit
 * absolutely over the real text at opacity 0 and only flash during a burst.
 * `.glitch-clone` (globals.css) forces every descendant to the clone's own
 * color and strips text-outline strokes, so headings with outlined words
 * glitch as solid color silhouettes.
 *
 * Under prefers-reduced-motion no burst ever plays — clones stay invisible.
 */
export default function GlitchText({
  children,
  trigger,
  className = "",
}: GlitchTextProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const realRef = useRef<HTMLSpanElement>(null);
  const cyanRef = useRef<HTMLSpanElement>(null);
  const violetRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const real = realRef.current;
      const cyan = cyanRef.current;
      const violet = violetRef.current;
      if (!wrap || !real || !cyan || !violet) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;

      const burst = () => playGlitchBurst(real, cyan, violet);

      if (trigger === "enter") {
        ScrollTrigger.create({
          trigger: wrap,
          start: "top 85%",
          once: true,
          onEnter: burst,
        });
        return;
      }

      // hover
      const host = wrap.closest("a, button") ?? wrap;
      let last = 0;
      const onEnter = () => {
        const now = performance.now();
        if (now - last < 600) return;
        last = now;
        burst();
      };
      host.addEventListener("pointerenter", onEnter);
      return () => host.removeEventListener("pointerenter", onEnter);
    },
    { scope: wrapRef, dependencies: [trigger] },
  );

  return (
    <span ref={wrapRef} className={`relative inline-block ${className}`}>
      <span
        ref={cyanRef}
        aria-hidden="true"
        className="glitch-clone absolute inset-0 opacity-0 pointer-events-none select-none"
        style={{ color: "var(--accent-cyan)" }}
      >
        {children}
      </span>
      <span
        ref={violetRef}
        aria-hidden="true"
        className="glitch-clone absolute inset-0 opacity-0 pointer-events-none select-none"
        style={{ color: "var(--accent-violet)" }}
      >
        {children}
      </span>
      <span ref={realRef} className="relative block">
        {children}
      </span>
    </span>
  );
}

"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export interface GlitchBurstOptions {
  /**
   * Burst intensity. 1 = the quick ~220ms punctuation (hover, hero loop);
   * ~2 = the full heading treatment — twice the steps, wider chromatic
   * throw, skew snaps on the real text, amplitude decaying to a clean lock.
   */
  power?: number;
  /**
   * When true the real element itself materializes out of the interference:
   * invisible for the first beats (only the chromatic ghosts show), then
   * flickering in as random scanline bands, then locking whole. End state
   * is always fully visible, so it's safe to re-fire on elements that were
   * never hidden.
   */
  materialize?: boolean;
}

/**
 * Builds and plays one RGB-split glitch burst: the cyan/violet clones flash
 * on with opposite x offsets while clip-path slices jump between random
 * horizontal bands, and the real text micro-jitters. Discrete .set() steps
 * (not eased tweens) are the point — the hard snapping IS the glitch;
 * easing would read as wobble. Transform / opacity / clip-path only, per the
 * repo rule (never animate filter or text-shadow — see globals.css notes).
 *
 * Exported separately from the component so HeroSection (and the navbar
 * logo) can drive the same burst on their own hand-built clones — DOM too
 * specialized (SplitText chars, depth echoes) to wrap in <GlitchText>.
 */
export function playGlitchBurst(
  real: HTMLElement,
  cyan: HTMLElement,
  violet: HTMLElement,
  { power = 1, materialize = false }: GlitchBurstOptions = {},
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const STEP = 0.055;
  const steps = Math.round(4 * power);
  const amp = 7 * power;

  const slice = () => {
    const top = gsap.utils.random(0, 70);
    const height = gsap.utils.random(8, 30);
    return `inset(${top}% 0 ${Math.max(0, 100 - top - height)}% 0)`;
  };

  for (let i = 0; i < steps; i++) {
    const t = i * STEP;
    // Interference dies down across the run — the burst arrives violent
    // and settles, instead of holding one flat intensity then vanishing.
    const decayAmp = amp * (1 - (i / steps) * 0.7);
    tl.set(
      cyan,
      {
        opacity: 1,
        x: gsap.utils.random(-decayAmp, -decayAmp * 0.3),
        y: gsap.utils.random(-2, 2) * power,
        clipPath: slice(),
      },
      t,
    );
    tl.set(
      violet,
      {
        opacity: 1,
        x: gsap.utils.random(decayAmp * 0.3, decayAmp),
        y: gsap.utils.random(-2, 2) * power,
        clipPath: slice(),
      },
      t,
    );
    tl.set(
      real,
      {
        x: gsap.utils.random(-2, 2) * power,
        // Skew snaps only at heading power — on the small quick burst they
        // read as smearing, not tearing.
        skewX: power > 1.4 ? gsap.utils.random(-6, 6) * (1 - i / steps) : 0,
      },
      t,
    );
    if (materialize) {
      if (i === 0) {
        tl.set(real, { opacity: 0 }, 0);
      } else if (i / steps < 0.6) {
        // Mid-burst the real text exists only as jumping scanline bands.
        tl.set(real, { opacity: 1, clipPath: slice() }, t);
      } else {
        tl.set(real, { opacity: 1, clipPath: "none" }, t);
      }
    }
  }
  const end = steps * STEP;
  tl.set(cyan, { opacity: 0, x: 0, y: 0 }, end);
  tl.set(violet, { opacity: 0, x: 0, y: 0 }, end);
  tl.set(
    real,
    { x: 0, skewX: 0, ...(materialize ? { opacity: 1, clipPath: "none" } : {}) },
    end,
  );
  return tl;
}

interface GlitchTextProps {
  children: React.ReactNode;
  /**
   * "enter" — a full-power materialize burst EVERY time the element comes
   *           into view (scrolling down or back up), throttled so direction
   *           jiggle at the trigger edge can't machine-gun it.
   * "hover" — one quick burst on pointerenter of the nearest <a>/<button>
   *           ancestor (falls back to the wrapper itself), throttled to
   *           ~600ms, so a button label glitches when the button is hovered
   *           — not only when the cursor happens to cross the label span.
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

      if (trigger === "enter") {
        // Replays on every pass — down (onEnter) and back up (onEnterBack)
        // — so the heading re-materializes whenever it returns to view.
        // The materialize burst's end state is always fully visible, so
        // re-firing on visible text can never strand it hidden.
        let last = 0;
        const burst = () => {
          const now = performance.now();
          if (now - last < 900) return;
          last = now;
          playGlitchBurst(real, cyan, violet, { power: 2, materialize: true });
        };
        ScrollTrigger.create({
          trigger: wrap,
          start: "top 85%",
          onEnter: burst,
          onEnterBack: burst,
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
        playGlitchBurst(real, cyan, violet);
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

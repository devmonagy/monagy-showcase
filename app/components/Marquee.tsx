"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { FINE_POINTER_QUERY } from "./SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type MarqueeProps = {
  items: string[];
  tone?: "volt" | "cyan";
  duration?: number;
  direction?: "left" | "right";
  /** Degrees — tilts the whole band so it cuts diagonally across the page */
  tilt?: number;
  /** Extra classes for the outer container (e.g. contextual margins) */
  className?: string;
};

export default function Marquee({
  items,
  tone = "volt",
  duration = 22,
  direction = "left",
  tilt = 0,
  className = "",
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  // True while the pointer holds the band stopped (or a touch-tap parked
  // it). Read by the scroll-velocity handlers so their per-frame timeScale
  // writes don't fight the hover glide — with the old hard pause() this
  // didn't matter, but a paused tween also silently ate every velocity
  // boost, which is why a band under the resting cursor felt dead.
  const stoppedRef = useRef(false);

  useGSAP(
    () => {
      // The infinite scroll, its scroll-velocity speedup/skew, and the
      // punch-in entrance are all non-essential decorative motion — the
      // most textbook case for prefers-reduced-motion on this whole site,
      // given it's a literal repeat:-1 loop running forever. Land the band
      // at its resting angle/position with no motion at all rather than
      // just slowing the loop down. tweenRef.current stays null, which the
      // pause/resume/togglePlay handlers below already handle safely via
      // optional chaining.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(trackRef.current, {
          xPercent: direction === "left" ? 0 : -50,
        });
        gsap.set(bandRef.current, { y: 0, rotate: tilt, opacity: 1 });
        return;
      }

      const tween = gsap.fromTo(
        trackRef.current,
        { xPercent: direction === "left" ? 0 : -50 },
        {
          xPercent: direction === "left" ? -50 : 0,
          duration,
          ease: "none",
          repeat: -1,
        },
      );
      tweenRef.current = tween;

      // Punch-in entrance: the band swings up from below with extra tilt,
      // settling into its resting angle. Desktop only — on touch the band
      // must never start at opacity 0 waiting on a ScrollTrigger that real
      // phones repeatedly failed to fire on time; its inline rotate(tilt)
      // keeps the resting angle without the tween.
      const mm = gsap.matchMedia();
      mm.add(FINE_POINTER_QUERY, () => {
        gsap.fromTo(
          bandRef.current,
          { y: 90, rotate: tilt + 6, opacity: 0 },
          {
            y: 0,
            rotate: tilt,
            opacity: 1,
            duration: 1.1,
            ease: "power4.out",
            scrollTrigger: { trigger: containerRef.current, start: "top 92%" },
          },
        );
      });

      // Scroll-velocity feedback: fast scrolling speeds the loop up and
      // skews the type in the scroll direction; a per-frame decay relaxes
      // both back to rest once scrolling stops. timeScale writes stand
      // down while the band is hover-stopped, and a real scroll burst
      // kills any in-flight hover glide so the boost takes over cleanly.
      const st = ScrollTrigger.create({
        onUpdate(self) {
          const v = self.getVelocity();
          gsap.set(trackRef.current, {
            skewX: gsap.utils.clamp(-12, 12, v / 160),
          });
          if (stoppedRef.current) return;
          if (Math.abs(v) > 100) gsap.killTweensOf(tween);
          if (!gsap.isTweening(tween))
            tween.timeScale(gsap.utils.clamp(1, 5, 1 + Math.abs(v) / 700));
        },
      });

      const decay = () => {
        const current = Number(gsap.getProperty(trackRef.current, "skewX")) || 0;
        const skewIdle = Math.abs(current) < 0.05;
        // While a hover glide owns timeScale, only the skew needs relaxing.
        if (stoppedRef.current || gsap.isTweening(tween)) {
          if (!skewIdle) gsap.set(trackRef.current, { skewX: current * 0.92 });
          return;
        }
        // At rest there's nothing to relax — skip the per-frame writes so
        // an idle page (3 marquee tickers) costs nothing.
        if (skewIdle && Math.abs(tween.timeScale() - 1) < 0.01) return;
        gsap.set(trackRef.current, { skewX: current * 0.92 });
        tween.timeScale(gsap.utils.interpolate(tween.timeScale(), 1, 0.05));
      };
      gsap.ticker.add(decay);

      return () => {
        gsap.ticker.remove(decay);
        st.kill();
      };
    },
    { scope: containerRef, dependencies: [direction, duration, tilt] },
  );

  // Momentum stop/start instead of a hard pause: the loop's own timeScale
  // is tweened, so the band coasts into stillness under the cursor and
  // lazily spools back up on leave. overwrite:true retargets cleanly if
  // the pointer jitters across the band edge mid-glide.
  const glideTo = (timeScale: number, duration: number, ease: string) => {
    const tween = tweenRef.current;
    if (!tween) return;
    gsap.to(tween, { timeScale, duration, ease, overwrite: true });
  };
  const glideStop = () => {
    stoppedRef.current = true;
    glideTo(0, 1.1, "power3.out");
  };
  const glideStart = () => {
    stoppedRef.current = false;
    glideTo(1, 1.5, "power2.inOut");
  };
  const togglePlay = () => {
    if (stoppedRef.current) glideStart();
    else glideStop();
  };

  const bg = tone === "volt" ? "var(--accent-volt)" : "var(--accent-cyan)";
  const ink =
    tone === "volt" ? "var(--accent-volt-ink)" : "var(--accent-cyan-ink)";

  const doubled = [...items, ...items, ...items, ...items];

  return (
    // Outer wrapper reserves vertical room so the tilted band's corners
    // don't clip against neighboring sections.
    <div
      ref={containerRef}
      className={`relative z-20 py-8 sm:py-10 overflow-visible ${className}`}
    >
      <div
        ref={bandRef}
        onMouseEnter={glideStop}
        onMouseLeave={glideStart}
        onTouchStart={togglePlay}
        className="relative w-[110vw] ml-[-5vw] overflow-hidden select-none py-4 sm:py-6 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
        style={{ backgroundColor: bg, transform: `rotate(${tilt}deg)` }}
      >
        <div ref={trackRef} className="flex whitespace-nowrap w-max">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-4xl md:text-5xl tracking-tight uppercase"
              style={
                // Every other word renders as a hollow outline of the ink
                // color — the alternation gives the band typographic depth
                // instead of one flat repeated texture.
                i % 2 === 0
                  ? { color: ink }
                  : {
                      color: "transparent",
                      WebkitTextStroke: `1.5px ${ink}`,
                    }
              }
            >
              {item}
              <span aria-hidden="true" style={{ color: ink }}>
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

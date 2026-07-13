"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type MarqueeProps = {
  items: string[];
  tone?: "volt" | "cyan";
  duration?: number;
  direction?: "left" | "right";
  /** Degrees — tilts the whole band so it cuts diagonally across the page */
  tilt?: number;
};

export default function Marquee({
  items,
  tone = "volt",
  duration = 22,
  direction = "left",
  tilt = 0,
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
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
      // settling into its resting angle.
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

      // Scroll-velocity feedback: fast scrolling speeds the loop up and
      // skews the type in the scroll direction; a per-frame decay relaxes
      // both back to rest once scrolling stops.
      const st = ScrollTrigger.create({
        onUpdate(self) {
          const v = self.getVelocity();
          gsap.set(trackRef.current, {
            skewX: gsap.utils.clamp(-12, 12, v / 160),
          });
          tween.timeScale(gsap.utils.clamp(1, 5, 1 + Math.abs(v) / 700));
        },
      });

      const decay = () => {
        const current = Number(gsap.getProperty(trackRef.current, "skewX")) || 0;
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

  const pause = () => tweenRef.current?.pause();
  const resume = () => tweenRef.current?.resume();
  const togglePlay = () => {
    const tween = tweenRef.current;
    if (!tween) return;
    if (tween.paused()) tween.resume();
    else tween.pause();
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
      className="relative z-20 py-6 sm:py-8 overflow-visible"
    >
      <div
        ref={bandRef}
        onMouseEnter={pause}
        onMouseLeave={resume}
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

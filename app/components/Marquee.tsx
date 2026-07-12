"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type MarqueeProps = {
  items: string[];
  tone?: "volt" | "flux";
  duration?: number;
  direction?: "left" | "right";
};

export default function Marquee({
  items,
  tone = "volt",
  duration = 22,
  direction = "left",
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      tweenRef.current = gsap.fromTo(
        trackRef.current,
        { xPercent: direction === "left" ? 0 : -50 },
        {
          xPercent: direction === "left" ? -50 : 0,
          duration,
          ease: "none",
          repeat: -1,
        },
      );
    },
    { scope: containerRef, dependencies: [direction, duration] },
  );

  const pause = () => tweenRef.current?.pause();
  const resume = () => tweenRef.current?.resume();
  const togglePlay = () => {
    const tween = tweenRef.current;
    if (!tween) return;
    if (tween.paused()) tween.resume();
    else tween.pause();
  };

  const bg = tone === "volt" ? "var(--accent-volt)" : "var(--accent-flux)";
  const ink = tone === "volt" ? "var(--accent-volt-ink)" : "var(--accent-flux-ink)";

  const doubled = [...items, ...items];

  return (
    <div
      ref={containerRef}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={togglePlay}
      className="relative w-full overflow-hidden select-none py-4 sm:py-6"
      style={{ backgroundColor: bg }}
    >
      <div ref={trackRef} className="flex whitespace-nowrap w-max">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-4xl md:text-5xl tracking-tight uppercase"
            style={{ color: ink }}
          >
            {item}
            <span aria-hidden="true">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

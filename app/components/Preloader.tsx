"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Preloader({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const counter = { value: 0 };

      const tl = gsap.timeline({
        onComplete,
      });

      tl.to(counter, {
        value: 100,
        duration: 1.3,
        ease: "power1.inOut",
        onUpdate: () => {
          if (countRef.current) {
            countRef.current.textContent = String(
              Math.round(counter.value),
            ).padStart(3, "0");
          }
        },
      })
        // Volt curtain sweeps up from the bottom, covering the counter
        .to(overlayRef.current, {
          scaleY: 1,
          duration: 0.55,
          ease: "power4.inOut",
        })
        // Whole loader (counter screen + volt curtain) slides up off-screen,
        // revealing the page underneath — transform-only, stays on the
        // compositor.
        .to(
          wrapperRef.current,
          {
            yPercent: -100,
            duration: 0.9,
            ease: "power4.inOut",
          },
          "+=0.1",
        );
    },
    { scope: wrapperRef },
  );

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-[999] overflow-hidden touch-none overscroll-contain"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[var(--bg)] flex items-center justify-center">
        <span
          ref={countRef}
          className="font-[family-name:var(--font-syne)] font-extrabold text-[18vw] sm:text-[12vw] leading-none tracking-tighter text-[var(--text-contrast)] tabular-nums"
        >
          000
        </span>
        <span className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--accent-volt)]">
          Mohamed Nagy — Portfolio
        </span>
      </div>
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[var(--accent-volt)] origin-bottom"
        style={{ transform: "scaleY(0)" }}
      />
    </div>
  );
}

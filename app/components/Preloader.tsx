"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// Small wireframe cube — same construction as Backdrop3D's, scaled down as a
// decorative boot-screen flourish. Hidden below sm: preserve-3d transforms
// are cheap but not worth it on a screen this brief and this small.
const CUBE_SIZE = 56;
const HALF = CUBE_SIZE / 2;
const CUBE_FACES: React.CSSProperties[] = [
  { transform: `translateZ(${HALF}px)` },
  { transform: `rotateY(180deg) translateZ(${HALF}px)` },
  { transform: `rotateY(90deg) translateZ(${HALF}px)` },
  { transform: `rotateY(-90deg) translateZ(${HALF}px)` },
  { transform: `rotateX(90deg) translateZ(${HALF}px)` },
  { transform: `rotateX(-90deg) translateZ(${HALF}px)` },
];

// Dot-grid geometry — matches Backdrop3D's so the texture reads as the same
// system, not a one-off.
const GRID_STEP = 34;

// Progress ring geometry (viewBox 0 0 120 120, centered r=52).
const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Boot diagnostic bargraph — reads as a hardware memory-check/POST readout,
// not a music visualizer. Segments light up left to right with progress; a
// cyan "read head" leads the volt trail behind it.
const SEGMENT_COUNT = 14;

const STATUS_STEPS = [
  { at: 0, label: "Initializing…" },
  { at: 28, label: "Loading assets…" },
  { at: 62, label: "Compiling shaders…" },
  { at: 88, label: "Almost there…" },
];

export default function Preloader({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cyanOverlayRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const counter = { value: 0 };

      if (ringRef.current) {
        ringRef.current.style.strokeDasharray = String(RING_CIRCUMFERENCE);
        ringRef.current.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
      }

      const tl = gsap.timeline({ onComplete });

      tl.to(counter, {
        value: 100,
        duration: 1.5,
        ease: "power1.inOut",
        onUpdate: () => {
          const v = counter.value;
          if (countRef.current) {
            countRef.current.textContent = String(Math.round(v)).padStart(
              3,
              "0",
            );
          }
          if (ringRef.current) {
            ringRef.current.style.strokeDashoffset = String(
              RING_CIRCUMFERENCE * (1 - v / 100),
            );
          }
          if (barRef.current) {
            barRef.current.style.transform = `scaleX(${v / 100})`;
          }
          if (statusRef.current) {
            const step = [...STATUS_STEPS].reverse().find((s) => v >= s.at);
            if (step) statusRef.current.textContent = step.label;
          }
          if (segmentsRef.current && segmentsRef.current.children.length > 0) {
            const lit = Math.round((v / 100) * SEGMENT_COUNT);
            Array.from(segmentsRef.current.children).forEach((el, i) => {
              const seg = el as HTMLElement;
              if (i < lit) {
                const isLeading = i === lit - 1;
                seg.style.background = isLeading
                  ? "var(--accent-cyan)"
                  : "var(--accent-volt)";
                seg.style.boxShadow = isLeading
                  ? "0 0 10px var(--accent-cyan)"
                  : "0 0 5px var(--accent-volt)";
                seg.style.borderColor = "transparent";
              } else {
                seg.style.background = "transparent";
                seg.style.boxShadow = "none";
                seg.style.borderColor = "rgba(255,255,255,0.14)";
              }
            });
          }
        },
      })
        // Counter punches to cyan right as it lands on 100 — the one hard
        // accent hit before the wipe takes over.
        .to(
          countRef.current,
          { color: "var(--accent-cyan)", duration: 0.12, yoyo: true, repeat: 1 },
          "-=0.05",
        )
        // Cyan sliver leads the wipe by ~80ms, volt follows close behind —
        // reads as a thin cyan edge riding the top of the volt curtain
        // instead of one flat color sweep.
        .to(cyanOverlayRef.current, {
          scaleY: 1,
          duration: 0.5,
          ease: "power4.inOut",
        })
        .to(
          overlayRef.current,
          { scaleY: 1, duration: 0.5, ease: "power4.inOut" },
          "-=0.42",
        )
        // Whole loader slides up off-screen — transform-only, stays on the
        // compositor.
        .to(
          wrapperRef.current,
          { yPercent: -100, duration: 0.9, ease: "power4.inOut" },
          "+=0.1",
        );
    },
    { scope: wrapperRef },
  );

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-[999] overflow-hidden touch-none overscroll-contain bg-[var(--bg)]"
      aria-hidden="true"
    >
      {/* Texture */}
      <div className="grain absolute inset-0 opacity-[0.06] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(247,247,245,0.65) 1px, transparent 1px)",
          backgroundSize: `${GRID_STEP}px ${GRID_STEP}px`,
        }}
      />

      {/* Ambient glow corners — .ambient-orb picks up the touch-device blur
          reduction already defined in globals.css for free */}
      <div className="ambient-orb absolute -top-[12%] -left-[10%] w-[60vw] h-[60vw] max-w-[26rem] max-h-[26rem] rounded-full bg-[var(--accent-cyan)] opacity-[0.12] blur-[110px] pointer-events-none" />
      <div className="ambient-orb absolute -bottom-[16%] -right-[10%] w-[55vw] h-[55vw] max-w-[24rem] max-h-[24rem] rounded-full bg-[var(--accent-volt)] opacity-[0.12] blur-[110px] pointer-events-none" />

      {/* Decorative wireframe cube — desktop/tablet only */}
      <div
        className="hidden sm:block absolute top-[10%] right-[8%] opacity-40 pointer-events-none animate-[floatY_7s_ease-in-out_infinite]"
        style={{ perspective: "600px" }}
      >
        <div
          className="relative animate-[spinCube_10s_linear_infinite]"
          style={{
            width: CUBE_SIZE,
            height: CUBE_SIZE,
            transformStyle: "preserve-3d",
          }}
        >
          {CUBE_FACES.map((style, i) => (
            <div
              key={i}
              className="absolute inset-0 border border-[var(--accent-volt)] opacity-30"
              style={style}
            />
          ))}
        </div>
      </div>

      {/* Decorative orbit ring — desktop/tablet only */}
      <div className="hidden sm:block absolute bottom-[14%] left-[8%] w-16 h-16 rounded-full border border-dashed border-[var(--accent-cyan)] opacity-25 pointer-events-none animate-[ringSpin_14s_linear_infinite]" />

      {/* Corner HUD tags */}
      <span className="absolute top-6 left-6 sm:top-8 sm:left-8 font-mono text-[0.5625rem] sm:text-[0.625rem] uppercase tracking-[0.3em] text-[var(--text)] opacity-80">
        MN.SYS
      </span>
      <span className="absolute top-6 right-6 sm:top-8 sm:right-8 font-mono text-[0.5625rem] sm:text-[0.625rem] uppercase tracking-[0.3em] text-[var(--text)] opacity-80">
        NYC // Boot
      </span>

      {/* Center stage */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 sm:gap-7 px-6">
        <span className="flex items-center gap-2 font-mono text-[0.625rem] sm:text-xs uppercase tracking-[0.35em] text-[var(--accent-volt)]">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent-volt)] animate-pulse shrink-0"
            style={{ boxShadow: "0 0 8px var(--accent-volt)" }}
          />
          System Boot
        </span>

        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            className="w-[clamp(10rem,42vw,18rem)] h-[clamp(10rem,42vw,18rem)] -rotate-90"
          >
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
            <circle
              ref={ringRef}
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--accent-volt)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px var(--accent-volt))" }}
            />
          </svg>
          <span
            ref={countRef}
            className="absolute font-[family-name:var(--font-syne)] font-extrabold text-[clamp(3rem,13vw,8rem)] leading-none tracking-tighter text-[var(--text-contrast)] tabular-nums"
            style={{
              textShadow:
                "2px 0 var(--accent-cyan), -2px 0 var(--accent-violet)",
            }}
          >
            000
          </span>
        </div>

        {/* Boot diagnostic bargraph — reads as hardware POST/memory-check
            lights, not a music visualizer. Segments light up left to right
            with real progress; a cyan "read head" leads the volt trail. */}
        <div
          ref={segmentsRef}
          className="flex items-center gap-1"
          aria-hidden="true"
        >
          {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-3.5 sm:w-2 sm:h-4 rounded-[2px] border border-white/[0.14] transition-colors duration-150"
            />
          ))}
        </div>

        <span
          ref={statusRef}
          className="font-mono text-[0.625rem] sm:text-xs uppercase tracking-[0.3em] text-[var(--text)] opacity-80"
        >
          Initializing…
        </span>

        <div className="w-[clamp(12rem,60vw,20rem)] h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div
            ref={barRef}
            className="h-full w-full origin-left bg-[var(--accent-volt)]"
            style={{
              transform: "scaleX(0)",
              boxShadow: "0 0 10px var(--accent-volt)",
            }}
          />
        </div>
      </div>

      <span className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 font-mono text-[0.625rem] uppercase tracking-[0.4em] text-[var(--accent-volt)]">
        Mohamed Nagy — Portfolio
      </span>

      {/* Exit wipe: cyan sliver leads, volt curtain follows */}
      <div
        ref={cyanOverlayRef}
        className="absolute inset-0 bg-[var(--accent-cyan)] origin-bottom"
        style={{ transform: "scaleY(0)" }}
      />
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[var(--accent-volt)] origin-bottom"
        style={{ transform: "scaleY(0)" }}
      />
    </div>
  );
}

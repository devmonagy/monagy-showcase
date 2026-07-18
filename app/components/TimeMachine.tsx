"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";
import { SITE_VERSIONS } from "../data/content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollSmoother, useGSAP);
}

// closed → open (entrance plays) → closing (exit plays, still mounted) →
// closed (unmounted). The middle state exists so the exit timeline has
// live DOM to animate before React tears the overlay down.
type Phase = "closed" | "open" | "closing";

// Warp-streak palette — mostly starlight white/cyan with volt and violet
// glints, matching the site's accent hierarchy (violet = depth only).
const STAR_COLORS: [string, number][] = [
  ["rgb(247, 247, 245)", 0.45],
  ["rgb(51, 232, 255)", 0.25],
  ["rgb(214, 255, 63)", 0.18],
  ["rgb(139, 92, 246)", 0.12],
];

function pickStarColor() {
  let r = Math.random();
  for (const [color, weight] of STAR_COLORS) {
    r -= weight;
    if (r <= 0) return color;
  }
  return STAR_COLORS[0][0];
}

const ACCENTS = {
  volt: { color: "var(--accent-volt)", rgb: "214, 255, 63" },
  cyan: { color: "var(--accent-cyan)", rgb: "51, 232, 255" },
} as const;

export default function TimeMachine() {
  const [phase, setPhase] = useState<Phase>("closed");
  const shown = phase !== "closed";

  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // GSAP-tweened speed multiplier for the canvas streaks: spikes on open
  // (the "warp jump"), settles to a cruise, spikes again on close.
  const warp = useRef({ v: 1.5 });

  const close = useCallback(() => {
    setPhase((p) => (p === "open" ? "closing" : p));
  }, []);

  /* ---- Entrance / exit choreography ---------------------------------- */
  useGSAP(
    () => {
      const overlay = overlayRef.current;
      if (!overlay || phase === "closed") return;
      const q = gsap.utils.selector(overlay);
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (phase === "open") {
        if (reduced) {
          gsap.set(overlay, { opacity: 1 });
          return;
        }
        warp.current.v = 15;
        gsap.to(warp.current, { v: 1.5, duration: 2.4, ease: "power3.out" });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(
          overlay,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: "power1.out" },
          0,
        )
          .fromTo(
            q(".tm-gyro-inner"),
            { scale: 0.55, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.2, ease: "expo.out" },
            0.05,
          )
          .fromTo(
            q(".tm-floor-wrap"),
            { opacity: 0 },
            { opacity: 1, duration: 0.9 },
            0.15,
          )
          .fromTo(
            q(".tm-head-el"),
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.09, duration: 0.8 },
            0.25,
          )
          .fromTo(
            q(".tm-card"),
            { opacity: 0, z: 110, y: -30 },
            {
              opacity: 1,
              z: 0,
              y: 0,
              stagger: 0.15,
              duration: 0.9,
              ease: "power4.out",
            },
            0.4,
          )
          .fromTo(
            q(".tm-ui"),
            { opacity: 0 },
            { opacity: 1, duration: 0.5 },
            0.55,
          );
      } else {
        // phase === "closing"
        const done = () => setPhase("closed");
        if (reduced) {
          done();
          return;
        }
        gsap.to(warp.current, { v: 18, duration: 0.6, ease: "power2.in" });
        const tl = gsap.timeline({ onComplete: done });
        tl.to(
          q(".tm-card"),
          { opacity: 0, y: -24, stagger: 0.05, duration: 0.3, ease: "power2.in" },
          0,
        )
          .to(
            q(".tm-gyro-inner"),
            { scale: 1.18, opacity: 0, duration: 0.45, ease: "power2.in" },
            0,
          )
          .to(overlay, { opacity: 0, duration: 0.4, ease: "power1.in" }, 0.12);
      }
    },
    { dependencies: [phase] },
  );

  /* ---- Modal plumbing: scroll lock, inert background, Esc, focus ------ */
  useEffect(() => {
    if (!shown) return;

    // Desktop: freeze the smoother's render loop. Touch has no smoother —
    // the html overflow lock below covers it; both are released in cleanup
    // the moment the overlay starts closing.
    const smoother = ScrollSmoother.get();
    smoother?.paused(true);
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    // Keep tab focus + screen readers out of the covered page. `inert` is
    // a progressive enhancement (ignored where unsupported) — the Tab trap
    // below is the functional guarantee.
    const wrapper = document.getElementById("smooth-wrapper");
    const header = document.querySelector("header");
    const trigger = triggerRef.current;
    wrapper?.setAttribute("inert", "");
    header?.setAttribute("inert", "");

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const overlay = overlayRef.current;
      if (!overlay) return;
      const focusables = overlay.querySelectorAll<HTMLElement>(
        "a[href], button",
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && overlay.contains(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener("keydown", onKey);
      wrapper?.removeAttribute("inert");
      header?.removeAttribute("inert");
      html.style.overflow = prevOverflow;
      smoother?.paused(false);
      trigger?.focus({ preventScroll: true });
    };
  }, [shown, close]);

  /* ---- Canvas: warp-speed star streaks radiating from the portal ------ */
  useEffect(() => {
    if (!shown) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // DPR capped: streak lines don't need retina sharpness, and the fill
    // cost of a full-screen canvas doubles with the square of the ratio.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    // Polar particles: d is normalized distance from the portal center,
    // advanced multiplicatively so streaks accelerate outward like a
    // warp-field, with a slight angular drift for a vortex twist.
    const stars = Array.from({ length: 170 }, () => ({
      a: Math.random() * Math.PI * 2,
      d: Math.random() * 0.9,
      sp: 0.5 + Math.random(),
      c: pickStarColor(),
    }));

    const center = () => ({ cx: w / 2, cy: h * 0.42, maxR: Math.hypot(w, h) * 0.6 });

    if (reduced) {
      // Static starfield — no animation loop at all.
      const { cx, cy, maxR } = center();
      for (const s of stars) {
        ctx.globalAlpha = Math.min(1, s.d * 2) * 0.6;
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(s.a) * s.d * maxR,
          cy + Math.sin(s.a) * s.d * maxR,
          0.8 + s.d,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return () => window.removeEventListener("resize", resize);
    }

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      // Translucent fill instead of clearRect = free motion trails.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(5, 5, 7, 0.3)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const { cx, cy, maxR } = center();
      const wv = warp.current.v;
      for (const s of stars) {
        const d0 = s.d;
        s.d += (0.0009 + s.d * 0.014 * s.sp) * wv * dt;
        s.a += 0.0005 * wv * dt;
        const cos = Math.cos(s.a);
        const sin = Math.sin(s.a);
        ctx.globalAlpha = Math.min(1, s.d * 2.2) * 0.75;
        ctx.strokeStyle = s.c;
        ctx.lineWidth = 0.5 + s.d * 1.6;
        ctx.beginPath();
        ctx.moveTo(cx + cos * d0 * maxR, cy + sin * d0 * maxR);
        ctx.lineTo(cx + cos * s.d * maxR, cy + sin * s.d * maxR);
        ctx.stroke();
        if (s.d >= 1) {
          s.d = Math.random() * 0.12;
          s.a = Math.random() * Math.PI * 2;
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [shown]);

  return (
    <>
      {/* ---- Trigger: the chrono-dial ---------------------------------- */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setPhase((p) => (p === "closed" ? "open" : p))}
        aria-haspopup="dialog"
        aria-expanded={shown}
        aria-label="Open the Timeback Machine — explore previous versions of this site"
        className="tm-trigger group fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-[60] w-[3.25rem] h-[3.25rem] sm:w-14 sm:h-14 rounded-full"
      >
        <span
          aria-hidden="true"
          className="absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.25em] text-[var(--accent-volt)] opacity-0 translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 pointer-events-none"
        >
          Timeback Machine
        </span>
        <span className="tm-trigger-core relative block w-full h-full rounded-full transition-transform duration-300 group-hover:scale-110">
          <span
            aria-hidden="true"
            className="tm-glowpulse absolute -inset-2 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(214, 255, 63, 0.22) 0%, rgba(51, 232, 255, 0.1) 45%, transparent 70%)",
            }}
          />
          <span className="tm-orbit absolute inset-0 rounded-full border border-dashed border-[rgba(51,232,255,0.6)]" />
          <svg
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="absolute inset-[0.3rem] w-[calc(100%-0.6rem)] h-[calc(100%-0.6rem)]"
          >
            <circle
              cx="24"
              cy="24"
              r="19"
              fill="rgba(13, 13, 16, 0.85)"
              stroke="rgba(247, 247, 245, 0.18)"
              strokeWidth="1"
            />
            <g stroke="rgba(247, 247, 245, 0.35)" strokeWidth="1.5">
              <line x1="24" y1="8.5" x2="24" y2="12" />
              <line x1="24" y1="36" x2="24" y2="39.5" />
              <line x1="8.5" y1="24" x2="12" y2="24" />
              <line x1="36" y1="24" x2="39.5" y2="24" />
            </g>
            <g className="tm-hand-hr">
              <line
                x1="24"
                y1="24"
                x2="24"
                y2="15"
                stroke="var(--accent-cyan)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </g>
            <g className="tm-hand-min">
              <line
                x1="24"
                y1="24"
                x2="24"
                y2="10.5"
                stroke="var(--accent-volt)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
            <circle cx="24" cy="24" r="2" fill="var(--accent-volt)" />
          </svg>
        </span>
      </button>

      {/* ---- Overlay: the chrono wormhole ------------------------------ */}
      {shown && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Timeback Machine — previous versions of monagy.com"
          className={`tm-overlay fixed inset-0 z-[120] overflow-y-auto overflow-x-hidden overscroll-contain bg-[var(--bg)] ${
            phase === "closing" ? "pointer-events-none" : ""
          }`}
        >
          {/* Decor layers are `fixed` (the overlay itself is the scroll
              container and has no transform, so fixed still means the
              viewport) — on phones the card column can be taller than the
              screen, and the wormhole must stay put while it scrolls. */}
          <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />

          {/* Portal gyroscope. Outer div owns CSS centering; GSAP scales
              only .tm-gyro-inner; the rings/swirl spin via their own CSS
              keyframes — three transform systems, three elements. */}
          <div className="fixed left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 z-[1] pointer-events-none">
            <div className="tm-gyro-inner relative w-[72vmin] h-[72vmin] max-w-[46rem] max-h-[46rem]">
              <span className="tm-swirl" />
              <span className="tm-core" />
              <span className="tm-ring tm-ring-a" />
              <span className="tm-ring tm-ring-b" />
              <span className="tm-ring tm-ring-c" />
              <span className="tm-ring tm-ring-d" />
            </div>
          </div>

          {/* Synthwave floor + horizon */}
          <div className="tm-floor-wrap fixed inset-x-0 bottom-0 h-[56%] z-[2] pointer-events-none">
            <div className="tm-floor" />
            <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-[var(--bg)] via-[rgba(5,5,7,0.55)] to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(51,232,255,0.5)] to-transparent" />
          </div>

          {/* Overlay's own film grain — the site-wide layer sits below
              this z-index, so the texture is re-supplied here. */}
          <div className="grain grain-animated fixed inset-[-25%] z-[5] opacity-[0.05] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 min-h-full flex flex-col items-center justify-center gap-10 sm:gap-14 px-5 pt-24 pb-16">
            <div className="tm-head-flat text-center">
              <div className="tm-head-plane flex flex-col items-center gap-3">
                <span className="tm-head-el font-mono text-[0.625rem] sm:text-xs uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
                  {"// Timeback Machine"}
                </span>
                <h2 className="tm-head-el font-[family-name:var(--font-syne)] font-extrabold tracking-tight text-[var(--text-contrast)] text-[clamp(1.75rem,5.5vw,3.5rem)] leading-[1.05]">
                  This site has{" "}
                  <span className="text-[var(--accent-volt)]">past lives</span>.
                </h2>
                <p className="tm-head-el max-w-md text-sm sm:text-base text-[var(--text)] opacity-90">
                  You&apos;re on the newest build of monagy.com. Its earlier
                  selves are still broadcasting — pick a timeline and step
                  through.
                </p>
              </div>
            </div>

            <div className="tm-stage relative flex flex-col min-[900px]:flex-row items-center gap-12 min-[900px]:gap-14">
              <span
                aria-hidden="true"
                className="tm-ghost absolute left-1/2 -bottom-[16%] font-[family-name:var(--font-syne)] font-extrabold tracking-tighter leading-none text-[clamp(5rem,16vw,13rem)] text-outline opacity-40 select-none pointer-events-none"
              >
                REWIND
              </span>

              {SITE_VERSIONS.map((v) => {
                const accent = ACCENTS[v.accent];
                return (
                  <a
                    key={v.id}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tm-cardwrap group/card relative block w-[min(26rem,84vw)] min-[900px]:w-[min(30rem,40vw)]"
                    style={{ "--tm-accent": accent.color } as React.CSSProperties}
                  >
                    <span className="tm-card relative block">
                      <span
                        aria-hidden="true"
                        className="absolute -inset-6 rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover/card:opacity-70 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, rgba(${accent.rgb}, 0.22) 0%, transparent 70%)`,
                        }}
                      />
                      <span
                        className="tm-card-inner relative block rounded-xl overflow-hidden border bg-[var(--card-bg)]"
                        style={{
                          borderColor: `rgba(${accent.rgb}, 0.4)`,
                          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        <span className="flex items-center gap-1.5 px-3 py-2 bg-[var(--badge-bg)] border-b border-[var(--border-color)]">
                          <span className="w-2 h-2 rounded-full bg-[rgba(247,247,245,0.18)]" />
                          <span className="w-2 h-2 rounded-full bg-[rgba(247,247,245,0.18)]" />
                          <span className="w-2 h-2 rounded-full bg-[rgba(247,247,245,0.18)]" />
                          <span className="ml-2 font-mono text-[0.5625rem] tracking-wider text-[var(--text)] opacity-80">
                            {v.host}
                          </span>
                          <span
                            className="ml-auto font-mono text-[0.5rem] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded"
                            style={{
                              color: accent.color,
                              border: `1px solid rgba(${accent.rgb}, 0.4)`,
                            }}
                          >
                            Archived
                          </span>
                        </span>
                        <Image
                          src={v.image}
                          alt={`Screenshot of ${v.name} — version ${v.version} of monagy.com`}
                          width={v.width}
                          height={v.height}
                          sizes="(min-width: 900px) 30rem, 84vw"
                          className="w-full h-auto"
                        />
                        <span className="flex items-center gap-4 px-4 py-3.5">
                          <span
                            className="font-[family-name:var(--font-syne)] font-extrabold text-2xl leading-none"
                            style={{ color: accent.color }}
                          >
                            {v.version}
                          </span>
                          <span className="flex flex-col">
                            <span className="font-[family-name:var(--font-syne)] font-bold text-base text-[var(--text-contrast)] leading-tight">
                              {v.name}
                            </span>
                            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-[var(--text)] opacity-80">
                              {v.tag}
                            </span>
                          </span>
                          <span
                            className="ml-auto font-mono text-xs font-bold tracking-wider"
                            style={{ color: accent.color }}
                          >
                            VISIT ↗
                          </span>
                        </span>
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>

            <p className="tm-ui font-mono text-[0.625rem] uppercase tracking-[0.3em] text-[var(--text)] opacity-80 text-center">
              Chrono-Archive · 02 timelines on file · Portal stable
            </p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            aria-label="Close the Timeback Machine"
            className="tm-ui group/close fixed top-5 right-5 sm:top-7 sm:right-7 z-20 flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="hidden sm:block font-mono text-[0.625rem] uppercase tracking-[0.25em] text-[var(--text)] opacity-0 transition-opacity duration-300 group-hover/close:opacity-80"
            >
              Esc
            </span>
            <span className="w-11 h-11 rounded-full border border-[var(--border-color)] bg-[rgba(13,13,16,0.7)] grid place-items-center transition-colors duration-300 group-hover/close:border-[var(--accent-volt)]">
              <svg viewBox="0 0 16 16" className="w-4 h-4" aria-hidden="true">
                <path
                  d="M3 3 L13 13 M13 3 L3 13"
                  stroke="var(--text-contrast)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </button>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// Dot-grid geometry — must match the CSS background below: 34px tiles with
// each radial-gradient dot at its tile's center (17,17). Sparkles snap to
// these points so they read as grid dots lighting up, not loose particles.
const GRID_STEP = 34;
const GRID_DOT_OFFSET = 17;

interface Sparkle {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  radius: number;
  /** rgba prefix, e.g. "rgba(247,247,245," — alpha appended per frame */
  color: string;
  /** A few sparkles also throw a vertical micro-line that grows as it fades */
  line: boolean;
}

// Mostly grid-white so the effect stays ambient; the occasional volt/cyan
// glint ties it to the brand without turning the background into confetti.
// Accents deliberately outnumbered 5:2 — they carry far more perceived
// brightness against the near-black canvas than the white ones do.
const SPARKLE_COLORS = [
  "rgba(247,247,245,",
  "rgba(247,247,245,",
  "rgba(247,247,245,",
  "rgba(247,247,245,",
  "rgba(247,247,245,",
  "rgba(214,255,63,",
  "rgba(51,232,255,",
];

// 3D wireframe cube built from six bordered faces — CSS preserve-3d, no WebGL.
// Fixed size regardless of viewport, deliberately larger than the plain
// 9.375rem base: this is the ~1.25x scale it used to render at under the old
// 1920px fluid-root-scale breakpoint (see globals.css), kept as the
// permanent size by request after that breakpoint was fixed to stop
// firing inconsistently across browsers on ordinary 1080p monitors.
const CUBE_SIZE_REM = 9.375 * 1.25;
const HALF_REM = CUBE_SIZE_REM / 2;
const CUBE_FACES: React.CSSProperties[] = [
  { transform: `translateZ(${HALF_REM}rem)` },
  { transform: `rotateY(180deg) translateZ(${HALF_REM}rem)` },
  { transform: `rotateY(90deg) translateZ(${HALF_REM}rem)` },
  { transform: `rotateY(-90deg) translateZ(${HALF_REM}rem)` },
  { transform: `rotateX(90deg) translateZ(${HALF_REM}rem)` },
  { transform: `rotateX(-90deg) translateZ(${HALF_REM}rem)` },
];

export default function Backdrop3D() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<HTMLDivElement>(null);
  const sparkleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll-reactive sparkle engine. The canvas is deliberately NOT inside
  // the parallax-transformed grid wrapper: it's a plain viewport-fixed
  // layer, and sparkles live in raw screen coordinates. An earlier version
  // parented it inside the tweened layer and derived spawn positions from
  // the transform state — every way of reading that state back proved
  // fragile, and each miss showed up as glints silently drifting off-screen
  // the deeper the page was scrolled. Screen space has no transform to get
  // wrong. Alignment with the grid dots is done per-spawn instead, by
  // snapping against the grid layer's live bounding rect (see spawn()).
  // The rAF loop only runs while sparkles are alive — an idle page costs
  // nothing.
  useEffect(() => {
    const canvas = sparkleCanvasRef.current;
    const layer = gridLayerRef.current;
    if (!canvas || !layer) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // DPR capped at 2, not left uncapped: on a 3x-DPR phone or a wide 4K/8K
    // desktop monitor, the raw ratio would multiply the backing-store pixel
    // count (and the per-frame clear cost) far past what these soft 1-2px
    // glows can even show. Capping at 2 keeps retina/4K displays sharp
    // without paying for resolution the glow can't render anyway. Drawing
    // math below stays in logical (CSS) pixels — only the backing store and
    // context transform scale with DPR, via ctx.setTransform.
    let width = 0;
    let height = 0;
    // The fluid root scale (globals.css) grows every rem-based element on
    // 1920px+ viewports; glints sized in raw px would shrink relative to
    // everything around them, so they ride the same scale.
    let fluidScale = 1;
    const resize = () => {
      // Re-read DPR on every resize, not once at mount — dragging the window
      // between monitors with different pixel densities fires resize with a
      // new devicePixelRatio, and a stale ratio renders soft or wasteful.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fluidScale =
        parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 ||
        1;
    };
    resize();
    window.addEventListener("resize", resize);

    let sparkles: Sparkle[] = [];
    let rafId = 0;
    let running = false;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      sparkles = sparkles.filter((s) => ++s.life < s.maxLife);

      for (const s of sparkles) {
        const t = s.life / s.maxLife;
        // Quick flare-in, long fade-out — reads as a glint, not a blink
        const alpha = t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75;

        // The soft wide gradient alone was tuned by eye on one monitor and
        // came out too subtle on others — a low-alpha tint blended over
        // near-black gets crushed toward invisible by the weaker black
        // level / gamma curve common on ordinary office-grade panels,
        // even though it reads fine on a high-contrast display. shadowBlur
        // adds a second, concentrated halo that's a genuine light bloom
        // around the core rather than a gradient fade, so the glint stays
        // visibly bright regardless of the panel it's rendered on. Reset
        // after this shape so it can't bleed into the line stroke below.
        ctx.shadowBlur = s.radius * 8;
        ctx.shadowColor = `${s.color}${(0.85 * alpha).toFixed(2)})`;

        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 4);
        glow.addColorStop(0, `${s.color}${0.42 * alpha})`);
        glow.addColorStop(1, `${s.color}0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `${s.color}${0.92 * alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        if (s.line) {
          const len = (8 + 24 * t) * fluidScale;
          ctx.strokeStyle = `${s.color}${0.28 * alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - len);
          ctx.lineTo(s.x, s.y + len);
          ctx.stroke();
        }
      }

      if (sparkles.length) {
        rafId = requestAnimationFrame(tick);
      } else {
        running = false;
        ctx.clearRect(0, 0, width, height);
      }
    };

    const spawn = (count: number) => {
      // Sparkles spawn anywhere in the viewport — the canvas IS the
      // viewport, so no visibility math can go wrong. They still need to
      // land on grid dots, which live inside the parallax-translated layer:
      // its bounding rect gives the dot lattice's current screen offset, so
      // snapping happens directly in screen space. The rect reflects
      // whatever transform is actually painted this frame — nothing to read
      // back, nothing to get out of sync.
      const rect = layer.getBoundingClientRect();

      for (let i = 0; i < count && sparkles.length < 20; i++) {
        const rawX = Math.random() * width;
        const rawY = Math.random() * height;
        const x =
          Math.round((rawX - rect.left - GRID_DOT_OFFSET) / GRID_STEP) *
            GRID_STEP +
          GRID_DOT_OFFSET +
          rect.left;
        const y =
          Math.round((rawY - rect.top - GRID_DOT_OFFSET) / GRID_STEP) *
            GRID_STEP +
          GRID_DOT_OFFSET +
          rect.top;
        // One glint per dot at a time — stacked draws on the same point
        // compound their alphas into exactly the hot flash we're avoiding.
        if (sparkles.some((s) => s.x === x && s.y === y)) continue;
        sparkles.push({
          x,
          y,
          life: 0,
          maxLife: 40 + Math.random() * 35,
          // Slightly larger floor than before: a sub-1.5px dot anti-aliases
          // into a faint smudge on standard (non-Retina) 1x-DPR monitors —
          // very common on external desktop displays — even though it
          // renders crisp on a high-density laptop panel.
          radius: (1.3 + Math.random() * 0.9) * fluidScale,
          color:
            SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          line: Math.random() < 0.18,
        });
      }
      if (!running && sparkles.length) {
        running = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    // Fractional spawn budget keyed to scroll velocity: slow scrolling
    // trickles out single glints, a hard flick bursts a few at once.
    // Velocity comes from raw window scroll events, NOT from a
    // ScrollTrigger's getVelocity(): native scroll is the one signal
    // that's identical whether or not ScrollSmoother is smoothing the
    // page (the smoother consumes native scroll as its own input), so
    // desktop behaves exactly like the native-scrolling phone path.
    // Reading velocity through GSAP proved unreliable on the smoothed,
    // heavily-pinned desktop page — glints stopped past the Projects
    // pin — while phones, which never run the smoother, worked to the
    // footer the whole time.
    let budget = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = now - lastT;
      if (dt <= 0) return;
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      lastT = now;
      const velocity = Math.abs(dy / dt) * 1000; // px/second
      if (velocity < 60) return;
      budget += Math.min(1.5, velocity / 1600);
      const whole = Math.floor(budget);
      if (whole > 0) {
        budget -= whole;
        spawn(whole);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useGSAP(
    () => {
      // Depth parallax: far layers drift slower than near layers as the page
      // scrolls, selling the 3D feel without any per-frame JS math.
      gsap.to(".bd-far", {
        yPercent: -14,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "max",
          scrub: 1.2,
        },
      });
      gsap.to(".bd-near", {
        yPercent: -38,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "max",
          scrub: 0.8,
        },
      });
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ perspective: "1100px" }}
      aria-hidden="true"
    >
      {/* Ambient glow orbs — far layer */}
      <div className="ambient-orb bd-far absolute top-[-12%] left-[-8%] w-[46vw] h-[46vw] max-w-[40rem] max-h-[40rem] rounded-full bg-[var(--accent-violet)] opacity-[0.10] blur-[130px]" />
      <div className="ambient-orb bd-far absolute top-[38%] right-[-12%] w-[40vw] h-[40vw] max-w-[35rem] max-h-[35rem] rounded-full bg-[var(--accent-cyan)] opacity-[0.07] blur-[130px]" />
      <div className="ambient-orb bd-far absolute bottom-[-14%] left-[22%] w-[42vw] h-[42vw] max-w-[37.5rem] max-h-[37.5rem] rounded-full bg-[var(--accent-volt)] opacity-[0.06] blur-[140px]" />

      {/* Fine dot grid — far layer texture so black never reads as empty. */}
      <div ref={gridLayerRef} className="bd-far absolute inset-[-20%]">
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(247,247,245,0.65) 1px, transparent 1px)",
            backgroundSize: `${GRID_STEP}px ${GRID_STEP}px`,
          }}
        />
      </div>

      {/* Scroll-sparkle canvas — viewport-fixed, NOT inside the parallax
          wrapper above. Sparkles are positioned in screen space and snapped
          to the grid layer's live rect at spawn; keeping the canvas out of
          any transformed ancestor is what guarantees they can never drift
          off-screen at depth (see the sparkle engine effect). */}
      <canvas
        ref={sparkleCanvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Perspective grid floor — anchored low, fades upward */}
      <div
        className="bd-far absolute left-[-30%] right-[-30%] bottom-[-6%] h-[46vh] opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(214,255,63,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(214,255,63,0.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          transform: "rotateX(62deg)",
          transformOrigin: "bottom center",
          WebkitMaskImage:
            "linear-gradient(to top, black 20%, transparent 90%)",
          maskImage: "linear-gradient(to top, black 20%, transparent 90%)",
        }}
      />

      {/* Wireframe cube — near layer, top right. Outer div floats, inner
          div tumbles; nesting keeps both transforms from fighting. */}
      <div className="bd-near absolute top-[6%] right-[2%] sm:top-[10%] sm:right-[10%] scale-[0.55] sm:scale-100 origin-top-right animate-[floatY_9s_ease-in-out_infinite]">
        <div
          className="relative animate-[spinCube_32s_linear_infinite]"
          style={{
            width: `${CUBE_SIZE_REM}rem`,
            height: `${CUBE_SIZE_REM}rem`,
            transformStyle: "preserve-3d",
          }}
        >
          {CUBE_FACES.map((style, i) => (
            <div
              key={i}
              className="absolute inset-0 border border-[var(--accent-volt)] opacity-25"
              style={style}
            />
          ))}
        </div>
      </div>

      {/* Orbit rings — dashed borders make the spin visible. Near layer.
          Sized in rem (like the cube above) so they ride the fluid root
          scale on 1920px+ instead of staying pinned to fixed pixels. */}
      <div className="bd-near absolute top-[52%] left-[-6%] sm:left-[2%]">
        <div className="w-[18.75rem] h-[18.75rem] sm:w-[26.25rem] sm:h-[26.25rem] rounded-full border border-dashed border-[var(--accent-cyan)] opacity-20 animate-[ringSpin_22s_linear_infinite]" />
      </div>
      <div className="bd-near absolute bottom-[6%] right-[2%] sm:right-[8%]">
        <div className="w-[12.5rem] h-[12.5rem] sm:w-[17.5rem] sm:h-[17.5rem] rounded-full border border-dashed border-[var(--accent-violet)] opacity-25 animate-[ringSpinB_18s_linear_infinite]" />
      </div>

      {/* Floating accent shards — small near-layer geometry */}
      <div className="bd-near absolute top-[30%] left-[14%] w-3 h-3 bg-[var(--accent-volt)] opacity-40 rotate-45 animate-[floatY_7s_ease-in-out_infinite]" />
      <div className="bd-near absolute top-[68%] right-[24%] w-2 h-2 bg-[var(--accent-cyan)] opacity-40 rounded-full animate-[floatY_11s_ease-in-out_infinite]" />
      <div className="bd-near absolute top-[16%] left-[42%] w-2.5 h-10 bg-[var(--accent-violet)] opacity-25 rotate-[24deg] animate-[floatY_13s_ease-in-out_infinite]" />
    </div>
  );
}

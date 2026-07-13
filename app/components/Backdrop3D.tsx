"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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
const CUBE_SIZE = 150;
const HALF = CUBE_SIZE / 2;
const CUBE_FACES: React.CSSProperties[] = [
  { transform: `translateZ(${HALF}px)` },
  { transform: `rotateY(180deg) translateZ(${HALF}px)` },
  { transform: `rotateY(90deg) translateZ(${HALF}px)` },
  { transform: `rotateY(-90deg) translateZ(${HALF}px)` },
  { transform: `rotateX(90deg) translateZ(${HALF}px)` },
  { transform: `rotateX(-90deg) translateZ(${HALF}px)` },
];

export default function Backdrop3D() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<HTMLDivElement>(null);
  const sparkleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll-reactive sparkle engine. The canvas shares the grid's parallax
  // wrapper, so sparkles inherit the exact same transform and stay glued to
  // real dot positions with zero per-frame alignment math. The rAF loop only
  // runs while sparkles are alive — an idle page costs nothing.
  useEffect(() => {
    const canvas = sparkleCanvasRef.current;
    const layer = gridLayerRef.current;
    if (!canvas || !layer) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // DPR capped at 1: these are soft 1-2px glows on a background layer —
    // retina sharpness is invisible here and a 1.4x-viewport canvas at 2x
    // DPR would quadruple the pixels cleared every frame.
    let width = 0;
    let height = 0;
    const resize = () => {
      // offsetWidth/Height: layout size, unaffected by the parallax transform
      width = layer.offsetWidth;
      height = layer.offsetHeight;
      canvas.width = width;
      canvas.height = height;
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

        // Peak alphas kept low on purpose — against the near-black canvas a
        // background glint should sit just above the grid's own 0.09, never
        // competing with foreground text for attention.
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 4);
        glow.addColorStop(0, `${s.color}${0.18 * alpha})`);
        glow.addColorStop(1, `${s.color}0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `${s.color}${0.4 * alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        if (s.line) {
          const len = 8 + 24 * t;
          ctx.strokeStyle = `${s.color}${0.15 * alpha})`;
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
      // Spawn only inside the slice of this oversized layer that's actually
      // on screen: the layer extends 20% past the viewport on every side and
      // is translated by the parallax tween (read back as px via "y").
      const parallaxY = Number(gsap.getProperty(layer, "y")) || 0;
      const viewLeft = (width - window.innerWidth) / 2;
      const viewTop = (height - window.innerHeight) / 2 - parallaxY;

      for (let i = 0; i < count && sparkles.length < 20; i++) {
        const rawX = viewLeft + Math.random() * window.innerWidth;
        const rawY = viewTop + Math.random() * window.innerHeight;
        const x =
          Math.round((rawX - GRID_DOT_OFFSET) / GRID_STEP) * GRID_STEP +
          GRID_DOT_OFFSET;
        const y =
          Math.round((rawY - GRID_DOT_OFFSET) / GRID_STEP) * GRID_STEP +
          GRID_DOT_OFFSET;
        // One glint per dot at a time — stacked draws on the same point
        // compound their alphas into exactly the hot flash we're avoiding.
        if (sparkles.some((s) => s.x === x && s.y === y)) continue;
        sparkles.push({
          x,
          y,
          life: 0,
          maxLife: 40 + Math.random() * 35,
          radius: 1 + Math.random() * 0.8,
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
    let budget = 0;
    const trigger = ScrollTrigger.create({
      onUpdate(self) {
        const velocity = Math.abs(self.getVelocity());
        if (velocity < 60) return;
        budget += Math.min(1.5, velocity / 1600);
        const whole = Math.floor(budget);
        if (whole > 0) {
          budget -= whole;
          spawn(whole);
        }
      },
    });

    return () => {
      trigger.kill();
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
      <div className="bd-far absolute top-[-12%] left-[-8%] w-[46vw] h-[46vw] max-w-[640px] max-h-[640px] rounded-full bg-[var(--accent-violet)] opacity-[0.10] blur-[130px]" />
      <div className="bd-far absolute top-[38%] right-[-12%] w-[40vw] h-[40vw] max-w-[560px] max-h-[560px] rounded-full bg-[var(--accent-cyan)] opacity-[0.07] blur-[130px]" />
      <div className="bd-far absolute bottom-[-14%] left-[22%] w-[42vw] h-[42vw] max-w-[600px] max-h-[600px] rounded-full bg-[var(--accent-volt)] opacity-[0.06] blur-[140px]" />

      {/* Fine dot grid + scroll-sparkle canvas — far layer texture so black
          never reads as empty. One shared wrapper so the sparkles ride the
          same parallax transform as the dots they light up. */}
      <div ref={gridLayerRef} className="bd-far absolute inset-[-20%]">
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(247,247,245,0.65) 1px, transparent 1px)",
            backgroundSize: `${GRID_STEP}px ${GRID_STEP}px`,
          }}
        />
        <canvas
          ref={sparkleCanvasRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>

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
            width: CUBE_SIZE,
            height: CUBE_SIZE,
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

      {/* Orbit rings — dashed borders make the spin visible. Near layer. */}
      <div className="bd-near absolute top-[52%] left-[-6%] sm:left-[2%]">
        <div className="w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full border border-dashed border-[var(--accent-cyan)] opacity-20 animate-[ringSpin_22s_linear_infinite]" />
      </div>
      <div className="bd-near absolute bottom-[6%] right-[2%] sm:right-[8%]">
        <div className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] rounded-full border border-dashed border-[var(--accent-violet)] opacity-25 animate-[ringSpinB_18s_linear_infinite]" />
      </div>

      {/* Floating accent shards — small near-layer geometry */}
      <div className="bd-near absolute top-[30%] left-[14%] w-3 h-3 bg-[var(--accent-volt)] opacity-40 rotate-45 animate-[floatY_7s_ease-in-out_infinite]" />
      <div className="bd-near absolute top-[68%] right-[24%] w-2 h-2 bg-[var(--accent-cyan)] opacity-40 rounded-full animate-[floatY_11s_ease-in-out_infinite]" />
      <div className="bd-near absolute top-[16%] left-[42%] w-2.5 h-10 bg-[var(--accent-violet)] opacity-25 rotate-[24deg] animate-[floatY_13s_ease-in-out_infinite]" />
    </div>
  );
}

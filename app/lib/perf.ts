/**
 * Runtime performance tier.
 *
 * Every device split in this codebase used to key off FINE_POINTER_QUERY —
 * `(hover: hover) and (pointer: fine)`. That asks what the INPUT DEVICE is,
 * not what the hardware can do, so a 2017 office laptop on integrated
 * graphics answered it identically to a desktop with a discrete GPU and got
 * the full payload: ScrollSmoother transforming the entire document every
 * frame, three 130–140px blur orbs being parallaxed inside a fixed layer,
 * six perpetual compositor animations behind the page, and a hero entrance
 * that 3D-rotates text-stroked glyphs. All of the mitigations that already
 * existed for those costs sat behind `(pointer: coarse)` and could never
 * fire on a weak mouse-driven machine.
 *
 * This module supplies the missing axis: a "high"/"low" tier that touch
 * devices AND weak desktops both land in.
 *
 * The tier is decided ONCE, in a blocking inline script in <head>
 * (PERF_BOOT_SCRIPT below), so the attribute is on <html> before first paint
 * and CSS never has to flash the expensive styles first.
 *
 * It is deliberately never changed again for the life of the page. An
 * earlier version also ran a frame-rate watchdog that demoted mid-session
 * when it measured sustained drops — the idea being to catch a machine whose
 * static hints look fine but whose GPU can't keep up. In practice that meant
 * the site could rebuild its own scroll engine underneath someone who was
 * mid-scroll: ScrollSmoother torn down, every ScrollTrigger re-measured, the
 * grain and orbs and navbar all visibly changing at once. Measured on an
 * ordinary dev build, scroll frame rate swung between roughly 32 and 58fps
 * second to second, which is close enough to any sane threshold that healthy
 * machines would trip it on a transient hitch. A page that reorganises itself
 * while you read it is worse than one that is merely heavy, so the decision
 * is made before the first frame and then left alone.
 */

export type PerfTier = "high" | "low";

/** Attribute that carries the tier: <html data-perf="low">. */
const ATTR = "perf";

/** localStorage key holding the cached GPU verdict. See ensureGpuTier. */
const GPU_KEY = "mn-perf-gpu";

/**
 * Static detection, as a string because it runs as a blocking inline script
 * in <head> (see layout.tsx) — the same no-flash pattern theme toggles use.
 * Kept as the single source of truth: the module below never re-derives the
 * tier, it only ever reads the attribute this script wrote.
 *
 * Conservative on purpose. Everything here is a signal that the device is
 * either demonstrably modest or has told us it wants less work; anything
 * ambiguous stays "high". The known gap is a desktop with plenty of threads
 * and a weak integrated GPU: deviceMemory is Chromium-only and saturates at
 * 8, and hardwareConcurrency describes a CPU while this page is GPU-bound,
 * so such a machine passes every check here. Closing that needs a real
 * capability probe at boot, not a guess from a spec sheet.
 */
export const PERF_BOOT_SCRIPT = `(function(){try{
var d=document.documentElement,n=navigator,low=false,
mm=function(q){return window.matchMedia(q).matches};
if(mm('(prefers-reduced-motion: reduce)'))low=true;
if(mm('(hover: none)')||mm('(pointer: coarse)'))low=true;
var c=n.connection;
if(c&&c.saveData)low=true;
if(typeof n.deviceMemory==='number'&&n.deviceMemory<=4)low=true;
if(typeof n.hardwareConcurrency==='number'&&n.hardwareConcurrency<=4)low=true;
if(!low){try{if(localStorage.getItem('${GPU_KEY}')==='low')low=true;}catch(e){}}
d.setAttribute('data-${ATTR}',low?'low':'high');
}catch(e){document.documentElement.setAttribute('data-${ATTR}','high');}})();`;

/**
 * Reads the tier off the DOM rather than caching it in a module variable, so
 * there is exactly one place the answer lives and no copy that can drift.
 *
 * Defaults to "low" during SSR. That direction matters: the server can't
 * know the device, and guessing "high" would render the expensive path and
 * then tear it down on the weakest hardware, which is precisely the machine
 * that can least afford the extra work.
 */
export function getPerfTier(): PerfTier {
  if (typeof document === "undefined") return "low";
  return document.documentElement.getAttribute(`data-${ATTR}`) === "low"
    ? "low"
    : "high";
}

export function isLowPerf(): boolean {
  return getPerfTier() === "low";
}

/**
 * The static hints above describe a CPU. This page is bound by the GPU, and
 * the two are not correlated on a desktop: the machine this was diagnosed on
 * reports 8 threads and 8GB — sailing past every check above — while
 * rendering on Intel Iris Xe integrated graphics. It was being handed
 * ScrollSmoother, three 130-140px blur orbs and six perpetual compositor
 * animations, and it felt exactly like what it was: a weak GPU running the
 * maximum-cost path.
 *
 * WebGL's unmasked renderer string is the one signal that actually names the
 * hardware doing the compositing, so it's what gets asked. Note this is the
 * right question even on a hybrid-graphics laptop: if the browser has picked
 * the integrated GPU, then the integrated GPU is what paints this page, and
 * classifying by it is correct rather than pessimistic.
 *
 * Timing matters as much as the signal. Creating a WebGL context measured
 * 6-19ms on that same machine, which is far too much to put in front of
 * first paint in the blocking boot script — it would delay paint most on the
 * hardware least able to spare it. So the probe runs at module evaluation on
 * the client instead: after first paint, but before any component effect has
 * run, which means before ScrollSmoother is ever created and while the
 * preloader still covers the page. Nothing has scrolled and nothing has
 * pinned, so acting on the result is free of the mid-session teardown that
 * made the earlier frame-rate watchdog unshippable.
 *
 * The verdict is cached in localStorage so the boot script can apply it
 * before first paint on every subsequent load, and the probe never runs
 * twice on the same machine.
 */
function probeGpu(): PerfTier {
  let gl: WebGLRenderingContext | null = null;
  try {
    const canvas = document.createElement("canvas");
    // No powerPreference: the default is what the browser composites the
    // page with. Asking for "low-power" would name the integrated chip on a
    // machine that actually paints with a discrete card, which is precisely
    // how you'd wrongly demote a gaming desktop.
    gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    // No WebGL at all usually means software rendering or a disabled GPU
    // process — either way, not a machine to hand the expensive path to.
    if (!gl) return "low";

    const info = gl.getExtension("WEBGL_debug_renderer_info");
    // Some browsers mask the string (Safari, Firefox with resistFingerprinting).
    // Unknown is not evidence of weakness — leave the tier alone.
    if (!info) return "high";

    const renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));

    // Software rasterisers: no GPU acceleration at all.
    if (/swiftshader|llvmpipe|softpipe|basic render/i.test(renderer)) {
      return "low";
    }
    // Intel integrated graphics — HD, UHD and Iris (including Iris Xe).
    // Plain substring tests rather than a regex: an earlier version used
    // word-boundary escapes that were silently mangled into literal control
    // characters on the way into this file, leaving a pattern that compiled
    // fine and matched nothing. Intel's DISCRETE Arc cards carry none of
    // these names and correctly stay on the full path.
    const r = renderer.toLowerCase();
    if (
      r.includes("intel") &&
      (r.includes("hd graphics") ||
        r.includes("uhd graphics") ||
        r.includes("iris"))
    ) {
      return "low";
    }
    return "high";
  } catch {
    return "high";
  } finally {
    // Contexts are a limited per-browser resource; hand this one back rather
    // than leaving it for the GC to notice eventually.
    try {
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      /* nothing to release */
    }
  }
}

/**
 * Runs the GPU probe once per machine and records the verdict. Called at
 * module scope below so it lands before any component effect; safe to call
 * again, it no-ops once a verdict exists.
 */
export function ensureGpuTier(): void {
  if (typeof document === "undefined") return;
  // Already classified low by a static hint — nothing left to learn.
  if (isLowPerf()) return;

  let cached: string | null = null;
  try {
    cached = localStorage.getItem(GPU_KEY);
  } catch {
    /* private mode / storage blocked — fall through and probe */
  }
  // A cached verdict was already applied by the boot script before paint.
  if (cached === "low" || cached === "high") return;

  const verdict = probeGpu();
  try {
    localStorage.setItem(GPU_KEY, verdict);
  } catch {
    /* storage blocked: the probe just runs again next load */
  }
  if (verdict === "low") {
    document.documentElement.setAttribute(`data-${ATTR}`, "low");
  }
}

// Module scope, not a hook: this must resolve before SmoothScroll's effect
// decides whether to create the smoother, and module evaluation is the only
// point guaranteed to precede every component effect on the page.
ensureGpuTier();

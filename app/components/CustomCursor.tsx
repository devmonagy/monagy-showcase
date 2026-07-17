"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FINE_POINTER_QUERY } from "./SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

const HOVER_SELECTOR = "a, button, [role='button'], input, textarea, select";

// Elements marked data-cursor="drag" (the experience deck's cards) morph
// the ring into a labeled DRAG affordance — the native cursor is hidden
// site-wide on desktop (body cursor:none), so this ring is the only place
// a grab hint can live. Links INSIDE a draggable still win the plain
// hover state, checked first below.
type CursorMode = "default" | "hover" | "drag";

function modeFor(target: EventTarget | null): CursorMode | null {
  const el = target as HTMLElement | null;
  if (!el?.closest) return null;
  if (el.closest(HOVER_SELECTOR)) return "hover";
  if (el.closest("[data-cursor='drag']")) return "drag";
  return null;
}

// useSyncExternalStore, not useState+useEffect: setting state synchronously
// inside an effect body (the previous shape here) is a lint error
// (react-hooks/set-state-in-effect) precisely because it causes a
// throwaway extra render — but the naive fix of reading matchMedia
// straight in the render body would make the server's render (no
// `window`, always "disabled") disagree with the client's very first
// render, which IS real content (null vs. the cursor markup) and would
// trip a hydration mismatch. useSyncExternalStore is React's actual API
// for this exact "browser-only value, must not desync SSR from the
// client's first paint" case — getServerSnapshot supplies the SSR/first-
// paint answer, getSnapshot takes over once mounted, no extra render.
function subscribe(callback: () => void) {
  const mql = window.matchMedia(FINE_POINTER_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getSnapshot() {
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}
function getServerSnapshot() {
  return false;
}

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const enabled = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [mode, setMode] = useState<CursorMode>("default");

  useEffect(() => {
    if (!enabled) return;

    // Centering lives in GSAP (xPercent/yPercent), not Tailwind translate
    // classes: quickTo owns the transform, and a CSS -50% translate parsed
    // out of the matrix would be baked in as fixed pixels — wrong the moment
    // the ring scales on hover.
    gsap.set([dotRef.current, ringRef.current], {
      xPercent: -50,
      yPercent: -50,
    });

    const setDotX = gsap.quickTo(dotRef.current, "x", {
      duration: 0.1,
      ease: "power3.out",
    });
    const setDotY = gsap.quickTo(dotRef.current, "y", {
      duration: 0.1,
      ease: "power3.out",
    });
    const setRingX = gsap.quickTo(ringRef.current, "x", {
      duration: 0.45,
      ease: "power3.out",
    });
    const setRingY = gsap.quickTo(ringRef.current, "y", {
      duration: 0.45,
      ease: "power3.out",
    });

    const handleMove = (e: MouseEvent) => {
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
    };

    const handleOver = (e: MouseEvent) => {
      const m = modeFor(e.target);
      if (m) setMode(m);
    };
    const handleOut = (e: MouseEvent) => {
      if (modeFor(e.target)) setMode("default");
    };

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
    };
  }, [enabled]);

  // Feedback via transform scale only — the ring's width/height stay
  // static so state changes never touch the browser's layout engine, and the
  // whole cursor stays on the compositor. 1.75 scales the 32px ring to the
  // same 56px the old width/height transition landed on; drag mode goes
  // bigger still so the DRAG label inside stays legible.
  useGSAP(
    () => {
      if (!ringRef.current) return;
      gsap.to(ringRef.current, {
        scale: mode === "drag" ? 2.2 : mode === "hover" ? 1.75 : 1,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    },
    { dependencies: [mode, enabled] },
  );

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] w-2 h-2 rounded-full bg-[var(--accent-volt)] pointer-events-none mix-blend-difference"
      />
      {/* Static 32px box — hover growth is GSAP scale (see useGSAP above),
          never width/height, so the cursor can't cause layout work. The
          border style swap + label fade are CSS on elements GSAP never
          transforms (the ring's own transform is GSAP's; the class change
          touches border/opacity only). */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 z-[9999] w-8 h-8 rounded-full border border-[var(--accent-volt)] pointer-events-none mix-blend-difference ${
          mode === "drag" ? "border-dashed" : ""
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center font-mono font-bold text-[0.375rem] tracking-[0.2em] uppercase text-[var(--accent-volt)] transition-opacity duration-150 ${
            mode === "drag" ? "opacity-100" : "opacity-0"
          }`}
        >
          Drag
        </span>
      </div>
    </>
  );
}

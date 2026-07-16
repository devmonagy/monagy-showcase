"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FINE_POINTER_QUERY } from "./SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

const HOVER_SELECTOR = "a, button, [role='button'], input, textarea, select";

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
  const [isHovering, setIsHovering] = useState(false);

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
      if ((e.target as HTMLElement)?.closest?.(HOVER_SELECTOR)) {
        setIsHovering(true);
      }
    };
    const handleOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest?.(HOVER_SELECTOR)) {
        setIsHovering(false);
      }
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

  // Hover feedback via transform scale only — the ring's width/height stay
  // static so state changes never touch the browser's layout engine, and the
  // whole cursor stays on the compositor. 1.75 scales the 32px ring to the
  // same 56px the old width/height transition landed on.
  useGSAP(
    () => {
      if (!ringRef.current) return;
      gsap.to(ringRef.current, {
        scale: isHovering ? 1.75 : 1,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    },
    { dependencies: [isHovering, enabled] },
  );

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] w-2 h-2 rounded-full bg-[var(--accent-volt)] pointer-events-none mix-blend-difference"
      />
      {/* Static 32px box — hover growth is GSAP scale (see useGSAP above),
          never width/height, so the cursor can't cause layout work. */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9999] w-8 h-8 rounded-full border border-[var(--accent-volt)] pointer-events-none mix-blend-difference"
      />
    </>
  );
}

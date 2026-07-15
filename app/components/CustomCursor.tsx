"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const HOVER_SELECTOR = "a, button, [role='button'], input, textarea, select";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

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

"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

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

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] w-2 h-2 rounded-full bg-[var(--accent-volt)] pointer-events-none -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9999] rounded-full border border-[var(--accent-volt)] pointer-events-none -translate-x-1/2 -translate-y-1/2 mix-blend-difference transition-[width,height] duration-300 ease-out"
        style={{
          width: isHovering ? 56 : 32,
          height: isHovering ? 56 : 32,
        }}
      />
    </>
  );
}

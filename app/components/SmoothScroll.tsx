"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

// Shared device split: smoothing (and the ScrollTrigger pins that depend
// on it) only run on mouse-driven devices. Touch devices keep fully
// native scrolling — their compositor scroll is already smooth, and
// JS-driven smoothing there is what made pinned sections lag and
// flicker, while normalizeScroll's touch hijacking silently killed the
// projects row's native horizontal swipe.
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

export default function SmoothScroll({
  locked = false,
}: {
  /** Freezes scrolling while the preloader covers the mounted page. */
  locked?: boolean;
}) {
  const smootherRef = useRef<ScrollSmoother | null>(null);

  useEffect(() => {
    if (!window.matchMedia(FINE_POINTER_QUERY).matches) return;

    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.2,
      ignoreMobileResize: true,
    });
    smootherRef.current = smoother;

    // Section ScrollTriggers mount before the smoother re-parents the
    // page — re-measure everything against the final layout.
    ScrollTrigger.refresh();

    return () => {
      smootherRef.current = null;
      smoother.kill();
    };
  }, []);

  useEffect(() => {
    smootherRef.current?.paused(locked);
  }, [locked]);

  return null;
}

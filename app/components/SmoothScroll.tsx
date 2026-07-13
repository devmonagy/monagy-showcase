"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  // Mobile Safari/Chrome fire resize events as the address bar collapses
  // and expands during scroll — ScrollTrigger recalculates (and re-pins)
  // on every one by default. That mid-scroll churn is what made pinned
  // sections and reveal triggers unstable on phones: positions kept
  // getting recomputed against a viewport that was still settling, so
  // content stayed effectively undiscoverable until the browser chrome
  // finally stopped moving near the bottom of the page. This was
  // previously only set on ScrollSmoother's own config, which never runs
  // on touch devices — the one place that actually needed it had nothing.
  ScrollTrigger.config({ ignoreMobileResize: true });
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
  const isFineRef = useRef(false);

  useEffect(() => {
    isFineRef.current = window.matchMedia(FINE_POINTER_QUERY).matches;
    if (!isFineRef.current) return;

    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.2,
      ignoreMobileResize: true,
    });
    smootherRef.current = smoother;

    return () => {
      smootherRef.current = null;
      smoother.kill();
    };
  }, []);

  useEffect(() => {
    // Desktop: pause/resume the smoother's own render loop — its wrapper
    // is already position:fixed+overflow:hidden, so nothing scrolls while
    // paused regardless. Touch devices have no smoother to pause; they
    // rely solely on the preloader's own touch-action:none. An earlier
    // version also hard-locked document.documentElement's CSS overflow
    // here as a second line of defense — that's exactly the kind of state
    // that, if its release ever fails to fire on a real device for any
    // reason, leaves scrolling permanently dead with no way to recover.
    // Not worth it for a rare cosmetic edge case.
    smootherRef.current?.paused(locked);

    if (!locked) {
      // Every section's ScrollTrigger is created the instant it mounts —
      // which, now that the page renders behind the preloader, is before
      // fonts/layout have necessarily settled. Re-measure everything
      // against the final layout right as scrolling unlocks; otherwise
      // trigger start/end points stay pinned to whatever was on screen at
      // that first paint and every animation reads "late" by however far
      // the real layout drifted — which looks exactly like having to
      // scroll and scroll before content catches up. Waiting on
      // document.fonts.ready first avoids a second drift: custom fonts
      // swapping in after this refresh (common on a throttled mobile
      // connection) reflow text and silently invalidate the positions we
      // just measured.
      const refresh = () => requestAnimationFrame(() => ScrollTrigger.refresh());
      if (document.fonts?.ready) {
        document.fonts.ready.then(refresh);
      } else {
        refresh();
      }
    }
  }, [locked]);

  return null;
}

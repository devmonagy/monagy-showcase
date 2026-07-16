"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  // useGSAP registered alongside the rest: it accommodates cases where a
  // different gsap module instance ends up loaded (a real risk across
  // Next.js's server/client/chunk boundaries) by pointing the hook at
  // this exact core instance rather than whichever one @gsap/react
  // resolved at import time.
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, useGSAP);

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

// Single in-page navigation path for every nav surface (navbar, footer).
// Native hash jumps are wrong here twice over: inside ScrollSmoother's
// transformed wrapper they teleport with no smoothing, and pin-spacers
// shift sections' document positions so the jump doesn't even land where
// the section pins. On desktop this tweens the smoother's own scrollTop
// (the GSAP-documented anchor-nav pattern) rather than calling
// smoother.scrollTo(..., true): on page-length upward jumps — footer
// back to a top section — scrollTo teleported the native scroll while
// the smoothed transform froze at the old position, exactly the
// "doesn't smooth scroll up" bug. A fixed-duration tween of scrollTop
// IS the scroll, so the visual can never decouple from it, and
// overwrite:"auto" lets a second click cleanly take over mid-flight.
// smoother.offset() measures the live, pin-aware layout. Touch devices
// have no smoother — they fall back to native smooth scrolling, which
// is what their scroll pipeline uses everywhere else.
export function scrollToSection(href: string) {
  const smoother = ScrollSmoother.get();
  if (smoother) {
    const top =
      href === "#top"
        ? 0
        : gsap.utils.clamp(
            0,
            ScrollTrigger.maxScroll(window),
            smoother.offset(href, "top top"),
          );
    gsap.to(smoother, {
      scrollTop: top,
      duration: 1.1,
      ease: "power3.inOut",
      overwrite: "auto",
    });
  } else if (href === "#top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }
}

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
      // the real layout drifted — content stays invisible at its stale
      // (wrong) trigger position until something finally corrects it.
      //
      // A previous version gated this ENTIRELY behind document.fonts.ready
      // to also catch font-swap reflow — but on a real, possibly-throttled
      // mobile connection that promise can take several seconds to settle,
      // and scrolling is already unlocked well before then. The result:
      // sections stayed blank while scrolling through them, only
      // reappearing once fonts finally loaded and the delayed refresh
      // retroactively fired their reveals — which is exactly what a
      // screen recording of the bug showed happening.
      //
      // Fix: refresh immediately so the common case is correct from frame
      // one, then exactly two more passes tied to real, semantically
      // meaningful events — document.fonts.ready and window's load event
      // (fonts/images/subresources all finished) — rather than a handful of
      // arbitrary timers. Each refresh() forces a synchronous layout read
      // across every trigger on the page; on the weaker CPUs this bug
      // actually shows up on, firing that five-plus times in a few seconds
      // was itself real, avoidable jank stacked on top of the slow load
      // the user was already fighting.
      const refresh = () => ScrollTrigger.refresh();
      requestAnimationFrame(refresh);
      document.fonts?.ready?.then(refresh).catch(() => {});
      window.addEventListener("load", refresh);

      return () => {
        window.removeEventListener("load", refresh);
      };
    }
  }, [locked]);

  return null;
}

"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FINE_POINTER_QUERY } from "./SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// How far (px) the button may drift toward the cursor. Kept small on
// purpose — the pull should read as weight, not as the button escaping.
const MAX_PULL = 12;
// Fraction of the cursor's offset-from-center the button follows before
// the clamp kicks in.
const PULL_STRENGTH = 0.35;

interface MagneticLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Transform scale while hovered (GSAP-driven, replaces hover:scale-*) */
  hoverScale?: number;
  /** Degrees of tilt while hovered (replaces hover:-rotate-*) */
  hoverRotate?: number;
}

/**
 * Anchor with a magnetic cursor pull on fine-pointer devices. GSAP owns the
 * element's whole transform (pull, hover scale, hover tilt) — callers must
 * NOT put transform transitions or hover:scale/rotate classes on it, or CSS
 * would re-ease every per-frame GSAP write and the pull turns to sludge.
 * On touch / reduced-motion the effect never binds and this is a plain <a>.
 */
export default function MagneticLink({
  hoverScale = 1.05,
  hoverRotate = 0,
  children,
  ...anchorProps
}: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (!window.matchMedia(FINE_POINTER_QUERY).matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;

      // One elastic quickTo per axis handles both the follow and the
      // release: xTo(0) on leave springs back with the same overshoot, so
      // there's no second tween fighting the follower for x/y.
      const xTo = gsap.quickTo(el, "x", {
        duration: 1,
        ease: "elastic.out(1, 0.3)",
      });
      const yTo = gsap.quickTo(el, "y", {
        duration: 1,
        ease: "elastic.out(1, 0.3)",
      });

      // The pull cap rides the fluid root scale (globals.css) like the
      // sparkle engine does — a fixed 12px reads weaker on 1920px+ where
      // every rem-based element around it has grown. Re-read on each
      // enter so dragging the window between monitors stays correct.
      let maxPull = MAX_PULL;

      // Cache the layout box once per hover session instead of calling
      // getBoundingClientRect() on every mousemove. GSAP only ever writes
      // this element's `transform` (translate/scale/rotate), which never
      // invalidates layout, but a *forced* reflow doesn't care whose write
      // dirtied it — any other component's layout-affecting DOM write in
      // the same frame (ScrollTrigger, the cursor, etc.) makes the next
      // getBoundingClientRect() call synchronously recompute the whole
      // page's layout. Reading the rect once at rest (before any pull is
      // applied) and reusing it for the session turns a per-mousemove cost
      // into a per-hover one.
      let rect: DOMRect | null = null;

      const onMove = (e: MouseEvent) => {
        if (!rect) return;
        const clampPull = gsap.utils.clamp(-maxPull, maxPull);
        xTo(clampPull((e.clientX - (rect.left + rect.width / 2)) * PULL_STRENGTH));
        yTo(clampPull((e.clientY - (rect.top + rect.height / 2)) * PULL_STRENGTH));
      };
      const onEnter = () => {
        rect = el.getBoundingClientRect();
        maxPull =
          MAX_PULL *
          (parseFloat(getComputedStyle(document.documentElement).fontSize) /
            16 || 1);
        gsap.to(el, {
          scale: hoverScale,
          rotation: hoverRotate,
          duration: 0.3,
          ease: "power3.out",
          overwrite: "auto",
        });
      };
      const onLeave = () => {
        rect = null;
        xTo(0);
        yTo(0);
        gsap.to(el, {
          scale: 1,
          rotation: 0,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: ref },
  );

  return (
    <a ref={ref} {...anchorProps}>
      {children}
    </a>
  );
}

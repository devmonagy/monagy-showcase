"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import { SCRAMBLE_CHARS } from "./constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, useGSAP);
}

interface ScrambleLabelProps {
  text: string;
  /**
   * "enter" — decode once when scrolled into view.
   * "mount" — decode on mount after `delay` seconds; the hero kicker uses
   *           this to land inside the post-preloader choreography.
   */
  trigger: "enter" | "mount";
  /** Mount-mode start offset (seconds), for sequencing under a timeline. */
  delay?: number;
  className?: string;
}

/**
 * One-shot "decoding a transmission" text reveal — DescriptionReveal's
 * scramble, generalized for the small mono kicker labels that are the site's
 * native terminal voice. Uses the official ScrambleTextPlugin with the same
 * shared glyph set (fx/constants.ts) so both read as one system.
 *
 * Every placement is font-mono, so glyph churn causes zero layout jitter.
 * The animated span is aria-hidden with an sr-only twin carrying the real
 * text — screen readers never hear the scramble glyphs. Under
 * prefers-reduced-motion the final text just renders, no animation.
 */
export default function ScrambleLabel({
  text,
  trigger,
  delay = 0,
  className,
}: ScrambleLabelProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;

      // Same pacing curve as DescriptionReveal: longer text decodes a bit
      // slower so the effect stays legible, capped so nothing drags.
      const duration = Math.min(0.4 + text.length * 0.0045, 1.1);

      gsap.to(el, {
        duration,
        delay: trigger === "mount" ? delay : 0,
        ease: "power1.out",
        scrambleText: {
          text,
          chars: SCRAMBLE_CHARS,
          speed: 1,
        },
        ...(trigger === "enter"
          ? {
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                once: true,
              },
            }
          : {}),
      });
    },
    { scope: ref, dependencies: [text, trigger, delay] },
  );

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}

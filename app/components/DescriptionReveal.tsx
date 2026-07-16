"use client";

import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// Glyphs cycled during the scramble reveal — deliberately terminal/HUD
// flavored (brackets, slashes, binary) rather than plain alphanumerics, to
// read as "decoding a transmission" instead of a generic shuffle animation.
const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#01";

/**
 * Progressively reveals `text` left-to-right, showing scrambled glyphs for
 * not-yet-locked characters. Purely visual — the real text is always what
 * ends up on screen; this only controls what's displayed while `active`
 * is transitioning true. Skips straight to the final text under
 * prefers-reduced-motion.
 */
function useScrambleReveal(active: boolean, text: string) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    // Under reduced motion, leave `display` untouched (stays "") and let
    // the caller's own `scrambled || text` fallback show the real text
    // instantly — setting state synchronously in an effect body for this
    // branch would just be a same-tick round trip to the same result.
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    const state = { progress: 0 };
    // Longer descriptions decode a bit slower so the effect stays legible
    // rather than flashing past, but it's capped — nobody should wait over
    // a second for a tooltip.
    const duration = Math.min(0.4 + text.length * 0.0045, 1.1);

    const tween = gsap.to(state, {
      progress: 1,
      duration,
      ease: "power1.out",
      onUpdate: () => {
        const lockedCount = Math.floor(state.progress * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          if (i < lockedCount || text[i] === " ") {
            out += text[i];
          } else {
            out +=
              SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
        }
        setDisplay(out);
      },
      onComplete: () => setDisplay(text),
    });

    return () => {
      tween.kill();
    };
  }, [active, text]);

  return display;
}

interface DescriptionRevealProps {
  text: string;
  clampClassName: string;
  accent: string;
}

/**
 * A line-clamped paragraph whose truncation reads as a clickable link
 * ("···") rather than an inert ellipsis. Opening it decodes the full text
 * into a HUD-styled popover via a scramble reveal — on-brand with the
 * site's terminal/targeting-reticle motifs (Preloader's boot sequence,
 * the ghost index numerals, Backdrop3D's wireframe cube) rather than a
 * generic tooltip.
 *
 * Deliberately click/tap-to-toggle rather than hover-only: hover has no
 * touch equivalent, and a "link" that only works with a mouse would be
 * broken on exactly the devices (phones, tablets) most showcase visitors
 * actually carry.
 */
export default function DescriptionReveal({
  text,
  clampClassName,
  accent,
}: DescriptionRevealProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const scrambled = useScrambleReveal(open, text);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isFirstRender = useRef(true);

  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // Skip animating the closed state on mount — there's nothing to
      // visually settle from, and it avoided a pointer-events race this
      // used to have (the mount-time "closing" tween's onComplete used to
      // be what disabled hit-testing, so the panel was briefly clickable
      // and could swallow the trigger's own opening click). pointer-events
      // is now driven straight off `open` via className below instead.
      if (isFirstRender.current) {
        isFirstRender.current = false;
        gsap.set(panel, { autoAlpha: 0, y: 10, scale: 0.94 });
        return;
      }

      if (open) {
        gsap.fromTo(
          panel,
          reduced
            ? { autoAlpha: 0 }
            : { autoAlpha: 0, y: 14, scale: 0.92, transformOrigin: "bottom right" },
          reduced
            ? { autoAlpha: 1, duration: 0.15 }
            : {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                ease: "back.out(1.8)",
              },
        );
        if (!reduced && scanRef.current) {
          gsap.fromTo(
            scanRef.current,
            { yPercent: -20, autoAlpha: 0 },
            {
              yPercent: 220,
              autoAlpha: 1,
              duration: 0.7,
              ease: "power1.inOut",
              onComplete: () => gsap.set(scanRef.current, { autoAlpha: 0 }),
            },
          );
        }
      } else {
        gsap.to(panel, {
          autoAlpha: 0,
          y: reduced ? 0 : 10,
          scale: reduced ? 1 : 0.94,
          duration: reduced ? 0.1 : 0.25,
          ease: "power2.in",
        });
      }
    },
    { dependencies: [open], scope: wrapperRef },
  );

  return (
    <div ref={wrapperRef} className="relative">
      <p className={clampClassName}>{text}</p>

      {/* Fade mask blends the clamped text's last line into the trigger
          so "···" reads as its continuation, not a badge stuck on top. */}
      <span
        className="absolute bottom-0 right-0 h-[1.4em] w-14 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, var(--bg) 45%, transparent)",
        }}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Hide full description" : "Read full description"}
        className="group absolute bottom-0 right-0 font-mono font-bold tracking-widest cursor-pointer"
        style={{ color: accent }}
      >
        <span className="underline decoration-dotted underline-offset-4 opacity-90 group-hover:opacity-100 transition-opacity">
          ···
        </span>
      </button>

      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-label="Full project description"
        // pointer-events tracks `open` directly rather than through GSAP's
        // animation completion — see the useGSAP comment above for why.
        className={`invisible opacity-0 absolute bottom-full right-0 mb-3 z-30 w-72 sm:w-80 max-w-[85vw] rounded-lg p-4 overflow-hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{
          backgroundColor: "var(--card-bg)",
          border: `1px solid ${accent}`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)`,
        }}
      >
        {/* Corner brackets — same targeting-reticle language as the ghost
            index numerals and the hero badge's orbit ring. */}
        {(
          [
            ["top-0 left-0", "border-t-2 border-l-2"],
            ["top-0 right-0", "border-t-2 border-r-2"],
            ["bottom-0 left-0", "border-b-2 border-l-2"],
            ["bottom-0 right-0", "border-b-2 border-r-2"],
          ] as const
        ).map(([pos, edges]) => (
          <span
            key={pos}
            className={`absolute ${pos} ${edges} w-3 h-3 pointer-events-none`}
            style={{ borderColor: accent }}
            aria-hidden="true"
          />
        ))}

        {/* One-shot scanline sweep on open */}
        <div
          ref={scanRef}
          className="invisible absolute left-0 right-0 h-8 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, ${accent}33, transparent)`,
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2 mb-2.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <span
            className="font-mono text-[0.5625rem] uppercase tracking-[0.25em] opacity-70"
            style={{ color: accent }}
          >
            Full transmission
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="ml-auto font-mono text-xs opacity-50 hover:opacity-90 transition-opacity cursor-pointer"
            style={{ color: "var(--text)" }}
          >
            ✕
          </button>
        </div>

        <p className="relative text-xs sm:text-sm leading-relaxed text-[var(--text)]">
          {open ? scrambled || text : text}
        </p>
      </div>
    </div>
  );
}

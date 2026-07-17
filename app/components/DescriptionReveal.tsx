"use client";

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SCRAMBLE_CHARS } from "./fx/constants";
import { FINE_POINTER_QUERY } from "./SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

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

/**
 * Finds where the paragraph's last fully-visible line of text actually
 * ends, so the trigger can sit flush against the real last word instead
 * of pinned to the container's right edge — which left an awkward gap
 * whenever that line didn't happen to reach full width. Range.
 * getClientRects() gives the true glyph geometry per wrapped line
 * (unlike the paragraph's own box, which is one rect for the whole
 * clipped block); filtering to rects entirely inside the clipped box
 * excludes a line that's only partially peeking in at the very edge.
 * Re-measures on resize (viewport width drives the wrap) and once
 * webfonts finish loading (metrics can shift after the fallback font's
 * initial paint).
 */
function useLastLineEnd(
  paragraphRef: RefObject<HTMLParagraphElement | null>,
  text: string,
) {
  const [metrics, setMetrics] = useState<{ end: number; width: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const measure = () => {
      const p = paragraphRef.current;
      if (!p || !p.firstChild) return;
      const pRect = p.getBoundingClientRect();
      const range = document.createRange();
      // Whole-contents selection, not p.firstChild: the paragraph renders
      // per-word spans now (they index the flashlight beam's targets), so
      // the first child is an element, and the range must cover every
      // word/space node. getClientRects still yields one rect per inline segment in
      // document order — the last visible one's right edge is still the
      // last visible word's end. Zero-width rects (collapsed element
      // boundaries) are noise, not glyphs.
      range.selectNodeContents(p);
      const rects = Array.from(range.getClientRects()).filter(
        (r) => r.width > 0,
      );
      const visible = rects.filter((r) => r.bottom <= pRect.bottom + 1);
      const last = visible[visible.length - 1];
      if (!last) return;
      setMetrics({ end: last.right - pRect.left, width: pRect.width });
    };

    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [paragraphRef, text]);

  return metrics;
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
  const textRef = useRef<HTMLParagraphElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const popupTextRef = useRef<HTMLParagraphElement>(null);
  const brightRef = useRef<HTMLParagraphElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<{
    move: (i: number) => void;
    release: () => void;
  } | null>(null);
  const panelId = useId();
  const scrambled = useScrambleReveal(open, text);
  const lastLine = useLastLineEnd(textRef, text);

  // Both the clamped paragraph and the popover render the SAME word list
  // as indexed spans — word i outside IS word i inside, which is what the
  // flashlight beam below maps across. Splitting on single spaces keeps
  // the rendered text byte-identical to the plain string (spans + plain
  // space text nodes wrap exactly like raw text), and the offsets let the
  // popover keep the scramble decode by slicing the churning string
  // per-word inside stable spans.
  const words = useMemo(() => text.split(" "), [text]);
  const wordOffsets = useMemo(() => {
    const offsets: number[] = [];
    for (let i = 0, acc = 0; i < words.length; i++) {
      offsets.push(acc);
      acc += words[i].length + 1;
    }
    return offsets;
  }, [words]);

  // Flashlight word-tracking: hovering a word in the clamped text
  // (desktop, popover open) glides an accent-colored beam onto the SAME
  // word inside the popover — so when the eye hits the clamp's last
  // visible word, the light shows exactly where to carry on reading.
  // The outside text itself gets NO styling at all (by request — it
  // reads as plain text under the pointer); the popover carries the whole
  // show. The pointer handlers only forward a word index; everything
  // visual lives in the GSAP engine below.
  const onWordsOver = (e: React.PointerEvent<HTMLParagraphElement>) => {
    if (!open || !flashRef.current) return;
    const w = (e.target as HTMLElement).closest?.(
      "[data-w]",
    ) as HTMLElement | null;
    // Pointer over inter-word space: hold the beam where it is instead of
    // flickering it off between words.
    if (!w) return;
    flashRef.current.move(Number(w.dataset.w));
  };
  const onWordsLeave = () => flashRef.current?.release();

  // Any close path kills the light — a stale beam inside a hidden panel
  // would just reappear wrongly on the next open.
  useEffect(() => {
    if (!open) flashRef.current?.release();
  }, [open]);

  // The beam engine. One quickTo per axis is what makes the glide SMOOTH:
  // every new hovered word simply retargets the in-flight tween, so the
  // light carves a continuous path across the paragraph instead of
  // teleporting per word. Two layers ride the same coordinates —
  //   · a soft radial glow (transform x/y, compositor-only), and
  //   · an accent-colored twin of the text clipped by a circle
  //     (clip-path: circle(var(--drr) at var(--drx) var(--dry)) — CSS vars
  //     tweened by GSAP; clip-path is in the approved animatable set).
  // The base text dims while the light is on, so the beam reads as a
  // flashlight in a dark room, not a highlighter. Word centers come from
  // offsetLeft/offsetTop at pointerover — event-driven and word-coarse,
  // never a per-frame measurement (house rule is about mousemove paths).
  // Fine pointers only: no hover exists to drive it anywhere else.
  useGSAP(
    () => {
      if (!window.matchMedia(FINE_POINTER_QUERY).matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      const bright = brightRef.current;
      const glow = glowRef.current;
      const base = popupTextRef.current;
      if (!bright || !glow || !base) return;

      gsap.set(glow, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.6 });
      const xTo = gsap.quickTo(bright, "--drx", {
        duration: 0.45,
        ease: "power3.out",
      });
      const yTo = gsap.quickTo(bright, "--dry", {
        duration: 0.45,
        ease: "power3.out",
      });
      // The halo trails the clip circle by a breath (0.5 vs 0.45) — the
      // slight lag between the two layers is what sells "light swinging
      // across the page" over "two rectangles moving in lockstep".
      const gxTo = gsap.quickTo(glow, "x", {
        duration: 0.5,
        ease: "power3.out",
      });
      const gyTo = gsap.quickTo(glow, "y", {
        duration: 0.5,
        ease: "power3.out",
      });
      let lit = false;

      flashRef.current = {
        move(i) {
          // Measure the bright twin's own span — the clip circle's `at`
          // coordinates are relative to that element's box, so measuring
          // anything else could drift. The twin is inset-0 over the base,
          // so the glow (positioned in the shared stack) agrees too.
          const w = bright.querySelector<HTMLElement>(`[data-w="${i}"]`);
          if (!w) return;
          const x = w.offsetLeft + w.offsetWidth / 2;
          const y = w.offsetTop + w.offsetHeight / 2;
          if (!lit) {
            lit = true;
            // First contact: snap the position (quickTo's second arg sets
            // the start too) and grow the beam ON at the word — gliding in
            // from a stale corner would read as the light arriving late.
            xTo(x, x);
            yTo(y, y);
            gxTo(x, x);
            gyTo(y, y);
            gsap.to(bright, {
              "--drr": "52px",
              duration: 0.4,
              ease: "back.out(1.6)",
              overwrite: "auto",
            });
            gsap.to(glow, {
              opacity: 0.3,
              scale: 1,
              duration: 0.4,
              ease: "power2.out",
              overwrite: "auto",
            });
            gsap.to(base, {
              opacity: 0.45,
              duration: 0.45,
              ease: "power2.out",
              overwrite: "auto",
            });
          } else {
            xTo(x);
            yTo(y);
            gxTo(x);
            gyTo(y);
          }
        },
        release() {
          if (!lit) return;
          lit = false;
          gsap.to(bright, {
            "--drr": "0px",
            duration: 0.35,
            ease: "power2.in",
            overwrite: "auto",
          });
          gsap.to(glow, {
            opacity: 0,
            scale: 0.6,
            duration: 0.35,
            ease: "power2.in",
            overwrite: "auto",
          });
          gsap.to(base, {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
        },
      };

      return () => {
        flashRef.current = null;
      };
    },
    { scope: wrapperRef },
  );
  // +6px gap so the trigger doesn't crowd the last word. The Math.min is
  // a defensive backstop, not the primary guard against overflow — the
  // paragraph's own pr-10 (ProjectsSection) reserves 40px of width the
  // browser's text-wrapping can never fill, so lastLine.end is already
  // guaranteed to leave room for the ~31px-wide trigger. This just caps
  // it a couple px inside that reserved zone in case that padding value
  // and this trigger's rendered width (font, tracking, "···" itself)
  // ever drift out of sync with each other.
  const triggerLeft = lastLine
    ? Math.min(lastLine.end + 6, lastLine.width - 36)
    : null;

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

  // Rendered twice in the popover (base text + the flashlight's bright
  // twin) — one element array keeps the two layers character-identical by
  // construction, including mid-decode when each span shows its slice of
  // the churning scramble string.
  const popupWords = words.map((w, i) => (
    <Fragment key={i}>
      <span data-w={i}>
        {open && scrambled && scrambled !== text
          ? scrambled.slice(wordOffsets[i], wordOffsets[i] + w.length)
          : w}
      </span>
      {i < words.length - 1 ? " " : null}
    </Fragment>
  ));

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
    <div
      ref={wrapperRef}
      className="relative"
      style={{ "--dr-accent": accent } as React.CSSProperties}
    >
      <p
        ref={textRef}
        className={clampClassName}
        onPointerOver={onWordsOver}
        onPointerLeave={onWordsLeave}
      >
        {words.map((w, i) => (
          <Fragment key={i}>
            <span data-w={i}>{w}</span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </p>

      {/* text-xs/sm/base + !leading-relaxed here deliberately mirror the
          paragraph's own classes exactly (including the !important — see
          ProjectsSection's clampClassName comment for why plain
          leading-relaxed silently loses to text-base's bundled 1.5
          line-height at 900px+). The button is the paragraph's sibling,
          not its child, so it inherits nothing from it — without matching
          font-size/line-height, this rendered in the default inherited
          (larger, tighter-leading) box further up the tree, which
          visually sat lower than the paragraph's own last-line baseline
          despite both being bottom:0 in the same wrapper.

          left (not right-0) is set from useLastLineEnd: the trigger sits
          flush against the actual last word instead of pinned to the
          container's edge, which used to leave a variable gap whenever
          that line didn't reach full width. Falls back to right:0 for
          the one frame before the client-side measurement resolves. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Hide full description" : "Read full description"}
        className="group absolute bottom-0 text-xs sm:text-sm min-[900px]:text-base !leading-relaxed font-mono font-bold tracking-widest cursor-pointer"
        style={{
          color: accent,
          left: triggerLeft !== null ? `${triggerLeft}px` : undefined,
          right: triggerLeft === null ? 0 : undefined,
        }}
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

        {/* The flashlight stack — three layers sharing one coordinate
            space:
              1. glow: a soft accent radial halo BEHIND the text,
              2. base: the real text (dims while the light is on),
              3. bright: an aria-hidden accent-colored twin clipped to a
                 circle — only what's inside the beam shows.
            Base and twin render the SAME indexed word spans with the same
            type classes, so they overlay glyph-for-glyph; the decode still
            churns through both (each span shows its slice of the
            scrambling string), and the beam can land mid-decode. Hovering
            words inside the popover drives the same beam as hovering the
            clamped text outside. */}
        <div className="relative">
          <div ref={glowRef} aria-hidden="true" className="dr-flashlight-glow" />
          <p
            ref={popupTextRef}
            onPointerOver={onWordsOver}
            onPointerLeave={onWordsLeave}
            className="relative z-[1] text-xs sm:text-sm leading-relaxed text-[var(--text)]"
          >
            {popupWords}
          </p>
          <p
            ref={brightRef}
            aria-hidden="true"
            className="dr-flashlight-text absolute inset-0 z-[2] pointer-events-none text-xs sm:text-sm leading-relaxed"
            style={
              {
                "--drx": "0px",
                "--dry": "0px",
                "--drr": "0px",
              } as React.CSSProperties
            }
          >
            {popupWords}
          </p>
        </div>
      </div>
    </div>
  );
}

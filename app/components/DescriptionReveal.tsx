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
      // per-word spans now (for the word-lock highlight), so the first
      // child is an element, and the range must cover every word/space
      // node. getClientRects still yields one rect per inline segment in
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
  const hotWordRef = useRef<HTMLElement | null>(null);
  const srcWordRef = useRef<HTMLElement | null>(null);
  const panelId = useId();
  const scrambled = useScrambleReveal(open, text);
  const lastLine = useLastLineEnd(textRef, text);

  // Both the clamped paragraph and the popover render the SAME word list
  // as indexed spans — word i outside IS word i inside, which is what the
  // word-lock hover below maps across. Splitting on single spaces keeps
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

  // Word-lock: hovering a word in the clamped text (desktop, popover
  // open) locks onto the same word inside the popover — so when the eye
  // hits the clamp's last visible word, the highlight shows exactly where
  // to carry on reading. Class toggles on refs, not React state: this
  // runs on pointerover and shouldn't re-render two word lists per twitch.
  const releaseWordLock = () => {
    hotWordRef.current?.classList.remove("dr-word-hot");
    srcWordRef.current?.classList.remove("dr-word-src");
    hotWordRef.current = null;
    srcWordRef.current = null;
  };
  const onWordOver = (e: React.PointerEvent<HTMLParagraphElement>) => {
    if (!open) return;
    if (!window.matchMedia(FINE_POINTER_QUERY).matches) return;
    const src = (e.target as HTMLElement).closest?.(
      "[data-w]",
    ) as HTMLElement | null;
    // Pointer over inter-word space: keep the current lock instead of
    // flickering it off between words.
    if (!src || src === srcWordRef.current) return;
    const hot = popupTextRef.current?.querySelector<HTMLElement>(
      `[data-w="${src.dataset.w}"]`,
    );
    releaseWordLock();
    if (!hot) return;
    src.classList.add("dr-word-src");
    hot.classList.add("dr-word-hot");
    srcWordRef.current = src;
    hotWordRef.current = hot;
  };

  // Any close path drops the lock — a stale highlight inside a hidden
  // panel would just reappear wrongly on the next open.
  useEffect(() => {
    if (open) return;
    hotWordRef.current?.classList.remove("dr-word-hot");
    srcWordRef.current?.classList.remove("dr-word-src");
    hotWordRef.current = null;
    srcWordRef.current = null;
  }, [open]);
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
        onPointerOver={onWordOver}
        onPointerLeave={releaseWordLock}
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

        {/* Same indexed word spans as the clamped paragraph — the decode
            still churns (each span shows its slice of the scrambling
            string until it settles to the real text), but the spans stay
            stable so the word-lock highlight can land mid-decode too. */}
        <p
          ref={popupTextRef}
          className="relative text-xs sm:text-sm leading-relaxed text-[var(--text)]"
        >
          {words.map((w, i) => (
            <Fragment key={i}>
              <span data-w={i}>
                {open && scrambled && scrambled !== text
                  ? scrambled.slice(wordOffsets[i], wordOffsets[i] + w.length)
                  : w}
              </span>
              {i < words.length - 1 ? " " : null}
            </Fragment>
          ))}
        </p>
      </div>
    </div>
  );
}

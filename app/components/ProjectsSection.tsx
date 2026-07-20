"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PROJECTS } from "../data/content";
import MagneticLink from "./MagneticLink";
import DescriptionReveal from "./DescriptionReveal";
import GlitchText from "./fx/GlitchText";
import ScrambleLabel from "./fx/ScrambleLabel";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const SLIDE_TONES = [
  { accent: "var(--accent-volt)", ink: "var(--accent-volt-ink)" },
  { accent: "var(--accent-cyan)", ink: "var(--accent-cyan-ink)" },
];

// Pre-launch project tile — stands in for a screenshot when a project has
// no live site to capture yet. An interlocked N/M monogram (a stand-in for
// Namman Flooring's real mark until that asset lands in /public/assets) on
// a tiled-grout floor texture, since the client is a tile installer. Sits
// inside the same .proj-img-parallax wrapper as a real <Image> would, so
// the deck's scroll parallax and hover tone-wash treat it identically.
function ComingSoonArt({ accent }: { accent: string }) {
  return (
    <div className="proj-art absolute inset-0 flex items-center justify-center">
      <div className="proj-art-floor absolute inset-0" aria-hidden="true" />
      <div
        className="tm-glowpulse absolute w-[55%] aspect-square rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />
      <div className="relative w-[32%] aspect-square transition-transform duration-700 ease-out group-hover:scale-110">
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="#0a0a0c"
            stroke={accent}
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="50"
            r="39"
            fill="none"
            stroke="rgba(247,247,245,0.55)"
            strokeWidth="1.25"
          />
          <path
            d="M 27 65 L 39 33 L 50 57 L 61 33 L 73 65"
            fill="none"
            stroke="var(--text-contrast)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 24 72 L 76 28"
            stroke={accent}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="proj-art-scan absolute inset-0" aria-hidden="true" />
      <span
        className="absolute bottom-[11%] left-1/2 -translate-x-1/2 font-mono text-[0.5625rem] sm:text-[0.625rem] font-bold uppercase tracking-[0.35em]"
        style={{ color: accent }}
      >
        Coming Soon
      </span>
    </div>
  );
}

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Pin the section and drive the track horizontally from vertical
      // scroll, with a progress bar synced to the same distance — same
      // mechanism at every breakpoint. This is plain ScrollTrigger.pin with
      // no ScrollSmoother involved, so it rides native scroll/touch
      // directly; unlike the smoother, it never needs to intercept touch
      // events, which is what makes it safe to run on phones.
      const track = trackRef.current;
      const section = sectionRef.current;
      if (!track || !section) return;

      // scrollWidth deliberately gets the track's own padding-left added
      // back: trailing inline padding of an overflowing container isn't
      // part of its scrollable area, so the width-minus-viewport distance
      // alone ends the run with the last card flush against the browser
      // edge — while the first card starts a comfortable px-10 from it.
      // Reading the live computed padding keeps every breakpoint's value
      // (px-5/6/10) and stays correct through invalidateOnRefresh.
      const getScrollAmount = () => {
        const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        return Math.max(track.scrollWidth - window.innerWidth + pad, 0);
      };

      const tween = gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          // Named so Navbar can read this exact pin's live start/end and
          // light "Projects" in the nav for precisely this section's
          // pinned duration — the section never visually moves in the
          // viewport while pinned, so a viewport-center heuristic (what
          // every other nav link uses) would never fire for it.
          id: "projects-pin",
          trigger: section,
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      });

      // Per-slide media parallax riding the pin tween via containerAnimation:
      // each image pans xPercent -12 → 12 as its own slide traverses the
      // viewport, opposite to the track's travel. The pan lives on a wrapper
      // (never the <Image> — its transition-all would re-ease every scrub
      // write), pre-scaled 1.25 so a 12% shift stays inside the 12.5%
      // overhang and the frame edge never shows. Skipped under
      // prefers-reduced-motion; the pin itself is untouched either way.
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.utils.toArray<HTMLElement>(".proj-img-parallax").forEach(
          (media) => {
            gsap.fromTo(
              media,
              { xPercent: -12, scale: 1.25 },
              {
                xPercent: 12,
                scale: 1.25,
                ease: "none",
                scrollTrigger: {
                  trigger: media,
                  containerAnimation: tween,
                  start: "left right",
                  end: "right left",
                  scrub: true,
                },
              },
            );
          },
        );
      }

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="projects"
      ref={sectionRef}
      // pt clears the fixed navbar (h-16/h-20, i.e. 64/80px) with a small
      // buffer; pb clears the progress bar's own bottom-6/8/10 offset
      // below. min-h-screen + justify-center alone centers against the
      // *full* viewport with zero awareness of either fixed element,
      // which is what let the heading render underneath the navbar and
      // the button overlap the progress bar on shorter laptop viewports
      // (1366x768, 1024x768). Kept deliberately tight rather than
      // matching Hero's roomier py-24/28: at 1366x768 this section's own
      // content (heading + pinned card) already fills nearly the whole
      // viewport height, so generous padding here pushes the section
      // taller than 100vh — since it's pinned, that overflow renders
      // below the fold for the entire pin duration, which is worse than
      // the original bug. See the description line-clamp and heading
      // margin below for the other half of the fix: bounding content
      // height, not just padding around it.
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20 sm:pt-24 pb-10 sm:pb-12 min-[900px]:pb-14"
    >
      {/* mb-32 at min-900 (the pre-fix value) ate 128px of the tight
          budget this section has to work with once the pin has to fit
          inside a short laptop viewport (1366x768, 1024x768) — mb-8
          keeps a clear gap there without costing as much height. Once
          the viewport is wide (and, in practice, tall) enough to be a
          desktop monitor rather than a laptop, that budget pressure is
          gone, so min-[1800px] restores the original, roomier mb-32 gap
          instead of staying artificially tight. Deliberately NOT
          min-[1920px]: a real 1920-wide monitor's viewport can measure
          1920 in Chrome but ~1912 in Edge (scrollbar-gutter reservation
          differs — the exact issue globals.css's fluid-scale breakpoint
          had), so the *same monitor* would cross a 1920px threshold in
          one browser and not the other, landing back on the same
          inconsistent-spacing bug this file already fixed once. 1800px
          gives enough clearance that both browsers land on the same
          side of it on any real 1920+ display. */}
      <div className="px-5 sm:px-6 md:px-8 min-[900px]:px-10 mb-16 sm:mb-24 min-[900px]:mb-8 min-[1800px]:mb-32 flex items-end justify-between gap-6 max-w-content min-[900px]:max-w-none mx-auto min-[900px]:mx-0 w-full">
        <h2 className="font-[family-name:var(--font-syne)] font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tighter text-[var(--text-contrast)] leading-none">
          {/* One interference burst as the heading lands in view — same
              signal language as the hero name's glitch loop. */}
          <GlitchText trigger="enter">
            Selected
            <br />
            <span className="text-outline-volt">Works</span>
          </GlitchText>
        </h2>
        <span className="hidden sm:flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.3em] text-[var(--text)] opacity-80 pb-2">
          <ScrambleLabel text="Scroll" trigger="enter" />
          <span aria-hidden="true">→</span>
        </span>
      </div>

      <div
        ref={trackRef}
        className="flex items-start px-5 sm:px-6 min-[900px]:px-10 gap-10 min-[900px]:gap-24"
      >
        {PROJECTS.map((project, i) => {
          const tone = SLIDE_TONES[i % SLIDE_TONES.length];
          const tiltEven = i % 2 === 0;

          return (
            <article
              key={project.id}
              className="project-slide relative shrink-0 w-[88vw] sm:w-[72vw] min-[900px]:w-[86vw] max-w-[60rem]"
            >
              {/* Ghost slide index — z-20 floats the hollow numeral OVER the
                  image corner (outline-only, so nothing underneath is
                  actually blocked) instead of burying it behind the frame */}
              <span
                className="absolute -top-12 sm:-top-20 min-[900px]:-top-28 -left-2 z-20 font-[family-name:var(--font-syne)] font-extrabold text-[6rem] sm:text-[10rem] min-[900px]:text-[13rem] leading-none tracking-tighter pointer-events-none select-none"
                style={{
                  color: "transparent",
                  WebkitTextStroke: `2px ${tone.accent}`,
                  opacity: 0.55,
                }}
                aria-hidden="true"
              >
                0{i + 1}
              </span>

              {/* minmax(0, ...) on BOTH tracks, not bare 1.15fr/1fr: a plain
                  fr track's automatic minimum is its own content's
                  min-content size (effectively its longest unbreakable
                  word at this font-size), not 0 — so a longer project
                  title/tag forced its OWN text column to claim more than
                  its fr-share, stealing width from the image column next
                  to it. Measured live: at an identical 920px viewport,
                  "Blog Engine" rendered its image at 408px while "APA Tax
                  Accounting Inc" (longest word "Accounting", wider at
                  text-5xl bold) rendered the SAME image column at only
                  327px — different projects at the same viewport,
                  purely from title-length differences. minmax(0, Nfr)
                  disables that content-based floor, so every slide's
                  columns are sized by the fr RATIO alone and text wraps
                  instead of pushing the image column around. */}
              <div className="relative z-10 grid min-[900px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 min-[900px]:gap-12 items-start">
                {/* Tilted screenshot frame. min-[900px]:max-h ties its
                    height to the viewport rather than purely to the
                    column's own vw-based width: at that breakpoint the
                    grid is a fixed row inside a pinned, full-bleed
                    section, so a wide-but-short viewport (1366x768,
                    1024x768) could otherwise derive a height from
                    aspect-[16/10] taller than the space actually
                    available. object-cover on the image inside means the
                    crop just gets a bit wider when this caps it — no
                    distortion. */}
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative block aspect-[16/10] min-[900px]:max-h-[46vh] rounded-2xl overflow-hidden proj-frame-mask transition-transform duration-500 ease-out will-change-transform ${
                    tiltEven
                      ? "rotate-[-2.5deg] hover:rotate-0"
                      : "rotate-[2.5deg] hover:rotate-0"
                  } hover:scale-[1.02]`}
                  style={{
                    boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
                  }}
                >
                  {project.status && (
                    <span
                      className="absolute top-4 left-4 z-10 text-[0.625rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded"
                      style={{ backgroundColor: tone.accent, color: tone.ink }}
                    >
                      {project.status}
                    </span>
                  )}
                  {/* GSAP pans this wrapper (see the parallax block above);
                      the Image keeps its CSS hover treatment on a separate
                      element so the two transform systems never meet. */}
                  <div className="proj-img-parallax absolute inset-0 will-change-transform">
                    {project.image ? (
                      project.imageFit === "contain" ? (
                        // Brand mark on its own solid background, not a
                        // 16:10 screenshot — object-cover's crop-to-fill
                        // zoomed straight past the ring into the wordmark
                        // below it. #010101 samples the logo's own flat
                        // background exactly, so the letterboxed sides
                        // this produces (the frame is wider than the
                        // square source) read as the mark's own canvas
                        // continuing, not an empty bar.
                        <div className="absolute inset-0 bg-[#010101] flex items-center justify-center">
                          <div className="relative w-[68%] sm:w-[58%] aspect-square transition-transform duration-700 ease-out group-hover:scale-105">
                            <Image
                              src={project.image}
                              alt={project.title}
                              fill
                              sizes="(min-width: 900px) 24vw, 60vw"
                              className="object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-700 ease-out"
                            />
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          sizes="(min-width: 900px) 40vw, 88vw"
                          className="object-cover object-center grayscale-[50%] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                        />
                      )
                    ) : (
                      <ComingSoonArt accent={tone.accent} />
                    )}
                  </div>
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color opacity-25 group-hover:opacity-0 transition-opacity duration-500"
                    style={{ backgroundColor: tone.accent }}
                  />
                  {/* Accent ring — its own overlay, not a `border` on the
                      frame: on real iOS Safari a border on the rotated,
                      layer-promoted frame paints with SQUARE corners,
                      poking past the rounded clip. And not an inset shadow
                      on the frame either: inset shadows paint under
                      children, and the inset-0 image above would cover the
                      ring entirely. This sits on top of everything (z-20,
                      above the z-10 status badge) and carries its own
                      radius, so the ring both survives WebKit compositing
                      and stays visible over the image. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-2xl pointer-events-none z-20"
                    style={{ boxShadow: `inset 0 0 0 2px ${tone.accent}` }}
                  />
                </a>

                {/* Slide copy */}
                <div className="flex flex-col gap-3 sm:gap-4 self-center">
                  <span
                    className="font-mono text-[0.625rem] sm:text-xs uppercase tracking-[0.25em]"
                    style={{ color: tone.accent }}
                  >
                    {project.subtitle}
                  </span>
                  {/* Hover: the card's accent floods the title behind a
                      slanted clip wipe (.proj-title-fill, globals.css)
                      while the GlitchText clones tear chromatically — one
                      gesture, two layers of the same signal language.
                      The hover host is an INNER inline-block span, never
                      width classes on the h3 itself: w-max here once made
                      the h3's grid min-content contribution the full
                      single-line title width, which stretched the text
                      column and crushed the image column beside it. An
                      inline-block shrink-wraps AND wraps normally, so the
                      title lays out exactly like plain text while the
                      hover zone still hugs the words. */}
                  <h3 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-4xl min-[900px]:text-5xl tracking-tight text-[var(--text-contrast)] leading-[1.05]">
                    {/* The title is a real link to the live app (same
                        destination as the screenshot frame and Launch App
                        button). Still the INNER inline-block host, never
                        width classes on the h3 — see the layout-regression
                        note above. Being an <a> also makes it GlitchText's
                        hover host (closest("a")) and grows the custom
                        cursor ring, so the fill+glitch+cursor all agree
                        this is clickable. */}
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.title} — open live app`}
                      className="proj-title relative inline-block"
                      style={
                        { "--proj-accent": tone.accent } as React.CSSProperties
                      }
                    >
                      <GlitchText trigger="hover">{project.title}</GlitchText>
                      <span className="proj-title-fill" aria-hidden="true">
                        {project.title}
                      </span>
                    </a>
                  </h3>
                  {/* Clamped to the same 3 lines at every breakpoint: the
                      whole card stack shares one height (the tallest
                      card), and this section is pinned full-bleed
                      everywhere — an unclamped/looser-clamped description
                      can push that shared height past the viewport
                      (phone, or the case that was actually missed: a
                      short laptop like 1366x768, 1024x768, or 1280x720,
                      where extra lines here were enough on their own to
                      push the Launch App button below the fold for the
                      entire pin). Text column at min-900 is still wide
                      enough per line that 3 lines reads as a complete
                      thought, not a harsh truncation. DescriptionReveal
                      is absolutely positioned for its trigger/popover, so
                      it costs zero extra layout height on top of that
                      budget — the "···" is a real clickable reveal
                      instead of an inert browser ellipsis.

                      max-h-[4.8em] + overflow-hidden clips at exactly ~3
                      leading-relaxed (1.625) lines WITHOUT line-clamp:
                      -webkit-line-clamp always paints its own native "..."
                      on top of whatever's inside the box, which showed up
                      as a second, disconnected ellipsis next to
                      DescriptionReveal's own fade+"···" trigger. Plain
                      max-height clipping has no such glyph, so the custom
                      trigger is the only truncation cue — 4.8 rather than
                      the exact 4.875 (3 x 1.625em) leaves a hair of margin
                      so a 4th line's ascenders/descenders can never peek
                      through at the clip edge.

                      !leading-relaxed (not plain leading-relaxed) because
                      min-[900px]:text-base bundles its own paired
                      line-height (1.5rem) the same way every Tailwind
                      text-size utility does, and being a responsive/
                      prefixed utility it's emitted after the unprefixed
                      leading-relaxed rule — so at 900px+ it silently won
                      the cascade and the real line-height was 1.5, not
                      1.625. max-h-[4.8em] assumed 1.625 at every
                      breakpoint; against the actual 1.5 it clipped a
                      hair into a 4th line instead of stopping just under
                      the 3rd, leaving slack under the last visible line
                      that pushed DescriptionReveal's trigger dots visibly
                      below the text's own baseline. Forcing
                      leading-relaxed to actually win makes the ratio
                      1.625 everywhere as intended, which is what the
                      4.8em math needs to be correct.

                      pr-10 reserves 40px the browser's own text-wrapping
                      will never fill: DescriptionReveal positions its
                      "···" trigger dynamically at the real last line's
                      end (not a fixed container-edge position), but if a
                      line happened to wrap right up to the box's true
                      edge there'd be nowhere left to put the ~31px-wide
                      trigger without it overlapping real text. This
                      padding guarantees that space exists structurally,
                      so the trigger only ever has to fill it, never
                      fight for it. */}
                  <DescriptionReveal
                    text={project.description}
                    clampClassName="text-xs sm:text-sm min-[900px]:text-base text-[var(--text)] !leading-relaxed max-w-md overflow-hidden max-h-[4.8em] pr-10"
                    accent={tone.accent}
                  />
                  <ul className="flex flex-wrap gap-1.5 font-mono text-[0.5625rem] sm:text-[0.625rem] uppercase tracking-wider text-[var(--text)]">
                    {project.tech.map((t) => (
                      <li
                        key={t}
                        className="px-2.5 py-1 rounded-full border border-[var(--border-color)]"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                  <MagneticLink
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    hoverRotate={-1}
                    aria-label={`Launch ${project.title}`}
                    className="mt-2 inline-flex w-max items-center gap-2 rounded-full px-5 py-3 font-mono text-[0.6875rem] font-bold uppercase tracking-widest"
                    style={{ backgroundColor: tone.accent, color: tone.ink }}
                  >
                    {/* Hover glitch rides the label span, not the anchor —
                        MagneticLink owns the anchor's transform entirely. */}
                    <GlitchText trigger="hover">Launch App</GlitchText>
                    <span aria-hidden="true">↗</span>
                  </MagneticLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

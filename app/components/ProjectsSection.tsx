"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PROJECTS } from "../data/content";
import MagneticLink from "./MagneticLink";
import DescriptionReveal from "./DescriptionReveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const SLIDE_TONES = [
  { accent: "var(--accent-volt)", ink: "var(--accent-volt-ink)" },
  { accent: "var(--accent-cyan)", ink: "var(--accent-cyan-ink)" },
];

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

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

      const progress = gsap.fromTo(
        progressRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getScrollAmount()}`,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        },
      );

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        progress.scrollTrigger?.kill();
        progress.kill();
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
          Selected
          <br />
          <span className="text-outline-volt">Works</span>
        </h2>
        <span className="hidden sm:flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.3em] text-[var(--text)] opacity-80 pb-2">
          Scroll
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
              className="project-slide relative shrink-0 w-[88vw] sm:w-[72vw] min-[900px]:w-[64vw] max-w-[60rem]"
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

              <div className="relative z-10 grid min-[900px]:grid-cols-[1.15fr_1fr] gap-6 min-[900px]:gap-12 items-start">
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
                  className={`group relative block aspect-[16/10] min-[900px]:max-h-[46vh] rounded-2xl overflow-hidden border-2 transition-transform duration-500 ease-out will-change-transform ${
                    tiltEven
                      ? "rotate-[-2.5deg] hover:rotate-0"
                      : "rotate-[2.5deg] hover:rotate-0"
                  } hover:scale-[1.02]`}
                  style={{
                    borderColor: tone.accent,
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
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      sizes="(min-width: 900px) 40vw, 88vw"
                      className="object-cover object-center grayscale-[50%] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                  </div>
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color opacity-25 group-hover:opacity-0 transition-opacity duration-500"
                    style={{ backgroundColor: tone.accent }}
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
                  <h3 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-4xl min-[900px]:text-5xl tracking-tight text-[var(--text-contrast)] leading-[1.05]">
                    {project.title}
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
                      through at the clip edge. */}
                  <DescriptionReveal
                    text={project.description}
                    clampClassName="text-xs sm:text-sm min-[900px]:text-base text-[var(--text)] leading-relaxed max-w-md overflow-hidden max-h-[4.8em]"
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
                    Launch App
                    <span aria-hidden="true">↗</span>
                  </MagneticLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Horizontal progress bar — pin runs at every breakpoint now, so
          this is the only affordance telling touch users there's no
          direct swipe here, scrolling drives it */}
      <div className="absolute bottom-6 sm:bottom-8 min-[900px]:bottom-10 left-5 sm:left-6 min-[900px]:left-10 right-5 sm:right-6 min-[900px]:right-10 h-[3px] rounded-full bg-white/10 overflow-hidden">
        <div
          ref={progressRef}
          className="h-full w-full origin-left bg-[var(--accent-volt)]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </section>
  );
}

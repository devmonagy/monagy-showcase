"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PROJECTS } from "../data/content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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
      // Desktop (≥900px): pin the section and drive the track horizontally
      // from vertical scroll, with a progress bar synced to the same
      // distance. Below 900px the track is a native scroll-snap carousel
      // instead — an earlier revision ran this pin on phones too, and the
      // full-viewport track translating sideways during iOS momentum
      // scroll is exactly what read as "the whole app slides left/right."
      // Scroll-jacked horizontal motion is a mouse-wheel idiom; on touch,
      // swiping the row is the platform-native gesture and composites on
      // the GPU with zero JS per frame.
      const mm = gsap.matchMedia();

      mm.add("(min-width: 900px)", () => {
        const track = trackRef.current;
        const section = sectionRef.current;
        if (!track || !section) return;

        const getScrollAmount = () =>
          Math.max(track.scrollWidth - window.innerWidth, 0);

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
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative py-20 sm:py-28 min-[900px]:py-0 min-[900px]:min-h-screen min-[900px]:flex min-[900px]:flex-col min-[900px]:justify-center overflow-hidden"
    >
      <div className="px-5 sm:px-6 md:px-8 min-[900px]:px-10 mb-16 sm:mb-24 min-[900px]:mb-32 flex items-end justify-between gap-6 max-w-6xl min-[900px]:max-w-none mx-auto min-[900px]:mx-0 w-full">
        <h2 className="font-[family-name:var(--font-syne)] font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tighter text-[var(--text-contrast)] leading-none">
          Selected
          <br />
          <span className="text-outline-volt">Works</span>
        </h2>
        <span className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text)] opacity-60 pb-2">
          Scroll
          <span aria-hidden="true">→</span>
        </span>
      </div>

      {/* Below 900px: native scroll-snap swipe carousel. overscroll-x-contain
          keeps a swipe past either end from chaining into horizontal drag on
          the page itself. At ≥900px the same element becomes the pinned,
          scroll-jacked track. */}
      <div
        ref={trackRef}
        className="flex items-start overflow-x-auto snap-x snap-mandatory overscroll-x-contain min-[900px]:overflow-visible min-[900px]:snap-none min-[900px]:overscroll-x-auto pb-6 min-[900px]:pb-0 px-5 sm:px-6 min-[900px]:px-10 gap-10 min-[900px]:gap-24"
      >
        {PROJECTS.map((project, i) => {
          const tone = SLIDE_TONES[i % SLIDE_TONES.length];
          const tiltEven = i % 2 === 0;

          return (
            <article
              key={project.id}
              className="project-slide relative shrink-0 snap-center w-[88vw] sm:w-[72vw] min-[900px]:w-[64vw] max-w-[960px]"
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
                {/* Tilted screenshot frame */}
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative block aspect-[16/10] rounded-2xl overflow-hidden border-2 transition-transform duration-500 ease-out will-change-transform ${
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
                      className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded"
                      style={{ backgroundColor: tone.accent, color: tone.ink }}
                    >
                      {project.status}
                    </span>
                  )}
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(min-width: 900px) 40vw, 88vw"
                    className="object-cover object-center grayscale-[50%] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color opacity-25 group-hover:opacity-0 transition-opacity duration-500"
                    style={{ backgroundColor: tone.accent }}
                  />
                </a>

                {/* Slide copy */}
                <div className="flex flex-col gap-3 sm:gap-4 self-center">
                  <span
                    className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em]"
                    style={{ color: tone.accent }}
                  >
                    {project.subtitle}
                  </span>
                  <h3 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-4xl min-[900px]:text-5xl tracking-tight text-[var(--text-contrast)] leading-[1.05]">
                    {project.title}
                  </h3>
                  {/* Clamped below the pinned breakpoint: the whole card
                      stack shares one height (the tallest card), and this
                      section is pinned full-bleed on every device now — an
                      unclamped description can push that shared height past
                      a short phone's viewport and clip the button below. */}
                  <p className="text-xs sm:text-sm min-[900px]:text-base text-[var(--text)] leading-relaxed max-w-md line-clamp-3 min-[900px]:line-clamp-none">
                    {project.description}
                  </p>
                  <ul className="flex flex-wrap gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--text)]">
                    {project.tech.map((t) => (
                      <li
                        key={t}
                        className="px-2.5 py-1 rounded-full border border-[var(--border-color)]"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-max items-center gap-2 rounded-full px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-transform duration-200 hover:scale-105 hover:-rotate-1"
                    style={{ backgroundColor: tone.accent, color: tone.ink }}
                  >
                    Launch App
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Horizontal progress bar — desktop pinned mode only; the mobile
          carousel communicates position natively via the next card peeking
          in from the edge */}
      <div className="hidden min-[900px]:block absolute bottom-10 left-10 right-10 h-[3px] rounded-full bg-white/10 overflow-hidden">
        <div
          ref={progressRef}
          className="h-full w-full origin-left bg-[var(--accent-volt)]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </section>
  );
}

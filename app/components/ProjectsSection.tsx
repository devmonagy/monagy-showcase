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

const ACCENTS = ["var(--accent-volt)", "var(--accent-flux)", "var(--accent-cyan)"];

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop: pin the section and drive the track's horizontal position
      // from vertical scroll — the pinned-horizontal-scroll showcase.
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

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      // Mobile: no pin — the row is a native horizontal scroll-snap strip,
      // just fade the cards in as the section enters.
      mm.add("(max-width: 899px)", () => {
        gsap.fromTo(
          ".project-card",
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
          },
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative py-20 sm:py-28 px-4 sm:px-6 md:px-8 min-[900px]:py-0 min-[900px]:min-h-screen min-[900px]:flex min-[900px]:flex-col min-[900px]:justify-center overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full min-[900px]:max-w-none min-[900px]:px-8">
        <div className="flex items-center gap-4 mb-10 sm:mb-14">
          <h2 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-3xl md:text-4xl text-[var(--text-contrast)]">
            Some Things I&rsquo;ve Built
          </h2>
          <div className="h-px flex-1 bg-[var(--border-color)]" />
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory min-[900px]:overflow-visible min-[900px]:snap-none pb-6 min-[900px]:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 min-[900px]:mx-0 min-[900px]:px-8 gap-6 min-[900px]:gap-10"
      >
        {PROJECTS.map((project, i) => {
          const accent = ACCENTS[i % ACCENTS.length];

          return (
            <a
              key={project.id}
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card group shrink-0 snap-center w-[85vw] sm:w-[65vw] min-[900px]:w-[55vw] min-[900px]:max-w-[760px] rounded-2xl overflow-hidden border bg-[var(--card-bg)] flex flex-col"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="relative w-full h-[220px] sm:h-[320px] min-[900px]:h-[380px] overflow-hidden">
                {project.status && (
                  <div
                    className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded"
                    style={{ backgroundColor: accent, color: "var(--bg)" }}
                  >
                    {project.status}
                  </div>
                )}
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(min-width: 900px) 55vw, 85vw"
                  className="object-cover object-center grayscale-[60%] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-color opacity-30 group-hover:opacity-0 transition-opacity duration-500"
                  style={{ backgroundColor: accent }}
                />
              </div>

              <div className="p-5 sm:p-7 flex flex-col gap-3 flex-1">
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  {project.subtitle}
                </span>
                <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg sm:text-xl text-[var(--text-contrast)]">
                  {project.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed line-clamp-3">
                  {project.description}
                </p>
                <ul className="mt-auto flex flex-wrap gap-1.5 pt-2 font-mono text-[10px] text-[var(--text)] opacity-80">
                  {project.tech.map((t) => (
                    <li
                      key={t}
                      className="px-2 py-1 rounded-full border border-[var(--border-color)]"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

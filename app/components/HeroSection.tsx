"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BIO_PARAGRAPHS, SITE, TECH_STACK } from "../data/content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop: pin the hero for one viewport of scroll while the
      // headline/tagline/body reveal in scrub-driven stages, then release
      // into normal scroll.
      mm.add("(min-width: 900px)", () => {
        gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=100%",
            scrub: 1,
            pin: true,
            invalidateOnRefresh: true,
          },
        })
          .fromTo(
            ".hero-line",
            { yPercent: 110 },
            { yPercent: 0, stagger: 0.15, ease: "power4.out" },
          )
          .fromTo(
            ".hero-fade",
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, stagger: 0.08, ease: "power3.out" },
            "-=0.3",
          );
      });

      // Mobile: plain stagger-in on enter, no pin — avoids pinned-scroll
      // height/jank issues on small viewports.
      mm.add("(max-width: 899px)", () => {
        gsap.fromTo(
          ".hero-line",
          { yPercent: 110 },
          {
            yPercent: 0,
            stagger: 0.12,
            duration: 1,
            ease: "power4.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
          },
        );
        gsap.fromTo(
          ".hero-fade",
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
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
      id="about"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-8 py-28 sm:py-0 overflow-hidden"
    >
      <div className="absolute top-1/3 right-[-10%] w-[500px] h-[500px] bg-[var(--accent-flux)] opacity-[0.08] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[400px] h-[400px] bg-[var(--accent-volt)] opacity-[0.08] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <div className="overflow-hidden mb-3">
          <span className="hero-line inline-block font-mono text-xs sm:text-sm text-[var(--accent-volt)] tracking-widest uppercase font-semibold">
            Software Developer
          </span>
        </div>

        <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[15vw] sm:text-8xl md:text-9xl leading-[0.95] tracking-tighter text-[var(--text-contrast)]">
          <span className="overflow-hidden block">
            <span className="hero-line block">Mohamed</span>
          </span>
          <span className="overflow-hidden block">
            <span className="hero-line block">
              Nagy<span className="text-[var(--accent-volt)]">.</span>
            </span>
          </span>
        </h1>

        <div className="overflow-hidden mt-4 sm:mt-6">
          <p className="hero-line font-[family-name:var(--font-syne)] font-bold text-xl sm:text-2xl md:text-3xl text-[var(--accent-flux)] tracking-tight">
            {SITE.tagline}
          </p>
        </div>

        <div className="hero-fade mt-8 max-w-xl space-y-4 text-sm sm:text-base leading-relaxed text-[var(--text)]">
          {BIO_PARAGRAPHS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <ul className="hero-fade mt-6 flex flex-wrap gap-2 max-w-xl font-mono text-[11px] sm:text-xs">
          {TECH_STACK.map((tech) => (
            <li
              key={tech}
              className="px-3 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text)]"
            >
              {tech}
            </li>
          ))}
        </ul>

        <div className="hero-fade mt-8">
          <a
            href={SITE.resumeUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-[var(--accent-volt)] text-[var(--accent-volt-ink)] px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform duration-200"
          >
            Download Resume
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}

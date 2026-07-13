"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SITE, SOCIALS } from "../data/content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 12-ray starburst — rotates slowly behind the headline stack.
const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

export default function ContactSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".contact-reveal",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        },
      );

      // The big solid line gets its own scale-punch on top of the shared
      // rise — the section's one "wow" beat.
      gsap.fromTo(
        ".contact-punch",
        { scale: 0.8 },
        {
          scale: 1,
          duration: 1.2,
          ease: "back.out(1.4)",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        },
      );
    },
    { scope: sectionRef },
  );

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, {
      x: dx * 0.25,
      y: dy * 0.35,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 overflow-hidden"
    >
      {/* Rotating starburst behind the headline */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130vw] max-w-[900px] aspect-square pointer-events-none select-none opacity-[0.1]"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full animate-[spinSlow_50s_linear_infinite]"
        >
          {RAYS.map((deg) => (
            <path
              key={deg}
              d="M100 100 L95 8 L105 8 Z"
              fill="var(--accent-volt)"
              transform={`rotate(${deg} 100 100)`}
            />
          ))}
        </svg>
      </div>

      {/* Ambient corner glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[480px] max-h-[480px] rounded-full bg-[var(--accent-cyan)] opacity-[0.08] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[480px] max-h-[480px] rounded-full bg-[var(--accent-volt)] opacity-[0.08] blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-5 sm:px-6">
        <span className="contact-reveal inline-flex items-center gap-3 font-mono text-xs sm:text-sm text-[var(--accent-volt)] tracking-widest uppercase font-semibold mb-6">
          <span className="w-8 h-px bg-[var(--accent-volt)]" />
          Get In Touch
          <span className="w-8 h-px bg-[var(--accent-volt)]" />
        </span>

        <h2 className="contact-reveal font-[family-name:var(--font-syne)] font-extrabold tracking-tighter leading-[0.95]">
          <span
            className="block text-[clamp(1.9rem,6.5vw,4.5rem)] uppercase"
            style={{
              color: "transparent",
              WebkitTextStroke: "1.5px rgba(247,247,245,0.55)",
            }}
          >
            Got a project?
          </span>
          <span className="contact-punch block text-[clamp(3.4rem,13vw,10rem)] text-[var(--accent-volt)] uppercase">
            Let&rsquo;s Talk<span className="text-[var(--accent-cyan)]">.</span>
          </span>
        </h2>

        <p className="contact-reveal mt-6 max-w-lg text-sm sm:text-base text-[var(--text)] leading-relaxed">
          I&rsquo;m employed full-time and selective with freelance — but the
          right project always gets my attention. Pitch something
          interesting, or just talk shop.
        </p>

        {/* Giant magnetic gradient capsule */}
        <a
          href={`mailto:${SITE.email}`}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          className="contact-reveal group mt-10 sm:mt-14 inline-flex items-center gap-4 sm:gap-6 rounded-full pl-7 pr-3 py-3 sm:pl-12 sm:pr-4 sm:py-4 font-[family-name:var(--font-syne)] font-bold text-[clamp(0.95rem,3.2vw,1.6rem)] text-[var(--accent-volt-ink)] transition-shadow duration-300 hover:shadow-[0_0_70px_rgba(214,255,63,0.35)]"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-volt), var(--accent-cyan))",
          }}
        >
          {SITE.email}
          <span className="flex items-center justify-center w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-[var(--bg)] text-[var(--accent-volt)] text-lg sm:text-2xl rotate-45 group-hover:rotate-0 transition-transform duration-300">
            ↑
          </span>
        </a>

        {/* Meta strip: availability + socials */}
        <div className="contact-reveal mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text)]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-volt)] animate-pulse" />
            NYC · Select Freelance
          </span>
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent-volt)] transition-colors duration-200"
            >
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>

    </section>
  );
}

"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SITE } from "../data/content";
import Marquee from "./Marquee";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".contact-reveal",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
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
    gsap.to(el, { x: dx * 0.3, y: dy * 0.3, duration: 0.4, ease: "power2.out" });
  };

  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative py-24 sm:py-32 md:py-40 overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center opacity-[0.35] pointer-events-none">
        <Marquee items={["AVAILABLE FOR WORK"]} tone="flux" duration={26} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6">
        <span className="contact-reveal font-mono text-xs sm:text-sm text-[var(--accent-volt)] tracking-widest uppercase font-semibold mb-4">
          Get In Touch
        </span>

        <h2 className="contact-reveal font-[family-name:var(--font-syne)] font-extrabold text-[14vw] sm:text-7xl md:text-8xl tracking-tighter text-[var(--text-contrast)] leading-[1.0]">
          Say Hello<span className="text-[var(--accent-flux)]">.</span>
        </h2>

        <p className="contact-reveal mt-6 max-w-lg text-sm sm:text-base text-[var(--text)] leading-relaxed">
          Got a project in mind, or just want to talk shop? My inbox is
          always open.
        </p>

        <a
          href={`mailto:${SITE.email}`}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          className="contact-reveal mt-10 inline-flex items-center gap-3 rounded-full px-8 py-5 sm:px-10 sm:py-6 font-[family-name:var(--font-syne)] font-bold text-base sm:text-lg text-[var(--bg)]"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-volt), var(--accent-flux))",
          }}
        >
          {SITE.email}
        </a>
      </div>
    </section>
  );
}

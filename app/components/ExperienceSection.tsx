"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { EXPERIENCES } from "../data/content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ExperienceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  useGSAP(
    () => {
      gsap.fromTo(
        ".exp-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        },
      );
    },
    { scope: sectionRef },
  );

  const toggleFlip = (id: string) =>
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="relative py-20 sm:py-28 md:py-36 px-4 sm:px-6 md:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12 sm:mb-16">
          <h2 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-3xl md:text-4xl text-[var(--text-contrast)]">
            Experience
          </h2>
          <div className="h-px flex-1 bg-[var(--border-color)]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EXPERIENCES.map((exp, i) => {
            const tone = i % 2 === 0 ? "volt" : "flux";
            const accent =
              tone === "volt" ? "var(--accent-volt)" : "var(--accent-flux)";
            const isFlipped = !!flipped[exp.id];

            return (
              <div
                key={exp.id}
                className="exp-card perspective-1200 h-[380px] sm:h-[420px] group"
                onTouchStart={() => toggleFlip(exp.id)}
              >
                <div
                  className={`flip-card-inner relative w-full h-full ${
                    isFlipped ? "" : "group-hover:[transform:rotateY(180deg)]"
                  }`}
                  style={isFlipped ? { transform: "rotateY(180deg)" } : undefined}
                >
                  {/* Front face */}
                  <div
                    className="flip-card-face absolute inset-0 rounded-2xl p-6 sm:p-8 flex flex-col justify-between bg-[var(--card-bg)] border"
                    style={{ borderColor: accent }}
                  >
                    <div>
                      <span
                        className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: accent, color: "var(--bg)" }}
                      >
                        {exp.range}
                      </span>
                      <h3 className="mt-4 font-[family-name:var(--font-syne)] font-extrabold text-xl sm:text-2xl text-[var(--text-contrast)] leading-tight">
                        {exp.role}
                      </h3>
                      <a
                        href={exp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm text-[var(--text)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {exp.company}
                      </a>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed line-clamp-4">
                      {exp.summary}
                    </p>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text)] opacity-60">
                      Hover / tap for details →
                    </span>
                  </div>

                  {/* Back face */}
                  <div
                    className="flip-card-face flip-card-back absolute inset-0 rounded-2xl p-6 sm:p-8 flex flex-col overflow-y-auto bg-[var(--card-bg)] border"
                    style={{ borderColor: accent }}
                  >
                    <h4
                      className="font-[family-name:var(--font-syne)] font-bold text-sm uppercase tracking-wide mb-3"
                      style={{ color: accent }}
                    >
                      {exp.role}
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-[13px] text-[var(--text)] leading-relaxed">
                      {exp.details.map((d, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span style={{ color: accent }}>—</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {exp.skills.map((s) => (
                        <span
                          key={s}
                          className="font-mono text-[9px] px-2 py-1 rounded-full border border-[var(--border-color)] text-[var(--text)]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

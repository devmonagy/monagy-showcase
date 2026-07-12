"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NAV_LINKS, SOCIALS } from "../data/content";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function FooterSection() {
  const footerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".footer-reveal",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: footerRef.current, start: "top 90%" },
        },
      );
    },
    { scope: footerRef },
  );

  return (
    <footer
      ref={footerRef}
      className="relative border-t border-[var(--border-color)] pt-16 pb-10 px-4 sm:px-6 md:px-8 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div className="footer-reveal flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent-volt)]">
              Navigate
            </span>
            <ul className="flex flex-col gap-2 font-[family-name:var(--font-syne)] font-bold text-lg text-[var(--text-contrast)]">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="hover:text-[var(--accent-volt)] transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-reveal flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text)] opacity-60">
              Stack
            </span>
            <div className="flex flex-wrap gap-2 font-mono text-[11px] text-[var(--text)]">
              {["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP"].map(
                (tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-full border border-[var(--border-color)]"
                  >
                    {tech}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="footer-reveal flex flex-col gap-3 sm:items-end">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text)] opacity-60">
              Elsewhere
            </span>
            <div className="flex flex-col gap-2 font-mono text-xs sm:items-end">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-contrast)] hover:text-[var(--accent-volt)] transition-colors duration-200"
                >
                  {s.label} →
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-reveal w-full select-none pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 800 180"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="50%"
              y="60%"
              dominantBaseline="middle"
              textAnchor="middle"
              className="font-[family-name:var(--font-syne)] font-extrabold tracking-tighter"
              style={{ fontSize: "170px", fill: "var(--text-contrast)", opacity: 0.06 }}
            >
              MOHAMED NAGY
            </text>
          </svg>
        </div>

        <div className="footer-reveal flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border-color)] pt-8 font-mono text-[10px] tracking-wider text-[var(--text)] opacity-70">
          <span>© {new Date().getFullYear()} Mohamed Nagy — All Rights Reserved</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-volt)] animate-pulse" />
            Built with Next.js &amp; GSAP
          </span>
        </div>
      </div>
    </footer>
  );
}

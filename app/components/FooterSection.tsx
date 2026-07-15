"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { FOOTER_STACK, NAV_LINKS, SOCIALS } from "../data/content";
import { FINE_POINTER_QUERY, scrollToSection } from "./SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function FooterSection() {
  const footerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Desktop-only reveal — on touch the footer is visible from first
      // paint rather than gated on a ScrollTrigger firing.
      const mm = gsap.matchMedia();
      mm.add(FINE_POINTER_QUERY, () => {
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
      });
    },
    { scope: footerRef },
  );

  return (
    <footer
      ref={footerRef}
      className="relative border-t border-[var(--border-color)] pt-20 sm:pt-24 pb-10 px-5 sm:px-6 md:px-8 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div className="footer-reveal flex flex-col gap-3">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-[var(--accent-volt)]">
              Navigate
            </span>
            <ul className="flex flex-col gap-2 font-[family-name:var(--font-syne)] font-bold text-lg text-[var(--text-contrast)]">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="hover:text-[var(--accent-volt)] transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-reveal flex flex-col gap-3">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text)] opacity-80">
              Stack
            </span>
            {/* Mobile/tablet wraps the full list naturally; desktop
                (min-[900px]) forces FOOTER_STACK's own order into an
                explicit 3-on-top, 2-on-bottom grid, same pattern as the
                hero's tech tags. */}
            <div className="font-mono text-[0.6875rem] text-[var(--text)]">
              <div className="flex flex-wrap gap-2 min-[900px]:hidden">
                {FOOTER_STACK.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-full border border-[var(--border-color)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="hidden min-[900px]:flex min-[900px]:flex-col gap-2">
                <div className="flex gap-2">
                  {FOOTER_STACK.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-full border border-[var(--border-color)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {FOOTER_STACK.slice(3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-full border border-[var(--border-color)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="footer-reveal flex flex-col gap-3 sm:items-end">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text)] opacity-80">
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

        {/* Giant wordmark — echoes the navbar logo. Flex-centered IN FLOW:
            the container is symmetrically padded and mx-auto-centered, so a
            child that fits inside it centers exactly. (A w-screen breakout
            was 5px off-center — 100vw includes the scrollbar.) Sizes are
            clamped so the mark always fits the container at every width. */}
        <div className="footer-reveal select-none pointer-events-none flex justify-center leading-[0.8]">
          <span className="font-[family-name:var(--font-syne)] font-extrabold tracking-tighter text-[clamp(6rem,24vw,30rem)] leading-[0.8]">
            <span className="text-outline-volt">MN</span>
            <span className="text-[var(--accent-volt)]">.</span>
          </span>
        </div>

        <div className="footer-reveal flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border-color)] pt-8 font-mono text-[0.625rem] tracking-wider text-[var(--text)] opacity-80">
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

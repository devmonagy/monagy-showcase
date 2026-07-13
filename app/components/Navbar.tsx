"use client";

import { useEffect, useState } from "react";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { NAV_LINKS, SITE } from "../data/content";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(href === "#top" ? 0 : href, true, "top top");
    } else if (href === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border-color)]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 h-16 sm:h-20">
        <a
          href="#top"
          onClick={(e) => handleClick(e, "#top")}
          className="font-[family-name:var(--font-syne)] font-extrabold text-lg sm:text-xl tracking-tight text-[var(--text-contrast)]"
        >
          MN<span className="text-[var(--accent-volt)]">.</span>
        </a>

        <ul className="flex items-center gap-3 sm:gap-6 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text)]">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => handleClick(e, link.href)}
                className="hover:text-[var(--accent-volt)] transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={SITE.resumeUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[var(--accent-volt)] text-[var(--accent-volt-ink)] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-transform duration-200"
        >
          Resume
        </a>
      </nav>
    </header>
  );
}

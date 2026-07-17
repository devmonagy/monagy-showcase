"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import { NAV_LINKS, SITE, SOCIALS } from "../data/content";
import MagneticLink from "./MagneticLink";
import GlitchText, { playGlitchBurst } from "./fx/GlitchText";
import { SCRAMBLE_CHARS } from "./fx/constants";
import { FINE_POINTER_QUERY, scrollToSection } from "./SmoothScroll";
import { ENTRANCE_AT } from "./HeroSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, useGSAP);
}

// When the logo folds from "Mohamed Nagy." to "MN.", in seconds after
// mount: the hero name's last char locks in around ENTRANCE_AT + 1.4 and
// its depth echoes breathe in through ~+2.3 (see HeroSection) — starting
// the fold at +2.1 reads as the big name taking over from the small one:
// the navbar cedes the full name to the hero, keeping only the monogram.
const LOGO_FOLD_AT = ENTRANCE_AT + 2.1;

export default function Navbar() {
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const logoInnerRef = useRef<HTMLSpanElement>(null);
  const logoCyanRef = useRef<HTMLSpanElement>(null);
  const logoVioletRef = useRef<HTMLSpanElement>(null);
  const foldARef = useRef<HTMLSpanElement>(null);
  const foldBRef = useRef<HTMLSpanElement>(null);
  const linksUlRef = useRef<HTMLUListElement>(null);
  const activeLineRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const overlayTlRef = useRef<gsap.core.Timeline | null>(null);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      // Independent backup for the "nothing lit at the very top" rule,
      // driven straight off the browser's own scrollY rather than the
      // GSAP ScrollTrigger pipeline the magic-line logic uses below. Two
      // separate systems agreeing is what makes "always" actually true:
      // if the ScrollTrigger-driven check ever lags a frame behind (scroll
      // event batching, a pin mid-refresh, ScrollSmoother's own momentum
      // settling asymptotically toward but not instantly AT 0), this
      // still fires on every native scroll tick and forces the clear.
      if (window.scrollY <= 2) setActiveHref(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll lock while the mobile overlay is open. Effect-cleanup paired
  // (never a bare set) so a close by ANY path — link tap, hamburger,
  // unmount — always releases it.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [menuOpen]);

  useGSAP(
    () => {
      const header = headerRef.current;
      const foldA = foldARef.current;
      const foldB = foldBRef.current;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // ---- Functional, runs regardless of motion preference ----

      // Active-section tracking + the scroll-progress hairline share ONE
      // ScrollTrigger, read against raw scroll position every frame,
      // rather than one independent onToggle trigger per nav link. The
      // independent-triggers version measured each section's box with a
      // generic "top 50% / bottom 50%" viewport-center heuristic, which
      // is flat wrong for Projects (it's pinned — its box never moves in
      // the viewport while its own horizontal scrub runs, so that
      // heuristic could only ever catch the single instant its center
      // crossed 50%, not the whole pinned span) and was also unreliable
      // at creation time before every section's real layout/pins had
      // settled, which is what let Contact read as lit on a cold load.
      const aboutBounds = ScrollTrigger.create({
        trigger: "#about",
        start: "top top",
        end: "bottom top",
      });
      const experienceBounds = ScrollTrigger.create({
        trigger: "#experience",
        start: "top top",
        end: "bottom top",
      });
      // Contact has no upper bound short of the document end — it (and
      // the nav's last-visited state) should read as "current" through
      // the trailing Telemetry/Footer sections too, matching how a last
      // nav item conventionally stays lit to the bottom of the page.
      const contactBounds = ScrollTrigger.create({
        trigger: "#contact",
        start: "top top",
        end: "max",
      });

      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate(self) {
          gsap.set(progressRef.current, { scaleX: self.progress });

          const s = self.scroll();
          // Read live rather than cached: Projects' own pin trigger is
          // created by a sibling component that mounts (and registers
          // its ScrollTrigger) AFTER this effect runs, so getById would
          // return nothing if captured once up front.
          const projectsPin = ScrollTrigger.getById("projects-pin");

          // At rest on load (or scrolled back to the exact top), nothing
          // is "current" yet — the first couple pixels of scroll is what
          // lights About, by request. Matches the native-scroll backup
          // check in the other useEffect above (same threshold).
          if (s <= 2) {
            setActiveHref(null);
            return;
          }
          const ranges: { href: string; start: number; end: number }[] = [
            { href: "#about", start: aboutBounds.start, end: aboutBounds.end },
            {
              href: "#experience",
              start: experienceBounds.start,
              end: experienceBounds.end,
            },
            ...(projectsPin
              ? [
                  {
                    href: "#projects",
                    start: projectsPin.start,
                    end: projectsPin.end,
                  },
                ]
              : []),
            {
              href: "#contact",
              start: contactBounds.start,
              end: contactBounds.end,
            },
          ];
          const hit = ranges.find((r) => s >= r.start && s < r.end);
          if (hit) setActiveHref(hit.href);
        },
      });

      // Mobile overlay open/close timeline (played/reversed by state).
      // Built before the reduced-motion return: the menu itself is
      // functional — under that preference it snaps via progress() in the
      // state-driven hook below instead of animating.
      const overlay = overlayRef.current;
      if (overlay) {
        const tl = gsap.timeline({ paused: true });
        tl.set(overlay, { display: "block" })
          .fromTo(
            overlay,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.28, ease: "power2.out" },
          )
          .fromTo(
            ".mnav-link",
            { yPercent: 120 },
            {
              yPercent: 0,
              duration: 0.65,
              ease: "power4.out",
              stagger: 0.07,
            },
            0.06,
          )
          .fromTo(
            ".mnav-meta",
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.06 },
            0.3,
          );
        overlayTlRef.current = tl;
      }

      // ---- Decorative from here down ----

      if (reduceMotion) {
        // Static end state: monogram logo, everything visible, no motion.
        if (foldA) foldA.textContent = "";
        if (foldB) foldB.textContent = "";
        return;
      }

      // Load-in: the whole bar drops from above the viewport edge as the
      // preloader curtain clears (same mount-time-delay pattern as the
      // hero — no cross-component "preloader done" signal, see the
      // ENTRANCE_AT comment in HeroSection). Items then cascade in and
      // the link labels decode.
      gsap.set(header, { yPercent: -110 });
      gsap.set(".nav-item", { opacity: 0, y: -12 });

      const loadTl = gsap.timeline({ delay: ENTRANCE_AT - 0.05 });
      loadTl
        .to(header, {
          yPercent: 0,
          duration: 0.7,
          ease: "power4.out",
          // Leaving a settled transform on the header would make it the
          // containing block for any fixed descendant forever — clear it.
          onComplete: () => gsap.set(header, { clearProps: "transform" }),
        })
        .to(
          ".nav-item",
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.07 },
          0.25,
        )
        .call(
          () => {
            gsap.utils
              .toArray<HTMLElement>("[data-nav-label]")
              .forEach((el, i) => {
                gsap.to(el, {
                  duration: 0.6,
                  delay: i * 0.06,
                  ease: "none",
                  scrambleText: {
                    text: el.dataset.navLabel ?? el.textContent ?? "",
                    chars: SCRAMBLE_CHARS,
                    speed: 1,
                  },
                });
              });
          },
          undefined,
          0.35,
        );

      // ---- Logo morph: "Mohamed Nagy." ⇄ "MN." ----
      // ScrambleText tweens the middle letters to/from an empty string:
      // tweenLength shrinks the text as it churns through the glyph set,
      // so the surviving M / N / . slide together on the browser's own
      // inline layout — no measured x-offsets to drift out of sync. A
      // one-shot ~0.8s reflow in an isolated fixed header, not a per-frame
      // hot path.
      let foldedOnce = false;
      const fold = (isInitial = false) => {
        if (!foldA || !foldB) return;
        gsap.to(foldA, {
          duration: 0.8,
          ease: "power2.inOut",
          scrambleText: { text: "", chars: SCRAMBLE_CHARS, speed: 0.5 },
          overwrite: true,
        });
        gsap.to(foldB, {
          duration: 0.65,
          delay: 0.1,
          ease: "power2.inOut",
          scrambleText: { text: "", chars: SCRAMBLE_CHARS, speed: 0.5 },
          overwrite: true,
          onComplete: () => {
            foldedOnce = true;
            // "Monogram locked" punctuation — only on the initial timed
            // fold; on every hover round-trip it would wear out fast.
            if (
              isInitial &&
              logoInnerRef.current &&
              logoCyanRef.current &&
              logoVioletRef.current
            ) {
              playGlitchBurst(
                logoInnerRef.current,
                logoCyanRef.current,
                logoVioletRef.current,
              );
            }
          },
        });
      };
      const unfold = () => {
        if (!foldA || !foldB) return;
        gsap.to(foldA, {
          duration: 0.7,
          ease: "power2.out",
          scrambleText: { text: "ohamed ", chars: SCRAMBLE_CHARS, speed: 0.5 },
          overwrite: true,
        });
        gsap.to(foldB, {
          duration: 0.6,
          delay: 0.06,
          ease: "power2.out",
          scrambleText: { text: "agy", chars: SCRAMBLE_CHARS, speed: 0.5 },
          overwrite: true,
        });
      };

      const foldCall = gsap.delayedCall(LOGO_FOLD_AT, () => fold(true));

      // Desktop delight: hovering the monogram decodes the full name back
      // out; leaving folds it away again. Armed only after the first timed
      // fold so an early hover can't pre-empt the choreography.
      const logo = logoRef.current;
      let onLogoEnter: (() => void) | null = null;
      let onLogoLeave: (() => void) | null = null;
      if (logo && window.matchMedia(FINE_POINTER_QUERY).matches) {
        onLogoEnter = () => {
          if (foldedOnce) unfold();
        };
        onLogoLeave = () => {
          if (foldedOnce) fold();
        };
        logo.addEventListener("mouseenter", onLogoEnter);
        logo.addEventListener("mouseleave", onLogoLeave);
      }

      return () => {
        foldCall.kill();
        if (logo && onLogoEnter && onLogoLeave) {
          logo.removeEventListener("mouseenter", onLogoEnter);
          logo.removeEventListener("mouseleave", onLogoLeave);
        }
      };
    },
    { scope: rootRef },
  );

  // Drive the overlay timeline from state so every open/close path (tap,
  // link, escape-by-scroll) goes through one animation.
  useGSAP(
    () => {
      const tl = overlayTlRef.current;
      if (!tl) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.progress(menuOpen ? 1 : 0);
        return;
      }
      if (menuOpen) tl.timeScale(1).play();
      else tl.timeScale(1.6).reverse();
    },
    { dependencies: [menuOpen] },
  );

  // Magic line: glide the underline to the active desktop link. Measured
  // against the ul (offsetParent) on each change + on resize — never in a
  // per-frame path.
  useGSAP(
    () => {
      const line = activeLineRef.current;
      const ul = linksUlRef.current;
      if (!line || !ul) return;

      const place = (animate: boolean) => {
        if (!activeHref) {
          // No section reads as "current" (top of page) — hide the line
          // instead of leaving it parked under whatever was last active,
          // which otherwise kept glowing under "About" even at scrollY 0.
          if (animate) gsap.to(line, { opacity: 0, duration: 0.3 });
          else gsap.set(line, { opacity: 0 });
          return;
        }
        const link = ul.querySelector<HTMLElement>(`a[href="${activeHref}"]`);
        if (!link) return;
        // Rect math, not offsetLeft: the load-in tween leaves a transform
        // on each li, which silently makes the li the link's offsetParent
        // — offsetLeft then reads 0 for every link.
        const linkRect = link.getBoundingClientRect();
        const ulRect = ul.getBoundingClientRect();
        const vars = {
          x: linkRect.left - ulRect.left,
          width: linkRect.width,
          opacity: 1,
        };
        if (
          animate &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          gsap.to(line, { ...vars, duration: 0.45, ease: "power3.out" });
        } else {
          gsap.set(line, vars);
        }
      };

      place(true);
      const onResize = () => place(false);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    },
    { dependencies: [activeHref] },
  );

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    setMenuOpen(false);
    scrollToSection(href);
  };

  // Desktop nav-link hover: the label re-decodes in the terminal's voice.
  // Mono font, so the glyph churn causes zero layout jitter.
  const hoverScramble = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget.querySelector<HTMLElement>("[data-nav-label]");
    if (!el || gsap.isTweening(el)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(el, {
      duration: 0.5,
      ease: "none",
      scrambleText: {
        text: el.dataset.navLabel ?? "",
        chars: SCRAMBLE_CHARS,
        speed: 1.3,
      },
    });
  };

  return (
    <div ref={rootRef} className="contents">
      <header
        ref={headerRef}
        // transition-colors, NOT transition-all: GSAP owns this element's
        // transform for the load-in drop, and transition-all would re-ease
        // every GSAP transform write (house rule — see MagneticLink).
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${
          scrolled || menuOpen
            ? "bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border-color)]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-6 md:px-8 h-16 sm:h-20">
          {/* Morphing logo: server-renders as the full name, folds to the
              monogram after the hero entrance, decodes back out on hover
              (desktop). Screen readers get one stable label. */}
          <a
            href="#top"
            ref={logoRef}
            onClick={(e) => handleClick(e, "#top")}
            aria-label="Mohamed Nagy — back to top"
            className="relative font-[family-name:var(--font-syne)] font-extrabold text-lg sm:text-xl tracking-tight text-[var(--text-contrast)] whitespace-nowrap"
          >
            <span
              ref={logoCyanRef}
              aria-hidden="true"
              className="glitch-clone absolute inset-0 opacity-0 pointer-events-none select-none"
              style={{ color: "var(--accent-cyan)" }}
            >
              MN.
            </span>
            <span
              ref={logoVioletRef}
              aria-hidden="true"
              className="glitch-clone absolute inset-0 opacity-0 pointer-events-none select-none"
              style={{ color: "var(--accent-violet)" }}
            >
              MN.
            </span>
            <span ref={logoInnerRef} aria-hidden="true" className="relative block">
              {"M"}
              <span ref={foldARef}>{"ohamed "}</span>
              {"N"}
              <span ref={foldBRef}>{"agy"}</span>
              <span className="text-[var(--accent-volt)]">.</span>
            </span>
          </a>

          {/* Desktop links + magic line */}
          <ul
            ref={linksUlRef}
            className="relative hidden sm:flex items-center gap-6 font-mono text-xs uppercase tracking-widest text-[var(--text)]"
          >
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="nav-item">
                <a
                  href={link.href}
                  onClick={(e) => handleClick(e, link.href)}
                  onMouseEnter={hoverScramble}
                  className={`transition-colors duration-200 hover:text-[var(--accent-volt)] ${
                    activeHref === link.href
                      ? "text-[var(--accent-volt)]"
                      : ""
                  }`}
                >
                  <span data-nav-label={link.label}>{link.label}</span>
                </a>
              </li>
            ))}
            {/* Magic line — glides under the active section's link */}
            <span
              ref={activeLineRef}
              aria-hidden="true"
              className="absolute -bottom-1.5 left-0 h-[2px] w-8 bg-[var(--accent-volt)] opacity-0 pointer-events-none"
            />
          </ul>

          <div className="flex items-center gap-3">
            <MagneticLink
              href={SITE.resumeUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item hidden sm:inline-flex items-center gap-2 rounded-full bg-[var(--accent-volt)] text-[var(--accent-volt-ink)] px-4 py-2 font-mono text-[0.6875rem] font-bold uppercase tracking-widest"
            >
              {/* Hover glitch rides the label span, not the anchor —
                  MagneticLink owns the anchor's transform entirely. */}
              <GlitchText trigger="hover">Resume</GlitchText>
            </MagneticLink>

            {/* Mobile: hamburger → fullscreen overlay. CSS transitions are
                safe here — GSAP never touches these two bars. */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="nav-item sm:hidden relative flex flex-col items-center justify-center gap-[0.4375rem] w-10 h-10 -mr-2"
            >
              <span
                className={`block h-[2px] w-6 bg-[var(--text-contrast)] transition-transform duration-300 ${
                  menuOpen ? "translate-y-[0.28125rem] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[2px] w-6 bg-[var(--text-contrast)] transition-transform duration-300 ${
                  menuOpen ? "-translate-y-[0.28125rem] -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </nav>

        {/* Scroll-progress hairline — reads as the transmission's buffer
            filling as you move through the page. */}
        <span
          ref={progressRef}
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full h-[2px] origin-left scale-x-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, var(--accent-volt), var(--accent-cyan))",
          }}
        />
      </header>

      {/* Mobile fullscreen menu — a sibling of the header (never a child:
          the header's load-in transform would become this fixed layer's
          containing block). Solid background on purpose — no
          backdrop-filter, which is exactly the WebKit compositor cost that
          broke mobile scrolling once already (see RESOLUTION_FIXES.md). */}
      <div
        ref={overlayRef}
        className="sm:hidden fixed inset-0 z-40 hidden bg-[var(--bg)]"
      >
        <div className="flex h-full flex-col justify-between px-6 pt-28 pb-10">
          <nav aria-label="Mobile">
            <ul className="space-y-3">
              {NAV_LINKS.map((link, i) => (
                <li key={link.href} className="overflow-hidden">
                  {/* Fixed text-5xl (48px) clipped "Experience" — the
                      longest label — by 91px on a real 393px-wide iPhone
                      (measured: 436px needed vs 345px available), silently
                      cut off by this li's own overflow-hidden (which
                      exists for the stagger mask, not to hide overrun
                      text). min(clamp(...), calc(...)) is the same
                      hard-fit pattern as the hero name's mobile fix: the
                      clamp gives a pleasant size across ordinary phones,
                      and the calc term is a measured hard cap — 8.6 is
                      "Experience" in Syne extrabold/tracking-tighter's
                      width-per-font-size ratio (436px text portion ÷ 48px
                      font, plus buffer), 5rem is the reserved width for
                      the px-6 padding + numeral + gap, so the formula
                      guarantees fit at ANY viewport this overlay can
                      render at (sm:hidden, so up to ~640px) — including
                      edge cases like a 240px feature-phone width or a
                      280px folded-cover screen that were never explicitly
                      tested before. */}
                  <a
                    href={link.href}
                    onClick={(e) => handleClick(e, link.href)}
                    className="mnav-link flex items-baseline gap-4 font-[family-name:var(--font-syne)] font-extrabold text-[min(clamp(1.5rem,8.5vw,3rem),calc((100vw-5rem)/8.6))] tracking-tighter text-[var(--text-contrast)]"
                  >
                    <span className="font-mono text-xs font-bold text-[var(--accent-volt)]">
                      0{i + 1}
                    </span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-4">
            <a
              href={SITE.resumeUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="mnav-meta inline-flex items-center gap-3 rounded-full bg-[var(--accent-volt)] text-[var(--accent-volt-ink)] px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest"
            >
              Download Resume <span aria-hidden="true">↓</span>
            </a>
            <div className="mnav-meta flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.625rem] uppercase tracking-widest text-[var(--text)]">
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
            <a
              href={`mailto:${SITE.email}`}
              className="mnav-meta block font-mono text-[0.625rem] uppercase tracking-widest text-[var(--text)] opacity-80"
            >
              {SITE.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Preloader from "./components/Preloader";
import CustomCursor from "./components/CustomCursor";
import Backdrop3D from "./components/Backdrop3D";
import Navbar from "./components/Navbar";
import SmoothScroll from "./components/SmoothScroll";
import HeroSection from "./components/HeroSection";
import Marquee from "./components/Marquee";
import ExperienceSection from "./components/ExperienceSection";
import ProjectsSection from "./components/ProjectsSection";
import ContactSection from "./components/ContactSection";
import FooterSection from "./components/FooterSection";
import { TECH_STACK } from "./data/content";

// Code-split: this is the heaviest client bundle on the page (globe canvas
// math, Spotify polling, weather fetch, learning marquee) and, per the
// comment at its usage below, an explicitly lower-priority "bonus beat"
// below the fold — nothing above it depends on its JS. Splitting it into
// its own chunk keeps that weight off the critical path instead of
// bundled into the initial script the browser must parse/execute before
// hydration completes. ssr:false is correct here, not just faster: every
// data point it renders (weather, now-playing, NYC time) is client-fetched
// anyway, so there's no SEO-relevant markup to lose, and skipping SSR for
// it avoids a placeholder-vs-fetched-data hydration mismatch entirely.
const PersonalTelemetrySection = dynamic(
  () => import("./components/PersonalTelemetrySection"),
  { ssr: false },
);

// Touch-only mount delay for everything below the hero. A screen-recorded
// real iPhone showed the hero's char-flip entrance and its bio/tag/button
// reveal literally skipping frames — content snapping fully visible with
// no visible fade — instead of animating. Root cause: roughly ten
// components (Hero, Navbar, Backdrop3D, Experience, Projects, three
// Marquees, Contact, five DescriptionReveal instances) all register their
// GSAP setup (SplitText.create, ScrollTrigger.create, layout
// measurements) in the SAME mount tick, all fighting the hero for the
// same main-thread window a mid-tier phone can't keep up with — visible
// even in the preloader's own counter, which finished ~1s behind its
// nominal timing on that device. Desktop was verified clean at every
// tested resolution and needs no such gate.
//
// 5300ms matches HeroSection's own ENTRANCE_AT (2.75s) plus the ~2.5s its
// full choreography (char flip-up, bio/tag/button stagger, echo fade-in)
// takes to settle, plus real-device margin — not the theoretical minimum,
// since the recorded device was already running behind that minimum.
const MOBILE_DEFER_MS = 5300;

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showRest, setShowRest] = useState(false);

  // Safety net: the preloader's own GSAP timeline normally flips this via
  // onComplete, but a slow/busy real device is exactly the case where a
  // timeline can stall — and with nothing else to release it, that used to
  // mean the page stayed permanently hidden behind the curtain with
  // scrolling dead. This guarantees the reveal fires no matter what.
  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoaded(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  // Desktop flips immediately (same tick as mount, so there's no visible
  // change from today's always-eager render). Touch waits out
  // MOBILE_DEFER_MS. A plain setTimeout, not a "hero finished" event: this
  // codebase already learned that lesson once — a cross-component
  // completion signal for the preloader/hero handoff proved unreliable on
  // real mobile devices, which is exactly why ENTRANCE_AT itself is a flat
  // mount-time delay rather than an onComplete callback.
  useEffect(() => {
    const isTouch = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;
    // Both branches go through a timer (0ms for desktop, not a direct
    // same-tick setState) — functionally identical to flipping
    // immediately, since a 0ms timeout still fires before the next paint.
    const timer = window.setTimeout(
      () => setShowRest(true),
      isTouch ? MOBILE_DEFER_MS : 0,
    );
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <CustomCursor />

      {/* Site-wide film grain — above content, below the cursor. Oversized
          (inset:-25%) + .grain-animated so the grain churns like real film
          stock instead of sitting frozen; see globals.css for why transform
          steps, not background-position. */}
      <div className="grain grain-animated pointer-events-none fixed inset-[-25%] z-[100] opacity-[0.06]" />

      {!isLoaded && (
        <Preloader
          onComplete={() => {
            window.scrollTo(0, 0);
            setIsLoaded(true);
          }}
        />
      )}

      {/* The page mounts immediately UNDER the preloader (z-999), so slow
          devices pay the layout/hydration cost while the counter runs —
          the curtain then reveals a finished page instead of a blank
          frame. The hero delays its choreography to a mount-time constant
          matched to the preloader's exit (~2.75s — see ENTRANCE_AT in
          HeroSection) so the entrance plays right as the curtain clears,
          still without any cross-component "preloader done" signal, which
          proved unreliable on real mobile devices. Everything below the
          hero additionally waits out MOBILE_DEFER_MS on touch (see above)
          so ITS mount-time setup work doesn't compete with the hero's for
          the same frames — desktop still mounts all of it here, eagerly,
          unchanged. */}

      {/* Fixed 3D depth layer behind everything. Rendered outside the
          ScrollSmoother wrapper below: #smooth-content is moved via a
          CSS transform, which would otherwise become the containing
          block for these `fixed` layers and break them. */}
      <Backdrop3D />
      <Navbar />

      {/* ScrollSmoother's required DOM shape — only the actual
          scrollable page lives inside #smooth-content. */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main className="relative z-10">
            <HeroSection />
            {/* Gated behind showRest (see MOBILE_DEFER_MS above) — on
                touch this whole block simply isn't mounted, so none of
                its GSAP/ScrollTrigger/SplitText setup competes with the
                hero's entrance for the main thread. Desktop's showRest
                flips true in the same tick as mount, so this renders
                exactly as eagerly as before there. */}
            {showRest && (
              <>
                <Marquee
                  items={TECH_STACK}
                  tone="volt"
                  duration={20}
                  tilt={-2}
                />
                <ExperienceSection />
                {/* Desktop-only top clearance (className, NOT a wrapper div:
                    ScrollTrigger's pin-spacer around #projects re-parents
                    main's children, and inserting new siblings there makes
                    React's insertBefore throw): Projects below is min-h-screen
                    with vertically centered content, so its heading sits well
                    into the section — without this the band reads as glued to
                    the experience deck while floating far above "Selected
                    Works". Mobile rhythm is already symmetric. */}
                <Marquee
                  items={["DESIGNED. CODED. SHIPPED."]}
                  tone="cyan"
                  duration={24}
                  direction="right"
                  tilt={2}
                  className="min-[900px]:mt-16"
                />
                <ProjectsSection />
                <ContactSection />
                {/* Lives OUTSIDE ContactSection on purpose: that section is
                    overflow-hidden (its starburst/orbs need containing), which
                    was clipping this tilted band's corners. Marquee itself now
                    carries a z-20 stacking context so it always paints on top
                    of neighboring sections. */}
                <Marquee
                  items={["SELECT PROJECTS ONLY"]}
                  tone="cyan"
                  duration={26}
                  tilt={-2.5}
                />
                {/* Bonus beat after the core funnel — live personal telemetry */}
                <PersonalTelemetrySection />
                <FooterSection />
              </>
            )}
          </main>
        </div>
      </div>
      <SmoothScroll locked={!isLoaded} />
    </div>
  );
}

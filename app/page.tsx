"use client";

import { useState } from "react";
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
import PersonalTelemetrySection from "./components/PersonalTelemetrySection";
import FooterSection from "./components/FooterSection";
import { TECH_STACK } from "./data/content";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <CustomCursor />

      {/* Site-wide film grain — above content, below the cursor */}
      <div className="grain pointer-events-none fixed inset-0 z-[100] opacity-[0.05]" />

      {!isLoaded && <Preloader onComplete={() => setIsLoaded(true)} />}

      {isLoaded && (
        <>
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
              <div className="opacity-0 animate-[fadeIn_0.8s_ease_forwards]">
                <main className="relative z-10">
                  <HeroSection />
                  <Marquee
                    items={TECH_STACK}
                    tone="volt"
                    duration={20}
                    tilt={-2}
                  />
                  <ExperienceSection />
                  <Marquee
                    items={["TAKING SELECT PROJECTS"]}
                    tone="cyan"
                    duration={24}
                    direction="right"
                    tilt={2}
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
                </main>
              </div>
            </div>
          </div>
          <SmoothScroll />
        </>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

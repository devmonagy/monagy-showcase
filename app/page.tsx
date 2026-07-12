"use client";

import { useState } from "react";
import Preloader from "./components/Preloader";
import CustomCursor from "./components/CustomCursor";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Marquee from "./components/Marquee";
import ExperienceSection from "./components/ExperienceSection";
import ProjectsSection from "./components/ProjectsSection";
import ContactSection from "./components/ContactSection";
import FooterSection from "./components/FooterSection";
import { TECH_STACK } from "./data/content";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <CustomCursor />
      {!isLoaded && <Preloader onComplete={() => setIsLoaded(true)} />}

      {isLoaded && (
        <div className="opacity-0 animate-[fadeIn_0.8s_ease_forwards]">
          <Navbar />
          <main>
            <HeroSection />
            <Marquee items={TECH_STACK} tone="volt" duration={20} />
            <ExperienceSection />
            <Marquee
              items={["OPEN TO OPPORTUNITIES"]}
              tone="flux"
              duration={24}
              direction="right"
            />
            <ProjectsSection />
            <ContactSection />
            <FooterSection />
          </main>
        </div>
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

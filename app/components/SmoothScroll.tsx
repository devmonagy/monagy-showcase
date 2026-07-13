"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

// Mounted once the real page content exists inside #smooth-content (see
// page.tsx) so ScrollSmoother measures accurate scroll height from the
// start instead of an empty wrapper during the preloader.
export default function SmoothScroll() {
  useEffect(() => {
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.2,
      normalizeScroll: true,
      ignoreMobileResize: true,
    });

    return () => {
      smoother.kill();
    };
  }, []);

  return null;
}

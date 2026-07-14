"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { CONDITION_LABEL, orbGradient } from "./WeatherVisuals";
import type { WeatherData } from "../api/weather/route";
import { FINE_POINTER_QUERY } from "./SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ------------------------------------------------------------------ */
/* Data hooks — unchanged endpoints/polling, only the layout changed   */
/* ------------------------------------------------------------------ */

interface NowPlayingData {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  albumArt?: string;
  url?: string;
}

const SPOTIFY_POLL_MS = 8000;
const SPOTIFY_HIDDEN_POLL_MS = 25000;
const WEATHER_POLL_MS = 5 * 60 * 1000;
// This section mounts immediately with the rest of the page (nothing here
// is gated on scroll position), so its very first fetch would otherwise
// fire the instant the page loads — right when fonts, images, and the
// preloader's own JS are already competing for a mobile connection's
// bandwidth and the main thread. This widget has a placeholder state for
// exactly this reason; a beat of delay here is free. requestIdleCallback
// isn't used — Safari (all of iOS) has never implemented it.
const INITIAL_FETCH_DELAY_MS = 1200;

function useNowPlaying(): NowPlayingData {
  const [data, setData] = useState<NowPlayingData>({ isPlaying: false });

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number;

    const poll = async () => {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        const next: NowPlayingData = await res.json();
        if (!cancelled) setData(next);
      } catch {
        if (!cancelled) setData({ isPlaying: false });
      }
      if (!cancelled) {
        timeoutId = window.setTimeout(
          poll,
          document.hidden ? SPOTIFY_HIDDEN_POLL_MS : SPOTIFY_POLL_MS,
        );
      }
    };

    timeoutId = window.setTimeout(poll, INITIAL_FETCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return data;
}

function useWeather(): WeatherData | null {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number;

    const poll = async () => {
      try {
        const res = await fetch("/api/weather", { cache: "no-store" });
        if (res.ok) {
          const next: WeatherData = await res.json();
          if (!cancelled) setWeather(next);
        }
      } catch {
        // Keep the last reading — stale beats blank.
      }
      if (!cancelled) timeoutId = window.setTimeout(poll, WEATHER_POLL_MS);
    };

    timeoutId = window.setTimeout(poll, INITIAL_FETCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return weather;
}

function useNycTime(): string | null {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(new Date()),
      );
    update();
    const id = window.setInterval(update, 30000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}

/* ------------------------------------------------------------------ */
/* Static content                                                      */
/* ------------------------------------------------------------------ */

// Real lat/lon of each country's capital — used to project a flag pin
// onto the rotating globe (see the projection math in the globe effect).
const COUNTRIES = [
  {
    code: "us",
    name: "United States",
    coords: "38.9° N, 77.0° W",
    lat: 38.9,
    lon: -77.0,
  },
  {
    code: "eg",
    name: "Egypt",
    coords: "30.0° N, 31.2° E",
    lat: 30.0,
    lon: 31.2,
  },
  {
    code: "mx",
    name: "Mexico",
    coords: "19.4° N, 99.1° W",
    lat: 19.4,
    lon: -99.1,
  },
  {
    code: "do",
    name: "Dominican Republic",
    coords: "18.5° N, 69.9° W",
    lat: 18.5,
    lon: -69.9,
  },
];

// Simplified landmass outlines (lat, lon vertex loops) — not survey-grade
// coastlines, but real continent silhouettes rather than circular blobs,
// so each one reads as its actual shape as the globe turns.
const CONTINENTS: [number, number][][] = [
  // North America
  [
    [71, -156], [70, -95], [49, -95], [45, -67], [25, -81],
    [18, -95], [14, -91], [16, -99], [23, -106], [32, -117],
    [48, -125], [60, -141],
  ],
  // South America
  [
    [12, -72], [5, -60], [-5, -35], [-23, -43], [-34, -58],
    [-55, -68], [-52, -73], [-18, -70], [2, -79],
  ],
  // Europe
  [
    [71, 25], [60, 45], [47, 40], [42, 20], [36, -6],
    [43, -9], [51, 3], [60, 5], [66, 20],
  ],
  // Africa
  [
    [37, 10], [32, 33], [12, 51], [-1, 42], [-26, 33],
    [-34, 20], [-22, 15], [-5, 9], [10, 9], [20, -17], [32, -10],
  ],
  // Asia
  [
    [77, 80], [70, 180], [52, 160], [35, 140], [20, 109],
    [8, 98], [1, 104], [8, 80], [18, 57], [30, 49], [43, 40],
    [55, 49], [65, 60],
  ],
  // Australia
  [
    [-11, 113], [-10, 142], [-17, 146], [-25, 153], [-38, 146],
    [-35, 116], [-20, 113],
  ],
];

// Radius (in the SVG's own -100..100 viewBox units) the continent paths
// project onto — kept a touch inside the flag pins' own radius ratio
// (0.42 of the pixel stage) so coastlines sit just under the pins.
const CONTINENT_PROJECTION_RADIUS = 84;

// Initial yaw so all four visited countries start front-facing rather
// than scattered across the visible/hidden hemispheres.
const GLOBE_INITIAL_ROTATION = 56;
const GLOBE_IDLE_DEG_PER_SEC = 9;

const LEARNING = {
  title: "Three.js / WebGL",
  description: "Pushing browser-based visual fidelity further",
};

const NUM_BARS = 28;

// Cyan → volt spectrum for the waveform — same two accents as the
// Three.js/WebGL heading's gradient, spread across the bar sequence
// instead of blended in a single fill.
const BAR_CYAN: [number, number, number] = [51, 232, 255]; // #33e8ff
const BAR_VOLT: [number, number, number] = [214, 255, 63]; // #d6ff3f

function barSpectrumColor(t: number): string {
  const r = Math.round(BAR_CYAN[0] + (BAR_VOLT[0] - BAR_CYAN[0]) * t);
  const g = Math.round(BAR_CYAN[1] + (BAR_VOLT[1] - BAR_CYAN[1]) * t);
  const b = Math.round(BAR_CYAN[2] + (BAR_VOLT[2] - BAR_CYAN[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Idle bob rhythm per island body — all different so the four never
// breathe in sync, which is what sells "floating" over "animated together".
// Lives on the body only; labels sit outside it and never move.
const BOB = [
  { dur: "7s", delay: "0s" },
  { dur: "9s", delay: "0.8s" },
  { dur: "8s", delay: "1.4s" },
  { dur: "10s", delay: "0.4s" },
];

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function PersonalTelemetrySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const globeStageRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const continentRefs = useRef<(SVGPathElement | null)[]>([]);
  // Plain ref (not state) so hovering a pin can pause the globe's ticker
  // without re-running the whole rotation effect on every hover.
  const hoverPauseRef = useRef(false);

  const nowPlaying = useNowPlaying();
  const weather = useWeather();
  const nycTime = useNycTime();

  const isPlayingRef = useRef(nowPlaying.isPlaying);
  useEffect(() => {
    isPlayingRef.current = nowPlaying.isPlaying;
  }, [nowPlaying.isPlaying]);

  const [hoveredCountry, setHoveredCountry] = useState<
    (typeof COUNTRIES)[number] | null
  >(null);

  /* ---- Scroll choreography: header reveal and the deep-space island
     body assembly (scrubbed, so it plays in reverse too). Labels sit
     outside this entirely — they fade in once with the header and never
     move again, so the four stay perfectly aligned no matter how far
     you scroll. ---- */
  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.fromTo(
        ".telemetry-reveal",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
        },
      );

      // Desktop only — on touch the island bodies are visible from first
      // paint instead of waiting at opacity 0 for a ScrollTrigger that
      // real phones repeatedly failed to fire on time (see SmoothScroll.tsx).
      const mm = gsap.matchMedia();
      mm.add(FINE_POINTER_QUERY, () => {
        if (reduce) return;
        const islands = gsap.utils.toArray<HTMLElement>(".otc-island");
        if (!islands.length) return;

        // Deep-space assembly: each body starts far behind the canvas
        // (negative translateZ, tipped back, slightly small) and flies up
        // to the glass as you scroll — staggered so they arrive one after
        // another, and scrubbed so the whole flight reverses on scroll-up.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 92%",
            end: "top 28%",
            scrub: 0.9,
          },
        });
        islands.forEach((el, i) => {
          tl.fromTo(
            el,
            {
              opacity: 0,
              z: -420 - i * 130,
              rotationX: 10,
              scale: 0.94,
              transformPerspective: 1000,
            },
            {
              opacity: 1,
              z: 0,
              rotationX: 0,
              scale: 1,
              duration: 1,
              ease: "power2.out",
            },
            i * 0.14,
          );
        });

        // Slow counter-drift between island bodies across the whole
        // section — scroll-driven parallax (not mouse-driven), so the
        // group reads as floating at different depths as you pass
        // through. Only the body drifts; the label above it is a sibling
        // outside this wrapper and never moves.
        const drifts = gsap.utils.toArray<HTMLElement>(".otc-drift");
        const rates = [-5, 6, -7, 4];
        drifts.forEach((el, i) => {
          gsap.to(el, {
            yPercent: rates[i] ?? 0,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          });
        });
      });
    },
    { scope: sectionRef },
  );

  /* ---- Audio waveform — one shared ticker instead of per-bar tweens.
     Idle: a slow, synchronized sine sweep. Playing: three layered sine
     waves per bar (different frequency/phase each) summed together, so
     the motion reads as musical/organic instead of one obvious loop.
     Bars grow from the center (see items-center + transform-origin) like
     a real spectrum analyzer. Frame cost gated to while on screen. ---- */
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      const bars = barRefs.current.filter(
        (b): b is HTMLSpanElement => b !== null,
      );
      if (!bars.length) return;

      let t = 0;
      const tick = () => {
        t += 0.045;
        const playing = isPlayingRef.current;
        bars.forEach((bar, i) => {
          let scale: number;
          if (playing) {
            const w1 = Math.sin(t * 2.2 + i * 0.55);
            const w2 = Math.sin(t * 3.7 + i * 1.15) * 0.5;
            const w3 = Math.sin(t * 5.3 + i * 0.27) * 0.3;
            const combined = (w1 + w2 + w3) / 1.8;
            scale = Math.max(0.08, 0.5 + combined * 0.5);
          } else {
            const phase = i * 0.32;
            scale = Math.max(0.06, 0.14 + 0.24 * (0.5 + 0.5 * Math.sin(t * 0.9 + phase)));
          }
          bar.style.transform = `scaleY(${scale})`;
        });
      };

      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        onToggle(self) {
          if (self.isActive) gsap.ticker.add(tick);
          else gsap.ticker.remove(tick);
        },
      });

      return () => {
        st.kill();
        gsap.ticker.remove(tick);
      };
    },
    { scope: sectionRef },
  );

  /* ---- The globe — an orthographic projection rotated by yaw, no WebGL
     needed. One shared ticker paints every continent blob and flag pin
     each frame from its lat/lon; drag overrides the slow idle spin, and
     hovering a pin pauses it so the caption can be read. ---- */
  useGSAP(
    () => {
      const stage = globeStageRef.current;
      if (!stage) return;
      const pins = pinRefs.current.filter(
        (n): n is HTMLButtonElement => n !== null,
      );
      const continents = continentRefs.current.filter(
        (n): n is SVGPathElement => n !== null,
      );
      if (!pins.length) return;

      let rotationY = GLOBE_INITIAL_ROTATION;

      // Unit-sphere projection (radius 1) — pins and continent paths each
      // scale the result by their own radius, since pins live in real
      // pixels but the continent paths live in the SVG's own viewBox units.
      const projectUnit = (lat: number, lon: number) => {
        const latR = (lat * Math.PI) / 180;
        const lonR = (lon * Math.PI) / 180 + (rotationY * Math.PI) / 180;
        return {
          x: Math.cos(latR) * Math.sin(lonR),
          y: -Math.sin(latR),
          z: Math.cos(latR) * Math.cos(lonR),
        };
      };

      const paint = () => {
        const pinRadius = stage.offsetWidth * 0.42;

        continents.forEach((el, i) => {
          let sumZ = 0;
          const points = CONTINENTS[i];
          const d = points
            .map(([lat, lon], idx) => {
              const p = projectUnit(lat, lon);
              sumZ += p.z;
              const x = (p.x * CONTINENT_PROJECTION_RADIUS).toFixed(1);
              const y = (p.y * CONTINENT_PROJECTION_RADIUS).toFixed(1);
              return `${idx === 0 ? "M" : "L"}${x} ${y}`;
            })
            .join(" ");
          el.setAttribute("d", `${d} Z`);
          const depth = (sumZ / points.length + 1) / 2;
          el.style.opacity = String(0.1 + 0.25 * depth);
        });

        pins.forEach((el, i) => {
          const c = COUNTRIES[i];
          const p = projectUnit(c.lat, c.lon);
          const depth = (p.z + 1) / 2;
          const visible = p.z > -0.12;
          el.style.transform = `translate(${p.x * pinRadius}px, ${p.y * pinRadius}px) scale(${0.55 + 0.55 * depth})`;
          el.style.opacity = visible ? String(0.35 + 0.65 * depth) : "0";
          el.style.pointerEvents = visible ? "auto" : "none";
          el.style.zIndex = String(10 + Math.round(depth * 20));
        });
      };
      paint();

      let dragging = false;
      let lastClientX = 0;

      const onPointerDown = (e: PointerEvent) => {
        dragging = true;
        lastClientX = e.clientX;
        stage.style.cursor = "grabbing";
        stage.setPointerCapture(e.pointerId);
      };
      const onPointerMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastClientX;
        lastClientX = e.clientX;
        rotationY += dx * 0.45;
        paint();
      };
      const onPointerUp = () => {
        dragging = false;
        stage.style.cursor = "grab";
      };

      stage.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);

      let st: ScrollTrigger | undefined;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        let speed = 1;
        const tick = (_t: number, delta: number) => {
          const target = dragging || hoverPauseRef.current ? 0 : 1;
          speed += (target - speed) * 0.05;
          if (!dragging) {
            rotationY += (GLOBE_IDLE_DEG_PER_SEC * speed * delta) / 1000;
            paint();
          }
        };
        st = ScrollTrigger.create({
          trigger: stage,
          start: "top bottom",
          end: "bottom top",
          onToggle(self) {
            if (self.isActive) gsap.ticker.add(tick);
            else gsap.ticker.remove(tick);
          },
        });
        return () => {
          st?.kill();
          gsap.ticker.remove(tick);
          stage.removeEventListener("pointerdown", onPointerDown);
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
        };
      }

      return () => {
        stage.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
    },
    { scope: sectionRef },
  );

  const handlePinEnter = (country: (typeof COUNTRIES)[number]) => {
    setHoveredCountry(country);
    hoverPauseRef.current = true;
  };
  const handlePinLeave = () => {
    setHoveredCountry(null);
    hoverPauseRef.current = false;
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-28 px-5 sm:px-6 md:px-8"
    >
      {/* Ambient glow — static; all motion in this section belongs to the
          island bodies and the globe. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-[-10%] w-[50vw] h-[50vw] max-w-[38rem] max-h-[38rem] rounded-full blur-[140px] bg-[var(--accent-volt)] opacity-[0.08]" />
        <div className="absolute bottom-0 right-[-10%] w-[46vw] h-[46vw] max-w-[34rem] max-h-[34rem] rounded-full blur-[140px] bg-[var(--accent-cyan)] opacity-[0.07]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="telemetry-reveal flex items-end justify-between gap-4 mb-14 sm:mb-24">
          <h2 className="otc-title font-[family-name:var(--font-syne)] font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tighter text-[var(--text-contrast)] leading-none">
            Off The
            <br />
            <span className="text-outline-volt">Clock</span>
          </h2>
          <span className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text)] opacity-60 pb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-volt)] animate-pulse" />
            Live feeds
          </span>
        </div>

        {/* THE FLOATING ISLANDS — no cards, no borders. Each label is
            static (always aligned with its row partner); each body flies
            in from deep z-space on scroll (desktop) and bobs/drifts on
            its own rhythm below the label. */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-x-10 gap-y-3 sm:gap-y-4"
        >
          {/* NOW PLAYING — Spotify */}
          <div className="min-[900px]:col-span-7">
            <span
              className="telemetry-reveal flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em]"
              style={{ color: "var(--accent-volt)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: "var(--accent-volt)",
                  boxShadow: "0 0 8px var(--accent-volt)",
                }}
              />
              Now Playing · Spotify Live
            </span>

            <div className="otc-drift mt-8 sm:mt-10 mb-16 sm:mb-24">
              <div className="otc-island">
                <div
                  className="otc-bob max-w-xs sm:max-w-sm"
                  style={
                    {
                      "--bob-dur": BOB[0].dur,
                      "--bob-delay": BOB[0].delay,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-[3px] sm:gap-1 h-10 sm:h-12 mb-6">
                    {Array.from({ length: NUM_BARS }).map((_, i) => {
                      const spectrumColor = barSpectrumColor(
                        i / (NUM_BARS - 1),
                      );
                      return (
                        <span
                          key={i}
                          ref={(el) => {
                            barRefs.current[i] = el;
                          }}
                          className="otc-bar w-[3px] sm:w-1 h-full rounded-full"
                          style={{
                            backgroundColor: nowPlaying.isPlaying
                              ? spectrumColor
                              : "rgba(154,154,165,0.4)",
                            boxShadow: nowPlaying.isPlaying
                              ? `0 0 6px ${spectrumColor}`
                              : "none",
                          }}
                        />
                      );
                    })}
                  </div>

                  {nowPlaying.isPlaying ? (
                    <a
                      href={nowPlaying.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 group/track min-w-0"
                    >
                      {nowPlaying.albumArt && (
                        <Image
                          src={nowPlaying.albumArt}
                          alt=""
                          width={64}
                          height={64}
                          className="rounded-xl shrink-0 w-12 h-12 sm:w-16 sm:h-16 opacity-90 group-hover/track:opacity-100 transition-opacity"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="block font-[family-name:var(--font-syne)] font-extrabold text-xl sm:text-3xl text-[var(--text-contrast)] leading-tight truncate group-hover/track:text-[var(--accent-volt)] transition-colors duration-300">
                          {nowPlaying.title}
                        </span>
                        <span className="block font-mono text-[11px] sm:text-sm opacity-60 truncate mt-1">
                          {nowPlaying.artist} ↗
                        </span>
                      </div>
                    </a>
                  ) : (
                    <div>
                      <span className="text-outline block font-[family-name:var(--font-syne)] font-extrabold text-3xl sm:text-5xl uppercase leading-none">
                        Off Air
                      </span>
                      <span className="block font-mono text-[10px] sm:text-xs uppercase tracking-widest opacity-50 mt-3">
                        Mo isn&apos;t playing anything right now
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* NYC RIGHT NOW — live weather */}
          <div className="min-[900px]:col-span-5">
            <span
              className="telemetry-reveal flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em]"
              style={{ color: "var(--accent-cyan)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: "var(--accent-cyan)",
                  boxShadow: "0 0 8px var(--accent-cyan)",
                }}
              />
              NYC Right Now · Live Weather
            </span>

            <div className="otc-drift mt-8 sm:mt-10 mb-16 sm:mb-24">
              <div className="otc-island">
                <div
                  className="otc-bob"
                  style={
                    {
                      "--bob-dur": BOB[1].dur,
                      "--bob-delay": BOB[1].delay,
                    } as React.CSSProperties
                  }
                >
                  {weather ? (
                    <div className="flex items-center gap-6">
                      <div className="relative w-20 h-20 sm:w-28 sm:h-28 shrink-0">
                        <div
                          className="otc-orb-ring absolute inset-0 rounded-full border border-dashed opacity-40"
                          style={{ borderColor: "var(--accent-cyan)" }}
                        />
                        <div
                          className="absolute inset-0 rounded-full blur-2xl opacity-60"
                          style={{
                            background: orbGradient(
                              weather.condition,
                              weather.isDay,
                            ),
                          }}
                        />
                        <div
                          className="otc-orb-core absolute inset-3 sm:inset-4 rounded-full"
                          style={{
                            background: orbGradient(
                              weather.condition,
                              weather.isDay,
                            ),
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-[family-name:var(--font-syne)] font-extrabold text-5xl sm:text-7xl leading-none tabular-nums text-[var(--text-contrast)]">
                          {weather.tempF}°
                        </span>
                        <span className="block font-mono text-[11px] sm:text-sm opacity-60 mt-2">
                          {CONDITION_LABEL[weather.condition]} · Feels{" "}
                          {weather.feelsLikeF}°
                        </span>
                        <span className="block font-mono text-[10px] sm:text-xs uppercase tracking-wider opacity-40 mt-1">
                          {nycTime ?? "--:--"} in NYC · Wind {weather.windMph}{" "}
                          mph · Hum {weather.humidity}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="block font-mono text-[11px] sm:text-xs uppercase tracking-widest opacity-50 animate-pulse">
                      Reading the NYC sky…
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COUNTRIES VISITED — a small rotating globe with flag pins */}
          <div className="min-[900px]:col-span-7">
            <span
              className="telemetry-reveal flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em]"
              style={{ color: "var(--accent-cyan)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: "var(--accent-cyan)",
                  boxShadow: "0 0 8px var(--accent-cyan)",
                }}
              />
              4 Countries Visited · Passport Log
            </span>

            <div className="otc-drift mt-8 sm:mt-10 mb-16 sm:mb-24">
              <div className="otc-island">
                <div
                  className="otc-bob"
                  style={
                    {
                      "--bob-dur": BOB[2].dur,
                      "--bob-delay": BOB[2].delay,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-6 sm:gap-10">
                    {/* The globe: orthographic projection, drag to spin */}
                    <div
                      ref={globeStageRef}
                      className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0 rounded-full overflow-hidden cursor-grab select-none"
                      style={{
                        touchAction: "none",
                        background:
                          "radial-gradient(circle at 32% 28%, rgba(51,232,255,0.2), rgba(5,5,7,0.92) 72%)",
                        boxShadow:
                          "inset 0 0 40px rgba(0,0,0,0.6), 0 0 50px rgba(51,232,255,0.1)",
                      }}
                    >
                      <div className="absolute inset-0 rounded-full border border-white/10" />
                      <div className="absolute inset-[10%] rounded-full border border-white/[0.06]" />
                      <div className="absolute inset-[22%] rounded-full border border-white/[0.05]" />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-white/[0.06]" />
                      <div className="absolute inset-x-0 top-1/2 h-px bg-white/[0.06]" />

                      <svg
                        viewBox="-100 -100 200 200"
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        aria-hidden="true"
                      >
                        {CONTINENTS.map((_, i) => (
                          <path
                            key={i}
                            ref={(el) => {
                              continentRefs.current[i] = el;
                            }}
                            fill="var(--accent-cyan)"
                            stroke="var(--accent-cyan)"
                            strokeWidth="0.8"
                            strokeLinejoin="round"
                          />
                        ))}
                      </svg>

                      {COUNTRIES.map((country, i) => (
                        <button
                          key={country.code}
                          type="button"
                          ref={(el) => {
                            pinRefs.current[i] = el;
                          }}
                          onMouseEnter={() => handlePinEnter(country)}
                          onMouseLeave={handlePinLeave}
                          onFocus={() => handlePinEnter(country)}
                          onBlur={handlePinLeave}
                          title={country.name}
                          className="absolute left-1/2 top-1/2 w-6 h-6 sm:w-7 sm:h-7 -ml-3 -mt-3 sm:-ml-3.5 sm:-mt-3.5 rounded-full"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed external SVG from a static CDN */}
                          <img
                            src={`https://flagcdn.com/${country.code}.svg`}
                            alt={country.name}
                            draggable={false}
                            className="w-full h-full rounded-full object-cover border-2 border-[var(--card-bg)] shadow-[0_6px_16px_rgba(0,0,0,0.6)]"
                          />
                        </button>
                      ))}
                    </div>

                    <div className="min-w-0">
                      <span className="block font-[family-name:var(--font-syne)] font-extrabold text-6xl sm:text-7xl leading-none text-[var(--accent-cyan)] tabular-nums">
                        04
                      </span>
                      <div className="h-5 mt-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider">
                        {hoveredCountry ? (
                          <span style={{ color: "var(--accent-cyan)" }}>
                            {hoveredCountry.name} — {hoveredCountry.coords}
                          </span>
                        ) : (
                          <span className="opacity-40">Drag the globe · hover a flag</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CURRENTLY LEARNING */}
          <div className="min-[900px]:col-span-5">
            <span
              className="telemetry-reveal flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em]"
              style={{ color: "var(--accent-volt)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: "var(--accent-volt)",
                  boxShadow: "0 0 8px var(--accent-volt)",
                }}
              />
              Currently Learning
            </span>

            <div className="otc-drift mt-8 sm:mt-10 mb-16 sm:mb-24">
              <div className="otc-island">
                <div
                  className="otc-bob"
                  style={
                    {
                      "--bob-dur": BOB[3].dur,
                      "--bob-delay": BOB[3].delay,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className="block font-[family-name:var(--font-syne)] font-extrabold text-3xl sm:text-5xl uppercase leading-none"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--accent-cyan), var(--accent-volt))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {LEARNING.title}
                  </span>
                  <p className="font-mono text-[11px] sm:text-sm opacity-60 mt-3 mb-5 max-w-sm">
                    {LEARNING.description}
                  </p>

                  <div className="h-1 w-full max-w-sm rounded-full bg-[var(--border-color)] overflow-hidden">
                    <div className="h-full w-1/3 rounded-full bg-[var(--accent-volt)] animate-[learningProgress_2.2s_ease-in-out_infinite]" />
                  </div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--accent-volt)] opacity-70 mt-2">
                    Skill install in progress…
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

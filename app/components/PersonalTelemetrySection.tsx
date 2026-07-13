"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { CONDITION_LABEL, orbGradient, WeatherIcon } from "./WeatherVisuals";
import type { WeatherData } from "../api/weather/route";
import { FINE_POINTER_QUERY } from "./SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ------------------------------------------------------------------ */
/* Data hooks                                                          */
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
/* Hardware chrome pieces                                              */
/* ------------------------------------------------------------------ */

// Phillips-head screw — one per tile corner, like a mounted case panel.
function Screw({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      className={`absolute w-2.5 h-2.5 opacity-25 ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="5"
        cy="5"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M5 2.2v5.6M2.2 5h5.6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

type TileTone = "volt" | "cyan";

const TONE_COLOR: Record<TileTone, string> = {
  volt: "var(--accent-volt)",
  cyan: "var(--accent-cyan)",
};

// Shared tile shell: glass body, screwed corners, port-label header strip
// with a live LED, serial tag, PCB trace, and a mouse-tracked spotlight.
function Tile({
  port,
  serial,
  tone,
  className = "",
  children,
}: {
  port: string;
  serial: string;
  tone: TileTone;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const accent = TONE_COLOR[tone];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`bento-tile bento-tile--${tone} telemetry-reveal group relative flex flex-col overflow-hidden rounded-2xl text-[var(--text)] ${className}`}
    >
      {/* Mouse-tracked spotlight */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, ${accent} 9%, transparent), transparent 70%)`,
        }}
      />

      {/* Corner screws */}
      <Screw className="top-2 left-2" />
      <Screw className="top-2 right-2" />
      <Screw className="bottom-2 left-2" />
      <Screw className="bottom-2 right-2" />

      {/* Port-label header strip */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-6 pt-4 font-mono text-[9px] sm:text-[10px] tracking-[0.25em] uppercase">
        <span className="flex items-center gap-2" style={{ color: accent }}>
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{
              backgroundColor: accent,
              boxShadow: `0 0 8px ${accent}`,
            }}
          />
          {port}
        </span>
        <span className="opacity-40">{serial}</span>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-5 sm:px-6 py-5">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Countries data                                                      */
/* ------------------------------------------------------------------ */

const COUNTRIES = [
  { code: "us", name: "United States" },
  { code: "eg", name: "Egypt" },
  { code: "mx", name: "Mexico" },
  { code: "do", name: "Dominican Republic" },
];

const LEARNING = {
  title: "Three.js / WebGL",
  description: "Pushing browser-based visual fidelity further",
};

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function PersonalTelemetrySection() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const nowPlaying = useNowPlaying();
  const weather = useWeather();
  const nycTime = useNycTime();

  useGSAP(
    () => {
      // Modules "slot into the board": rise + scale with a slight overshoot.
      // Desktop only — on touch the tiles are visible from first paint
      // instead of waiting at opacity 0 for a ScrollTrigger that real
      // phones repeatedly failed to fire on time.
      const mm = gsap.matchMedia();
      mm.add(FINE_POINTER_QUERY, () => {
        gsap.fromTo(
          ".telemetry-reveal",
          { opacity: 0, y: 50, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: scopeRef.current,
              start: "top 78%",
            },
          },
        );
      });
    },
    { scope: scopeRef },
  );

  return (
    <section
      ref={scopeRef}
      className="relative py-20 sm:py-28 px-5 sm:px-6 md:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="telemetry-reveal flex items-end justify-between gap-4 mb-12 sm:mb-16">
          <h2 className="font-[family-name:var(--font-syne)] font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tighter text-[var(--text-contrast)] leading-none">
            Off The
            <br />
            <span className="text-outline-volt">Clock</span>
          </h2>
          <span className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text)] opacity-60 pb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-volt)] animate-pulse" />
            Live Telemetry // SYS.BOARD
          </span>
        </div>

        {/* Asymmetric Bento board: 7/5 split, then 5/7 — modules of unequal
            weight instead of a uniform card grid */}
        <div className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-4 sm:gap-5">
          {/* AUDIO_OUT — Spotify */}
          <Tile
            port="Port_01 // Audio_Out"
            serial="SN MN-A01"
            tone="volt"
            className="min-[900px]:col-span-7 min-h-[210px] sm:min-h-[240px]"
          >
            {nowPlaying.isPlaying ? (
              <a
                href={nowPlaying.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 sm:gap-6 group/track"
              >
                {nowPlaying.albumArt && (
                  <Image
                    src={nowPlaying.albumArt}
                    alt=""
                    width={72}
                    height={72}
                    className="rounded-xl border border-[var(--border-color)] shrink-0 w-14 h-14 sm:w-[72px] sm:h-[72px]"
                  />
                )}
                <div className="min-w-0">
                  <span className="flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[var(--accent-volt)] mb-2">
                    <span className="flex items-end gap-[2px] h-3 shrink-0">
                      <span className="eq-bar w-[2.5px] h-full rounded-full bg-[var(--accent-volt)] [animation-delay:0ms]" />
                      <span className="eq-bar w-[2.5px] h-full rounded-full bg-[var(--accent-volt)] [animation-delay:150ms]" />
                      <span className="eq-bar w-[2.5px] h-full rounded-full bg-[var(--accent-volt)] [animation-delay:300ms]" />
                    </span>
                    Now Playing
                  </span>
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
                <span
                  className="block font-[family-name:var(--font-syne)] font-extrabold text-3xl sm:text-5xl leading-none uppercase"
                  style={{
                    color: "transparent",
                    WebkitTextStroke: "1.5px rgba(247,247,245,0.35)",
                  }}
                >
                  No Signal
                </span>
                <span className="flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest opacity-50 mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text)] opacity-50" />
                  Audio_Out: Idle — Mo is offline on Spotify
                </span>
              </div>
            )}
          </Tile>

          {/* ATMOS — NYC weather */}
          <Tile
            port="Sensor_02 // Atmos"
            serial="SN MN-W02"
            tone="cyan"
            className="min-[900px]:col-span-5 min-h-[210px] sm:min-h-[240px]"
          >
            {weather ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0"
                    role="img"
                    aria-label={CONDITION_LABEL[weather.condition]}
                  >
                    <div
                      className="absolute inset-0 rounded-full blur-xl opacity-70"
                      style={{
                        background: orbGradient(
                          weather.condition,
                          weather.isDay,
                        ),
                      }}
                    />
                    <div
                      className="relative w-full h-full rounded-full p-3"
                      style={{
                        background: orbGradient(
                          weather.condition,
                          weather.isDay,
                        ),
                      }}
                    >
                      <WeatherIcon
                        condition={weather.condition}
                        isDay={weather.isDay}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block font-[family-name:var(--font-syne)] font-extrabold text-4xl sm:text-5xl text-[var(--text-contrast)] leading-none tabular-nums">
                      {weather.tempF}°
                    </span>
                    <span className="block font-mono text-[10px] sm:text-xs opacity-60 mt-1">
                      {CONDITION_LABEL[weather.condition]} · Feels{" "}
                      {weather.feelsLikeF}°
                    </span>
                  </div>
                </div>
                {/* Sensor readout chips */}
                <div className="flex flex-wrap gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">
                  {[
                    `NYC ${nycTime ?? "--:--"} EST`,
                    `Wind ${weather.windMph} MPH`,
                    `Hum ${weather.humidity}%`,
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="px-2 py-1 rounded border border-[var(--border-color)] tabular-nums"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest opacity-50 animate-pulse">
                Syncing atmospheric sensors…
              </span>
            )}
          </Tile>

          {/* GEO — countries visited */}
          <Tile
            port="Module_03 // Geo"
            serial="SN MN-G03"
            tone="cyan"
            className="min-[900px]:col-span-5 min-h-[190px]"
          >
            <div className="flex items-center gap-5 sm:gap-6">
              <span className="font-[family-name:var(--font-syne)] font-extrabold text-5xl sm:text-6xl leading-none text-[var(--accent-cyan)] tabular-nums">
                04
              </span>
              <div className="min-w-0">
                <span className="block font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text-contrast)] mb-2.5">
                  Countries Visited
                </span>
                <div className="flex -space-x-2.5">
                  {COUNTRIES.map((country) => (
                    <div
                      key={country.code}
                      className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-[var(--card-bg)] hover:border-[var(--accent-cyan)] hover:scale-110 hover:z-10 transition-all duration-300"
                      title={country.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed external SVG from a static CDN */}
                      <img
                        src={`https://flagcdn.com/${country.code}.svg`}
                        alt={country.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <span className="block font-mono text-[9px] sm:text-[10px] uppercase tracking-wider opacity-50 mt-2">
                  US · EG · MX · DO
                </span>
              </div>
            </div>
          </Tile>

          {/* FIRMWARE — currently learning */}
          <Tile
            port="Slot_04 // Firmware"
            serial="SN MN-F04"
            tone="volt"
            className="min-[900px]:col-span-7 min-h-[190px]"
          >
            <div>
              <span className="block font-mono text-[10px] sm:text-xs uppercase tracking-widest opacity-60 mb-2">
                Currently Learning
              </span>
              <span
                className="block font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-4xl uppercase leading-none"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "1.5px rgba(214,255,63,0.6)",
                }}
              >
                {LEARNING.title}
              </span>
              <span className="block font-mono text-[10px] sm:text-xs opacity-60 mt-2 mb-4">
                {LEARNING.description}
              </span>
              {/* Indeterminate sweep — "update in progress," not a fake % */}
              <div className="h-1 w-full max-w-sm rounded-full bg-[var(--border-color)] overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-[var(--accent-volt)] animate-[learningProgress_2.2s_ease-in-out_infinite]" />
              </div>
              <span className="block font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--accent-volt)] opacity-70 mt-2">
                Firmware update in progress…
              </span>
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}

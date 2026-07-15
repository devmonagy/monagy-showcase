// Shared weather visuals for the Off The Clock floating islands —
// condition label map and the ambient orb's gradient. Naturalistic
// per-condition colors on purpose (sun = warm amber, rain = blue, etc.):
// a weather readout looks more alive resembling the actual sky than
// tinted in the brand accent.

import type { WeatherCondition } from "../api/weather/route";

export const CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: "Clear",
  "partly-cloudy": "Partly Cloudy",
  cloudy: "Cloudy",
  fog: "Foggy",
  drizzle: "Drizzle",
  rain: "Rain",
  snow: "Snow",
  thunderstorm: "Thunderstorm",
};

export function orbGradient(
  condition: WeatherCondition,
  isDay: boolean,
): string {
  if (condition === "thunderstorm") {
    return "radial-gradient(circle at 32% 28%, #7c3aed, #1e1b4b)";
  }
  if (condition === "snow") {
    return "radial-gradient(circle at 32% 28%, #f0f9ff, #7dd3fc)";
  }
  if (condition === "rain" || condition === "drizzle") {
    return "radial-gradient(circle at 32% 28%, #38bdf8, #0c4a6e)";
  }
  if (condition === "fog") {
    return "radial-gradient(circle at 32% 28%, #e2e8f0, #64748b)";
  }
  if (!isDay) {
    return "radial-gradient(circle at 32% 28%, #4338ca, #0f172a)";
  }
  if (condition === "cloudy") {
    return "radial-gradient(circle at 32% 28%, #bae6fd, #64748b)";
  }
  if (condition === "partly-cloudy") {
    return "radial-gradient(circle at 32% 28%, #7dd3fc, #2563eb)";
  }
  return "radial-gradient(circle at 32% 28%, #fef3c7, #f59e0b)"; // clear day
}

export function WeatherIcon({
  condition,
  isDay,
}: {
  condition: WeatherCondition;
  isDay: boolean;
}) {
  const showSun =
    isDay && (condition === "clear" || condition === "partly-cloudy");
  const showMoon =
    !isDay && (condition === "clear" || condition === "partly-cloudy");
  const showCloud = condition !== "clear";
  const small = condition === "partly-cloudy"; // sun/moon shrinks when a cloud shares the frame

  return (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <defs>
        <radialGradient id="sunGradient" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="55%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <radialGradient id="moonGradient" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#94A3B8" />
        </radialGradient>
        <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={condition === "thunderstorm" ? "#94A3B8" : "#E2E8F0"}
          />
          <stop
            offset="100%"
            stopColor={condition === "thunderstorm" ? "#475569" : "#94A3B8"}
          />
        </linearGradient>
        {/* Genuine SVG bloom (blur merged with the sharp source) instead of
            a CSS blur that would soften the whole shape */}
        <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {showSun && (
        <g
          className="weather-sun-spin"
          style={{ transformOrigin: small ? "11px 11px" : "16px 16px" }}
          filter="url(#softGlow)"
        >
          <g
            transform={
              small ? "translate(2 2) scale(0.72)" : "translate(4 4) scale(1)"
            }
          >
            <circle cx="12" cy="12" r="5" fill="url(#sunGradient)" />
            <g stroke="#FBBF24" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="3.5" />
              <line x1="12" y1="20.5" x2="12" y2="23" />
              <line x1="1" y1="12" x2="3.5" y2="12" />
              <line x1="20.5" y1="12" x2="23" y2="12" />
              <line x1="4.2" y1="4.2" x2="6" y2="6" />
              <line x1="18" y1="18" x2="19.8" y2="19.8" />
              <line x1="4.2" y1="19.8" x2="6" y2="18" />
              <line x1="18" y1="6" x2="19.8" y2="4.2" />
            </g>
          </g>
        </g>
      )}

      {showMoon && (
        <g
          // translate(5.2 5.2) — this path's exact bounding-box center is
          // (12,12), so scale*12+translate=16 needs translate=5.2 on both
          // axes to land it dead center (computed, not eyeballed).
          transform={
            small
              ? "translate(3 2) scale(0.68)"
              : "translate(5.2 5.2) scale(0.9)"
          }
          filter="url(#softGlow)"
        >
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill="url(#moonGradient)"
          />
          <circle
            cx="20"
            cy="6"
            r="0.9"
            fill="#F8FAFC"
            className="weather-star weather-star-1"
          />
          <circle
            cx="23"
            cy="11"
            r="0.6"
            fill="#F8FAFC"
            className="weather-star weather-star-2"
          />
        </g>
      )}

      {showCloud && (
        // Outer g: static position (SVG transform attribute). Inner g: the
        // CSS drift animation. Both on one element don't compose — a CSS
        // transform replaces the attribute transform entirely.
        <g
          transform={
            condition === "partly-cloudy"
              ? "translate(9 13) scale(0.95)"
              : "translate(2.2 2.2) scale(1.15)"
          }
        >
          <g className="weather-cloud-drift">
            <path
              d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
              fill="url(#cloudGradient)"
            />
          </g>
        </g>
      )}

      {(condition === "rain" || condition === "drizzle") && (
        <g stroke="#7DD3FC" strokeWidth="1.6" strokeLinecap="round">
          <line
            x1="11"
            y1="26"
            x2="9.5"
            y2="30"
            className="weather-drop weather-drop-1"
          />
          <line
            x1="16"
            y1="26"
            x2="14.5"
            y2="30"
            className="weather-drop weather-drop-2"
          />
          <line
            x1="21"
            y1="26"
            x2="19.5"
            y2="30"
            className="weather-drop weather-drop-3"
          />
        </g>
      )}

      {condition === "snow" && (
        <g fill="#F0F9FF">
          <circle
            cx="11"
            cy="26"
            r="1.1"
            className="weather-snow weather-snow-1"
          />
          <circle
            cx="16"
            cy="29"
            r="1.1"
            className="weather-snow weather-snow-2"
          />
          <circle
            cx="21"
            cy="26"
            r="1.1"
            className="weather-snow weather-snow-3"
          />
        </g>
      )}

      {condition === "thunderstorm" && (
        <path
          d="M15 14 10 21h4l-1 5 6-8h-4l1-4z"
          fill="#FDE047"
          filter="url(#softGlow)"
          className="weather-bolt"
        />
      )}

      {condition === "fog" && (
        <g
          stroke="#94A3B8"
          strokeWidth="1.4"
          strokeLinecap="round"
          className="weather-fog"
        >
          <line x1="6" y1="16" x2="18" y2="16" />
          <line x1="9" y1="19.5" x2="24" y2="19.5" />
          <line x1="6" y1="23" x2="19" y2="23" />
        </g>
      )}
    </svg>
  );
}

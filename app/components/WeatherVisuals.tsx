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

// app/api/weather/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// NYC — matches the latitude already shown elsewhere on the site (About's
// "LOC: NYC · 40.7654° N").
const LAT = 40.7654;
const LON = -73.9814;

export type WeatherCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export interface WeatherData {
  tempF: number;
  feelsLikeF: number;
  isDay: boolean;
  condition: WeatherCondition;
  windMph: number;
  humidity: number;
  sunriseISO: string;
  sunsetISO: string;
}

// WMO weather codes (Open-Meteo's `weather_code`) collapsed into the
// broader categories the frontend has an icon for.
function codeToCondition(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "cloudy";
}

// Open-Meteo — free, no API key/signup required at all (unlike most
// weather APIs), which is why it's the one used here.
export async function GET() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,relative_humidity_2m` +
      `&daily=sunrise,sunset` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph` +
      `&timezone=America%2FNew_York`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

    const data = await res.json();
    const current = data.current;

    const weather: WeatherData = {
      tempF: Math.round(current.temperature_2m),
      feelsLikeF: Math.round(current.apparent_temperature),
      isDay: current.is_day === 1,
      condition: codeToCondition(current.weather_code),
      windMph: Math.round(current.wind_speed_10m),
      humidity: Math.round(current.relative_humidity_2m),
      sunriseISO: data.daily?.sunrise?.[0] ?? "",
      sunsetISO: data.daily?.sunset?.[0] ?? "",
    };

    return NextResponse.json(weather, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: true },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

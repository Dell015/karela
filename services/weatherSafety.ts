/**
 * Bayanihan Protocol, the automatic part (Tier 0 and Tier 1).
 *
 * aboutkarela.md: OpenWeatherMap handles Tier 0-1 automatically.
 *   Tier 0 Normal: no weather advisory.
 *   Tier 1 Watch:  wind > 40 km/h OR rainfall > 10 mm/hr.
 * Tier 2-4 are escalated by an admin from PAGASA bulletins and are not here.
 *
 * Thunderstorms (OpenWeatherMap condition ids 200-299) are also treated as
 * Watch: lightning is dangerous for runners even when wind and rain are low.
 *
 * Rule: Karela must never be the reason someone gets hurt. When in doubt,
 * do not tell the user to go outside.
 */

export type WeatherTier = 0 | 1;

/** The fields we read from an OpenWeatherMap "current weather" response (units=metric). */
export interface OwmCurrent {
  weather?: { id?: number }[];
  wind?: { speed?: number }; // m/s
  rain?: { "1h"?: number }; // mm in the last hour
}

const WIND_LIMIT_KMH = 40;
const RAIN_LIMIT_MM_PER_HR = 10;

export const getWeatherTier = (data: OwmCurrent): WeatherTier => {
  const windKmh = (data.wind?.speed ?? 0) * 3.6;
  const rainMm = data.rain?.["1h"] ?? 0;
  const isThunderstorm = (data.weather ?? []).some(
    (w) => (w.id ?? 0) >= 200 && (w.id ?? 0) < 300,
  );

  if (windKmh > WIND_LIMIT_KMH || rainMm > RAIN_LIMIT_MM_PER_HR || isThunderstorm) {
    return 1;
  }
  return 0;
};

const HOT_C = 30;

/**
 * Ani's one-line weather note on the dashboard. Never says "go run" unless
 * we actually know the weather is safe (Tier 0).
 */
export const getWeatherLine = (w: {
  status: "loading" | "ok" | "unavailable";
  tier: WeatherTier | null;
  desc: string;
  city: string;
  temp: string | number;
}): string => {
  if (w.status === "loading") return "Checking the weather...";
  if (w.status === "unavailable" || w.tier === null) {
    return "I can't get the weather right now. Check the sky before you head out.";
  }

  const desc = w.desc.charAt(0).toUpperCase() + w.desc.slice(1);
  const where = `${desc} in ${w.city}, ${w.temp}°C.`;

  if (w.tier >= 1) {
    return `${where} Strong wind, heavy rain or a storm. Stay in today. A short indoor stretch is a good option.`;
  }
  if (Number(w.temp) > HOT_C) {
    return `${where} It's hot, so go early or late and bring water.`;
  }
  return `${where} Safe for a run.`;
};

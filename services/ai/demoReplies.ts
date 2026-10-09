import { getRunsSince, RunRow } from "@/services/calendarData";
import { analyzeRuns } from "@/services/runAnalytics";
import { clockText, kmText, paceFor, paceText } from "@/services/runMath";

/**
 * Premade Ani replies for the chat screen's quick-reply buttons, for demos
 * and screenshots when Gemini can't answer (no key, bad key, offline).
 *
 * DEVELOPMENT BUILDS ONLY (`__DEV__`: Expo Go, `npx expo start`). A release
 * build never uses these, so real users never get a canned answer dressed
 * up as Ani's. Typed questions are never answered from here.
 *
 * The numbers come from the user's real runs (run_history) and profile. With
 * no runs, the replies say so instead of inventing any.
 *
 * Same rules as the real Ani (services/ai/aniPersona.ts): general wellness
 * coaching only, "approximately" for estimates, never a diagnosis.
 */

interface DemoContext {
  userId?: string;
  name?: string;
  stats?: { level?: number; streak?: number } | null;
}

const DAY_MS = 86_400_000;

const recentRuns = async (userId?: string): Promise<RunRow[]> => {
  if (!userId) return [];
  return (await getRunsSince(userId, new Date(Date.now() - 30 * DAY_MS))) ?? [];
};

const streakLine = (streak?: number) =>
  streak && streak > 1
    ? `You're on a ${streak}-day streak, so the main job is to keep it going, not to go faster.`
    : "One short run tomorrow starts a new streak.";

const howToStart = (name: string) =>
  [
    `Tara, ${name}! The best start is a small one.`,
    "",
    "For the first week, try 20 minutes, three times: walk 2 minutes, jog 1 minute, and repeat. Go at a pace where you can still talk. If you can't, slow down or walk. That still counts.",
    "",
    "Early morning or after 5 PM is cooler in Tuguegarao, and bring water.",
    "",
    "If you pass a blocked drain or a pile of trash on the way, you can report it from the Run map. It counts toward your quests just like the distance.",
  ].join("\n");

const analyzeLastRun = async (ctx: DemoContext, name: string) => {
  const runs = await recentRuns(ctx.userId);
  const last = runs[0];
  if (!last) return howToStart(name);

  const pace = paceFor(last.distance_meters, last.duration_seconds);
  const month = analyzeRuns(runs, 30);
  const lines = [
    `Here's your last run, ${name}: ${kmText(last.distance_meters)} km in ${clockText(last.duration_seconds)}${
      pace ? `, about ${paceText(pace)} per km` : ""
    }.`,
    "",
  ];
  if (pace && month.avgPaceS && runs.length > 1) {
    const diff = Math.round(month.avgPaceS - pace);
    lines.push(
      Math.abs(diff) < 10
        ? `That's right around your usual pace for the last 30 days (${paceText(month.avgPaceS)} per km). Steady is good.`
        : diff > 0
          ? `That's approximately ${diff} seconds per km quicker than your 30-day average (${paceText(month.avgPaceS)}). Nice work. Keep the next one easy so your legs can recover.`
          : `That's approximately ${-diff} seconds per km slower than your 30-day average (${paceText(month.avgPaceS)}). Easy days are part of the plan, so that's fine.`,
      "",
    );
  }
  lines.push(
    streakLine(ctx.stats?.streak),
    "",
    "Next time, try the first 5 minutes as a brisk walk to warm up. If anything hurts, rest, and see a health professional if it doesn't settle.",
  );
  return lines.join("\n");
};

const myProgress = async (ctx: DemoContext, name: string) => {
  const runs = await recentRuns(ctx.userId);
  const month = analyzeRuns(runs, 30);
  const level = ctx.stats?.level ?? 1;
  if (month.runs === 0) {
    return [
      `You're at level ${level}, ${name}. No runs in the last 30 days yet, so this is a fresh start.`,
      "",
      "Aim for three short sessions this week. Consistency beats intensity: a 20-minute walk every day does more than one long run and a week off.",
    ].join("\n");
  }
  return [
    `Last 30 days, ${name}: ${month.totalKm.toFixed(1)} km over ${month.runs} ${month.runs === 1 ? "run" : "runs"} on ${month.activeDays} ${
      month.activeDays === 1 ? "day" : "days"
    }${month.avgPaceS ? `, at about ${paceText(month.avgPaceS)} per km on average` : ""}. You're level ${level}.`,
    "",
    streakLine(ctx.stats?.streak),
    "",
    "For the next two weeks, add a little at a time, roughly 10% more distance per week at most. Kaya mo 'yan.",
  ].join("\n");
};

const bestShoes = (name: string) =>
  [
    `Good question, ${name}. You don't need an expensive pair. Fit matters more than the brand.`,
    "",
    "Look for a thumb's width of space at the toes, a heel that doesn't slip, and enough cushioning to feel comfortable on concrete. Try them on in the afternoon, when your feet are a little bigger.",
    "",
    "Most running shoes last approximately 500 to 800 km. If yours feel flat or your legs ache more than usual after runs, it may be time for a new pair, and if the ache stays, check with a health professional.",
  ].join("\n");

const DEMO_QUESTIONS = ["how to start?", "analyze my last run", "my progress", "best shoes for me?"];

/** True when demoReply would answer this question (development builds only). */
export const hasDemoReply = (question: string) => __DEV__ && DEMO_QUESTIONS.includes(question.trim().toLowerCase());

/**
 * A premade reply for one of the quick-reply buttons, or null (release
 * build, or a typed question).
 */
export const demoReply = async (question: string, ctx: DemoContext): Promise<string | null> => {
  if (!hasDemoReply(question)) return null;
  const name = ctx.name?.split(" ")[0] || "Strider";
  switch (question.trim().toLowerCase()) {
    case "how to start?":
      return howToStart(name);
    case "analyze my last run":
      return analyzeLastRun(ctx, name);
    case "my progress":
      return myProgress(ctx, name);
    case "best shoes for me?":
      return bestShoes(name);
    default:
      return null;
  }
};

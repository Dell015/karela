import type { KarelaIconName } from "@/components/icons/KarelaIcon";

/**
 * Things bought with real money: Gem packs and the Scout Pass.
 *
 * Owner decision (2026-10-09): Gems are earned by playing AND can be bought.
 * The Scout Pass is the spec's seasonal pass (aboutkarela.md section 24:
 * ₱149 for a 90-day season).
 *
 * SCREENS ONLY FOR NOW. Nothing here charges money. STORE_OPEN stays false
 * until Karela is published and Google Play / App Store billing is wired up,
 * with every receipt checked on the server before Gems are added. Until
 * then, Buy says plainly that purchases aren't open and that nothing was
 * charged. Never fake a purchase.
 *
 * Prices are a first proposal, set on 2026-10-09 (the owner asked for
 * prices that are fair and cheap for people in the Philippines):
 *   - the smallest pack is ₱49, about one milk tea
 *   - running earns about 10 Gems per km, a Streak Freeze is 80 Gems and
 *     cosmetics are 300 / 600 Gems, so ₱49 covers a freeze and ₱99 a common
 *     cosmetic
 *   - bigger packs give a little more per peso
 *   - the stores keep about 15% of each sale
 * Change them here. When billing is built, the stores' own product prices
 * become the source of truth and these become display fallbacks.
 */

export const STORE_OPEN = false;

export const STORE_CLOSED_TITLE = "Not open yet";
export const STORE_CLOSED_MESSAGE =
  "Gem packs and the Scout Pass open when Karela is on Google Play and the App Store. Nothing was charged.";

export interface GemPack {
  /** the store product id to create in Play Console / App Store Connect */
  productId: string;
  gems: number;
  pesos: number;
  note?: string;
}

export const GEM_PACKS: GemPack[] = [
  { productId: "karela_gems_120", gems: 120, pesos: 49 },
  { productId: "karela_gems_300", gems: 300, pesos: 99 },
  { productId: "karela_gems_650", gems: 650, pesos: 199, note: "Popular" },
  { productId: "karela_gems_1400", gems: 1400, pesos: 399, note: "Best value" },
];

/** "₱49" */
export const pesoText = (n: number) => `₱${n.toLocaleString("en-PH")}`;

// ---------- Scout Pass ----------

export const SCOUT_PASS = {
  productId: "karela_scout_pass_s1",
  pesos: 149,
  days: 90,
  /** From aboutkarela.md section 24, "Stream 2". */
  benefits: [
    { icon: "gem", title: "+20% Gems from sector bonuses", body: "For the whole season, on every run." },
    { icon: "trail", title: "Rare map trails", body: "Season-only trail colours for your run line." },
    { icon: "star", title: "Exclusive Ani outfits", body: "Dress Ani in this season's looks." },
    { icon: "civic", title: "Early access to new quest types", body: "Try new quests before everyone else." },
    { icon: "medal", title: "A season badge", body: "Shows on your profile, for good." },
  ] as { icon: KarelaIconName; title: string; body: string }[],
  /** What stays after the season ends (spec: cosmetics are permanent). */
  keepNote: "Everything you unlock is yours to keep. Only the +20% Gem rate ends with the season.",
};

/**
 * DRAFT for the owner to review (2026-10-09): season dates and the reward
 * track below were proposed by Claude, not taken from the spec.
 */
export const SEASON = {
  name: "Season 1",
  /** Manila date the season starts; it lasts SCOUT_PASS.days. */
  startsOn: "2026-10-01",
};

export const seasonEnds = () => {
  const d = new Date(`${SEASON.startsOn}T00:00:00+08:00`);
  d.setDate(d.getDate() + SCOUT_PASS.days - 1);
  return d;
};

/**
 * Season XP needed per level. Season XP is the XP earned from runs since the
 * season started. Someone running about 3 km three times a week earns
 * roughly 1,000 to 1,400 XP a week with their streak bonus, so they finish
 * the track in about 11 to 13 weeks; a daily walker gets there sooner.
 */
export const XP_PER_LEVEL = 750;

export type RewardKind = "gems" | "freeze" | "boost" | "trail" | "frame" | "badge" | "ani";

export interface Reward {
  kind: RewardKind;
  label: string;
  /** for gems */
  amount?: number;
}

export interface TrackLevel {
  level: number;
  free: Reward | null;
  pass: Reward;
}

const gems = (amount: number): Reward => ({ kind: "gems", label: `${amount} Gems`, amount });
const freeze: Reward = { kind: "freeze", label: "Streak Freeze" };

/** 20 levels. Free rewards on most even levels, a Scout Pass reward on every level. */
export const SEASON_TRACK: TrackLevel[] = [
  { level: 1, free: null, pass: { kind: "badge", label: "Season 1 badge" } },
  { level: 2, free: gems(20), pass: gems(40) },
  { level: 3, free: null, pass: freeze },
  { level: 4, free: gems(20), pass: gems(50) },
  { level: 5, free: freeze, pass: { kind: "trail", label: "Sunrise trail" } },
  { level: 6, free: null, pass: gems(60) },
  { level: 7, free: gems(30), pass: freeze },
  { level: 8, free: null, pass: { kind: "frame", label: "Season 1 frame" } },
  { level: 9, free: gems(30), pass: gems(70) },
  { level: 10, free: freeze, pass: { kind: "ani", label: "Ani outfit: season jacket" } },
  { level: 11, free: null, pass: gems(80) },
  { level: 12, free: gems(40), pass: freeze },
  { level: 13, free: null, pass: { kind: "trail", label: "River trail" } },
  { level: 14, free: gems(40), pass: gems(90) },
  { level: 15, free: freeze, pass: { kind: "boost", label: "Bayanihan Boost" } },
  { level: 16, free: null, pass: gems(100) },
  { level: 17, free: gems(50), pass: freeze },
  { level: 18, free: null, pass: { kind: "frame", label: "Season 1 gold frame" } },
  { level: 19, free: gems(50), pass: gems(120) },
  { level: 20, free: gems(100), pass: { kind: "ani", label: "Ani outfit: season finisher" } },
];

export const REWARD_ICON: Record<RewardKind, KarelaIconName> = {
  gems: "gem",
  freeze: "freeze",
  boost: "bayanihan",
  trail: "trail",
  frame: "frame",
  badge: "medal",
  ani: "star",
};

/** Level reached (0 to 20) and progress toward the next one. */
export const seasonLevel = (seasonXp: number) => {
  const max = SEASON_TRACK.length;
  const xp = Math.max(0, Math.floor(seasonXp));
  const level = Math.min(max, Math.floor(xp / XP_PER_LEVEL));
  const intoLevel = level >= max ? XP_PER_LEVEL : xp % XP_PER_LEVEL;
  return { level, intoLevel, max };
};

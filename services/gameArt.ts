import type { ImageSourcePropType } from "react-native";

/**
 * Low-poly 3D art for Shop items and guild badges, rendered from three.js
 * like Ani's sprites (see scripts/render-game-art). Re-render rather than
 * hand-edit. Each file is about 4 KB.
 */
export const GAME_ART: Record<string, ImageSourcePropType> = {
  badge_bayanihan_heart: require("@/assets/images/game/badge_bayanihan_heart.webp"),
  badge_century_walkers: require("@/assets/images/game/badge_century_walkers.webp"),
  badge_iron_streak: require("@/assets/images/game/badge_iron_streak.webp"),
  badge_pioneer: require("@/assets/images/game/badge_pioneer.webp"),
  badge_vanguard_guild: require("@/assets/images/game/badge_vanguard_guild.webp"),
  bayanihan_boost: require("@/assets/images/game/bayanihan_boost.webp"),
  frame_aqua: require("@/assets/images/game/frame_aqua.webp"),
  frame_ember: require("@/assets/images/game/frame_ember.webp"),
  frame_gold: require("@/assets/images/game/frame_gold.webp"),
  gem: require("@/assets/images/game/gem.webp"),
  streak_freeze: require("@/assets/images/game/streak_freeze.webp"),
  streak_repair: require("@/assets/images/game/streak_repair.webp"),
  territory_boost: require("@/assets/images/game/territory_boost.webp"),
  trail_aqua: require("@/assets/images/game/trail_aqua.webp"),
  trail_gold: require("@/assets/images/game/trail_gold.webp"),
  trail_karela: require("@/assets/images/game/trail_karela.webp"),
  trail_sky: require("@/assets/images/game/trail_sky.webp"),
  trail_teal: require("@/assets/images/game/trail_teal.webp"),
};


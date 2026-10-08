/**
 * Gems: how they are earned on the phone.
 *
 * Gems are earned through:
 * - Sector Bonuses: 5 gems per 500 m sector of a run
 * - Civic reports: 5 when sent, 20 when neighbours confirm it (maps.tsx)
 * - B2B QR Scans: 20 gems (future)
 * - Vanguard Reviews: 10 gems (future)
 *
 * Gems are NOT multiplied by the streak multiplier (flat rate). A guild with
 * the Century Walkers badge earns 5% more (services/buffs.ts).
 *
 * What Gems buy, and for how much, lives on the server in shop_items
 * (supabase/10_streak_protection_and_shop.sql), so prices can change without
 * an app update. Every purchase is checked there.
 *
 * Not built yet: the seasonal cap (Gems above 500 at season end become
 * Legacy Tokens, aboutkarela.md).
 */

export const GEM_EARNINGS = {
  SECTOR_BONUS: 5,       // Per 500m sector
  B2B_SCAN: 20,          // QR scan at partner location
  VANGUARD_REVIEW: 10,   // Reviewing a civic submission
} as const;

/**
 * Calculate how many 500m sectors exist in a run.
 */
export const getTotalSectors = (distanceMeters: number): number => {
  return Math.floor(distanceMeters / 500);
};

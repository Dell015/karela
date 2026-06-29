/**
 * Gems Economy System
 *
 * Gems are earned through:
 * - Sector Bonuses: 5 gems per 500m sector where user beats the Ghost
 * - B2B QR Scans: 20 gems (future)
 * - Vanguard Reviews: 10 gems (future)
 *
 * Gems are NOT multiplied by the streak multiplier (flat rate).
 *
 * Gems can be spent on:
 * - Streak Freeze: 80 gems (protects streak for 1 day)
 * - Squad Shield: 200 gems (future)
 * - Territory Defense Boost: 150 gems (future)
 * - Map Trail Cosmetics: 300–600 gems (future)
 *
 * Seasonal cap: Gems above 500 at season-end convert to Legacy Tokens.
 */

export const GEM_PRICES = {
  STREAK_FREEZE: 80,
  SQUAD_SHIELD: 200,
  TERRITORY_BOOST: 150,
  COSMETIC_BASIC: 300,
  COSMETIC_RARE: 600,
} as const;

export const GEM_EARNINGS = {
  SECTOR_BONUS: 5,       // Per 500m sector beating the ghost
  B2B_SCAN: 20,          // QR scan at partner location
  VANGUARD_REVIEW: 10,   // Reviewing a civic submission
} as const;

export const SEASONAL_GEM_CAP = 500;

/**
 * Calculate sector bonuses earned from a ghost race.
 * A "sector" is every 500m. User earns gems for each sector
 * where they were ahead of (or matched) the ghost.
 *
 * @param totalDistance - total distance run in meters
 * @param sectorsWon - number of 500m sectors where user beat the ghost
 * @returns total gems earned
 */
export const calculateSectorGems = (
  totalDistance: number,
  sectorsWon: number
): number => {
  return sectorsWon * GEM_EARNINGS.SECTOR_BONUS;
};

/**
 * Calculate how many 500m sectors exist in a run.
 */
export const getTotalSectors = (distanceMeters: number): number => {
  return Math.floor(distanceMeters / 500);
};

/**
 * Check if user can afford a purchase.
 */
export const canAfford = (currentGems: number, price: number): boolean => {
  return currentGems >= price;
};

/**
 * Calculates gems remaining after a purchase. Returns null if can't afford.
 */
export const purchaseItem = (
  currentGems: number,
  price: number
): number | null => {
  if (!canAfford(currentGems, price)) return null;
  return currentGems - price;
};

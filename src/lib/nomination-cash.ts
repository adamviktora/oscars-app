// Cash rewards (Kč) per category after Oscar night announcement.
// Index 0 = 1st place, index 1 = 2nd place, etc.
// If a user tipped the winner on Nth place, they receive the Nth amount.

const TIER_7: number[] = [7, 3, 2, 1, 0];
const TIER_8: number[] = [8, 3, 2, 1, 0];
const TIER_9: number[] = [9, 4, 2, 1, 0];
const TIER_11: number[] = [11, 5, 3, 1, 0];
const TIER_13: number[] = [13, 6, 3, 1, 0];
const TIER_16: number[] = [16, 8, 4, 1, 0];
const TIER_20: number[] = [20, 10, 5, 2, 0];
const TIER_BEST_PICTURE: number[] = [69, 34, 23, 16, 11, 7, 4, 2, 1, 0];

export const NOMINATION_CASH: Record<string, number[]> = {
  // Masky, Vizuální efekty, Nejlepší krátkometrážní dokument
  'makeup': TIER_7,
  'visual-effects': TIER_7,
  'short-documentary': TIER_7,

  // Kostýmy, Zvuk, Nejlepší krátkometrážní animovaný film
  'costume-design': TIER_8,
  'sound': TIER_8,
  'short-animated': TIER_8,

  // Píseň, Výprava, Nejlepší krátkometrážní hraný film
  'song': TIER_9,
  'production-design': TIER_9,
  'short-live-action': TIER_9,

  // Střih, Hudba, Nejlepší celovečerní dokument
  'film-editing': TIER_11,
  'music': TIER_11,
  'documentary': TIER_11,

  // Herec ve vedlejší roli, Herečka ve vedlejší roli, Kamera, Nejlepší animovaný film
  'supporting-actor': TIER_13,
  'supporting-actress': TIER_13,
  'camera': TIER_13,
  'animated-feature': TIER_13,

  // Casting, Původní scénář, Adaptovaný scénář, Nejlepší mezinárodní film
  'casting': TIER_16,
  'original-screenplay': TIER_16,
  'adapted-screenplay': TIER_16,
  'international': TIER_16,

  // Režie, Herec v hlavní roli, Herečka v hlavní roli
  'director': TIER_20,
  'actor': TIER_20,
  'actress': TIER_20,

  // Nejlepší film
  'best-picture': TIER_BEST_PICTURE,
};

/**
 * Returns the cash reward for a given category slug and the position
 * where the user tipped the actual winner (1-based).
 * Returns 0 if the category is unknown or the position is out of range.
 */
export function getNominationCashReward(categorySlug: string, position: number): number {
  const tier = NOMINATION_CASH[categorySlug];
  if (!tier) return 0;
  const index = position - 1;
  if (index < 0 || index >= tier.length) return 0;
  return tier[index];
}

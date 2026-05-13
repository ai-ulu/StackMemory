export const DECAY_HALF_LIFE_DAYS = 30;

export function calculateDecayScore(lastAccessed: string | null, createdAt: string): number {
  const referenceDate = lastAccessed || createdAt;

  if (!referenceDate) return 0.5;

  const ageInDays = (Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24);

  return Math.exp(-ageInDays / DECAY_HALF_LIFE_DAYS);
}

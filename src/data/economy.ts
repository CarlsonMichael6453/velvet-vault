export const WELCOME_COINS = 8_000;
export const JACKPOT_SEED = 250_000;
export const JACKPOT_RAKE = 0.12;
export const HOURLY_MS = 60 * 60 * 1000;
export const HOURLY_COINS = 400;
export const DRAW_TICKET_PRICE = 200;
export const MAX_LEVEL = 40;

export const DAILY_REWARDS = [800, 1_000, 1_400, 1_800, 2_400, 3_500, 7_000];

export const WHEEL_PRIZES = [300, 500, 800, 1_200, 1_800, 2_500, 5_000, 10_000];

export const VIP_TIERS = [
  { id: 'bronze', name: 'Bronze', min: 0, multiplier: 1, perk: 'Standard bonuses' },
  { id: 'silver', name: 'Silver', min: 5_000, multiplier: 1.05, perk: '+5% daily, hourly, and wheel coins' },
  { id: 'gold', name: 'Gold', min: 25_000, multiplier: 1.1, perk: '+10% daily, hourly, and wheel coins' },
  { id: 'platinum', name: 'Platinum', min: 100_000, multiplier: 1.15, perk: '+15% daily, hourly, and wheel coins' },
  { id: 'diamond', name: 'Diamond', min: 400_000, multiplier: 1.25, perk: '+25% daily, hourly, and wheel coins' },
] as const;

export type VipTierId = (typeof VIP_TIERS)[number]['id'];

const MAX_BET_LADDER = [
  { level: 1, bet: 100 },
  { level: 2, bet: 250 },
  { level: 4, bet: 500 },
  { level: 6, bet: 1_000 },
  { level: 9, bet: 2_500 },
  { level: 12, bet: 5_000 },
  { level: 16, bet: 10_000 },
  { level: 22, bet: 20_000 },
];

export function xpToNext(level: number): number {
  return Math.round(70 * Math.pow(level, 1.32));
}

export function levelFromXp(xp: number): { level: number; into: number; next: number } {
  let level = 1;
  let remaining = Math.max(0, xp);
  while (level < MAX_LEVEL) {
    const need = xpToNext(level);
    if (remaining < need) return { level, into: remaining, next: need };
    remaining -= need;
    level += 1;
  }
  return { level: MAX_LEVEL, into: 1, next: 1 };
}

export function maxBetForLevel(level: number): number {
  let bet = MAX_BET_LADDER[0].bet;
  for (const step of MAX_BET_LADDER) {
    if (level >= step.level) bet = step.bet;
  }
  return bet;
}

export function nextBetUnlock(level: number): { level: number; bet: number } | null {
  return MAX_BET_LADDER.find((step) => step.level > level) ?? null;
}

export function levelTitle(level: number): string {
  if (level >= 30) return 'Vault Legend';
  if (level >= 22) return 'High Society';
  if (level >= 16) return 'Diamond Guest';
  if (level >= 12) return 'Pit Boss';
  if (level >= 9) return 'High Roller';
  if (level >= 6) return 'Regular';
  if (level >= 3) return 'Night Owl';
  return 'New Face';
}

export function vipFromPoints(points: number): {
  id: VipTierId;
  name: string;
  min: number;
  multiplier: number;
  perk: string;
  points: number;
  next: { name: string; min: number } | null;
} {
  let current: (typeof VIP_TIERS)[number] = VIP_TIERS[0];
  for (const tier of VIP_TIERS) {
    if (points >= tier.min) current = tier;
  }
  const index = VIP_TIERS.findIndex((tier) => tier.id === current.id);
  const next = VIP_TIERS[index + 1];
  return {
    ...current,
    points,
    next: next ? { name: next.name, min: next.min } : null,
  };
}

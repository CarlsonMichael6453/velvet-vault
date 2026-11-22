/** Seasonal windows. Swap or append a holiday by date; the shop and home read whatever is active. */

export type HolidayDef = {
  id: string;
  name: string;
  /** Inclusive YYYY-MM-DD. */
  start: string;
  /** Inclusive YYYY-MM-DD. */
  end: string;
  productId: string;
  themeId: string;
  banner: string;
};

export const HOLIDAYS: HolidayDef[] = [
  {
    id: 'yule-2026',
    name: 'Hearth & Holly',
    start: '2026-11-15',
    end: '2027-01-06',
    productId: 'holiday.hearth',
    themeId: 'hearth',
    banner: 'Hearth & Holly is in the shop through Twelfth Night. Coins only, no cash value.',
  },
];

export function activeHoliday(today: string): HolidayDef | null {
  return HOLIDAYS.find((holiday) => today >= holiday.start && today <= holiday.end) ?? null;
}

export const SEASON = {
  id: 'velvet-1',
  name: 'Velvet Season',
  start: '2026-11-01',
  days: 30,
  productId: 'season.velvet',
  styleId: 'gilded',
} as const;

/** 1-based day inside the season, or null outside the window. */
export function seasonDayIndex(today: string): number | null {
  const start = Date.parse(`${SEASON.start}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(now)) return null;
  const diff = Math.round((now - start) / 86_400_000);
  if (diff < 0 || diff >= SEASON.days) return null;
  return diff + 1;
}

export function seasonReward(day: number, track: 'free' | 'premium'): number {
  if (track === 'free') return 150 + day * 50;
  return day === SEASON.days ? 12_000 : 400 + day * 100;
}

export const AD_REWARD = 200;
export const AD_DAILY_CAP = 3;

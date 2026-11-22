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

/** One entry per month, then the list repeats. November 2026 is the first. */
export const SEASON_ROTATION = [
  { styleId: 'gilded', name: 'Gilded Season' },
  { styleId: 'frostline', name: 'Frost Line' },
  { styleId: 'rosecourt', name: 'Rose Court' },
  { styleId: 'inkwell', name: 'Inkwell' },
  { styleId: 'marigold', name: 'Marigold' },
  { styleId: 'tideglass', name: 'Tideglass' },
] as const;

export const SEASON_STYLE_IDS = new Set<string>(SEASON_ROTATION.map((item) => item.styleId));

/** The track is 30 days, and never runs into the next month. */
export const SEASON_TRACK_DAYS = 30;
export const SEASON_PRODUCT_ID = 'season.pass';

export type Season = {
  id: string;
  name: string;
  start: string;
  days: number;
  /** 1-based claim day, or null on a 31st after the 30-day track. */
  day: number | null;
  productId: typeof SEASON_PRODUCT_ID;
  styleId: (typeof SEASON_ROTATION)[number]['styleId'];
};

const FIRST_SEASON = 2026 * 12 + 10;

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The season for a calendar month. A new one starts on the 1st, every month. */
export function seasonFor(today: string): Season {
  const [year, month, day] = today.split('-').map(Number);
  const safeYear = year || 2026;
  const safeMonth = month || 1;
  const safeDay = day || 1;
  const index = safeYear * 12 + (safeMonth - 1);
  const rotation = SEASON_ROTATION[((index - FIRST_SEASON) % SEASON_ROTATION.length + SEASON_ROTATION.length) % SEASON_ROTATION.length];
  const id = `${safeYear}-${String(safeMonth).padStart(2, '0')}`;
  const days = Math.min(SEASON_TRACK_DAYS, daysInMonth(safeYear, safeMonth));
  return {
    id,
    name: rotation.name,
    start: `${id}-01`,
    days,
    day: safeDay >= 1 && safeDay <= days ? safeDay : null,
    productId: SEASON_PRODUCT_ID,
    styleId: rotation.styleId,
  };
}

export function seasonById(id: string): Season | null {
  if (!/^\d{4}-\d{2}$/.test(id)) return null;
  return seasonFor(`${id}-01`);
}

/** 1-based day inside this month's track, or null after it (the 31st). */
export function seasonDayIndex(today: string): number | null {
  return seasonFor(today).day;
}

export function seasonReward(day: number, track: 'free' | 'premium', days = SEASON_TRACK_DAYS): number {
  if (track === 'free') return 150 + day * 50;
  return day === days ? 12_000 : 400 + day * 100;
}

export function seasonPassKey(seasonId: string): string {
  return `${SEASON_PRODUCT_ID}@${seasonId}`;
}

export const AD_REWARD = 200;
export const AD_DAILY_CAP = 3;

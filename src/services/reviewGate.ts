import { REVIEW_COOLDOWN_DAYS } from '@/src/config';

export type ReviewGateInput = {
  /** App launches so far, including the current one. The first launch is 1. */
  sessions: number;
  /** Calendar day (YYYY-MM-DD) the native prompt was last requested, if ever. */
  lastPromptOn: string | null;
  /** Calendar day the positive moment happened. */
  today: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(fromDay: string, toDay: string): number | null {
  const from = parseDay(fromDay);
  const to = parseDay(toDay);
  if (from === null || to === null) return null;
  return Math.round((to - from) / DAY_MS);
}

/**
 * A review may be requested only after the player has launched the app before
 * this session, and only when 90 days have passed since the last request.
 * Calling this at launch is not enough: the caller must wait for a positive moment.
 */
export function reviewGateAllows(input: ReviewGateInput): boolean {
  if (!Number.isFinite(input.sessions) || input.sessions < 2) return false;
  if (!input.lastPromptOn) return true;
  const elapsed = daysBetween(input.lastPromptOn, input.today);
  if (elapsed === null || elapsed < REVIEW_COOLDOWN_DAYS) return false;
  return true;
}

function parseDay(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return utc;
}

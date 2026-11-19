import { JACKPOT_SEED } from '@/src/data/economy';
import { shuffle } from '@/src/lib/random';

export const MAIN_POOL = 20;
export const MAIN_PICKS = 5;
export const STAR_POOL = 5;

export type Ticket = { main: number[]; star: number };

export type DrawResult = {
  main: number[];
  star: number;
};

export type TicketScore = {
  ticket: Ticket;
  mainMatches: number;
  starMatch: boolean;
  amount: number;
  jackpotWon: boolean;
  label: string;
};

export function quickPick(rng: () => number = Math.random): Ticket {
  const main = shuffle(
    Array.from({ length: MAIN_POOL }, (_, i) => i + 1),
    rng,
  )
    .slice(0, MAIN_PICKS)
    .sort((a, b) => a - b);
  return { main, star: 1 + Math.floor(rng() * STAR_POOL) };
}

export function drawResult(rng: () => number = Math.random): DrawResult {
  const main = shuffle(
    Array.from({ length: MAIN_POOL }, (_, i) => i + 1),
    rng,
  ).slice(0, MAIN_PICKS);
  return { main, star: 1 + Math.floor(rng() * STAR_POOL) };
}

/**
 * Pays are tuned for a 200-coin ticket against a 5-of-20 plus 1-of-5 draw.
 * The progressive jackpot replaces the 5+star prize and then resets.
 */
export function scoreTicket(ticket: Ticket, draw: DrawResult, jackpot: number): TicketScore {
  const drawn = new Set(draw.main);
  const mainMatches = ticket.main.filter((n) => drawn.has(n)).length;
  const starMatch = ticket.star === draw.star;
  let amount = 0;
  let jackpotWon = false;
  let label = 'No win';

  if (mainMatches >= 5 && starMatch) {
    amount = jackpot;
    jackpotWon = true;
    label = 'Jackpot';
  } else if (mainMatches >= 5) {
    amount = 100_000;
    label = 'Five numbers';
  } else if (mainMatches === 4) {
    amount = 8_000 + (starMatch ? 10_000 : 0);
    label = starMatch ? 'Four + star' : 'Four numbers';
  } else if (mainMatches === 3) {
    amount = 800 + (starMatch ? 1_000 : 0);
    label = starMatch ? 'Three + star' : 'Three numbers';
  } else if (mainMatches === 2) {
    amount = 150 + (starMatch ? 200 : 0);
    label = starMatch ? 'Two + star' : 'Two numbers';
  } else if (starMatch) {
    amount = 80;
    label = 'Vault star';
  }

  return { ticket, mainMatches, starMatch, amount, jackpotWon, label };
}

export function scoreTickets(tickets: Ticket[], draw: DrawResult, jackpot: number): { scores: TicketScore[]; prize: number; jackpotWon: boolean; nextJackpot: number } {
  let jackpotLeft = jackpot;
  let jackpotWon = false;
  const scores = tickets.map((ticket) => {
    const score = scoreTicket(ticket, draw, jackpotLeft);
    if (score.jackpotWon) {
      jackpotWon = true;
      jackpotLeft = JACKPOT_SEED;
    }
    return score;
  });
  const prize = scores.reduce((sum, score) => sum + score.amount, 0);
  return { scores, prize, jackpotWon, nextJackpot: jackpotLeft };
}

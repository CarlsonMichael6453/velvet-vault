import { mulberry32 } from '@/src/lib/random';

export type SymbolId =
  | 'low1'
  | 'low2'
  | 'low3'
  | 'mid1'
  | 'mid2'
  | 'mid3'
  | 'high1'
  | 'high2'
  | 'wild'
  | 'scatter';

export type Payouts = Partial<Record<2 | 3 | 4 | 5, number>>;

export type SymbolDef = {
  id: SymbolId;
  label: string;
  icon: string;
  weight: number;
  payouts: Payouts;
};

export type Machine = {
  id: string;
  name: string;
  tagline: string;
  family: 'classic' | 'midnight' | 'neon' | 'pharaoh' | 'dragon' | 'cosmos' | 'diamond';
  accent: string;
  levelRequired: number;
  reels: 3 | 5;
  rows: 3;
  paylines: number[][];
  symbols: SymbolDef[];
  strips: SymbolId[][];
  volatility: 'Low' | 'Medium' | 'High';
  /** Extra multiplier applied on top of the scatter award while free spins run. */
  freeSpinBonus: number;
};

export type LineWin = {
  lineIndex: number;
  symbol: SymbolId;
  count: number;
  amount: number;
  positions: { reel: number; row: number }[];
};

export type SpinEvaluation = {
  grid: SymbolId[][];
  lineWins: LineWin[];
  scatterCount: number;
  scatterPay: number;
  freeSpinsAwarded: number;
  awardedMultiplier: number;
  totalWin: number;
};

export function buildStrips(symbols: SymbolDef[], reels: number, seed: number, length = 42): SymbolId[][] {
  return Array.from({ length: reels }, (_, reel) => {
    const rng = mulberry32(seed + reel * 9973);
    const bag: SymbolId[] = [];
    for (const symbol of symbols) {
      for (let i = 0; i < symbol.weight; i++) bag.push(symbol.id);
    }
    return Array.from({ length }, () => bag[Math.floor(rng() * bag.length)]);
  });
}

export function spinGrid(machine: Machine, rng: () => number = Math.random): SymbolId[][] {
  const bag: SymbolId[] = [];
  for (const symbol of machine.symbols) {
    for (let i = 0; i < symbol.weight; i++) bag.push(symbol.id);
  }
  return Array.from({ length: machine.reels }, () =>
    Array.from({ length: machine.rows }, () => bag[Math.floor(rng() * bag.length)]),
  );
}

function symbolById(machine: Machine, id: SymbolId): SymbolDef {
  const found = machine.symbols.find((symbol) => symbol.id === id);
  if (!found) throw new Error(`Missing symbol ${id} on ${machine.id}`);
  return found;
}

/** Left-to-right pay. Wilds substitute. Scatters break the line and never pay on it. */
export function evaluateLine(symbols: SymbolId[], machine: Machine): { symbol: SymbolId; count: number; indexes: number[] } | null {
  if (symbols[0] === 'scatter') return null;
  let target: SymbolId | null = symbols[0] === 'wild' ? null : symbols[0];
  const indexes: number[] = [];
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    if (symbol === 'scatter') break;
    if (symbol === 'wild' || target === null || symbol === target) {
      if (symbol !== 'wild' && target === null) target = symbol;
      indexes.push(i);
      continue;
    }
    break;
  }
  const paySymbol: SymbolId = target ?? 'wild';
  const count = indexes.length as 2 | 3 | 4 | 5;
  const multiplier = symbolById(machine, paySymbol).payouts[count];
  if (!multiplier) return null;
  return { symbol: paySymbol, count, indexes };
}

export const FREE_SPIN_CAP = 18;

export function scatterAward(count: number, freeSpinBonus: number): { payMult: number; spins: number; multiplier: number } {
  if (count >= 5) return { payMult: 12, spins: 8, multiplier: 3 + freeSpinBonus };
  if (count === 4) return { payMult: 4, spins: 6, multiplier: 2 + freeSpinBonus };
  if (count === 3) return { payMult: 1, spins: 5, multiplier: 2 + freeSpinBonus };
  return { payMult: 0, spins: 0, multiplier: 1 };
}

export function evaluateSpin(
  machine: Machine,
  grid: SymbolId[][],
  totalBet: number,
  activeMultiplier = 1,
): SpinEvaluation {
  const lineBet = totalBet / machine.paylines.length;
  const lineWins: LineWin[] = [];
  machine.paylines.forEach((line, lineIndex) => {
    const symbols = line.map((row, reel) => grid[reel][row]);
    const hit = evaluateLine(symbols, machine);
    if (!hit) return;
    const lineMultiplier = symbolById(machine, hit.symbol).payouts[hit.count as 2 | 3 | 4 | 5] ?? 0;
    lineWins.push({
      lineIndex,
      symbol: hit.symbol,
      count: hit.count,
      amount: lineMultiplier * lineBet * activeMultiplier,
      positions: hit.indexes.map((reel) => ({ reel, row: line[reel] })),
    });
  });

  let scatterCount = 0;
  for (const reel of grid) {
    for (const symbol of reel) if (symbol === 'scatter') scatterCount += 1;
  }
  const award = scatterAward(scatterCount, machine.freeSpinBonus);
  const scatterPay = award.payMult * totalBet * activeMultiplier;
  const totalWin = lineWins.reduce((sum, win) => sum + win.amount, 0) + scatterPay;

  return {
    grid,
    lineWins,
    scatterCount,
    scatterPay,
    freeSpinsAwarded: award.spins,
    awardedMultiplier: award.spins > 0 ? award.multiplier : activeMultiplier,
    totalWin,
  };
}

export function celebrationFor(amount: number, bet: number): 'big' | 'mega' | 'ultra' | 'jackpot' | null {
  if (bet <= 0 || amount <= 0) return null;
  const multiple = amount / bet;
  if (multiple >= 100) return 'jackpot';
  if (multiple >= 50) return 'ultra';
  if (multiple >= 25) return 'mega';
  if (multiple >= 10) return 'big';
  return null;
}

export function symbolLabel(machine: Machine, id: SymbolId): string {
  return symbolById(machine, id).label;
}

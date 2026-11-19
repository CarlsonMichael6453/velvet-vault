import { maxBetForLevel } from '@/src/data/economy';
import { buildStrips, type Machine, type Payouts, type SymbolDef, type SymbolId } from '@/src/games/slots/engine';

export const LINES_3: number[][] = [
  [1, 1, 1],
  [0, 0, 0],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
];

export const LINES_20: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [0, 2, 1, 2, 0],
];

const PAY3: Record<SymbolId, Payouts> = {
  low1: { 3: 13 },
  low2: { 3: 16 },
  low3: { 3: 21 },
  mid1: { 3: 32 },
  mid2: { 3: 46 },
  mid3: { 3: 71 },
  high1: { 3: 130 },
  high2: { 3: 240 },
  wild: { 3: 420 },
  scatter: {},
};

const PAY5: Record<SymbolId, Payouts> = {
  low1: { 3: 8, 4: 25, 5: 80 },
  low2: { 3: 8, 4: 28, 5: 90 },
  low3: { 3: 11, 4: 40, 5: 140 },
  mid1: { 3: 16, 4: 55, 5: 220 },
  mid2: { 3: 20, 4: 80, 5: 320 },
  mid3: { 3: 32, 4: 120, 5: 480 },
  high1: { 3: 55, 4: 220, 5: 940 },
  high2: { 3: 90, 4: 380, 5: 1600 },
  wild: { 3: 140, 4: 540, 5: 2600 },
  scatter: {},
};

type Family = Machine['family'];

const ICONS: Record<Family, Record<SymbolId, { label: string; icon: string }>> = {
  classic: {
    low1: { label: 'Cherry', icon: 'cherry' },
    low2: { label: 'Lemon', icon: 'lemon' },
    low3: { label: 'Plum', icon: 'plum' },
    mid1: { label: 'Bell', icon: 'bell' },
    mid2: { label: 'Bar', icon: 'bar' },
    mid3: { label: 'Star', icon: 'star' },
    high1: { label: 'Seven', icon: 'seven' },
    high2: { label: 'Crown', icon: 'crown' },
    wild: { label: 'Wild', icon: 'wild' },
    scatter: { label: 'Vault', icon: 'vault' },
  },
  midnight: {
    low1: { label: 'Rose', icon: 'rose' },
    low2: { label: 'Olive', icon: 'glass' },
    low3: { label: 'Plum', icon: 'plum' },
    mid1: { label: 'Bell', icon: 'bell' },
    mid2: { label: 'Dice', icon: 'dice' },
    mid3: { label: 'Star', icon: 'star' },
    high1: { label: 'Seven', icon: 'seven' },
    high2: { label: 'Crown', icon: 'crown' },
    wild: { label: 'Wild', icon: 'wild' },
    scatter: { label: 'Vault', icon: 'vault' },
  },
  neon: {
    low1: { label: 'Bolt', icon: 'bolt' },
    low2: { label: 'Cherry', icon: 'cherry' },
    low3: { label: 'Star', icon: 'star' },
    mid1: { label: 'Bell', icon: 'bell' },
    mid2: { label: 'Bar', icon: 'bar' },
    mid3: { label: 'Dice', icon: 'dice' },
    high1: { label: 'Seven', icon: 'seven' },
    high2: { label: 'Crown', icon: 'crown' },
    wild: { label: 'Wild', icon: 'wild' },
    scatter: { label: 'Vault', icon: 'vault' },
  },
  pharaoh: {
    low1: { label: 'Scarab', icon: 'scarab' },
    low2: { label: 'Eye', icon: 'eye' },
    low3: { label: 'Ankh', icon: 'ankh' },
    mid1: { label: 'Cat', icon: 'cat' },
    mid2: { label: 'Vase', icon: 'vase' },
    mid3: { label: 'Star', icon: 'star' },
    high1: { label: 'Pharaoh', icon: 'pharaoh' },
    high2: { label: 'Crown', icon: 'crown' },
    wild: { label: 'Wild', icon: 'wild' },
    scatter: { label: 'Vault', icon: 'vault' },
  },
  dragon: {
    low1: { label: 'Coin', icon: 'coin' },
    low2: { label: 'Fan', icon: 'fan' },
    low3: { label: 'Lantern', icon: 'lantern' },
    mid1: { label: 'Koi', icon: 'koi' },
    mid2: { label: 'Drum', icon: 'drum' },
    mid3: { label: 'Star', icon: 'star' },
    high1: { label: 'Dragon', icon: 'dragon' },
    high2: { label: 'Crown', icon: 'crown' },
    wild: { label: 'Wild', icon: 'wild' },
    scatter: { label: 'Vault', icon: 'vault' },
  },
  cosmos: {
    low1: { label: 'Comet', icon: 'comet' },
    low2: { label: 'Moon', icon: 'moon' },
    low3: { label: 'Star', icon: 'star' },
    mid1: { label: 'Planet', icon: 'planet' },
    mid2: { label: 'Asteroid', icon: 'asteroid' },
    mid3: { label: 'Gem', icon: 'gem' },
    high1: { label: 'Nova', icon: 'seven' },
    high2: { label: 'Crown', icon: 'crown' },
    wild: { label: 'Wild', icon: 'wild' },
    scatter: { label: 'Vault', icon: 'vault' },
  },
  diamond: {
    low1: { label: 'Heart', icon: 'heart' },
    low2: { label: 'Spade', icon: 'spade' },
    low3: { label: 'Club', icon: 'club' },
    mid1: { label: 'Diamond', icon: 'gem' },
    mid2: { label: 'Bell', icon: 'bell' },
    mid3: { label: 'Star', icon: 'star' },
    high1: { label: 'Seven', icon: 'seven' },
    high2: { label: 'Crown', icon: 'crown' },
    wild: { label: 'Wild', icon: 'wild' },
    scatter: { label: 'Vault', icon: 'vault' },
  },
};

const WEIGHTS: Record<SymbolId, number> = {
  low1: 18,
  low2: 16,
  low3: 14,
  mid1: 11,
  mid2: 9,
  mid3: 7,
  high1: 5,
  high2: 3,
  wild: 3,
  scatter: 3,
};

function symbolsFor(family: Family, pay: Record<SymbolId, Payouts>, weightBoost: Partial<Record<SymbolId, number>> = {}): SymbolDef[] {
  const icons = ICONS[family];
  return (Object.keys(WEIGHTS) as SymbolId[]).map((id) => ({
    id,
    label: icons[id].label,
    icon: icons[id].icon,
    weight: WEIGHTS[id] + (weightBoost[id] ?? 0),
    payouts: pay[id],
  }));
}

function make(
  partial: Omit<Machine, 'rows' | 'symbols' | 'strips'> & { pay: Record<SymbolId, Payouts>; weightBoost?: Partial<Record<SymbolId, number>>; seed: number },
): Machine {
  const symbols = symbolsFor(partial.family, partial.pay, partial.weightBoost);
  const { pay: _pay, weightBoost: _boost, seed, ...rest } = partial;
  return {
    ...rest,
    rows: 3,
    symbols,
    strips: buildStrips(symbols, partial.reels, seed, 240),
  };
}

export const MACHINES: Machine[] = [
  make({
    id: 'cherry-parlor',
    name: 'Cherry Parlor',
    tagline: 'Three reels, five lines, and the house lights still warm.',
    family: 'classic',
    accent: '#e23d5c',
    levelRequired: 1,
    reels: 3,
    paylines: LINES_3,
    volatility: 'Low',
    freeSpinBonus: 0,
    pay: PAY3,
    seed: 1101,
  }),
  make({
    id: 'midnight-bells',
    name: 'Midnight Bells',
    tagline: 'A quieter room. Twenty lines and a longer memory.',
    family: 'midnight',
    accent: '#d7c4a3',
    levelRequired: 2,
    reels: 5,
    paylines: LINES_20,
    volatility: 'Medium',
    freeSpinBonus: 0,
    pay: PAY5,
    seed: 2202,
  }),
  make({
    id: 'neon-nights',
    name: 'Neon Nights',
    tagline: 'Twenty lines under a sign that never quite turns off.',
    family: 'neon',
    accent: '#3ef0ff',
    levelRequired: 4,
    reels: 5,
    paylines: LINES_20,
    volatility: 'Medium',
    freeSpinBonus: 0,
    pay: PAY5,
    seed: 3303,
  }),
  make({
    id: 'pharaohs-chamber',
    name: "Pharaoh's Chamber",
    tagline: 'Sand on the rails. Twenty lines and a sealed tomb.',
    family: 'pharaoh',
    accent: '#3ec6c6',
    levelRequired: 6,
    reels: 5,
    paylines: LINES_20,
    volatility: 'High',
    freeSpinBonus: 0,
    pay: PAY5,
    seed: 4404,
  }),
  make({
    id: 'dragon-hoard',
    name: 'Dragon Hoard',
    tagline: 'High drama, twenty lines, and a jealous dragon.',
    family: 'dragon',
    accent: '#ffb15a',
    levelRequired: 8,
    reels: 5,
    paylines: LINES_20,
    volatility: 'High',
    freeSpinBonus: 0,
    pay: PAY5,
    seed: 5505,
  }),
  make({
    id: 'cosmic-well',
    name: 'Cosmic Well',
    tagline: 'The reels fall farther out here.',
    family: 'cosmos',
    accent: '#b9a6ff',
    levelRequired: 11,
    reels: 5,
    paylines: LINES_20,
    volatility: 'High',
    freeSpinBonus: 0,
    pay: PAY5,
    seed: 6606,
  }),
  make({
    id: 'diamond-salon',
    name: 'Diamond Salon',
    tagline: 'The last room. Higher bets, an extra wild, and brighter symbols.',
    family: 'diamond',
    accent: '#d7f4ff',
    levelRequired: 14,
    reels: 5,
    paylines: LINES_20,
    volatility: 'High',
    freeSpinBonus: 0,
    pay: PAY5,
    seed: 7707,
  }),
];

export function getMachine(id: string): Machine | undefined {
  return MACHINES.find((machine) => machine.id === id);
}

export const LINE_BETS = [2, 5, 10, 25, 50, 100, 250, 500];

export function betOptions(machine: Machine, level: number): number[] {
  const max = maxBetForLevel(level);
  const options = LINE_BETS.map((bet) => bet * machine.paylines.length).filter((total) => total <= max);
  return options.length > 0 ? options : [machine.paylines.length * LINE_BETS[0]];
}

import { mulberry32, pickWeighted, shuffle } from '@/src/lib/random';

export type ScratchStyle = 'match3' | 'sum' | 'rows';

export type PrizeTier = { amount: number; weight: number; title: string };

export type ScratchTicketDef = {
  id: string;
  name: string;
  blurb: string;
  price: number;
  style: ScratchStyle;
  accent: string;
  tiers: PrizeTier[];
};

export type ScratchCell = {
  icon: string;
  label: string;
  value: number;
  matched?: boolean;
};

export type ScratchRow = {
  icons: string[];
  prize: number;
  matched: boolean;
};

export type ScratchPresentation = {
  style: ScratchStyle;
  prize: number;
  title: string;
  cells?: ScratchCell[];
  rows?: ScratchRow[];
  headline: string;
};

const ICONS = ['cherry', 'lemon', 'plum', 'bell', 'star', 'seven', 'crown', 'gem', 'coin', 'vault'];

export const SCRATCH_TICKETS: ScratchTicketDef[] = [
  {
    id: 'spark-seven',
    name: 'Spark Seven',
    blurb: 'Match three symbols to open the sealed prize.',
    price: 100,
    style: 'match3',
    accent: '#e23d5c',
    tiers: [
      { amount: 0, weight: 690, title: 'No match' },
      { amount: 100, weight: 175, title: 'Spark' },
      { amount: 250, weight: 85, title: 'Bright match' },
      { amount: 600, weight: 35, title: 'Lucky seven' },
      { amount: 1_800, weight: 12, title: 'Vault prize' },
      { amount: 5_000, weight: 3, title: 'Foil jackpot' },
    ],
  },
  {
    id: 'gold-dust',
    name: 'Gold Dust',
    blurb: 'Add up every gold coin you uncover.',
    price: 250,
    style: 'sum',
    accent: '#e2b657',
    tiers: [
      { amount: 0, weight: 690, title: 'Dust' },
      { amount: 250, weight: 175, title: 'A few coins' },
      { amount: 625, weight: 85, title: 'Gold pile' },
      { amount: 1_500, weight: 35, title: 'Heavy dust' },
      { amount: 4_500, weight: 12, title: 'Rich vein' },
      { amount: 12_500, weight: 3, title: 'Mother lode' },
    ],
  },
  {
    id: 'vault-key',
    name: 'Vault Key',
    blurb: 'Keys you uncover are added into one prize.',
    price: 500,
    style: 'sum',
    accent: '#d7c4a3',
    tiers: [
      { amount: 0, weight: 690, title: 'Locked' },
      { amount: 500, weight: 175, title: 'One key' },
      { amount: 1_250, weight: 85, title: 'Key ring' },
      { amount: 3_000, weight: 35, title: 'Side door' },
      { amount: 9_000, weight: 12, title: 'Inner vault' },
      { amount: 25_000, weight: 3, title: 'Master key' },
    ],
  },
  {
    id: 'diamond-row',
    name: 'Diamond Row',
    blurb: 'Three rows. A matching row pays what it shows.',
    price: 1_000,
    style: 'rows',
    accent: '#9ad7ff',
    tiers: [
      { amount: 0, weight: 700, title: 'No row' },
      { amount: 1_000, weight: 160, title: 'One row' },
      { amount: 2_500, weight: 85, title: 'Clean row' },
      { amount: 5_500, weight: 38, title: 'Double row' },
      { amount: 16_000, weight: 13, title: 'Diamond line' },
      { amount: 44_000, weight: 4, title: 'Full cut' },
    ],
  },
  {
    id: 'emperors-seal',
    name: "Emperor's Seal",
    blurb: 'The expensive foil. Match three for a sealed fortune.',
    price: 2_500,
    style: 'match3',
    accent: '#ffb15a',
    tiers: [
      { amount: 0, weight: 710, title: 'Unsealed' },
      { amount: 2_500, weight: 155, title: 'Seal' },
      { amount: 6_000, weight: 80, title: 'Court prize' },
      { amount: 14_000, weight: 38, title: 'Imperial' },
      { amount: 40_000, weight: 13, title: 'Throne' },
      { amount: 124_000, weight: 4, title: 'Emperor' },
    ],
  },
];

export function getScratchTicket(id: string): ScratchTicketDef | undefined {
  return SCRATCH_TICKETS.find((ticket) => ticket.id === id);
}

function rollPrize(def: ScratchTicketDef, rng: () => number): PrizeTier {
  return pickWeighted(def.tiers, rng);
}

function buildMatch3(win: boolean, rng: () => number): ScratchCell[] {
  const cells: ScratchCell[] = [];
  if (!win) {
    const icons = Array.from({ length: 9 }, () => ICONS[Math.floor(rng() * (ICONS.length - 2))]);
    for (let guard = 0; guard < 24; guard++) {
      const counts = new Map<string, number>();
      icons.forEach((icon) => counts.set(icon, (counts.get(icon) ?? 0) + 1));
      const over = [...counts.entries()].find(([, count]) => count >= 3);
      if (!over) break;
      const index = icons.findIndex((icon) => icon === over[0]);
      icons[index] = ICONS.find((icon) => (counts.get(icon) ?? 0) < 2) ?? 'lemon';
    }
    return icons.map((icon) => ({ icon, label: icon, value: 0 }));
  }
  const winIcon = ICONS[Math.floor(rng() * 6)];
  const positions = new Set(shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rng).slice(0, 3));
  const counts = new Map<string, number>();
  for (let i = 0; i < 9; i++) {
    if (positions.has(i)) {
      cells.push({ icon: winIcon, label: winIcon, value: 0, matched: true });
      continue;
    }
    let icon = ICONS[Math.floor(rng() * ICONS.length)];
    let guard = 0;
    while ((icon === winIcon || (counts.get(icon) ?? 0) >= 2) && guard < 12) {
      icon = ICONS[Math.floor(rng() * ICONS.length)];
      guard += 1;
    }
    counts.set(icon, (counts.get(icon) ?? 0) + 1);
    cells.push({ icon, label: icon, value: 0 });
  }
  return cells;
}

function buildSum(amount: number, rng: () => number, icon: string): ScratchCell[] {
  const cells: ScratchCell[] = Array.from({ length: 9 }, () => ({ icon, label: icon, value: 0 }));
  if (amount <= 0) return cells;
  const parts = 3 + Math.floor(rng() * 3);
  const indexes = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rng).slice(0, parts);
  const weights = indexes.map(() => 0.4 + rng());
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  let assigned = 0;
  indexes.forEach((index, i) => {
    if (i === indexes.length - 1) {
      cells[index].value = amount - assigned;
    } else {
      const share = Math.max(1, Math.round((amount * weights[i]) / weightTotal));
      const capped = Math.min(share, amount - assigned - (indexes.length - 1 - i));
      cells[index].value = capped;
      assigned += capped;
    }
    cells[index].matched = cells[index].value > 0;
  });
  return cells;
}

function buildRows(amount: number, rng: () => number): ScratchRow[] {
  const prizes = [0, 0, 0];
  if (amount > 0) {
    const parts = amount >= 2000 && rng() > 0.55 ? 2 : 1;
    if (parts === 1) prizes[Math.floor(rng() * 3)] = amount;
    else {
      const first = Math.max(100, Math.round(amount * (0.35 + rng() * 0.3)));
      const a = Math.floor(rng() * 3);
      let b = Math.floor(rng() * 3);
      while (b === a) b = Math.floor(rng() * 3);
      prizes[a] = first;
      prizes[b] = amount - first;
    }
  }
  return prizes.map((prize) => {
    const icon = ICONS[Math.floor(rng() * ICONS.length)];
    if (prize > 0) return { icons: [icon, icon, icon], prize, matched: true };
    const a = ICONS[Math.floor(rng() * ICONS.length)];
    let b = ICONS[Math.floor(rng() * ICONS.length)];
    while (b === a) b = ICONS[Math.floor(rng() * ICONS.length)];
    const c = rng() > 0.5 ? a : ICONS[Math.floor(rng() * ICONS.length)];
    const icons = shuffle([a, b, c === a && c === b ? 'lemon' : c], rng);
    return { icons, prize: 0, matched: false };
  });
}

export function presentTicket(def: ScratchTicketDef, seed: number): ScratchPresentation {
  const rng = mulberry32(seed);
  const tier = rollPrize(def, rng);
  if (def.style === 'match3') {
    return {
      style: 'match3',
      prize: tier.amount,
      title: tier.title,
      cells: buildMatch3(tier.amount > 0, rng),
      headline: tier.amount > 0 ? 'Three of a kind' : 'No set of three',
    };
  }
  if (def.style === 'rows') {
    return {
      style: 'rows',
      prize: tier.amount,
      title: tier.title,
      rows: buildRows(tier.amount, rng),
      headline: tier.amount > 0 ? 'A row matched' : 'No matching row',
    };
  }
  const icon = def.id === 'vault-key' ? 'vault' : 'coin';
  return {
    style: 'sum',
    prize: tier.amount,
    title: tier.title,
    cells: buildSum(tier.amount, rng, icon),
    headline: tier.amount > 0 ? 'Coins uncovered' : 'Nothing under the foil',
  };
}

export function ticketRtp(def: ScratchTicketDef): number {
  const weight = def.tiers.reduce((sum, tier) => sum + tier.weight, 0);
  const ev = def.tiers.reduce((sum, tier) => sum + tier.amount * tier.weight, 0) / weight;
  return ev / def.price;
}

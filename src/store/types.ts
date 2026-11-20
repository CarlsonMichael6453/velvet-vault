export type Settings = {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  reducedMotion: boolean;
};

export type Stats = {
  spins: number;
  wins: number;
  scratchBought: number;
  scratchWins: number;
  draws: number;
  drawWins: number;
  ticketsBought: number;
  biggestWin: number;
  biggestMultiple: number;
  bestScratchMultiple: number;
  bestDrawMatch: number;
  starHits: number;
  totalWagered: number;
  totalWon: number;
  hourlyClaims: number;
  themesBought: number;
  packsBought: number;
  wheelSpins: number;
};

export type MissionState = {
  date: string;
  progress: Record<string, number>;
  claimed: string[];
};

export type FreeSpinState = {
  machineId: string;
  left: number;
  bet: number;
  multiplier: number;
};

export type PendingScratch = {
  ticketId: string;
  seed: number;
  prize: number;
  price: number;
  credited: boolean;
};

export type PendingTicket = { main: number[]; star: number };

export type PendingDraw = {
  tickets: PendingTicket[];
  drawnMain: number[];
  drawnStar: number;
  prize: number;
  jackpotWon: boolean;
  credited: boolean;
};

export type PendingWheel = {
  index: number;
  amount: number;
  credited: boolean;
};

export type SaveState = {
  version: 1;
  ageConfirmed: boolean;
  welcomed: boolean;
  coins: number;
  xp: number;
  lifetimeWagered: number;
  lifetimePurchased: number;
  ownedThemes: string[];
  activeTheme: string;
  ownedBackgrounds: string[];
  activeBackground: string;
  ownedStyles: string[];
  activeStyle: string;
  settings: Settings;
  lastDaily: string | null;
  streak: number;
  bestStreak: number;
  lastHourly: number | null;
  lastWheel: string | null;
  jackpot: number;
  achievements: Record<string, number>;
  missions: MissionState;
  stats: Stats;
  freeSpin: FreeSpinState | null;
  pendingScratch: PendingScratch | null;
  pendingDraw: PendingDraw | null;
  pendingWheel: PendingWheel | null;
  /** How many times this install has launched. 1 is the first session. */
  sessions: number;
  /** Day the native store review was last requested, or null. */
  reviewPromptOn: string | null;
};

export type Notice = { title: string; detail: string };

export type Clock = { today: string; now: number };

export function emptyStats(): Stats {
  return {
    spins: 0,
    wins: 0,
    scratchBought: 0,
    scratchWins: 0,
    draws: 0,
    drawWins: 0,
    ticketsBought: 0,
    biggestWin: 0,
    biggestMultiple: 0,
    bestScratchMultiple: 0,
    bestDrawMatch: 0,
    starHits: 0,
    totalWagered: 0,
    totalWon: 0,
    hourlyClaims: 0,
    themesBought: 0,
    packsBought: 0,
    wheelSpins: 0,
  };
}

import {
  DAILY_REWARDS,
  HOURLY_COINS,
  HOURLY_MS,
  JACKPOT_RAKE,
  JACKPOT_SEED,
  WELCOME_COINS,
  WHEEL_PRIZES,
  levelFromXp,
  levelTitle,
  maxBetForLevel,
  vipFromPoints,
  DRAW_TICKET_PRICE,
} from '@/src/data/economy';
import { ACHIEVEMENTS, MISSION_KEYS } from '@/src/data/progress';
import type { Product } from '@/src/data/products';
import { scoreTickets, type DrawResult, type Ticket } from '@/src/games/lottery/draw';
import { getScratchTicket } from '@/src/games/scratch/tickets';
import { formatCoins, shiftDay, todayKey } from '@/src/lib/format';
import type { Clock, Notice, PendingDraw, PendingScratch, PendingWheel, SaveState, Stats } from '@/src/store/types';
import { emptyStats } from '@/src/store/types';

export type Result = {
  ok: boolean;
  save: SaveState;
  notices: Notice[];
  error?: string;
  amount?: number;
  index?: number;
};

export function liveClock(): Clock {
  return { today: todayKey(), now: Date.now() };
}

export function freshSave(): SaveState {
  return {
    version: 1,
    ageConfirmed: false,
    welcomed: false,
    coins: 0,
    xp: 0,
    lifetimeWagered: 0,
    lifetimePurchased: 0,
    ownedThemes: ['velvet', 'midnight', 'sunset'],
    activeTheme: 'velvet',
    ownedBackgrounds: ['hall', 'cabin', 'beach'],
    activeBackground: 'hall',
    ownedStyles: ['classic', 'bubbly', 'winter'],
    activeStyle: 'classic',
    settings: { sound: true, music: true, haptics: true, reducedMotion: false },
    lastDaily: null,
    streak: 0,
    bestStreak: 0,
    lastHourly: null,
    lastWheel: null,
    jackpot: JACKPOT_SEED,
    achievements: {},
    missions: { date: '', progress: {}, claimed: [] },
    stats: emptyStats(),
    freeSpin: null,
    pendingScratch: null,
    pendingDraw: null,
    pendingWheel: null,
    sessions: 0,
    reviewPromptOn: null,
  };
}

export function hydrateSave(raw: Partial<SaveState> | undefined): SaveState {
  const base = freshSave();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    version: 1,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    stats: { ...base.stats, ...(raw.stats ?? {}) },
    missions: raw.missions?.progress ? raw.missions : base.missions,
    achievements: raw.achievements ?? {},
    ownedThemes: raw.ownedThemes?.length ? raw.ownedThemes : base.ownedThemes,
    activeTheme: raw.activeTheme || base.activeTheme,
    ownedBackgrounds: raw.ownedBackgrounds?.length ? raw.ownedBackgrounds : base.ownedBackgrounds,
    activeBackground: raw.activeBackground || base.activeBackground,
    ownedStyles: raw.ownedStyles?.length ? raw.ownedStyles : base.ownedStyles,
    activeStyle: raw.activeStyle || base.activeStyle,
    sessions: typeof raw.sessions === 'number' && raw.sessions >= 0 ? raw.sessions : base.sessions,
    reviewPromptOn: typeof raw.reviewPromptOn === 'string' ? raw.reviewPromptOn : null,
  };
}

export function vipFor(save: SaveState) {
  const points = save.lifetimePurchased + Math.floor(save.lifetimeWagered / 20);
  return vipFromPoints(points);
}

export function streakIfClaimed(save: SaveState, today: string): number {
  if (!save.lastDaily) return 1;
  if (save.lastDaily === today) return save.streak;
  if (save.lastDaily === shiftDay(today, -1)) return save.streak + 1;
  return 1;
}

export function dailyAvailable(save: SaveState, today: string): boolean {
  return save.lastDaily !== today;
}

export function hourlyRemaining(save: SaveState, now: number): number {
  if (!save.lastHourly) return 0;
  return Math.max(0, HOURLY_MS - (now - save.lastHourly));
}

function fail(save: SaveState, error: string): Result {
  return { ok: false, save, notices: [], error };
}

function applyAchievements(save: SaveState): { save: SaveState; notices: Notice[] } {
  let next = save;
  const notices: Notice[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (next.achievements[achievement.id]) continue;
    if (!achievement.test(next)) continue;
    next = {
      ...next,
      coins: next.coins + achievement.reward,
      achievements: { ...next.achievements, [achievement.id]: Date.now() },
    };
    notices.push({
      title: achievement.name,
      detail: achievement.reward > 0 ? `${achievement.detail} +${formatCoins(achievement.reward)} coins.` : achievement.detail,
    });
  }
  return { save: next, notices };
}

function levelNotices(before: SaveState, after: SaveState): Notice[] {
  const from = levelFromXp(before.xp).level;
  const to = levelFromXp(after.xp).level;
  if (to <= from) return [];
  return [{ title: `Level ${to}`, detail: `${levelTitle(to)}. Your max bet just moved up.` }];
}

function finalize(before: SaveState, draft: SaveState, extra: Notice[] = [], amount?: number, index?: number): Result {
  const achieved = applyAchievements(draft);
  return {
    ok: true,
    save: achieved.save,
    notices: [...extra, ...levelNotices(before, achieved.save), ...achieved.notices],
    amount,
    index,
  };
}

function bumpMissions(save: SaveState, delta: Partial<Record<keyof typeof MISSION_KEYS, number>>, today: string): SaveState {
  let missions = save.missions;
  if (missions.date !== today) missions = { date: today, progress: {}, claimed: [] };
  const progress = { ...missions.progress };
  (Object.keys(delta) as (keyof typeof MISSION_KEYS)[]).forEach((key) => {
    const amount = delta[key];
    if (!amount) return;
    const id = MISSION_KEYS[key];
    progress[id] = (progress[id] ?? 0) + amount;
  });
  return { ...save, missions: { ...missions, date: today, progress } };
}

function withStats(save: SaveState, patch: Partial<Stats>): SaveState {
  return { ...save, stats: { ...save.stats, ...patch } };
}

export function confirmAge(save: SaveState): Result {
  if (save.ageConfirmed && save.welcomed) return { ok: true, save, notices: [] };
  const grant = save.welcomed ? 0 : WELCOME_COINS;
  return {
    ok: true,
    save: { ...save, ageConfirmed: true, welcomed: true, coins: save.coins + grant },
    notices: grant > 0 ? [{ title: 'Welcome to the vault', detail: `${formatCoins(grant)} Velvet Coins are on the house. They have no cash value.` }] : [],
    amount: grant,
  };
}

export function resetSave(): SaveState {
  return { ...freshSave(), ageConfirmed: true, welcomed: true, coins: WELCOME_COINS };
}

export function wagerSpin(save: SaveState, bet: number, levelRequired: number, clock = liveClock()): Result {
  const level = levelFromXp(save.xp).level;
  if (level < levelRequired) return fail(save, `Reach level ${levelRequired} to unlock this machine.`);
  const max = maxBetForLevel(level);
  if (!Number.isFinite(bet) || bet <= 0) return fail(save, 'Choose a bet first.');
  if (bet > max) return fail(save, `Level ${level} caps your bet at ${formatCoins(max)} coins.`);
  if (save.coins < bet) return fail(save, 'Not enough coins for that bet.');
  let next: SaveState = {
    ...save,
    coins: save.coins - bet,
    xp: save.xp + Math.max(1, Math.round(bet / 8)),
    lifetimeWagered: save.lifetimeWagered + bet,
  };
  next = withStats(next, { spins: next.stats.spins + 1, totalWagered: next.stats.totalWagered + bet });
  next = bumpMissions(next, { spins: 1, wager: bet }, clock.today);
  return finalize(save, next, [], bet);
}

export function recordFreeSpin(save: SaveState, clock = liveClock()): Result {
  let next = withStats({ ...save, xp: save.xp + 2 }, { spins: save.stats.spins + 1 });
  next = bumpMissions(next, { spins: 1 }, clock.today);
  return finalize(save, next);
}

export function setFreeSpin(save: SaveState, freeSpin: SaveState['freeSpin']): SaveState {
  return { ...save, freeSpin };
}

type WinMeta = {
  kind: 'slot' | 'scratch' | 'draw' | 'bonus';
  multiple?: number;
  scratchMultiple?: number;
  drawMatch?: number;
  star?: boolean;
};

function applyWin(save: SaveState, amount: number, meta: WinMeta, today: string): SaveState {
  if (amount <= 0) return save;
  const stats: Partial<Stats> = {
    totalWon: save.stats.totalWon + amount,
    biggestWin: Math.max(save.stats.biggestWin, amount),
  };
  if (meta.kind === 'slot' || meta.kind === 'scratch' || meta.kind === 'draw') stats.wins = save.stats.wins + 1;
  if (meta.multiple) stats.biggestMultiple = Math.max(save.stats.biggestMultiple, meta.multiple);
  if (meta.scratchMultiple) stats.bestScratchMultiple = Math.max(save.stats.bestScratchMultiple, meta.scratchMultiple);
  if (meta.kind === 'scratch') stats.scratchWins = save.stats.scratchWins + 1;
  if (meta.kind === 'draw') stats.drawWins = save.stats.drawWins + 1;
  if (meta.drawMatch) stats.bestDrawMatch = Math.max(save.stats.bestDrawMatch, meta.drawMatch);
  if (meta.star) stats.starHits = save.stats.starHits + 1;
  let next = withStats({ ...save, coins: save.coins + amount }, stats);
  if (meta.kind === 'slot' || meta.kind === 'scratch' || meta.kind === 'draw') {
    next = bumpMissions(next, { wins: 1 }, today);
  }
  return next;
}

export function creditSlotWin(save: SaveState, amount: number, bet: number, clock = liveClock()): Result {
  const multiple = bet > 0 ? amount / bet : 0;
  const next = applyWin(save, amount, { kind: 'slot', multiple }, clock.today);
  const label = multiple >= 100 ? 'Jackpot' : multiple >= 50 ? 'Ultra win' : multiple >= 25 ? 'Mega win' : 'Big win';
  const notices =
    amount > 0 && multiple >= 10
      ? [{ title: label, detail: `+${formatCoins(amount)} · ${multiple.toFixed(1)}× your bet.` }]
      : [];
  return finalize(save, next, notices, amount);
}

export function buyScratch(save: SaveState, ticketId: string, seed: number, prize: number, clock = liveClock()): Result {
  const ticket = getScratchTicket(ticketId);
  if (!ticket) return fail(save, 'That ticket is not for sale.');
  const price = ticket.price;
  if (save.pendingScratch && !save.pendingScratch.credited) return fail(save, 'Finish the ticket already in your hand.');
  if (save.coins < price) return fail(save, 'Not enough coins for that ticket.');
  const pending: PendingScratch = { ticketId, seed, prize, price, credited: false };
  let next: SaveState = {
    ...save,
    coins: save.coins - price,
    xp: save.xp + Math.max(1, Math.round(price / 8)),
    lifetimeWagered: save.lifetimeWagered + price,
    pendingScratch: pending,
  };
  next = withStats(next, {
    scratchBought: next.stats.scratchBought + 1,
    totalWagered: next.stats.totalWagered + price,
  });
  next = bumpMissions(next, { scratch: 1, wager: price }, clock.today);
  return finalize(save, next, [], price);
}

export function settleScratch(save: SaveState, clock = liveClock()): Result {
  const pending = save.pendingScratch;
  if (!pending) return fail(save, 'No ticket to settle.');
  let next: SaveState = { ...save, pendingScratch: null };
  if (!pending.credited && pending.prize > 0) {
    next = applyWin(next, pending.prize, { kind: 'scratch', scratchMultiple: pending.prize / pending.price }, clock.today);
  }
  const notices =
    pending.prize > 0
      ? [{ title: `Scratch pays ${formatCoins(pending.prize)}`, detail: 'Coins stay in the vault. They have no cash value.' }]
      : [{ title: 'No win on this foil', detail: 'The next ticket is a fresh seal.' }];
  return finalize(save, next, notices, pending.prize);
}

export function purchaseDraw(save: SaveState, tickets: Ticket[], draw: DrawResult, clock = liveClock()): Result {
  if (save.pendingDraw && !save.pendingDraw.credited) return fail(save, 'Let the current draw finish.');
  if (tickets.length < 1) return fail(save, 'Pick at least one ticket.');
  const cost = tickets.length * DRAW_TICKET_PRICE;
  if (save.coins < cost) return fail(save, 'Not enough coins for those tickets.');
  const rake = Math.round(cost * JACKPOT_RAKE);
  const scored = scoreTickets(tickets, draw, save.jackpot + rake);
  const pending: PendingDraw = {
    tickets,
    drawnMain: draw.main,
    drawnStar: draw.star,
    prize: scored.prize,
    jackpotWon: scored.jackpotWon,
    credited: false,
  };
  let next: SaveState = {
    ...save,
    coins: save.coins - cost,
    xp: save.xp + Math.max(1, Math.round(cost / 8)),
    lifetimeWagered: save.lifetimeWagered + cost,
    jackpot: scored.nextJackpot,
    pendingDraw: pending,
  };
  next = withStats(next, {
    draws: next.stats.draws + 1,
    ticketsBought: next.stats.ticketsBought + tickets.length,
    totalWagered: next.stats.totalWagered + cost,
  });
  next = bumpMissions(next, { draws: 1, wager: cost }, clock.today);
  return finalize(save, next, [], cost);
}

export function settleDraw(save: SaveState, clock = liveClock()): Result {
  const pending = save.pendingDraw;
  if (!pending) return fail(save, 'No draw to settle.');
  let next: SaveState = { ...save, pendingDraw: null };
  const bestMatch = pending.tickets.reduce((best, ticket) => {
    const matches = ticket.main.filter((n) => pending.drawnMain.includes(n)).length;
    return Math.max(best, matches);
  }, 0);
  const star = pending.tickets.some((ticket) => ticket.star === pending.drawnStar);
  if (!pending.credited && pending.prize > 0) {
    next = applyWin(next, pending.prize, { kind: 'draw', drawMatch: bestMatch, star }, clock.today);
  } else if (bestMatch > 0 || star) {
    next = withStats(next, {
      bestDrawMatch: Math.max(next.stats.bestDrawMatch, bestMatch),
      starHits: next.stats.starHits + (star ? 1 : 0),
    });
  }
  const notices = pending.jackpotWon
    ? [{ title: 'Vault jackpot', detail: `${formatCoins(pending.prize)} coins. The meter resets. Still no cash value.` }]
    : pending.prize > 0
      ? [{ title: `Draw pays ${formatCoins(pending.prize)}`, detail: 'A coin prize, not cash.' }]
      : [{ title: 'No winning numbers', detail: 'The jackpot meter still grew.' }];
  return finalize(save, next, notices, pending.prize);
}

export function startWheel(save: SaveState, index: number, clock = liveClock()): Result {
  if (save.pendingWheel && !save.pendingWheel.credited) return fail(save, 'Your wheel spin is still resolving.');
  if (save.lastWheel === clock.today) return fail(save, 'The wheel has already been spun today.');
  const amount = Math.round(WHEEL_PRIZES[index] * vipFor(save).multiplier);
  const pending: PendingWheel = { index, amount, credited: false };
  const next = withStats(
    { ...save, lastWheel: clock.today, pendingWheel: pending },
    { wheelSpins: save.stats.wheelSpins + 1 },
  );
  return finalize(save, next, [], amount, index);
}

export function settleWheel(save: SaveState): Result {
  const pending = save.pendingWheel;
  if (!pending) return fail(save, 'No wheel spin waiting.');
  if (pending.credited) return { ok: true, save: { ...save, pendingWheel: null }, notices: [] };
  const next = { ...save, pendingWheel: null, coins: save.coins + pending.amount };
  return finalize(save, next, [{ title: 'Wheel prize', detail: `+${formatCoins(pending.amount)} Velvet Coins.` }], pending.amount, pending.index);
}

export function claimDaily(save: SaveState, clock = liveClock()): Result {
  if (!dailyAvailable(save, clock.today)) return fail(save, 'You already claimed today’s bonus.');
  const streak = streakIfClaimed(save, clock.today);
  const base = DAILY_REWARDS[(streak - 1) % DAILY_REWARDS.length];
  const amount = Math.round(base * vipFor(save).multiplier);
  const next: SaveState = {
    ...save,
    coins: save.coins + amount,
    lastDaily: clock.today,
    streak,
    bestStreak: Math.max(save.bestStreak, streak),
  };
  const day = ((streak - 1) % DAILY_REWARDS.length) + 1;
  return finalize(save, next, [{ title: `Day ${day} bonus`, detail: `+${formatCoins(amount)} coins. Come back tomorrow to keep the streak.` }], amount);
}

export function claimHourly(save: SaveState, clock = liveClock()): Result {
  const wait = hourlyRemaining(save, clock.now);
  if (wait > 0) return fail(save, 'The hourly tray is still refilling.');
  const amount = Math.round(HOURLY_COINS * vipFor(save).multiplier);
  const next = withStats(
    { ...save, coins: save.coins + amount, lastHourly: clock.now },
    { hourlyClaims: save.stats.hourlyClaims + 1 },
  );
  return finalize(save, next, [{ title: 'Hourly coins', detail: `+${formatCoins(amount)}. Another tray in an hour.` }], amount);
}

export function claimMission(save: SaveState, missionId: string, target: number, reward: number, clock = liveClock()): Result {
  const missions = save.missions.date === clock.today ? save.missions : { date: clock.today, progress: {}, claimed: [] };
  const progress = missions.progress[missionId] ?? 0;
  if (missions.claimed.includes(missionId)) return fail(save, 'That mission is already claimed.');
  if (progress < target) return fail(save, 'That mission is not finished yet.');
  const next: SaveState = {
    ...save,
    coins: save.coins + reward,
    missions: { ...missions, claimed: [...missions.claimed, missionId] },
  };
  return finalize(save, next, [{ title: 'Mission complete', detail: `+${formatCoins(reward)} coins.` }], reward);
}

export function buyThemeWithCoins(save: SaveState, theme: { id: string; name: string; coinPrice: number; premium: boolean }): Result {
  if (save.ownedThemes.includes(theme.id)) return fail(save, 'You already own this theme.');
  if (theme.premium && save.coins < theme.coinPrice) return fail(save, 'Not enough coins for that theme.');
  const price = theme.premium ? theme.coinPrice : 0;
  const next = withStats(
    {
      ...save,
      coins: save.coins - price,
      ownedThemes: [...save.ownedThemes, theme.id],
      activeTheme: theme.id,
    },
    { themesBought: save.stats.themesBought + (theme.premium ? 1 : 0) },
  );
  return finalize(save, next, [{ title: `${theme.name} unlocked`, detail: 'The room changes. The coins do not become cash.' }]);
}

export function applyTheme(save: SaveState, themeId: string): Result {
  if (!save.ownedThemes.includes(themeId)) return fail(save, 'That theme is still locked.');
  return { ok: true, save: { ...save, activeTheme: themeId }, notices: [] };
}

export type CosmeticOffer = {
  id: string;
  name: string;
  coinPrice: number;
  levelRequired: number;
  iapProductId?: string;
};

function cosmeticUnlocked(save: SaveState, owned: string[], item: CosmeticOffer): boolean {
  if (owned.includes(item.id)) return true;
  if (item.coinPrice === 0 && item.levelRequired === 0 && !item.iapProductId) return true;
  if (item.levelRequired > 0 && item.coinPrice === 0 && !item.iapProductId && levelFromXp(save.xp).level >= item.levelRequired) return true;
  return false;
}

function buyCosmetic(
  save: SaveState,
  item: CosmeticOffer,
  owned: string[],
  assign: (nextOwned: string[]) => SaveState,
  noun: string,
): Result {
  if (owned.includes(item.id)) return fail(save, `You already own this ${noun}.`);
  if (item.coinPrice <= 0) {
    return fail(save, item.levelRequired > 0 ? `Reach level ${item.levelRequired} to unlock this ${noun}.` : `This ${noun} is in the mock store.`);
  }
  if (save.coins < item.coinPrice) return fail(save, `Not enough coins for that ${noun}.`);
  const next = assign([...owned, item.id]);
  return finalize(save, { ...next, coins: save.coins - item.coinPrice }, [
    { title: `${item.name} unlocked`, detail: 'Cosmetic only. The coins do not become cash.' },
  ]);
}

function equipCosmetic(save: SaveState, item: CosmeticOffer, owned: string[], assign: (nextOwned: string[]) => SaveState, noun: string): Result {
  if (!cosmeticUnlocked(save, owned, item)) {
    if (item.levelRequired > 0 && levelFromXp(save.xp).level < item.levelRequired) {
      return fail(save, `Reach level ${item.levelRequired} for this ${noun}.`);
    }
    return fail(save, `That ${noun} is still locked.`);
  }
  const nextOwned = owned.includes(item.id) ? owned : [...owned, item.id];
  return { ok: true, save: assign(nextOwned), notices: [] };
}

export function buyBackgroundWithCoins(save: SaveState, item: CosmeticOffer): Result {
  return buyCosmetic(
    save,
    item,
    save.ownedBackgrounds,
    (ownedBackgrounds) => ({ ...save, ownedBackgrounds, activeBackground: item.id }),
    'backdrop',
  );
}

export function applyBackground(save: SaveState, item: CosmeticOffer): Result {
  return equipCosmetic(
    save,
    item,
    save.ownedBackgrounds,
    (ownedBackgrounds) => ({ ...save, ownedBackgrounds, activeBackground: item.id }),
    'backdrop',
  );
}

export function buyStyleWithCoins(save: SaveState, item: CosmeticOffer): Result {
  return buyCosmetic(
    save,
    item,
    save.ownedStyles,
    (ownedStyles) => ({ ...save, ownedStyles, activeStyle: item.id }),
    'style',
  );
}

export function applyStyle(save: SaveState, item: CosmeticOffer): Result {
  return equipCosmetic(save, item, save.ownedStyles, (ownedStyles) => ({ ...save, ownedStyles, activeStyle: item.id }), 'style');
}

export function grantProduct(save: SaveState, product: Product): Result {
  if (product.themeId && save.ownedThemes.includes(product.themeId)) return fail(save, 'You already own this theme.');
  if (product.backgroundId && save.ownedBackgrounds.includes(product.backgroundId)) return fail(save, 'You already own this backdrop.');
  if (product.styleId && save.ownedStyles.includes(product.styleId)) return fail(save, 'You already own this style.');
  let next = save;
  const notices: Notice[] = [];
  if (product.coins) {
    next = withStats(
      { ...next, coins: next.coins + product.coins, lifetimePurchased: next.lifetimePurchased + product.coins },
      { packsBought: next.stats.packsBought + 1 },
    );
    notices.push({ title: 'Coins added', detail: `+${formatCoins(product.coins)} Velvet Coins from the mock store.` });
  }
  if (product.themeId) {
    next = withStats(
      { ...next, ownedThemes: [...next.ownedThemes, product.themeId], activeTheme: product.themeId },
      { themesBought: next.stats.themesBought + 1 },
    );
    notices.push({ title: product.title, detail: 'Theme unlocked. Cosmetic only.' });
  }
  if (product.backgroundId) {
    next = { ...next, ownedBackgrounds: [...next.ownedBackgrounds, product.backgroundId], activeBackground: product.backgroundId };
    notices.push({ title: product.title, detail: 'Backdrop unlocked. Cosmetic only.' });
  }
  if (product.styleId) {
    next = { ...next, ownedStyles: [...next.ownedStyles, product.styleId], activeStyle: product.styleId };
    notices.push({ title: product.title, detail: 'Game style unlocked. Cosmetic only.' });
  }
  return finalize(save, next, notices, product.coins ?? 0);
}

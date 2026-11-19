import { levelFromXp } from '@/src/data/economy';
import type { SaveState } from '@/src/store/types';

export type AchievementDef = {
  id: string;
  name: string;
  detail: string;
  reward: number;
  test: (save: SaveState) => boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-spin', name: 'First Spin', detail: 'Spin any slot machine.', reward: 200, test: (s) => s.stats.spins >= 1 },
  { id: 'spins-50', name: 'Warm Reels', detail: 'Spin 50 times.', reward: 500, test: (s) => s.stats.spins >= 50 },
  { id: 'spins-250', name: "Can't Stop", detail: 'Spin 250 times.', reward: 1_500, test: (s) => s.stats.spins >= 250 },
  { id: 'big-win', name: 'Big Win', detail: 'Land a win of 10× your bet or more.', reward: 800, test: (s) => s.stats.biggestMultiple >= 10 },
  { id: 'mega-win', name: 'Mega Win', detail: 'Land a win of 25× your bet or more.', reward: 2_000, test: (s) => s.stats.biggestMultiple >= 25 },
  { id: 'ultra-win', name: 'Ultra Win', detail: 'Land a win of 50× your bet or more.', reward: 5_000, test: (s) => s.stats.biggestMultiple >= 50 },
  { id: 'first-scratch', name: 'Foil Fresh', detail: 'Buy a scratch ticket.', reward: 200, test: (s) => s.stats.scratchBought >= 1 },
  { id: 'scratch-10', name: 'Ten Tickets', detail: 'Scratch 10 tickets.', reward: 800, test: (s) => s.stats.scratchBought >= 10 },
  { id: 'scratch-jackpot', name: 'Foil Fortune', detail: 'Win 20× the ticket price on a scratcher.', reward: 1_500, test: (s) => s.stats.bestScratchMultiple >= 20 },
  { id: 'first-draw', name: 'Number Picker', detail: 'Enter a Vault Draw.', reward: 200, test: (s) => s.stats.draws >= 1 },
  { id: 'match-3', name: 'Triple Match', detail: 'Match 3 numbers in a draw.', reward: 1_000, test: (s) => s.stats.bestDrawMatch >= 3 },
  { id: 'star', name: 'Star Struck', detail: 'Hit the Vault Star.', reward: 400, test: (s) => s.stats.starHits >= 1 },
  { id: 'streak-3', name: 'Three-Night Stand', detail: 'Reach a 3-day claim streak.', reward: 500, test: (s) => s.bestStreak >= 3 },
  { id: 'streak-7', name: 'Week at the Vault', detail: 'Reach a 7-day claim streak.', reward: 2_000, test: (s) => s.bestStreak >= 7 },
  { id: 'level-5', name: 'Regular', detail: 'Reach level 5.', reward: 600, test: (s) => levelFromXp(s.xp).level >= 5 },
  { id: 'level-10', name: 'High Roller', detail: 'Reach level 10.', reward: 1_500, test: (s) => levelFromXp(s.xp).level >= 10 },
  { id: 'level-15', name: 'House Favorite', detail: 'Reach level 15.', reward: 3_000, test: (s) => levelFromXp(s.xp).level >= 15 },
  { id: 'theme', name: 'New Coat', detail: 'Unlock a premium theme.', reward: 500, test: (s) => s.stats.themesBought >= 1 },
  { id: 'pack', name: 'Patron', detail: 'Buy a coin pack.', reward: 250, test: (s) => s.stats.packsBought >= 1 },
  { id: 'hourly-5', name: 'Clockwatcher', detail: 'Claim the hourly bonus 5 times.', reward: 400, test: (s) => s.stats.hourlyClaims >= 5 },
  { id: 'wager-10k', name: 'In the Action', detail: 'Wager 10,000 coins.', reward: 600, test: (s) => s.lifetimeWagered >= 10_000 },
  { id: 'wager-100k', name: 'Deep Action', detail: 'Wager 100,000 coins.', reward: 2_500, test: (s) => s.lifetimeWagered >= 100_000 },
];

export type MissionDef = {
  id: string;
  name: string;
  detail: string;
  target: number;
  reward: number;
};

export const MISSIONS: MissionDef[] = [
  { id: 'spin-20', name: 'Work the reels', detail: 'Spin 20 times.', target: 20, reward: 500 },
  { id: 'wager-2500', name: 'Put it in play', detail: 'Wager 2,500 coins.', target: 2_500, reward: 700 },
  { id: 'scratch-2', name: 'Two foils', detail: 'Buy 2 scratch tickets.', target: 2, reward: 600 },
  { id: 'draw-1', name: 'Take a number', detail: 'Enter a Vault Draw.', target: 1, reward: 500 },
  { id: 'wins-3', name: 'Three hits', detail: 'Win 3 times in any game.', target: 3, reward: 800 },
];

export const MISSION_KEYS = {
  spins: 'spin-20',
  wager: 'wager-2500',
  scratch: 'scratch-2',
  draws: 'draw-1',
  wins: 'wins-3',
} as const;

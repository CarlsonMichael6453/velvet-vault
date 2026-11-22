import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getProduct } from '@/src/data/products';
import { iap } from '@/src/services/iap';
import { levelFromXp } from '@/src/data/economy';
import type { DrawResult, Ticket } from '@/src/games/lottery/draw';
import { MACHINES } from '@/src/games/slots/machines';
import { getBackground } from '@/src/theme/backgrounds';
import { getStyle } from '@/src/theme/styles';
import { getTheme } from '@/src/theme/themes';
import {
  applyBackground,
  applyStyle,
  applyTheme,
  buyBackgroundWithCoins,
  buyScratch,
  buyStyleWithCoins,
  buyThemeWithCoins,
  claimAd,
  claimDaily,
  claimHourly,
  claimMission,
  claimSeasonDay,
  confirmAge,
  creditSlotWin,
  freshSave,
  grantProduct,
  hydrateSave,
  restoreOwned,
  purchaseDraw,
  recordFreeSpin,
  resetSave,
  setFreeSpin,
  settleDraw,
  settleScratch,
  settleWheel,
  startWheel,
  wagerSpin,
  type Result,
} from '@/src/store/logic';
import type { Notice, SaveState } from '@/src/store/types';

export type LiveNotice = Notice & { id: string };

type Store = {
  save: SaveState;
  hydrated: boolean;
  notices: LiveNotice[];
  setHydrated: () => void;
  dismissNotice: (id: string) => void;
  confirmAge: () => Result;
  updateSettings: (patch: Partial<SaveState['settings']>) => void;
  wagerSpin: (machineId: string, bet: number) => Result;
  recordFreeSpin: () => Result;
  setFreeSpin: (free: SaveState['freeSpin']) => void;
  creditSlotWin: (amount: number, bet: number) => Result;
  buyScratch: (ticketId: string, seed: number, prize: number) => Result;
  settleScratch: () => Result;
  buyDraw: (tickets: Ticket[], draw: DrawResult) => Result;
  settleDraw: () => Result;
  startWheel: (index: number) => Result;
  settleWheel: () => Result;
  claimDaily: () => Result;
  claimHourly: () => Result;
  claimMission: (id: string, target: number, reward: number) => Result;
  buyThemeWithCoins: (themeId: string) => Result;
  applyTheme: (themeId: string) => Result;
  buyBackgroundWithCoins: (backgroundId: string) => Result;
  applyBackground: (backgroundId: string) => Result;
  buyStyleWithCoins: (styleId: string) => Result;
  applyStyle: (styleId: string) => Result;
  grantProduct: (productId: string) => Result;
  restorePurchases: () => Promise<{ ok: boolean; count: number; message: string }>;
  claimAd: () => Result;
  claimSeasonDay: (day: number, track: 'free' | 'premium') => Result;
  replaceSave: (save: SaveState) => void;
  resetProgress: () => void;
  bumpSession: () => void;
  markReviewPrompted: (day: string) => void;
};

let noticeSerial = 1;

function withNotices(current: LiveNotice[], incoming: Notice[]): LiveNotice[] {
  if (incoming.length === 0) return current;
  const added = incoming.map((notice) => ({ ...notice, id: `n${noticeSerial++}` }));
  return [...current, ...added].slice(-5);
}

export const useGame = create<Store>()(
  persist(
    (set, get) => {
      const commit = (result: Result, extraNotices: Notice[] = []): Result => {
        if (!result.ok) return result;
        const stamped: Result = { ...result, save: { ...result.save, updatedAt: Date.now() } };
        const beforeLevelMachines = new Set(
          MACHINES.filter((machine) => machine.levelRequired <= levelFromXp(get().save.xp).level).map((machine) => machine.id),
        );
        set((state) => ({
          save: stamped.save,
          notices: withNotices(state.notices, [...stamped.notices, ...extraNotices]),
        }));
        const unlocked = MACHINES.filter(
          (machine) => machine.levelRequired <= levelFromXp(stamped.save.xp).level && !beforeLevelMachines.has(machine.id),
        );
        if (unlocked.length > 0) {
          set((state) => ({
            notices: withNotices(state.notices, unlocked.map((machine) => ({ title: `${machine.name} unlocked`, detail: machine.tagline }))),
          }));
        }
        return stamped;
      };

      return {
        save: freshSave(),
        hydrated: false,
        notices: [],
        setHydrated: () => set({ hydrated: true }),
        dismissNotice: (id) => set((state) => ({ notices: state.notices.filter((notice) => notice.id !== id) })),
        confirmAge: () => commit(confirmAge(get().save)),
        updateSettings: (patch) =>
          set((state) => ({
            save: { ...state.save, updatedAt: Date.now(), settings: { ...state.save.settings, ...patch } },
          })),
        wagerSpin: (machineId, bet) => {
          const machine = MACHINES.find((item) => item.id === machineId);
          if (!machine) return { ok: false, save: get().save, notices: [], error: 'That machine is not on the floor.' };
          return commit(wagerSpin(get().save, bet, machine.levelRequired));
        },
        recordFreeSpin: () => commit(recordFreeSpin(get().save)),
        setFreeSpin: (free) => set((state) => ({ save: setFreeSpin(state.save, free) })),
        creditSlotWin: (amount, bet) => commit(creditSlotWin(get().save, amount, bet)),
        buyScratch: (ticketId, seed, prize) => commit(buyScratch(get().save, ticketId, seed, prize)),
        settleScratch: () => commit(settleScratch(get().save)),
        buyDraw: (tickets, draw) => commit(purchaseDraw(get().save, tickets, draw)),
        settleDraw: () => commit(settleDraw(get().save)),
        startWheel: (index) => commit(startWheel(get().save, index)),
        settleWheel: () => commit(settleWheel(get().save)),
        claimDaily: () => commit(claimDaily(get().save)),
        claimHourly: () => commit(claimHourly(get().save)),
        claimMission: (id, target, reward) => commit(claimMission(get().save, id, target, reward)),
        buyThemeWithCoins: (themeId) => {
          const theme = getTheme(themeId);
          if (theme.id !== themeId) return { ok: false, save: get().save, notices: [], error: 'Unknown theme.' };
          return commit(buyThemeWithCoins(get().save, theme));
        },
        applyTheme: (themeId) => {
          const result = applyTheme(get().save, themeId);
          if (!result.ok) return result;
          set({ save: result.save });
          return result;
        },
        buyBackgroundWithCoins: (backgroundId) => {
          const item = getBackground(backgroundId);
          if (item.id !== backgroundId) return { ok: false, save: get().save, notices: [], error: 'Unknown backdrop.' };
          return commit(buyBackgroundWithCoins(get().save, item));
        },
        applyBackground: (backgroundId) => {
          const item = getBackground(backgroundId);
          if (item.id !== backgroundId) return { ok: false, save: get().save, notices: [], error: 'Unknown backdrop.' };
          const result = applyBackground(get().save, item);
          if (!result.ok) return result;
          set({ save: result.save });
          return result;
        },
        buyStyleWithCoins: (styleId) => {
          const item = getStyle(styleId);
          if (item.id !== styleId) return { ok: false, save: get().save, notices: [], error: 'Unknown style.' };
          return commit(buyStyleWithCoins(get().save, item));
        },
        applyStyle: (styleId) => {
          const item = getStyle(styleId);
          if (item.id !== styleId) return { ok: false, save: get().save, notices: [], error: 'Unknown style.' };
          const result = applyStyle(get().save, item);
          if (!result.ok) return result;
          set({ save: result.save });
          return result;
        },
        grantProduct: (productId) => {
          const product = getProduct(productId);
          if (!product) return { ok: false, save: get().save, notices: [], error: 'Unknown product.' };
          return commit(grantProduct(get().save, product));
        },
        restorePurchases: async () => {
          try {
            const { productIds } = await iap.restore();
            let save = get().save;
            let count = 0;
            for (const id of productIds) {
              const product = getProduct(id);
              if (!product) continue;
              const restored = restoreOwned(save, product);
              if (!restored.changed) continue;
              save = { ...restored.save, updatedAt: Date.now() };
              count += 1;
            }
            if (count > 0) set({ save });
            return {
              ok: true,
              count,
              message: count
                ? `Restored ${count} unlock${count === 1 ? '' : 's'}. Coin packs are not paid out again.`
                : 'Nothing new to restore. Coin packs stay in the store and are not paid out again.',
            };
          } catch (error) {
            return { ok: false, count: 0, message: error instanceof Error ? error.message : 'Restore failed.' };
          }
        },
        claimAd: () => commit(claimAd(get().save)),
        claimSeasonDay: (day, track) => commit(claimSeasonDay(get().save, day, track)),
        replaceSave: (save) => set({ save: hydrateSave(save) }),
        resetProgress: () =>
          set((state) => ({
            save: { ...resetSave(), sessions: state.save.sessions, reviewPromptOn: state.save.reviewPromptOn, updatedAt: Date.now() },
            notices: [],
          })),
        bumpSession: () => set((state) => ({ save: { ...state.save, sessions: state.save.sessions + 1 } })),
        markReviewPrompted: (day) => set((state) => ({ save: { ...state.save, reviewPromptOn: day } })),
      };
    },
    {
      name: 'velvet-vault-save-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ save: state.save }),
      merge: (persisted, current) => {
        const saved = (persisted as { save?: Partial<SaveState> } | undefined)?.save;
        return { ...current, save: hydrateSave(saved) };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export function useHydrated(): boolean {
  return useGame((state) => state.hydrated);
}

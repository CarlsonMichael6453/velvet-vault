import * as StoreReview from 'expo-store-review';

import { todayKey } from '@/src/lib/format';
import { reviewGateAllows } from '@/src/services/reviewGate';
import { useGame } from '@/src/store/gameStore';

let asking = false;

/**
 * Ask for a store review after a positive moment. Never call this at launch.
 * Unavailable platforms and system refusals fail silently.
 */
export async function considerStoreReview(): Promise<void> {
  if (asking) return;
  const save = useGame.getState().save;
  if (!reviewGateAllows({ sessions: save.sessions, lastPromptOn: save.reviewPromptOn, today: todayKey() })) return;
  asking = true;
  try {
    const requested = await requestNativeReview();
    if (requested) useGame.getState().markReviewPrompted(todayKey());
  } catch {
    // The store sheet is optional. A failure should not surface in the game.
  } finally {
    asking = false;
  }
}

async function requestNativeReview(): Promise<boolean> {
  try {
    if (!(await StoreReview.isAvailableAsync())) return false;
    if (!(await StoreReview.hasAction())) return false;
    await StoreReview.requestReview();
    return true;
  } catch {
    return false;
  }
}

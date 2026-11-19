import * as Haptics from 'expo-haptics';

import { useGame } from '@/src/store/gameStore';

export type Buzz = 'tap' | 'stop' | 'win' | 'big' | 'scratch' | 'error';

export function buzz(kind: Buzz): void {
  if (!useGame.getState().save.settings.haptics) return;
  const run = () => {
    if (kind === 'tap' || kind === 'scratch') return Haptics.selectionAsync();
    if (kind === 'stop') return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (kind === 'win') return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (kind === 'big') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };
  void run().catch(() => undefined);
}

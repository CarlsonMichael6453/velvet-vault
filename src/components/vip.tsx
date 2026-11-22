import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { VIP_TIERS, type VipTierId } from '@/src/data/economy';
import { useGame } from '@/src/store/gameStore';

export const VIP_COLORS: Record<VipTierId, string> = {
  bronze: '#c4895a',
  silver: '#d9dde6',
  gold: '#f0d78c',
  platinum: '#9ee7dc',
  diamond: '#f4fbff',
};

export const VIP_PLAIN: Record<VipTierId, string> = {
  bronze: 'The house rate. Daily coins, the hourly tray, and the wheel pay the amounts printed on them.',
  silver: 'Those three pay 5% more. Your badge and balance pick up a silver edge.',
  gold: 'Those three pay 10% more. A gold frame sits on the balance, and bigger purchases shake a little harder.',
  platinum: 'Those three pay 15% more. The frame takes a cooler light.',
  diamond: 'Those three pay 25% more. A prism frame and a brighter coin shower on the largest moments.',
};

export function VipBadge({ onPress, compact = false }: { onPress?: () => void; compact?: boolean }) {
  const save = useGame((state) => state.save);
  const tier = tierOf(save);
  const color = VIP_COLORS[tier.id];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.pip, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]} numberOfLines={1}>
        {compact ? tier.name : `${tier.name} VIP`}
      </Text>
    </Pressable>
  );
}

export function VipFrame({ children, tier }: { children: React.ReactNode; tier: VipTierId }) {
  const reduced = useGame((state) => state.save.settings.reducedMotion);
  const glow = useSharedValue(0.35);
  useEffect(() => {
    if (reduced || tier === 'bronze') {
      glow.value = 0.45;
      return;
    }
    glow.value = withRepeat(withTiming(1, { duration: tier === 'diamond' ? 1600 : 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [glow, reduced, tier]);
  const style = useAnimatedStyle(() => ({
    borderColor: VIP_COLORS[tier],
    shadowColor: VIP_COLORS[tier],
    shadowOpacity: tier === 'bronze' ? 0 : glow.value * 0.8,
    shadowRadius: tier === 'diamond' ? 16 : 8,
  }));
  return <Animated.View style={[styles.frame, style]}>{children}</Animated.View>;
}

export function tierOf(save: { lifetimePurchased: number; lifetimeWagered: number }) {
  const points = save.lifetimePurchased + Math.floor(save.lifetimeWagered / 20);
  let current: (typeof VIP_TIERS)[number] = VIP_TIERS[0];
  for (const tier of VIP_TIERS) {
    if (points >= tier.min) current = tier;
  }
  return current;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 160,
  },
  pip: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontFamily: 'Outfit_700Bold', fontSize: 12 },
  frame: { borderWidth: 1.5, borderRadius: 18, padding: 2 },
});

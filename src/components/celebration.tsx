import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CoinIcon } from '@/src/components/art';
import { formatCoins } from '@/src/lib/format';
import { playCelebration } from '@/src/services/audio';
import { buzz } from '@/src/services/haptics';
import { useGame } from '@/src/store/gameStore';
import { useTheme } from '@/src/theme/useTheme';

const COUNTS = [10, 16, 24, 36, 48, 64];
const TITLES = ['A small stack', 'Pocketed', 'A real stack', 'The chest opens', 'Royale light', 'The vault answers'];

export function PurchaseCelebration({
  tier,
  title,
  coins,
  onDone,
}: {
  tier: 0 | 1 | 2 | 3 | 4 | 5;
  title: string;
  coins: number;
  onDone: () => void;
}) {
  const theme = useTheme();
  const reduced = useGame((state) => state.save.settings.reducedMotion);
  const skip = useGame((state) => state.save.settings.skipAnimations);
  const pop = useSharedValue(0.7);
  const shake = useSharedValue(0);
  const flash = useSharedValue(0);
  const count = reduced ? Math.min(8, COUNTS[tier]) : COUNTS[tier];
  const coinspecs = useMemo(
    () =>
      Array.from({ length: count }, (_, id) => ({
        id,
        x: Math.random() * 100,
        delay: Math.random() * (400 + tier * 80),
        duration: 1100 + Math.random() * (800 + tier * 200),
        size: 12 + tier * 2 + Math.random() * 10,
      })),
    [count, tier],
  );

  useEffect(() => {
    if (skip) {
      onDone();
      return;
    }
    playCelebration(tier);
    if (tier >= 2) buzz(tier >= 4 ? 'big' : 'win');
    pop.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.back(1.6)) });
    if (!reduced && tier >= 2) {
      const amp = 4 + tier * 2;
      shake.value = withSequence(
        withTiming(amp, { duration: 40 }),
        withTiming(-amp, { duration: 50 }),
        withTiming(amp * 0.6, { duration: 40 }),
        withTiming(0, { duration: 50 }),
      );
    }
    if (tier >= 4) flash.value = withSequence(withTiming(0.45, { duration: 80 }), withTiming(0, { duration: 280 }));
    const timer = setTimeout(onDone, reduced ? 1400 : 1800 + tier * 420);
    return () => clearTimeout(timer);
  }, [flash, onDone, pop, reduced, shake, skip, tier]);

  const card = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }, { translateX: shake.value }] }));
  const wash = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <Pressable style={styles.overlay} onPress={onDone} accessibilityRole="button" accessibilityLabel="Dismiss celebration">
      <View style={styles.scrim} />
      <Animated.View pointerEvents="none" style={[styles.flash, { backgroundColor: theme.colors.gold }, wash]} />
      {coinspecs.map((coin) => (
        <Falling key={coin.id} coin={coin} color={tier >= 4 ? theme.colors.accent2 : theme.colors.gold} />
      ))}
      <Animated.View style={[styles.card, card]}>
        <Text style={[styles.kicker, { color: theme.colors.accent2 }]}>{TITLES[tier]}</Text>
        <Text style={[styles.title, { color: theme.colors.gold, fontSize: tier >= 4 ? 28 : 22 }]}>{title}</Text>
        {coins > 0 ? <Text style={[styles.amount, { color: theme.colors.text }]}>+{formatCoins(coins)}</Text> : null}
        <Text style={[styles.note, { color: theme.colors.muted }]}>Play money. No cash value, no cash out.</Text>
        <Text style={[styles.note, { color: theme.colors.accent2 }]}>Tap to skip</Text>
      </Animated.View>
    </Pressable>
  );
}

function Falling({
  coin,
  color,
}: {
  coin: { id: number; x: number; delay: number; duration: number; size: number };
  color: string;
}) {
  const y = useSharedValue(-30);
  useEffect(() => {
    y.value = withDelay(coin.delay, withRepeat(withTiming(640, { duration: coin.duration, easing: Easing.in(Easing.quad) }), -1, false));
  }, [coin.delay, coin.duration, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${y.value}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: `${coin.x}%`, top: 0 }, style]}>
      <CoinIcon size={coin.size} color={color} />
    </Animated.View>
  );
}

export function Shimmer({ active, color }: { active: boolean; color: string }) {
  const reduced = useGame((state) => state.save.settings.reducedMotion);
  const x = useSharedValue(-180);
  useEffect(() => {
    if (!active || reduced) {
      x.value = -180;
      return;
    }
    x.value = withRepeat(withTiming(320, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [active, reduced, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { rotate: '18deg' }] }));
  if (!active) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.shimmer, { backgroundColor: color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', zIndex: 40 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  flash: { ...StyleSheet.absoluteFill },
  card: { alignItems: 'center', paddingHorizontal: 22, maxWidth: 320 },
  kicker: { fontFamily: 'Outfit_700Bold', letterSpacing: 1.4, fontSize: 12, textTransform: 'uppercase' },
  title: { fontFamily: 'Cinzel_700Bold', textAlign: 'center', marginTop: 6 },
  amount: { fontFamily: 'SpaceMono', fontSize: 32, marginTop: 8 },
  note: { fontFamily: 'Outfit_500Medium', marginTop: 8, fontSize: 13, textAlign: 'center' },
  shimmer: { position: 'absolute', top: -20, width: 36, bottom: -20, opacity: 0.28 },
});

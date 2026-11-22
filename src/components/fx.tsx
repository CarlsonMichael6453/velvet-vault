import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CoinIcon } from '@/src/components/art';
import { formatCoins } from '@/src/lib/format';
import { useGame } from '@/src/store/gameStore';
import type { Theme, WinStyle } from '@/src/theme/themes';

type Spec = { id: number; x: number; size: number; duration: number; delay: number; color: string; drift: number };

const PALETTE: Record<Theme['particle'], string[]> = {
  dust: ['#f0d78c', '#e7c98a', '#fff4d2'],
  neon: ['#ff2bd6', '#29f3ff', '#ffe56a'],
  sand: ['#ffd56a', '#e2b657', '#fff1c2'],
  ember: ['#ff7a3c', '#ffb15a', '#ffd7a1'],
  bubble: ['#b7fff2', '#7ad7ff', '#e9fffb'],
  star: ['#ffffff', '#d7cbff', '#ffc2ea'],
  sparkle: ['#ffffff', '#d5f1ff', '#fff4d2'],
  warm: ['#ffb089', '#ffd7a1', '#ff8a5b'],
  snow: ['#ffffff', '#e7f4ff', '#d5e8f5'],
  petal: ['#ffd0e0', '#ff8fb8', '#fff0f5'],
  bat: ['#2a1838', '#6a3a78', '#f08a2a'],
};

export function Particles({
  theme,
  reduced,
  kind,
  count: countOverride,
}: {
  theme: Theme;
  reduced: boolean;
  kind?: Theme['particle'];
  count?: number;
}) {
  const particle = kind ?? theme.particle;
  const count = reduced ? 0 : countOverride ?? (theme.lavish || kind ? 18 : 12);
  const specs = useMemo<Spec[]>(() => {
    const colors = PALETTE[particle];
    return Array.from({ length: count }, (_, id) => ({
      id,
      x: Math.random() * 100,
      size: particle === 'bubble' || particle === 'snow' ? 5 + Math.random() * 8 : 2 + Math.random() * 4,
      duration: 5000 + Math.random() * 7000,
      delay: Math.random() * 4000,
      color: colors[id % colors.length],
      drift: -20 + Math.random() * 40,
    }));
  }, [count, particle]);
  if (count === 0) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {specs.map((spec) => (
        <Mote key={`${particle}-${spec.id}`} spec={spec} fall={particle === 'snow' || particle === 'petal' || particle === 'bat'} />
      ))}
    </View>
  );
}

function Mote({ spec, fall }: { spec: Spec; fall: boolean }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(spec.delay, withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.linear }), -1, false));
  }, [progress, spec.delay, spec.duration]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.sin(progress.value * Math.PI) * 0.85,
    transform: [
      { translateY: (fall ? progress.value : 1 - progress.value) * 320 - 40 },
      { translateX: progress.value * spec.drift },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${spec.x}%`,
          bottom: 0,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

export function Orbs({ theme, reduced }: { theme: Theme; reduced: boolean }) {
  const a = useSharedValue(0);
  useEffect(() => {
    a.value = reduced ? 0.4 : withRepeat(withTiming(1, { duration: theme.lavish ? 7000 : 11000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [a, reduced, theme.lavish]);
  const one = useAnimatedStyle(() => ({ transform: [{ scale: 1 + a.value * 0.15 }], opacity: 0.55 + a.value * 0.25 }));
  const two = useAnimatedStyle(() => ({ transform: [{ scale: 1.1 - a.value * 0.12 }], opacity: 0.35 + (1 - a.value) * 0.2 }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.orb, { backgroundColor: theme.colors.orb1, top: -80, left: -40 }, one]} />
      <Animated.View style={[styles.orb, { backgroundColor: theme.colors.orb2, top: 180, right: -70, width: 220, height: 220 }, two]} />
      {theme.lavish ? <Animated.View style={[styles.orb, { backgroundColor: theme.colors.orb3, bottom: 40, left: -30, width: 180, height: 180 }, one]} /> : null}
    </View>
  );
}

const TITLES: Record<NonNullable<WinStyle> | 'big' | 'mega' | 'ultra' | 'jackpot', string> = {
  classic: 'BIG WIN',
  neon: 'BIG WIN',
  gold: 'BIG WIN',
  dragon: 'BIG WIN',
  ocean: 'BIG WIN',
  cosmos: 'BIG WIN',
  diamond: 'BIG WIN',
  big: 'BIG WIN',
  mega: 'MEGA WIN',
  ultra: 'ULTRA WIN',
  jackpot: 'JACKPOT',
};

export function BigWin({
  tier,
  amount,
  theme,
  onDone,
}: {
  tier: 'big' | 'mega' | 'ultra' | 'jackpot';
  amount: number;
  theme: Theme;
  onDone: () => void;
}) {
  const pop = useSharedValue(0.6);
  const skip = useGame((state) => state.save.settings.skipAnimations);
  useEffect(() => {
    if (skip) {
      onDone();
      return;
    }
    pop.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.back(1.4)) });
    const timer = setTimeout(onDone, tier === 'jackpot' || tier === 'ultra' ? 4200 : 3200);
    return () => clearTimeout(timer);
  }, [onDone, pop, skip, tier]);
  const titleStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const coins = useMemo(() => Array.from({ length: theme.lavish ? 28 : 18 }, (_, id) => ({
    id,
    x: Math.random() * 100,
    delay: Math.random() * 600,
    duration: 1400 + Math.random() * 1200,
    size: 14 + Math.random() * 12,
  })), [theme.lavish]);
  return (
    <Pressable style={styles.winOverlay} onPress={onDone}>
      <View style={[styles.winScrim, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />
      {coins.map((coin) => (
        <FallingCoin key={coin.id} coin={coin} color={theme.colors.gold} />
      ))}
      <Animated.View style={[styles.winCard, titleStyle]}>
        <Text style={[styles.kicker, { color: theme.colors.accent2 }]}>{theme.winStyle === 'neon' ? 'NEON PAYOUT' : 'VELVET VAULT'}</Text>
        <Text style={[styles.winTitle, { color: theme.colors.gold }]}>{TITLES[tier]}</Text>
        <Text style={[styles.winAmount, { color: theme.colors.text }]}>+{formatCoins(amount)}</Text>
        <Text style={[styles.winNote, { color: theme.colors.muted }]}>Coins only. No cash value.</Text>
        <Text style={[styles.winNote, { color: theme.colors.accent2 }]}>Tap to skip</Text>
      </Animated.View>
    </Pressable>
  );
}

function FallingCoin({ coin, color }: { coin: { id: number; x: number; delay: number; duration: number; size: number }; color: string }) {
  const y = useSharedValue(-40);
  useEffect(() => {
    y.value = withDelay(coin.delay, withRepeat(withTiming(720, { duration: coin.duration, easing: Easing.in(Easing.quad) }), -1, false));
  }, [coin.delay, coin.duration, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${y.value}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: `${coin.x}%`, top: 0 }, style]}>
      <CoinIcon size={coin.size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', width: 260, height: 260, borderRadius: 200 },
  winOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', zIndex: 35 },
  winScrim: { ...StyleSheet.absoluteFill },
  winCard: { alignItems: 'center', paddingHorizontal: 24 },
  kicker: { fontFamily: 'Cinzel_700Bold', letterSpacing: 3, fontSize: 12 },
  winTitle: { fontFamily: 'Cinzel_900Black', fontSize: 48, letterSpacing: 1, textAlign: 'center', marginTop: 6 },
  winAmount: { fontFamily: 'SpaceMono', fontSize: 36, marginTop: 8 },
  winNote: { fontFamily: 'Outfit_500Medium', marginTop: 8, fontSize: 13 },
});

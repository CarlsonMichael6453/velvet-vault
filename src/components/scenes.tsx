import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import type { BackgroundDef } from '@/src/theme/backgrounds';

export function BackgroundScene({ scene, reduced, scrim = true }: { scene: BackgroundDef; reduced: boolean; scrim?: boolean }) {
  const [height, setHeight] = useState(360);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
      <LinearGradient colors={scene.colors} style={StyleSheet.absoluteFill} />
      {scene.id === 'cabin' ? <Cabin reduced={reduced} /> : null}
      {scene.id === 'beach' ? <Beach reduced={reduced} height={height} /> : null}
      {scene.id === 'aurora' ? <Aurora reduced={reduced} /> : null}
      {scene.id === 'blossom' ? <Blossom reduced={reduced} /> : null}
      {scene.id === 'reef' ? <Reef reduced={reduced} height={height} /> : null}
      {scene.id === 'candy' ? <Candy reduced={reduced} /> : null}
      {scene.id === 'station' ? <Station reduced={reduced} /> : null}
      {scene.id === 'manor' ? <Manor reduced={reduced} /> : null}
      {scene.id === 'palace' ? <Palace reduced={reduced} /> : null}
      {scene.id === 'arcade' ? <Arcade reduced={reduced} height={height} /> : null}
      {scrim ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(8,10,18,0)', 'rgba(8,10,18,0.45)', 'rgba(8,10,18,0.88)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%' }}
        />
      ) : null}
    </View>
  );
}

function Drift({
  count,
  color,
  fall,
  reduced,
  size,
}: {
  count: number;
  color: string;
  fall: boolean;
  reduced: boolean;
  size: number;
}) {
  if (reduced) return null;
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Mote key={index} index={index} color={color} fall={fall} size={size} />
      ))}
    </>
  );
}

function Mote({ index, color, fall, size }: { index: number; color: string; fall: boolean; size: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 4200 + (index % 5) * 700, easing: Easing.linear }), -1, false);
  }, [index, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + Math.sin(progress.value * Math.PI) * 0.55,
    transform: [
      { translateY: (fall ? progress.value : 1 - progress.value) * 280 - 30 },
      { translateX: Math.sin(progress.value * Math.PI * 2) * 10 },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${(index * 37) % 92}%`,
          bottom: fall ? undefined : 0,
          top: fall ? 0 : undefined,
          width: size + (index % 3),
          height: size + (index % 3),
          borderRadius: size,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function Cabin({ reduced }: { reduced: boolean }) {
  return (
    <>
      <View style={[styles.ground, { height: '18%', backgroundColor: '#f4f7fb' }]} />
      <View style={[styles.pine, { left: '8%', bottom: '16%', backgroundColor: '#1d4a38' }]} />
      <View style={[styles.pine, { right: '10%', bottom: '14%', backgroundColor: '#163c2e', width: '12%', height: '22%' }]} />
      <View style={[styles.cabin, { backgroundColor: '#7a4630' }]} />
      <View style={[styles.roof, { backgroundColor: '#4e2a1c' }]} />
      <Flicker style={styles.window} color="#ffd27a" reduced={reduced} />
      <Drift count={14} color="#ffffff" fall reduced={reduced} size={4} />
    </>
  );
}

function Beach({ reduced, height }: { reduced: boolean; height: number }) {
  const shift = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    shift.value = withRepeat(withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, shift]);
  const wave = useAnimatedStyle(() => ({ transform: [{ translateX: (shift.value - 0.5) * Math.min(height, 80) }] }));
  return (
    <>
      <View style={[styles.sun, { backgroundColor: '#ffe56a' }]} />
      <View style={[styles.ocean, { backgroundColor: '#1f8fbf' }]} />
      <Animated.View style={[styles.wave, { backgroundColor: 'rgba(180, 230, 245, 0.85)' }, wave]} />
      <View style={[styles.ground, { height: '16%', backgroundColor: '#f0d2a0' }]} />
      <View style={styles.trunk} />
      <View style={[styles.frond, { backgroundColor: '#1f8f4a', left: '4%', bottom: '38%' }]} />
      <View style={[styles.frond, { backgroundColor: '#2ea85c', left: '12%', bottom: '40%' }]} />
    </>
  );
}

function Aurora({ reduced }: { reduced: boolean }) {
  return (
    <>
      <Band top="16%" color="rgba(120, 255, 190, 0.55)" reduced={reduced} />
      <Band top="30%" color="rgba(150, 120, 255, 0.45)" reduced={reduced} />
      <Band top="44%" color="rgba(80, 220, 255, 0.35)" reduced={reduced} />
      <Drift count={10} color="#ffffff" fall={false} reduced={reduced} size={2} />
    </>
  );
}

function Band({ top, color, reduced }: { top: `${number}%`; color: string; reduced: boolean }) {
  const shift = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    shift.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, shift]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + shift.value * 0.45,
    transform: [{ translateX: (shift.value - 0.5) * 36 }, { rotate: '-8deg' }, { scaleX: 1.25 }],
  }));
  return <Animated.View style={[{ position: 'absolute', left: '-8%', right: '-8%', top, height: 34, borderRadius: 40, backgroundColor: color }, reduced ? { opacity: 0.55 } : style]} />;
}

function Blossom({ reduced }: { reduced: boolean }) {
  return (
    <>
      <View style={[styles.ground, { height: '22%', backgroundColor: '#c7e8b0' }]} />
      <View style={[styles.trunk, { left: '46%', bottom: '18%', height: '34%', backgroundColor: '#6b3a32' }]} />
      <View style={[styles.bloom, { left: '34%', bottom: '40%', backgroundColor: '#ff8fb8' }]} />
      <View style={[styles.bloom, { left: '48%', bottom: '48%', backgroundColor: '#ffd0e0' }]} />
      <View style={[styles.bloom, { left: '58%', bottom: '38%', backgroundColor: '#ff6f9a' }]} />
      <Drift count={12} color="#ffd0e0" fall reduced={reduced} size={6} />
    </>
  );
}

function Reef({ reduced, height }: { reduced: boolean; height: number }) {
  const shift = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    shift.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.linear }), -1, false);
  }, [reduced, shift]);
  const fish = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value * Math.max(120, height * 0.4) - 40 }] }));
  return (
    <>
      <View style={[styles.ground, { height: '16%', backgroundColor: '#e6d2a8' }]} />
      <View style={[styles.coral, { left: '12%', backgroundColor: '#ff7a8a' }]} />
      <View style={[styles.coral, { left: '30%', height: '22%', backgroundColor: '#ffb15a' }]} />
      <View style={[styles.coral, { right: '14%', backgroundColor: '#d46bff' }]} />
      <Animated.View style={[styles.fish, fish]} />
      <Drift count={12} color="rgba(220, 250, 255, 0.85)" fall={false} reduced={reduced} size={7} />
    </>
  );
}

function Candy({ reduced }: { reduced: boolean }) {
  return (
    <>
      <View style={[styles.gumdrop, { left: '6%', backgroundColor: '#ff6f9a' }]} />
      <View style={[styles.gumdrop, { left: '28%', backgroundColor: '#7dcea0', bottom: '4%' }]} />
      <View style={[styles.gumdrop, { left: '52%', backgroundColor: '#7eb6ff' }]} />
      <View style={[styles.gumdrop, { right: '4%', backgroundColor: '#ffe27a', bottom: '6%' }]} />
      <View style={styles.lollipop} />
      <Drift count={8} color="#fff6fb" fall={false} reduced={reduced} size={8} />
    </>
  );
}

function Station({ reduced }: { reduced: boolean }) {
  return (
    <>
      <View style={styles.earth} />
      <View style={styles.ring} />
      <Flicker style={styles.porthole} color="#d7e8ff" reduced={reduced} />
      <Drift count={16} color="#ffffff" fall={false} reduced={reduced} size={2} />
    </>
  );
}

function Manor({ reduced }: { reduced: boolean }) {
  return (
    <>
      <View style={[styles.moon, { backgroundColor: '#f4e7c5' }]} />
      <View style={[styles.ground, { height: '20%', backgroundColor: '#140c16' }]} />
      <View style={[styles.cabin, { backgroundColor: '#2a1830', bottom: '16%', height: '24%' }]} />
      <View style={[styles.roof, { backgroundColor: '#1a1020', bottom: '38%' }]} />
      <Flicker style={[styles.window, { backgroundColor: '#ffb15a' }]} color="#ffb15a" reduced={reduced} />
      <View style={[styles.fog, { backgroundColor: 'rgba(180, 170, 190, 0.25)' }]} />
    </>
  );
}

function Palace({ reduced }: { reduced: boolean }) {
  return (
    <>
      <View style={styles.dome} />
      <View style={[styles.column, { left: '22%' }]} />
      <View style={[styles.column, { left: '46%' }]} />
      <View style={[styles.column, { left: '70%' }]} />
      <View style={[styles.ground, { height: '14%', backgroundColor: '#8a6420' }]} />
      <Drift count={10} color="#fff4d2" fall={false} reduced={reduced} size={3} />
    </>
  );
}

function Arcade({ reduced, height }: { reduced: boolean; height: number }) {
  const shift = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    shift.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.linear }), -1, false);
  }, [reduced, shift]);
  const scan = useAnimatedStyle(() => ({ transform: [{ translateY: shift.value * height }] }));
  return (
    <>
      {Array.from({ length: 8 }, (_, index) => (
        <View key={index} style={[styles.gridLine, { top: `${12 + index * 10}%` }]} />
      ))}
      <Animated.View style={[styles.scan, scan]} />
      <View style={styles.neonFrame} />
    </>
  );
}

function Flicker({ style, color, reduced }: { style: object; color: string; reduced: boolean }) {
  const glow = useSharedValue(0.7);
  useEffect(() => {
    if (reduced) return;
    glow.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [glow, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: 0.45 + glow.value * 0.55 }));
  return <Animated.View style={[style, { backgroundColor: color }, reduced ? { opacity: 0.8 } : animated]} />;
}

const styles = StyleSheet.create({
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  cabin: { position: 'absolute', left: '30%', width: '40%', height: '22%', bottom: '16%', borderRadius: 4 },
  roof: { position: 'absolute', left: '24%', width: '52%', height: '8%', bottom: '36%', borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  window: { position: 'absolute', left: '44%', width: '12%', height: '8%', bottom: '22%', borderRadius: 2 },
  pine: { position: 'absolute', width: '14%', height: '18%', borderRadius: 40 },
  sun: { position: 'absolute', right: '10%', top: '8%', width: '22%', aspectRatio: 1, borderRadius: 999 },
  ocean: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '36%' },
  wave: { position: 'absolute', left: '-10%', right: '-10%', bottom: '28%', height: '8%', borderRadius: 40 },
  trunk: { position: 'absolute', left: '8%', bottom: '16%', width: '3%', height: '30%', backgroundColor: '#7a4630', borderRadius: 4 },
  frond: { position: 'absolute', width: '12%', height: '8%', borderRadius: 20 },
  bloom: { position: 'absolute', width: '18%', aspectRatio: 1, borderRadius: 999 },
  coral: { position: 'absolute', bottom: '12%', width: '12%', height: '16%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  fish: { position: 'absolute', left: 0, top: '42%', width: 28, height: 12, borderRadius: 8, backgroundColor: '#ffe27a' },
  gumdrop: { position: 'absolute', bottom: '2%', width: '22%', height: '28%', borderTopLeftRadius: 80, borderTopRightRadius: 80 },
  lollipop: { position: 'absolute', right: '18%', top: '16%', width: '16%', aspectRatio: 1, borderRadius: 999, backgroundColor: '#ff7ab0', borderWidth: 4, borderColor: '#fff' },
  earth: { position: 'absolute', left: '-10%', bottom: '-8%', width: '50%', aspectRatio: 1, borderRadius: 999, backgroundColor: '#1f6b4a' },
  ring: { position: 'absolute', left: '18%', top: '28%', width: '64%', aspectRatio: 1, borderRadius: 999, borderWidth: 8, borderColor: 'rgba(180, 200, 230, 0.55)' },
  porthole: { position: 'absolute', left: '42%', top: '42%', width: '16%', aspectRatio: 1, borderRadius: 999 },
  moon: { position: 'absolute', right: '12%', top: '10%', width: '16%', aspectRatio: 1, borderRadius: 999 },
  fog: { position: 'absolute', left: 0, right: 0, bottom: '12%', height: '14%' },
  dome: { position: 'absolute', left: '30%', bottom: '28%', width: '40%', height: '22%', borderTopLeftRadius: 120, borderTopRightRadius: 120, backgroundColor: '#f0d78c' },
  column: { position: 'absolute', bottom: '12%', width: '8%', height: '28%', backgroundColor: '#f7e7b8', borderRadius: 4 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 80, 180, 0.25)' },
  scan: { position: 'absolute', left: 0, right: 0, top: 0, height: 10, backgroundColor: 'rgba(80, 255, 180, 0.18)' },
  neonFrame: { position: 'absolute', left: 10, right: 10, top: 10, bottom: 10, borderWidth: 2, borderColor: '#ff2bd6', borderRadius: 8 },
});

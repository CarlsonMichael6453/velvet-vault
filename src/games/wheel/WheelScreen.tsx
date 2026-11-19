import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

import { Card, Display, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { WHEEL_PRIZES } from '@/src/data/economy';
import { formatCompact, todayKey } from '@/src/lib/format';
import { playSfx } from '@/src/services/audio';
import { buzz } from '@/src/services/haptics';
import { vipFor } from '@/src/store/logic';
import { useGame } from '@/src/store/gameStore';
import { useTheme } from '@/src/theme/useTheme';

const SEGMENT = 360 / WHEEL_PRIZES.length;

export function WheelScreen() {
  const theme = useTheme();
  const save = useGame((state) => state.save);
  const reduced = save.settings.reducedMotion;
  const rotation = useSharedValue(0);
  const lights = useSharedValue(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wheelSize, setWheelSize] = useState(280);
  const vip = vipFor(save);
  const already = save.lastWheel === todayKey() && !save.pendingWheel;

  useEffect(() => {
    lights.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
    const pending = useGame.getState().save.pendingWheel;
    if (pending && !pending.credited) {
      const settled = useGame.getState().settleWheel();
      if (settled.ok) setResult(`+${(settled.amount ?? 0).toLocaleString('en-US')} Velvet Coins`);
    }
  }, [lights]);

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const bulbStyle = useAnimatedStyle(() => ({ opacity: 0.35 + lights.value * 0.65 }));

  function finish() {
    const settled = useGame.getState().settleWheel();
    setSpinning(false);
    if (settled.ok) {
      setResult(`+${(settled.amount ?? 0).toLocaleString('en-US')} Velvet Coins`);
      void playSfx('fanfare');
      buzz('big');
    }
  }

  function spin() {
    if (spinning) return;
    const index = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const started = useGame.getState().startWheel(index);
    if (!started.ok) {
      setError(started.error ?? 'The wheel is resting.');
      return;
    }
    setError(null);
    setResult(null);
    setSpinning(true);
    const turns = 6 * 360;
    const current = rotation.value % 360;
    const target = (360 - index * SEGMENT) % 360;
    const delta = (target - current + 360) % 360;
    rotation.value = withTiming(rotation.value + turns + delta, { duration: reduced ? 700 : 4800, easing: Easing.bezier(0.12, 0.7, 0.08, 1) }, (finished) => {
      if (finished) runOnJS(finish)();
    });
    void playSfx('spin');
  }

  const colors = [theme.colors.gold, theme.colors.bg2, theme.colors.accent, theme.colors.goldDeep];

  return (
    <Screen bottomInset back>
      <View style={styles.header}>
        <Display size={26}>Daily wheel</Display>
      </View>
      <Muted>One spin each day. {vip.name} multiplies the prize by {vip.multiplier === 1 ? 'nothing extra yet' : `${vip.multiplier}×`}.</Muted>
      <View
        style={[styles.stage, { height: wheelSize + 24 }]}
        onLayout={(event) => setWheelSize(Math.max(200, Math.min(300, Math.floor(event.nativeEvent.layout.width - 8))))}
      >
        <View style={[styles.pointer, { borderTopColor: theme.colors.gold }]} />
        <Animated.View style={wheelStyle}>
          <Svg width={wheelSize} height={wheelSize} viewBox="0 0 300 300">
            <G>
              {WHEEL_PRIZES.map((prize, index) => {
                const start = index * SEGMENT - SEGMENT / 2;
                const end = start + SEGMENT;
                return (
                  <Path key={prize + index} d={wedge(150, 150, 140, start, end)} fill={colors[index % colors.length]} />
                );
              })}
              {WHEEL_PRIZES.map((prize, index) => {
                const angle = index * SEGMENT;
                const point = polar(150, 150, 92, angle);
                return (
                  <SvgText key={`l-${index}`} x={point.x} y={point.y} fill={theme.colors.ink} fontSize={13} fontWeight="700" textAnchor="middle">
                    {formatCompact(Math.round(prize * vip.multiplier))}
                  </SvgText>
                );
              })}
            </G>
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.hub, { backgroundColor: theme.colors.bg0, borderColor: theme.colors.gold }, bulbStyle]} />
      </View>
      {result ? <Text style={[styles.result, { color: theme.colors.gold }]}>{result}</Text> : null}
      {error ? <Text style={[styles.result, { color: theme.colors.danger }]}>{error}</Text> : null}
      <GoldButton label={already ? 'Come back tomorrow' : spinning ? 'Spinning' : 'Spin the wheel'} onPress={spin} disabled={already || spinning} />
      <Card style={{ marginTop: 12 }}>
        <Muted>The wheel does not award cash, entries, or anything you can redeem. It is a daily coin top-up.</Muted>
      </Card>
      <LegalLine />
    </Screen>
  );
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function wedge(cx: number, cy: number, radius: number, start: number, end: number) {
  const a = polar(cx, cy, radius, start);
  const b = polar(cx, cy, radius, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stage: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  pointer: {
    position: 'absolute',
    top: 4,
    zIndex: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hub: { position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 3, top: '50%', left: '50%', marginTop: -27, marginLeft: -27 },
  result: { textAlign: 'center', fontFamily: 'Cinzel_700Bold', fontSize: 22, marginBottom: 8 },
});

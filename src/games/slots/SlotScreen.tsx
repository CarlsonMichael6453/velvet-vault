import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { SymbolTile, Card, CoinPill, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { BigWin } from '@/src/components/fx';
import { betOptions, getMachine } from '@/src/games/slots/machines';
import { celebrationFor, evaluateSpin, spinGrid, type SpinEvaluation, type SymbolId } from '@/src/games/slots/engine';
import { levelFromXp, maxBetForLevel, nextBetUnlock } from '@/src/data/economy';
import { formatCoins } from '@/src/lib/format';
import { mulberry32 } from '@/src/lib/random';
import { playSfx } from '@/src/services/audio';
import { buzz } from '@/src/services/haptics';
import { useGame } from '@/src/store/gameStore';
import { useTheme } from '@/src/theme/useTheme';

export function SlotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const machine = getMachine(String(id));
  const router = useRouter();
  const theme = useTheme();
  const coins = useGame((state) => state.save.coins);
  const xp = useGame((state) => state.save.xp);
  const reduced = useGame((state) => state.save.settings.reducedMotion);
  const freeSpin = useGame((state) => state.save.freeSpin);
  const level = levelFromXp(xp);
  const [betIndex, setBetIndex] = useState(0);
  const [frameW, setFrameW] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinId, setSpinId] = useState(0);
  const [strips, setStrips] = useState<SymbolId[][] | null>(null);
  const [hot, setHot] = useState<boolean[][]>([]);
  const [banner, setBanner] = useState('Pick a bet and spin.');
  const [lastWin, setLastWin] = useState(0);
  const [paytable, setPaytable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ tier: 'big' | 'mega' | 'ultra' | 'jackpot'; amount: number } | null>(null);
  const [autoLeft, setAutoLeft] = useState(0);
  const busy = useRef(false);
  const stopped = useRef(new Set<number>());
  const pending = useRef<SpinEvaluation | null>(null);
  const betUsed = useRef(0);
  const autoRef = useRef(0);
  const chainTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const options = machine ? betOptions(machine, level.level) : [];
  const bet = options[Math.min(betIndex, Math.max(0, options.length - 1))] ?? 0;
  const symbolSize = machine && frameW > 0 ? Math.max(52, Math.min(machine.reels === 3 ? 112 : 78, Math.floor((frameW - 12 - (machine.reels - 1) * 4) / machine.reels))) : 64;

  const preview = useMemo(() => (machine ? spinGrid(machine, mulberry32(machine.levelRequired * 91)) : []), [machine]);

  useEffect(() => {
    return () => {
      if (chainTimer.current) clearTimeout(chainTimer.current);
    };
  }, []);

  if (!machine) {
    return (
      <Screen>
        <Display>Machine missing</Display>
        <GhostButton label="Back to the floor" onPress={() => router.back()} />
      </Screen>
    );
  }

  const activeFree = freeSpin && freeSpin.machineId === machine.id && freeSpin.left > 0 ? freeSpin : null;
  const locked = level.level < machine.levelRequired;

  function finish() {
    const result = pending.current;
    if (!result) return;
    pending.current = null;
    setSpinning(false);
    const mask = machine!.paylines[0].map(() => false);
    void mask;
    const gridHot = result.grid.map((reel) => reel.map(() => false));
    result.lineWins.forEach((win) => win.positions.forEach((pos) => {
      gridHot[pos.reel][pos.row] = true;
    }));
    setHot(gridHot);
    if (result.totalWin > 0) {
      useGame.getState().creditSlotWin(result.totalWin, betUsed.current);
      setLastWin(result.totalWin);
      const multiple = result.totalWin / betUsed.current;
      setBanner(`${formatCoins(result.totalWin)} · ${multiple.toFixed(1)}×`);
      void playSfx(multiple >= 25 ? 'megawin' : multiple >= 10 ? 'bigwin' : 'win');
      buzz(multiple >= 10 ? 'big' : 'win');
    } else {
      setLastWin(0);
      setBanner(result.scatterCount > 0 ? `${result.scatterCount} vault symbols` : 'No line this time');
    }
    if (result.freeSpinsAwarded > 0) {
      const current = useGame.getState().save.freeSpin;
      const base = current && current.machineId === machine!.id ? current.left : 0;
      useGame.getState().setFreeSpin({
        machineId: machine!.id,
        left: Math.min(18, base + result.freeSpinsAwarded),
        bet: betUsed.current,
        multiplier: Math.max(current?.machineId === machine!.id ? current.multiplier : 1, result.awardedMultiplier),
      });
      setBanner(`${result.freeSpinsAwarded} free spins · ${result.awardedMultiplier}×`);
      void playSfx('fanfare');
    }
    busy.current = false;
    const tier = celebrationFor(result.totalWin, betUsed.current);
    const continuePlay = () => {
      const free = useGame.getState().save.freeSpin;
      if (free && free.machineId === machine!.id && free.left > 0) {
        chainTimer.current = setTimeout(() => spin(), 650);
        return;
      }
      if (autoRef.current > 0) {
        autoRef.current -= 1;
        setAutoLeft(autoRef.current);
        chainTimer.current = setTimeout(() => spin(), 420);
      }
    };
    if (tier) setCelebration({ tier, amount: result.totalWin });
    else continuePlay();
  }

  function onReelStopped(index: number) {
    stopped.current.add(index);
    buzz('stop');
    void playSfx('stop');
    if (machine && stopped.current.size >= machine.reels) finish();
  }

  function spin() {
    if (!machine || busy.current || locked) return;
    const active = useGame.getState().save.freeSpin;
    const usingFree = active && active.machineId === machine.id && active.left > 0;
    let spinBet = bet;
    let multiplier = 1;
    if (usingFree && active) {
      spinBet = active.bet;
      multiplier = active.multiplier;
      const left = active.left - 1;
      useGame.getState().setFreeSpin(left > 0 ? { ...active, left } : null);
      const recorded = useGame.getState().recordFreeSpin();
      if (!recorded.ok) return;
    } else {
      const paid = useGame.getState().wagerSpin(machine.id, bet);
      if (!paid.ok) {
        setMessage(paid.error ?? 'Cannot spin.');
        autoRef.current = 0;
        setAutoLeft(0);
        return;
      }
    }
    setMessage(null);
    const grid = spinGrid(machine);
    const result = evaluateSpin(machine, grid, spinBet, multiplier);
    betUsed.current = spinBet;
    pending.current = result;
    stopped.current = new Set();
    busy.current = true;
    setHot([]);
    setStrips(
      grid.map((landing, reel) => {
        const filler = Array.from({ length: 12 + reel * 2 }, () => {
          const choice = machine.symbols[Math.floor(Math.random() * machine.symbols.length)];
          return choice.id;
        });
        return [...filler, ...landing];
      }),
    );
    setSpinning(true);
    setSpinId((value) => value + 1);
    setBanner(usingFree ? `Free spin · ${multiplier}×` : 'Reels in motion');
    void playSfx('spin');
  }

  function dismissWin() {
    if (!machine) return;
    setCelebration(null);
    const free = useGame.getState().save.freeSpin;
    if (free && free.machineId === machine.id && free.left > 0) {
      chainTimer.current = setTimeout(() => spin(), 280);
      return;
    }
    if (autoRef.current > 0) {
      autoRef.current -= 1;
      setAutoLeft(autoRef.current);
      chainTimer.current = setTimeout(() => spin(), 280);
    }
  }

  const shown = strips ?? preview.map((reel) => reel);
  const nextUnlock = nextBetUnlock(level.level);

  return (
    <Screen padded={false} bottomInset>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.back, { color: theme.colors.gold }]}>Back</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{machine.name}</Text>
          <Text style={[styles.sub, { color: theme.colors.muted }]}>
            {machine.paylines.length} lines · {machine.volatility}
          </Text>
        </View>
        <CoinPill amount={coins} onPress={() => router.push('/shop')} />
      </View>

      <View style={styles.meterRow}>
        <Card style={styles.meter}>
          <Text style={[styles.meterLabel, { color: theme.colors.muted }]}>WIN</Text>
          <Text style={[styles.meterValue, { color: theme.colors.gold }]}>{formatCoins(lastWin)}</Text>
        </Card>
        <Card style={styles.meter}>
          <Text style={[styles.meterLabel, { color: theme.colors.muted }]}>{activeFree ? 'FREE SPINS' : 'BET'}</Text>
          <Text style={[styles.meterValue, { color: theme.colors.text }]}>{activeFree ? `${activeFree.left} · ${activeFree.multiplier}×` : formatCoins(bet)}</Text>
        </Card>
      </View>

      <Text style={[styles.banner, { color: theme.colors.accent2 }]}>{banner}</Text>

      <View style={[styles.cabinet, { borderColor: theme.colors.gold, backgroundColor: theme.colors.reel }]} onLayout={(event) => setFrameW(event.nativeEvent.layout.width)}>
        <View style={styles.reels}>
          {shown.map((strip, reel) => (
            <ReelColumn
              key={`${machine.id}-${reel}`}
              strip={strip}
              icons={Object.fromEntries(machine.symbols.map((symbol) => [symbol.id, symbol.icon]))}
              size={symbolSize}
              spinning={spinning}
              spinId={spinId}
              index={reel}
              reduced={reduced}
              hot={hot[reel]}
              onStopped={onReelStopped}
            />
          ))}
        </View>
      </View>

      {message ? <Text style={[styles.message, { color: theme.colors.danger }]}>{message}</Text> : null}
      {locked ? <Muted center>Reach level {machine.levelRequired} to unlock this machine.</Muted> : null}

      <View style={styles.controls}>
        <View style={styles.betRow}>
          <GhostButton label="−" onPress={() => setBetIndex((value) => Math.max(0, value - 1))} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.betLabel, { color: theme.colors.muted }]}>TOTAL BET</Text>
            <Text style={[styles.betValue, { color: theme.colors.text }]}>{formatCoins(bet)}</Text>
            <Text style={[styles.betHint, { color: theme.colors.muted }]}>
              {formatCoins(bet / machine.paylines.length)} per line
              {nextUnlock ? ` · Lv ${nextUnlock.level} raises the cap` : ''}
            </Text>
          </View>
          <GhostButton
            label="+"
            onPress={() => {
              if (betIndex >= options.length - 1) {
                setMessage(nextUnlock ? `Level ${nextUnlock.level} raises your max bet to ${formatCoins(nextUnlock.bet)}.` : `Level cap is ${formatCoins(maxBetForLevel(level.level))}.`);
                return;
              }
              setBetIndex((value) => value + 1);
            }}
          />
        </View>
        <GoldButton label={spinning ? 'SPINNING' : activeFree ? 'FREE SPIN' : autoLeft > 0 ? `AUTO ${autoLeft}` : 'SPIN'} onPress={spin} disabled={spinning || locked} />
        <View style={styles.sideRow}>
          <GhostButton
            label={autoLeft > 0 ? 'Stop auto' : 'Auto 10'}
            onPress={() => {
              if (autoRef.current > 0) {
                autoRef.current = 0;
                setAutoLeft(0);
                return;
              }
              autoRef.current = 10;
              setAutoLeft(10);
              spin();
            }}
          />
          <GhostButton label="Pays" onPress={() => setPaytable(true)} />
        </View>
      </View>
      <LegalLine />

      {paytable ? (
        <View style={styles.modal}>
          <Card>
            <Display size={22}>Paytable</Display>
            <Muted>Line pays are multipliers of the line bet. Wilds stand in for any paying symbol. Three or more Vault symbols, anywhere, pay on the total bet and start free spins.</Muted>
            {machine.symbols.filter((symbol) => symbol.id !== 'scatter').map((symbol) => (
              <Text key={symbol.id} style={[styles.payRow, { color: theme.colors.text }]}>
                {symbol.label}{'  '}
                {Object.entries(symbol.payouts)
                  .map(([count, mult]) => `${count}× ${mult}`)
                  .join('   ')}
              </Text>
            ))}
            <Text style={[styles.payRow, { color: theme.colors.gold }]}>Vault ×3 pays 1× and 5 free spins at 2×. ×4 pays 4× and 6 spins. ×5 pays 12× and 8 spins at 3×.</Text>
            <GoldButton label="Close" onPress={() => setPaytable(false)} />
          </Card>
        </View>
      ) : null}
      {celebration ? <BigWin tier={celebration.tier} amount={celebration.amount} theme={theme} onDone={dismissWin} /> : null}
    </Screen>
  );
}

function ReelColumn({
  strip,
  icons,
  size,
  spinning,
  spinId,
  index,
  reduced,
  hot,
  onStopped,
}: {
  strip: SymbolId[];
  icons: Record<string, string>;
  size: number;
  spinning: boolean;
  spinId: number;
  index: number;
  reduced: boolean;
  hot?: boolean[];
  onStopped: (index: number) => void;
}) {
  const end = -Math.max(0, strip.length - 3) * size;
  const y = useSharedValue(end);
  const onStoppedRef = useRef(onStopped);
  onStoppedRef.current = onStopped;
  const finishReel = useCallback((reel: number) => onStoppedRef.current(reel), []);
  useEffect(() => {
    if (!spinning) {
      y.value = end;
      return;
    }
    y.value = 0;
    y.value = withDelay(
      reduced ? 0 : index * 130,
      withTiming(end, { duration: reduced ? 240 : 900 + index * 280, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(finishReel)(index);
      }),
    );
  }, [spinning, spinId, end, index, reduced, y, finishReel]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const landingStart = Math.max(0, strip.length - 3);
  return (
    <View style={{ width: size, height: size * 3, overflow: 'hidden' }}>
      <Animated.View style={style}>
        {strip.map((symbol, row) => {
          const visibleRow = row - landingStart;
          const winner = !!hot && visibleRow >= 0 && hot[visibleRow];
          const dim = !!hot && hot.some(Boolean) && visibleRow >= 0 && !winner;
          return <SymbolTile key={`${spinId}-${row}-${symbol}`} icon={icons[symbol] ?? 'coin'} size={size} hot={winner} dim={dim && !spinning} />;
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  back: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  name: { fontFamily: 'Cinzel_700Bold', fontSize: 18 },
  sub: { fontFamily: 'Outfit_400Regular', fontSize: 12 },
  meterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  meter: { flex: 1, paddingVertical: 8 },
  meterLabel: { fontFamily: 'Outfit_500Medium', fontSize: 11, letterSpacing: 1 },
  meterValue: { fontFamily: 'SpaceMono', fontSize: 18, marginTop: 2 },
  banner: { textAlign: 'center', fontFamily: 'Outfit_600SemiBold', marginVertical: 8, paddingHorizontal: 16 },
  cabinet: { marginHorizontal: 16, borderWidth: 2, borderRadius: 18, padding: 8 },
  reels: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  controls: { paddingHorizontal: 16, gap: 10, marginTop: 12 },
  betRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  betLabel: { fontFamily: 'Outfit_500Medium', fontSize: 11, letterSpacing: 1 },
  betValue: { fontFamily: 'SpaceMono', fontSize: 20 },
  betHint: { fontFamily: 'Outfit_400Regular', fontSize: 11, textAlign: 'center' },
  sideRow: { flexDirection: 'row', gap: 8 },
  message: { textAlign: 'center', fontFamily: 'Outfit_500Medium', marginTop: 8, paddingHorizontal: 16 },
  modal: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 18, zIndex: 20 },
  payRow: { fontFamily: 'Outfit_500Medium', fontSize: 13, marginVertical: 3 },
});

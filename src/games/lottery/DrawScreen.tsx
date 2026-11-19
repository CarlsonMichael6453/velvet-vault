import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { Card, CoinPill, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { BigWin } from '@/src/components/fx';
import { DRAW_TICKET_PRICE, JACKPOT_SEED, levelFromXp } from '@/src/data/economy';
import { MAIN_PICKS, MAIN_POOL, STAR_POOL, drawResult, quickPick, type Ticket } from '@/src/games/lottery/draw';
import { celebrationFor } from '@/src/games/slots/engine';
import { formatCoins } from '@/src/lib/format';
import { playSfx } from '@/src/services/audio';
import { considerStoreReview } from '@/src/services/reviewPrompt';
import { buzz } from '@/src/services/haptics';
import { useGame } from '@/src/store/gameStore';
import type { PendingDraw } from '@/src/store/types';
import { useTheme } from '@/src/theme/useTheme';

export function DrawScreen() {
  const router = useRouter();
  const theme = useTheme();
  const coins = useGame((state) => state.save.coins);
  const jackpot = useGame((state) => state.save.jackpot);
  const [main, setMain] = useState<number[]>([]);
  const [star, setStar] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<1 | 3 | 5>(1);
  const [error, setError] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(0);
  const [active, setActive] = useState<PendingDraw | null>(null);
  const [done, setDone] = useState(false);
  const [celebration, setCelebration] = useState<{ tier: 'big' | 'mega' | 'ultra' | 'jackpot'; amount: number } | null>(null);
  const levelBeforeDraw = useRef(1);

  const cost = quantity * DRAW_TICKET_PRICE;
  const ready = main.length === MAIN_PICKS && star !== null;

  useEffect(() => {
    const pending = useGame.getState().save.pendingDraw;
    if (pending && !pending.credited) {
      setActive(pending);
      setShowCount(0);
      setDone(false);
    }
  }, []);

  useEffect(() => {
    if (!active || done) return;
    if (showCount >= active.drawnMain.length + 1) {
      const result = useGame.getState().settleDraw();
      setDone(true);
      if ((result.amount ?? 0) > 0) {
        void playSfx(active.jackpotWon ? 'fanfare' : 'win');
        buzz('big');
        const tier = active.jackpotWon ? 'jackpot' : celebrationFor(result.amount ?? 0, cost);
        if (tier) setCelebration({ tier, amount: result.amount ?? 0 });
        else if (levelFromXp(useGame.getState().save.xp).level > levelBeforeDraw.current) void considerStoreReview();
      } else if (levelFromXp(useGame.getState().save.xp).level > levelBeforeDraw.current) {
        void considerStoreReview();
      }
      return;
    }
    const timer = setTimeout(() => {
      setShowCount((count) => count + 1);
      void playSfx('ball');
      buzz('stop');
    }, 700);
    return () => clearTimeout(timer);
  }, [active, showCount, done, cost]);

  function toggleMain(value: number) {
    setMain((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      if (current.length >= MAIN_PICKS) return current;
      return [...current, value];
    });
  }

  function play(tickets: Ticket[]) {
    levelBeforeDraw.current = levelFromXp(useGame.getState().save.xp).level;
    const draw = drawResult();
    const result = useGame.getState().buyDraw(tickets, draw);
    if (!result.ok || !result.save.pendingDraw) {
      setError(result.error ?? 'The draw did not start.');
      return;
    }
    setError(null);
    setDone(false);
    setShowCount(0);
    setActive(result.save.pendingDraw);
    void playSfx('whoosh');
  }

  function buySelected() {
    if (!ready || star === null) {
      setError(`Choose ${MAIN_PICKS} numbers and one Vault Star.`);
      return;
    }
    const own: Ticket = { main: [...main].sort((a, b) => a - b), star };
    const extras = Array.from({ length: quantity - 1 }, () => quickPick());
    play([own, ...extras]);
  }

  const balls = active ? [...active.drawnMain.map((value) => ({ value, star: false })), { value: active.drawnStar, star: true }] : [];

  return (
    <Screen scroll bottomInset back>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Display size={26}>Vault Draw</Display>
          <Muted>Five numbers from 1–{MAIN_POOL}, plus one Vault Star. Same draw, up to five tickets.</Muted>
        </View>
        <CoinPill amount={coins} onPress={() => router.push('/shop')} />
      </View>
      <Card style={{ marginTop: 8 }}>
        <Text style={[styles.kicker, { color: theme.colors.muted }]}>PROGRESSIVE JACKPOT</Text>
        <Text style={[styles.jackpot, { color: theme.colors.gold }]}>{formatCoins(jackpot)}</Text>
        <Muted>It grows with every ticket. Winning it pays coins and resets the meter to {formatCoins(JACKPOT_SEED)}. Still not cash.</Muted>
      </Card>

      {active ? (
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.kicker, { color: theme.colors.accent2 }]}>{done ? 'Result' : 'Drawing'}</Text>
          <View style={styles.ballRow}>
            {balls.map((ball, index) => (
              <DrawBall key={`${ball.star}-${index}`} value={ball.value} star={ball.star} show={index < showCount} delay={index * 40} />
            ))}
          </View>
          {done ? (
            <View style={{ gap: 8, marginTop: 8 }}>
              {active.tickets.map((ticket, index) => {
                const matches = ticket.main.filter((value) => active.drawnMain.includes(value)).length;
                const starHit = ticket.star === active.drawnStar;
                return (
                  <Text key={index} style={[styles.ticketLine, { color: theme.colors.text }]}>
                    {ticket.main.join(' ')} · star {ticket.star} · {matches} match{matches === 1 ? '' : 'es'}
                    {starHit ? ' + star' : ''}
                  </Text>
                );
              })}
              <GoldButton
                label="Play again"
                onPress={() => {
                  setActive(null);
                  setDone(false);
                  setShowCount(0);
                }}
              />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 12 }}>
          <Text style={[styles.kicker, { color: theme.colors.muted }]}>YOUR NUMBERS {main.length}/{MAIN_PICKS}</Text>
          <View style={styles.grid}>
            {Array.from({ length: MAIN_POOL }, (_, index) => index + 1).map((value) => {
              const selected = main.includes(value);
              return (
                <Pressable key={value} onPress={() => toggleMain(value)} style={[styles.num, { borderColor: selected ? theme.colors.gold : theme.colors.cardBorder, backgroundColor: selected ? theme.colors.gold : theme.colors.card }]}>
                  <Text style={{ color: selected ? theme.colors.ink : theme.colors.text, fontFamily: 'Outfit_700Bold' }}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.kicker, { color: theme.colors.muted }]}>VAULT STAR</Text>
          <View style={styles.ballRow}>
            {Array.from({ length: STAR_POOL }, (_, index) => index + 1).map((value) => {
              const selected = star === value;
              return (
                <Pressable key={value} onPress={() => setStar(value)} style={[styles.star, { borderColor: selected ? theme.colors.accent : theme.colors.cardBorder, backgroundColor: selected ? theme.colors.accent : theme.colors.card }]}>
                  <Text style={{ color: selected ? theme.colors.ink : theme.colors.text, fontFamily: 'Outfit_700Bold' }}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.qty}>
            {([1, 3, 5] as const).map((count) => (
              <Pressable key={count} onPress={() => setQuantity(count)} style={[styles.num, { borderColor: quantity === count ? theme.colors.gold : theme.colors.cardBorder, backgroundColor: quantity === count ? theme.colors.gold : 'transparent' }]}>
                <Text style={{ color: quantity === count ? theme.colors.ink : theme.colors.text, fontFamily: 'Outfit_600SemiBold' }}>{count}×</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={{ color: theme.colors.danger, fontFamily: 'Outfit_500Medium' }}>{error}</Text> : null}
          <GoldButton label={ready ? `Draw · ${formatCoins(cost)}` : 'Complete your ticket'} onPress={buySelected} />
          <GhostButton
            label={`Quick pick ${quantity} · ${formatCoins(cost)}`}
            onPress={() => play(Array.from({ length: quantity }, () => quickPick()))}
          />
        </View>
      )}
      <LegalLine />
      {celebration ? <BigWin tier={celebration.tier} amount={celebration.amount} theme={theme} onDone={() => { setCelebration(null); void considerStoreReview(); }} /> : null}
    </Screen>
  );
}

function DrawBall({ value, star, show, delay }: { value: number; star: boolean; show: boolean; delay: number }) {
  const theme = useTheme();
  const scale = useSharedValue(0.4);
  useEffect(() => {
    if (!show) return;
    scale.value = withDelay(delay, withSpring(1, { damping: 11, stiffness: 160 }));
  }, [show, delay, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: show ? 1 : 0.25 }));
  return (
    <Animated.View style={[styles.ball, { backgroundColor: star ? theme.colors.accent : theme.colors.gold }, style]}>
      <Text style={{ color: theme.colors.ink, fontFamily: 'Outfit_700Bold', fontSize: 16 }}>{show ? value : '•'}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  kicker: { fontFamily: 'Outfit_600SemiBold', letterSpacing: 1, fontSize: 12 },
  jackpot: { fontFamily: 'SpaceMono', fontSize: 32, marginVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  num: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  star: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ballRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 8 },
  ball: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  qty: { flexDirection: 'row', gap: 8 },
  ticketLine: { fontFamily: 'Outfit_500Medium', fontSize: 13 },
});

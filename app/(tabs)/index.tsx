import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, CoinPill, Display, GoldButton, LegalLine, Muted, Screen, Wordmark } from '@/src/components/ui';
import { DAILY_REWARDS, HOURLY_COINS, levelFromXp, levelTitle } from '@/src/data/economy';
import { MACHINES } from '@/src/games/slots/machines';
import { formatClock, formatCoins, todayKey } from '@/src/lib/format';
import { playSfx } from '@/src/services/audio';
import { considerStoreReview } from '@/src/services/reviewPrompt';
import { useGame } from '@/src/store/gameStore';
import { dailyAvailable, hourlyRemaining, streakIfClaimed, vipFor } from '@/src/store/logic';
import { useTheme } from '@/src/theme/useTheme';

export default function LobbyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const save = useGame((state) => state.save);
  const [now, setNow] = useState(Date.now());
  const level = levelFromXp(save.xp);
  const vip = vipFor(save);
  const today = todayKey();
  const dailyOpen = dailyAvailable(save, today);
  const streakPreview = streakIfClaimed(save, today);
  const hourLeft = hourlyRemaining(save, now);
  const featured = [...MACHINES].reverse().find((machine) => level.level >= machine.levelRequired) ?? MACHINES[0];

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  function claim(kind: 'daily' | 'hourly') {
    const result = kind === 'daily' ? useGame.getState().claimDaily() : useGame.getState().claimHourly();
    if (!result.ok) return;
    void playSfx('coin');
    if (kind === 'daily' && result.save.streak > 0 && result.save.streak % 7 === 0) void considerStoreReview();
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Wordmark />
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
            <Text style={{ color: theme.colors.gold, fontFamily: 'Outfit_600SemiBold' }}>Settings</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/feedback')} hitSlop={8}>
            <Text style={{ color: theme.colors.muted, fontFamily: 'Outfit_500Medium', fontSize: 13 }}>Feedback</Text>
          </Pressable>
        </View>
      </View>

      <Card style={{ marginTop: 14 }}>
        <View style={styles.row}>
          <View>
            <Text style={[styles.kicker, { color: theme.colors.muted }]}>LEVEL {level.level}</Text>
            <Text style={[styles.levelTitle, { color: theme.colors.text }]}>{levelTitle(level.level)}</Text>
          </View>
          <CoinPill amount={save.coins} onPress={() => router.push('/shop')} />
        </View>
        <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
          <View style={[styles.fill, { width: `${Math.min(100, (level.into / level.next) * 100)}%`, backgroundColor: theme.colors.gold }]} />
        </View>
        <Text style={[styles.tiny, { color: theme.colors.muted }]}>
          {level.into}/{level.next} XP · {vip.name} VIP
        </Text>
      </Card>

      <Pressable onPress={() => router.push('/draw')} style={{ marginTop: 12 }}>
        <Card>
          <Text style={[styles.kicker, { color: theme.colors.muted }]}>VAULT JACKPOT</Text>
          <Text style={[styles.jackpot, { color: theme.colors.gold }]}>{formatCoins(save.jackpot)}</Text>
          <Muted>Grows when players buy draw tickets. Paid in coins only.</Muted>
        </Card>
      </Pressable>

      <View style={styles.split}>
        <Card style={styles.half}>
          <Text style={[styles.kicker, { color: theme.colors.muted }]}>DAILY</Text>
          <Text style={[styles.bonus, { color: theme.colors.text }]}>Day {((streakPreview - 1) % DAILY_REWARDS.length) + 1}</Text>
          <Text style={[styles.tiny, { color: theme.colors.gold }]}>{formatCoins(Math.round(DAILY_REWARDS[(streakPreview - 1) % DAILY_REWARDS.length] * vip.multiplier))}</Text>
          <View style={{ marginTop: 8 }}>
            {dailyOpen ? <GoldButton compact label="Claim" onPress={() => claim('daily')} /> : <Muted>Claimed today. Streak {save.streak}.</Muted>}
          </View>
        </Card>
        <Card style={styles.half}>
          <Text style={[styles.kicker, { color: theme.colors.muted }]}>HOURLY</Text>
          <Text style={[styles.bonus, { color: theme.colors.text }]}>{hourLeft === 0 ? 'Ready' : formatClock(hourLeft)}</Text>
          <Text style={[styles.tiny, { color: theme.colors.gold }]}>{formatCoins(Math.round(HOURLY_COINS * vip.multiplier))}</Text>
          <View style={{ marginTop: 8 }}>
            {hourLeft === 0 ? <GoldButton compact label="Claim" onPress={() => claim('hourly')} /> : <Muted>The tray refills on the hour.</Muted>}
          </View>
        </Card>
      </View>

      <Pressable onPress={() => router.push('/wheel')} style={{ marginTop: 12 }}>
        <Card style={{ borderColor: theme.colors.accent }}>
          <Text style={[styles.kicker, { color: theme.colors.accent }]}>DAILY WHEEL</Text>
          <Text style={[styles.bonus, { color: theme.colors.text }]}>{save.lastWheel === today ? 'Spun for today' : 'A free spin is waiting'}</Text>
        </Card>
      </Pressable>

      <Text style={[styles.section, { color: theme.colors.text }]}>Tonight on the floor</Text>
      <View style={styles.tiles}>
        <Tile title="Slots" detail="Reels, lines, free spins" onPress={() => router.push('/games')} />
        <Tile title="Scratch" detail="Foil from 100 coins" onPress={() => router.push('/scratch')} />
        <Tile title="Draw" detail="Numbers and a jackpot" onPress={() => router.push('/draw')} />
      </View>

      <Pressable onPress={() => router.push({ pathname: '/slots/[id]', params: { id: featured.id } })} style={{ marginTop: 12 }}>
        <Card>
          <Text style={[styles.kicker, { color: theme.colors.muted }]}>FEATURED MACHINE</Text>
          <Text style={[styles.bonus, { color: theme.colors.text }]}>{featured.name}</Text>
          <Muted>{featured.tagline}</Muted>
        </Card>
      </Pressable>
      <LegalLine />
    </Screen>
  );
}

function Tile({ title, detail, onPress }: { title: string; detail: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.tile, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
      <Text style={{ color: theme.colors.gold, fontFamily: 'Cinzel_700Bold', fontSize: 16 }}>{title}</Text>
      <Text style={{ color: theme.colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 4 }}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, letterSpacing: 1 },
  levelTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 20, marginTop: 2 },
  track: { height: 8, borderRadius: 99, marginTop: 12, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 99 },
  tiny: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 6 },
  jackpot: { fontFamily: 'SpaceMono', fontSize: 30, marginVertical: 4 },
  split: { flexDirection: 'row', gap: 10, marginTop: 12 },
  half: { flex: 1 },
  bonus: { fontFamily: 'Cinzel_700Bold', fontSize: 18, marginTop: 4 },
  section: { fontFamily: 'Cinzel_700Bold', fontSize: 20, marginTop: 18, marginBottom: 8 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, minHeight: 92 },
});

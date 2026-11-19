import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Display, LegalLine, Muted, Screen } from '@/src/components/ui';
import { levelFromXp, maxBetForLevel } from '@/src/data/economy';
import { MACHINES } from '@/src/games/slots/machines';
import { SCRATCH_TICKETS } from '@/src/games/scratch/tickets';
import { formatCoins } from '@/src/lib/format';
import { useGame } from '@/src/store/gameStore';
import { useTheme } from '@/src/theme/useTheme';

export default function GamesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const xp = useGame((state) => state.save.xp);
  const level = levelFromXp(xp);
  return (
    <Screen scroll back="lobby">
      <Display>The floor</Display>
      <Muted>Machines open as you level. Your max bet right now is {formatCoins(maxBetForLevel(level.level))}.</Muted>
      <Text style={[styles.section, { color: theme.colors.gold }]}>Slots</Text>
      <View style={{ gap: 10 }}>
        {MACHINES.map((machine) => {
          const locked = level.level < machine.levelRequired;
          return (
            <Pressable key={machine.id} disabled={locked} onPress={() => router.push({ pathname: '/slots/[id]', params: { id: machine.id } })}>
              <Card style={{ opacity: locked ? 0.55 : 1, borderColor: machine.accent }}>
                <View style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: machine.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.colors.text }]}>{machine.name}</Text>
                    <Text style={[styles.detail, { color: theme.colors.muted }]}>
                      {machine.reels} reels · {machine.paylines.length} lines · {machine.volatility}
                    </Text>
                    <Text style={[styles.detail, { color: theme.colors.muted }]}>{machine.tagline}</Text>
                  </View>
                  <Text style={{ color: locked ? theme.colors.danger : theme.colors.gold, fontFamily: 'Outfit_700Bold' }}>
                    {locked ? `Lv ${machine.levelRequired}` : 'Play'}
                  </Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.section, { color: theme.colors.gold }]}>Scratch foils</Text>
      <Pressable onPress={() => router.push('/scratch')}>
        <Card>
          <Text style={[styles.name, { color: theme.colors.text }]}>{SCRATCH_TICKETS.length} tickets</Text>
          <Muted>From {formatCoins(SCRATCH_TICKETS[0].price)} to {formatCoins(SCRATCH_TICKETS[SCRATCH_TICKETS.length - 1].price)} coins. Drag to scratch.</Muted>
        </Card>
      </Pressable>
      <Text style={[styles.section, { color: theme.colors.gold }]}>Vault Draw</Text>
      <Pressable onPress={() => router.push('/draw')}>
        <Card>
          <Text style={[styles.name, { color: theme.colors.text }]}>Pick five and a star</Text>
          <Muted>Animated ball draw. The jackpot meter only pays coins.</Muted>
        </Card>
      </Pressable>
      <LegalLine />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: 'Cinzel_700Bold', fontSize: 18, marginTop: 18, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  dot: { width: 12, height: 42, borderRadius: 8 },
  name: { fontFamily: 'Cinzel_700Bold', fontSize: 18 },
  detail: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 2 },
});

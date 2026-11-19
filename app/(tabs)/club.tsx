import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Display, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { levelFromXp, levelTitle } from '@/src/data/economy';
import { ACHIEVEMENTS, MISSIONS } from '@/src/data/progress';
import { formatCoins, todayKey } from '@/src/lib/format';
import { playSfx } from '@/src/services/audio';
import { useGame } from '@/src/store/gameStore';
import { vipFor } from '@/src/store/logic';
import { useTheme } from '@/src/theme/useTheme';

const TABS = ['Missions', 'Achievements', 'VIP'] as const;

export default function ClubScreen() {
  const router = useRouter();
  const theme = useTheme();
  const save = useGame((state) => state.save);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Missions');
  const level = levelFromXp(save.xp);
  const vip = vipFor(save);
  const today = todayKey();
  const missions = save.missions.date === today ? save.missions : { date: today, progress: {}, claimed: [] };

  return (
    <Screen scroll back="lobby">
      <View style={styles.header}>
        <Display>The club</Display>
        <Pressable onPress={() => router.push('/settings')}>
          <Text style={{ color: theme.colors.gold, fontFamily: 'Outfit_600SemiBold' }}>Settings</Text>
        </Pressable>
      </View>
      <Card>
        <Text style={[styles.kicker, { color: theme.colors.muted }]}>LEVEL {level.level} · {levelTitle(level.level)}</Text>
        <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
          <View style={[styles.fill, { width: `${Math.min(100, (level.into / level.next) * 100)}%`, backgroundColor: theme.colors.gold }]} />
        </View>
        <View style={styles.stats}>
          <Stat label="Wagered" value={formatCoins(save.lifetimeWagered)} />
          <Stat label="Won" value={formatCoins(save.stats.totalWon)} />
          <Stat label="Biggest" value={formatCoins(save.stats.biggestWin)} />
        </View>
      </Card>
      <View style={styles.tabs}>
        {TABS.map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, { borderColor: tab === item ? theme.colors.gold : theme.colors.cardBorder }]}>
            <Text style={{ color: tab === item ? theme.colors.gold : theme.colors.muted, fontFamily: 'Outfit_600SemiBold' }}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'Missions' ? (
        <View style={{ gap: 10 }}>
          <Muted>Resets at local midnight. Rewards are coins, not prizes.</Muted>
          {MISSIONS.map((mission) => {
            const progress = Math.min(mission.target, missions.progress[mission.id] ?? 0);
            const claimed = missions.claimed.includes(mission.id);
            const ready = progress >= mission.target && !claimed;
            return (
              <Card key={mission.id}>
                <Text style={[styles.name, { color: theme.colors.text }]}>{mission.name}</Text>
                <Muted>{mission.detail}</Muted>
                <Text style={{ color: theme.colors.gold, fontFamily: 'SpaceMono', marginTop: 6 }}>
                  {progress}/{mission.target} · {formatCoins(mission.reward)}
                </Text>
                {ready ? (
                  <View style={{ marginTop: 8 }}>
                    <GoldButton
                      compact
                      label="Claim"
                      onPress={() => {
                        const result = useGame.getState().claimMission(mission.id, mission.target, mission.reward);
                        if (result.ok) void playSfx('coin');
                      }}
                    />
                  </View>
                ) : (
                  <Text style={{ color: theme.colors.muted, fontFamily: 'Outfit_500Medium', marginTop: 6 }}>{claimed ? 'Claimed' : 'In progress'}</Text>
                )}
              </Card>
            );
          })}
        </View>
      ) : null}

      {tab === 'Achievements' ? (
        <View style={{ gap: 8 }}>
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = !!save.achievements[achievement.id];
            return (
              <Card key={achievement.id} style={{ opacity: unlocked ? 1 : 0.55 }}>
                <Text style={[styles.name, { color: unlocked ? theme.colors.gold : theme.colors.text }]}>{achievement.name}</Text>
                <Muted>{achievement.detail}</Muted>
                <Text style={{ color: theme.colors.muted, fontFamily: 'Outfit_500Medium', marginTop: 4 }}>
                  {unlocked ? 'Unlocked' : 'Locked'}
                  {achievement.reward > 0 ? ` · ${formatCoins(achievement.reward)} coins` : ''}
                </Text>
              </Card>
            );
          })}
        </View>
      ) : null}

      {tab === 'VIP' ? (
        <Card>
          <Text style={[styles.name, { color: theme.colors.gold }]}>{vip.name}</Text>
          <Muted>{vip.perk}. Points come from coin purchases plus a slice of what you wager. They do not create cash value.</Muted>
          <Text style={{ color: theme.colors.text, fontFamily: 'SpaceMono', marginTop: 8 }}>{formatCoins(vip.points)} points</Text>
          {vip.next ? <Muted>{formatCoins(vip.next.min - vip.points)} points to {vip.next.name}.</Muted> : <Muted>You are at the top tier.</Muted>}
        </Card>
      ) : null}
      <LegalLine />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: theme.colors.muted, fontFamily: 'Outfit_500Medium', fontSize: 11 }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontFamily: 'SpaceMono', fontSize: 12, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  kicker: { fontFamily: 'Outfit_600SemiBold', letterSpacing: 1, fontSize: 12 },
  track: { height: 8, borderRadius: 99, marginTop: 10, overflow: 'hidden' },
  fill: { height: 8 },
  stats: { flexDirection: 'row', marginTop: 12, gap: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  tab: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  name: { fontFamily: 'Cinzel_700Bold', fontSize: 16 },
});

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen, Display, Muted, Card } from '@/src/components/ui';
import { VIP_COLORS, VIP_PLAIN, VipFrame } from '@/src/components/vip';
import { VIP_TIERS } from '@/src/data/economy';
import { formatCoins } from '@/src/lib/format';
import { vipFor } from '@/src/store/logic';
import { useGame } from '@/src/store/gameStore';
import { useTheme } from '@/src/theme/useTheme';

export default function VipScreen() {
  const theme = useTheme();
  const save = useGame((state) => state.save);
  const vip = vipFor(save);
  const color = VIP_COLORS[vip.id];
  const span = vip.next ? vip.next.min - vip.min : 1;
  const into = Math.max(0, vip.points - vip.min);
  const pct = vip.next ? Math.min(100, (into / span) * 100) : 100;

  return (
    <Screen padded={false} bottomInset back>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Display size={26}>VIP</Display>
        <Muted>A loyalty tier for the vault. It sweetens free coins. It never turns them into cash.</Muted>
        <View style={{ marginTop: 14 }}>
          <VipFrame tier={vip.id}>
            <Card style={{ marginTop: 0 }}>
              <Text style={[styles.tier, { color }]}>{vip.name}</Text>
              <Text style={[styles.points, { color: theme.colors.text }]}>{formatCoins(vip.points)} points</Text>
              <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              {vip.next ? (
                <Muted>
                  {formatCoins(vip.next.min - vip.points)} points to {vip.next.name}.
                </Muted>
              ) : (
                <Muted>You are at the top tier.</Muted>
              )}
            </Card>
          </VipFrame>
        </View>

        <Text style={[styles.section, { color: theme.colors.gold }]}>How points are earned</Text>
        <Card>
          <Text style={[styles.body, { color: theme.colors.text }]}>1 point for every Velvet Coin you buy in the shop.</Text>
          <Text style={[styles.body, { color: theme.colors.text, marginTop: 8 }]}>1 point for every 20 coins you wager on slots, scratch tickets, or the draw.</Text>
          <Muted>Points are not a balance you can spend, transfer, or cash out.</Muted>
        </Card>

        <Text style={[styles.section, { color: theme.colors.gold }]}>Every tier</Text>
        {VIP_TIERS.map((tier) => {
          const here = tier.id === vip.id;
          return (
            <View key={tier.id} style={{ marginTop: 10 }}>
              <VipFrame tier={tier.id}>
                <Card style={{ marginTop: 0, borderColor: here ? VIP_COLORS[tier.id] : undefined }}>
                  <View style={styles.row}>
                    <View style={[styles.mark, { borderColor: VIP_COLORS[tier.id] }]}>
                      <View style={[styles.pip, { backgroundColor: VIP_COLORS[tier.id] }]} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.name, { color: VIP_COLORS[tier.id] }]} numberOfLines={1}>
                        {tier.name}
                        {here ? ' · you' : ''}
                      </Text>
                      <Text style={[styles.need, { color: theme.colors.muted }]}>
                        {tier.min === 0 ? 'From the start' : `${formatCoins(tier.min)} points`}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.body, { color: theme.colors.text, marginTop: 8 }]}>{VIP_PLAIN[tier.id]}</Text>
                  <Text style={[styles.need, { color: theme.colors.muted, marginTop: 6 }]}>{tier.perk}</Text>
                </Card>
              </VipFrame>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tier: { fontFamily: 'Cinzel_700Bold', fontSize: 32 },
  points: { fontFamily: 'SpaceMono', fontSize: 16, marginTop: 4 },
  track: { height: 10, borderRadius: 99, marginTop: 12, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 99 },
  section: { fontFamily: 'Cinzel_700Bold', fontSize: 20, marginTop: 18, marginBottom: 8 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pip: { width: 12, height: 12, borderRadius: 6 },
  name: { fontFamily: 'Cinzel_700Bold', fontSize: 18 },
  need: { fontFamily: 'Outfit_500Medium', fontSize: 12, marginTop: 2 },
});

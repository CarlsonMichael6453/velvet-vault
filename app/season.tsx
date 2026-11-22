import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PurchaseCelebration } from '@/src/components/celebration';
import { Card, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { celebrationTier, getProduct } from '@/src/data/products';
import { SEASON, seasonDayIndex, seasonReward } from '@/src/data/live';
import { formatCoins, todayKey } from '@/src/lib/format';
import { playSfx } from '@/src/services/audio';
import { iap } from '@/src/services/iap';
import { useGame } from '@/src/store/gameStore';
import { useTheme } from '@/src/theme/useTheme';
import { useState } from 'react';

export default function SeasonScreen() {
  const theme = useTheme();
  const save = useGame((state) => state.save);
  const today = todayKey();
  const day = seasonDayIndex(today);
  const product = getProduct(SEASON.productId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  async function buyPass() {
    if (!product) return;
    setBusy(true);
    const purchase = await iap.purchase(product.id);
    setBusy(false);
    if (!purchase.ok) {
      setMessage(purchase.error ?? 'Mock purchase cancelled.');
      return;
    }
    const granted = useGame.getState().grantProduct(product.id);
    setMessage(granted.ok ? 'Premium track open. No real charge.' : granted.error ?? 'Could not open the track.');
    if (granted.ok) {
      if (useGame.getState().save.settings.skipAnimations) void playSfx('tap');
      else {
        void playSfx('unlock');
        setShow(true);
      }
    }
  }

  function claim(track: 'free' | 'premium', index: number) {
    const result = useGame.getState().claimSeasonDay(index, track);
    setMessage(result.ok ? `Day ${index} claimed.` : result.error ?? 'Could not claim.');
    if (result.ok) void playSfx('coin');
  }

  return (
    <Screen padded={false} bottomInset back>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <Display size={26}>{SEASON.name}</Display>
        <Muted>
          Thirty days. A free track for everyone, and a premium track if you take the pass. Rewards are coins, plus the Gilded Season style on the pass. Nothing here becomes cash.
        </Muted>
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.kicker, { color: theme.colors.gold }]}>{day == null ? 'BETWEEN SEASONS' : `DAY ${day} OF ${SEASON.days}`}</Text>
          <Muted>{day == null ? `The next window starts on a date in the season list. This one opened ${SEASON.start}.` : 'Open days can be claimed in any order. Missed days stay open until the season ends.'}</Muted>
        </Card>
        {product && !save.seasonPremium ? (
          <Card style={{ marginTop: 12, borderColor: theme.colors.gold }}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{product.title}</Text>
            <Muted>{product.description}</Muted>
            <View style={{ marginTop: 10 }}>
              <GoldButton label={busy ? 'Contacting the store…' : `Mock store ${product.priceString}`} onPress={() => void buyPass()} disabled={busy} />
            </View>
          </Card>
        ) : (
          <Card style={{ marginTop: 12 }}>
            <Text style={[styles.name, { color: theme.colors.gold }]}>Premium track open</Text>
            <Muted>Gilded Season is in your styles. Claim the premium column below.</Muted>
          </Card>
        )}
        {message ? <Text style={[styles.message, { color: theme.colors.gold }]}>{message}</Text> : null}
        <View style={styles.headRow}>
          <Text style={[styles.col, { color: theme.colors.muted }]}>Day</Text>
          <Text style={[styles.col, { color: theme.colors.muted }]}>Free</Text>
          <Text style={[styles.col, { color: theme.colors.muted }]}>Premium</Text>
        </View>
        {Array.from({ length: SEASON.days }, (_, index) => index + 1).map((index) => {
          const open = day != null && index <= day;
          const freeClaimed = save.seasonFreeClaimed.includes(index);
          const premiumClaimed = save.seasonPremiumClaimed.includes(index);
          return (
            <View key={index} style={[styles.day, { borderColor: theme.colors.cardBorder }]}>
              <Text style={[styles.dayNum, { color: theme.colors.text }]}>{index}</Text>
              <View style={styles.cell}>
                <Text style={[styles.amount, { color: theme.colors.gold }]}>{formatCoins(seasonReward(index, 'free'))}</Text>
                {freeClaimed ? <Text style={[styles.state, { color: theme.colors.muted }]}>Claimed</Text> : open ? (
                  <GhostButton label="Claim" onPress={() => claim('free', index)} />
                ) : (
                  <Text style={[styles.state, { color: theme.colors.muted }]}>Later</Text>
                )}
              </View>
              <View style={styles.cell}>
                <Text style={[styles.amount, { color: theme.colors.accent2 }]}>{formatCoins(seasonReward(index, 'premium'))}</Text>
                {premiumClaimed ? <Text style={[styles.state, { color: theme.colors.muted }]}>Claimed</Text> : open && save.seasonPremium ? (
                  <GhostButton label="Claim" onPress={() => claim('premium', index)} />
                ) : (
                  <Text style={[styles.state, { color: theme.colors.muted }]}>{save.seasonPremium ? 'Later' : 'Pass'}</Text>
                )}
              </View>
            </View>
          );
        })}
        <LegalLine />
      </ScrollView>
      {show && product ? (
        <PurchaseCelebration
          tier={celebrationTier(product.priceString)}
          title={product.title}
          coins={0}
          onDone={() => setShow(false)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: 'Outfit_700Bold', letterSpacing: 1, fontSize: 12 },
  name: { fontFamily: 'Cinzel_700Bold', fontSize: 20 },
  message: { fontFamily: 'Outfit_500Medium', marginTop: 10 },
  headRow: { flexDirection: 'row', marginTop: 16, paddingHorizontal: 4 },
  col: { flex: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  day: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingVertical: 8 },
  dayNum: { width: 28, fontFamily: 'SpaceMono', fontSize: 13 },
  cell: { flex: 1, minWidth: 0, gap: 4 },
  amount: { fontFamily: 'SpaceMono', fontSize: 12 },
  state: { fontFamily: 'Outfit_500Medium', fontSize: 12 },
});

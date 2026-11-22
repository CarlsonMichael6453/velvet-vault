import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PurchaseCelebration, Shimmer } from '@/src/components/celebration';
import { Card, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { VipBadge, VipFrame, tierOf } from '@/src/components/vip';
import { activeHoliday } from '@/src/data/live';
import { COIN_PRODUCTS, celebrationTier, coinPackPremium, getProduct, type Product } from '@/src/data/products';
import { formatCoins, todayKey } from '@/src/lib/format';
import { playCelebration } from '@/src/services/audio';
import { buzz } from '@/src/services/haptics';
import { iap } from '@/src/services/iap';
import { vipFor } from '@/src/store/logic';
import { useGame } from '@/src/store/gameStore';
import { useTheme } from '@/src/theme/useTheme';

export default function ShopScreen() {
  const router = useRouter();
  const theme = useTheme();
  const save = useGame((state) => state.save);
  const vip = vipFor(save);
  const tier = tierOf(save);
  const holiday = activeHoliday(todayKey());
  const holidayProduct = holiday ? getProduct(holiday.productId) : undefined;
  const starter = getProduct('offer.starter');
  const [pending, setPending] = useState<Product | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState<Product | null>(null);

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    const purchase = await iap.purchase(pending.id);
    setBusy(false);
    if (!purchase.ok) {
      setStatus(purchase.error ?? 'The mock store cancelled the purchase.');
      return;
    }
    const granted = useGame.getState().grantProduct(pending.id);
    if (!granted.ok) {
      setStatus(granted.error ?? 'Could not grant that product.');
      return;
    }
    const skip = useGame.getState().save.settings.skipAnimations;
    if (!skip) {
      playCelebration(celebrationTier(pending.priceString));
      buzz(celebrationTier(pending.priceString) >= 3 ? 'big' : 'win');
      setCelebrate(pending);
    }
    setStatus(`${pending.title} added. No real charge was made.`);
    setPending(null);
  }

  return (
    <Screen padded={false} back="lobby">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}>
        <Display>Coin shop</Display>
        <VipBadge compact onPress={() => router.push('/vip')} />
      </View>
      <Muted>Buy Velvet Coins with a simulated App Store purchase. In this build nothing is charged. Coins cannot be cashed out, transferred, or redeemed.</Muted>
      <View style={{ marginTop: 12 }}>
        <VipFrame tier={tier.id}>
          <Card style={{ marginTop: 0 }}>
            <Text style={[styles.kicker, { color: theme.colors.muted }]}>BALANCE</Text>
            <Text style={[styles.balance, { color: theme.colors.gold }]}>{formatCoins(save.coins)}</Text>
            <Text style={[styles.kicker, { color: theme.colors.accent2 }]}>{vip.name} · {formatCoins(vip.points)} VIP points</Text>
          </Card>
        </VipFrame>
      </View>
      {holiday && holidayProduct && !save.ownedOffers.includes(holidayProduct.id) ? (
        <Card style={{ marginTop: 14, borderColor: theme.colors.gold, overflow: 'hidden' }}>
          <Shimmer active color={theme.colors.gold} />
          <Text style={[styles.kicker, { color: theme.colors.accent }]}>HOLIDAY · {holiday.name.toUpperCase()}</Text>
          <Text style={[styles.name, { color: theme.colors.text, marginTop: 4 }]}>{holidayProduct.title}</Text>
          <Text style={[styles.coins, { color: theme.colors.gold }]}>{formatCoins(holidayProduct.coins ?? 0)} coins and the room</Text>
          <Text style={[styles.detail, { color: theme.colors.muted }]}>{holiday.banner}</Text>
          <View style={{ marginTop: 8 }}>
            <GoldButton label={`Mock store ${holidayProduct.priceString}`} onPress={() => { setPending(holidayProduct); setStatus(null); }} />
          </View>
        </Card>
      ) : null}
      {starter && !save.ownedOffers.includes(starter.id) ? (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.kicker, { color: theme.colors.gold }]}>ONCE</Text>
          <Text style={[styles.name, { color: theme.colors.text, marginTop: 4 }]}>{starter.title}</Text>
          <Muted>{starter.description}</Muted>
          <View style={{ marginTop: 8 }}>
            <GoldButton compact label={starter.priceString} onPress={() => { setPending(starter); setStatus(null); }} />
          </View>
        </Card>
      ) : null}
      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.name, { color: theme.colors.text }]}>Velvet Season</Text>
        <Muted>{save.seasonPremium ? 'Premium track is open.' : 'Free track for everyone. Premium track is $4.99 and includes a style.'}</Muted>
        <View style={{ marginTop: 8 }}>
          <GhostButton label="Open the season" onPress={() => router.push('/season')} />
        </View>
      </Card>
      <View style={{ gap: 10, marginTop: 14 }}>
        {COIN_PRODUCTS.map((product) => {
          const tierIndex = celebrationTier(product.priceString);
          return (
            <Card key={product.id} style={[product.badge === 'Best value' ? { borderColor: theme.colors.gold } : undefined, { overflow: 'hidden' }]}>
              <Shimmer active={tierIndex >= 2} color={tierIndex >= 4 ? theme.colors.gold : theme.colors.accent2} />
              <View pointerEvents="none" style={[styles.glow, tierIndex >= 3 ? { borderColor: theme.colors.gold, borderWidth: tierIndex >= 5 ? 2 : 1 } : null]} />
              <View style={styles.row}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>{product.title}</Text>
                  <Text style={[styles.coins, { color: theme.colors.gold }]}>{formatCoins(product.coins ?? 0)} coins</Text>
                  <Text style={[styles.coins, { color: theme.colors.accent2 }]}>{packValue(product)}</Text>
                  <Text style={[styles.detail, { color: theme.colors.muted }]}>{product.description}</Text>
                </View>
                <View style={styles.buyCol}>
                  {product.badge ? <Text style={[styles.badge, { color: theme.colors.ink, backgroundColor: theme.colors.gold }]}>{product.badge}</Text> : null}
                  <GoldButton compact label={product.priceString} onPress={() => { setPending(product); setStatus(null); }} />
                </View>
              </View>
            </Card>
          );
        })}
      </View>
      {status ? <Text style={[styles.status, { color: theme.colors.accent2 }]}>{status}</Text> : null}
      <View style={{ marginTop: 12 }}>
        <GhostButton
          label="Restore purchases"
          onPress={() => {
            void useGame.getState().restorePurchases().then((result) => setStatus(result.message));
          }}
        />
      </View>
      <LegalLine />
      </ScrollView>
      {pending ? (
        <View style={styles.modal}>
          <Card>
            <Text style={[styles.kicker, { color: theme.colors.gold }]}>MOCK APP STORE</Text>
            <Text style={[styles.name, { color: theme.colors.text, marginTop: 6 }]}>{pending.title}</Text>
            <Text style={[styles.coins, { color: theme.colors.gold }]}>{pending.priceString}</Text>
            <Muted>No real charge. This simulates StoreKit so coin packs can be tested. The coins have no cash value.</Muted>
            <View style={{ gap: 8, marginTop: 12 }}>
              <GoldButton label={busy ? 'Contacting the store…' : 'Confirm mock purchase'} onPress={() => void confirm()} disabled={busy} />
              <GhostButton label="Cancel" onPress={() => setPending(null)} />
            </View>
          </Card>
        </View>
      ) : null}
      {celebrate ? (
        <PurchaseCelebration
          tier={celebrationTier(celebrate.priceString)}
          title={celebrate.title}
          coins={celebrate.coins ?? 0}
          onDone={() => setCelebrate(null)}
        />
      ) : null}
    </Screen>
  );
}

function packValue(product: Product): string {
  const premium = coinPackPremium(product);
  if (premium == null) return 'Base pack';
  return `+${(premium * 100).toFixed(1)}% coins per dollar`;
}

const styles = StyleSheet.create({
  kicker: { fontFamily: 'Outfit_600SemiBold', letterSpacing: 1, fontSize: 11 },
  balance: { fontFamily: 'SpaceMono', fontSize: 28, marginVertical: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  buyCol: { alignItems: 'flex-end', gap: 6, flexShrink: 0, maxWidth: '46%' },
  glow: { ...StyleSheet.absoluteFill, borderRadius: 16 },
  name: { fontFamily: 'Cinzel_700Bold', fontSize: 18 },
  coins: { fontFamily: 'SpaceMono', fontSize: 14, marginTop: 2 },
  detail: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 4 },
  badge: { fontFamily: 'Outfit_700Bold', fontSize: 11, overflow: 'hidden', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  status: { fontFamily: 'Outfit_500Medium', marginTop: 12 },
  modal: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 18 },
});

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { COIN_PRODUCTS, type Product } from '@/src/data/products';
import { formatCoins } from '@/src/lib/format';
import { playSfx } from '@/src/services/audio';
import { iap } from '@/src/services/iap';
import { buzz } from '@/src/services/haptics';
import { vipFor } from '@/src/store/logic';
import { useGame } from '@/src/store/gameStore';
import { useTheme } from '@/src/theme/useTheme';

export default function ShopScreen() {
  const theme = useTheme();
  const save = useGame((state) => state.save);
  const vip = vipFor(save);
  const [pending, setPending] = useState<Product | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    void playSfx('coin');
    buzz('big');
    setStatus(`${pending.title} added. No real charge was made.`);
    setPending(null);
  }

  return (
    <Screen padded={false}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <Display>Coin shop</Display>
      <Muted>Buy Velvet Coins with a simulated App Store purchase. In this build nothing is charged. Coins cannot be cashed out, transferred, or redeemed.</Muted>
      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.kicker, { color: theme.colors.muted }]}>BALANCE</Text>
        <Text style={[styles.balance, { color: theme.colors.gold }]}>{formatCoins(save.coins)}</Text>
        <Text style={[styles.kicker, { color: theme.colors.accent2 }]}>{vip.name} · {formatCoins(vip.points)} VIP points</Text>
      </Card>
      <View style={{ gap: 10, marginTop: 14 }}>
        {COIN_PRODUCTS.map((product) => (
          <Card key={product.id} style={product.badge === 'Best value' ? { borderColor: theme.colors.gold } : undefined}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.colors.text }]}>{product.title}</Text>
                <Text style={[styles.coins, { color: theme.colors.gold }]}>{formatCoins(product.coins ?? 0)} coins</Text>
                <Text style={[styles.detail, { color: theme.colors.muted }]}>{product.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                {product.badge ? <Text style={[styles.badge, { color: theme.colors.ink, backgroundColor: theme.colors.gold }]}>{product.badge}</Text> : null}
                <GoldButton compact label={product.priceString} onPress={() => { setPending(product); setStatus(null); }} />
              </View>
            </View>
          </Card>
        ))}
      </View>
      {status ? <Text style={[styles.status, { color: theme.colors.accent2 }]}>{status}</Text> : null}
      <View style={{ marginTop: 12 }}>
        <GhostButton
          label="Restore purchases"
          onPress={() => {
            void iap.restore().then(() => setStatus('Mock restore checked this device. Owned themes are already saved locally.'));
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: 'Outfit_600SemiBold', letterSpacing: 1, fontSize: 11 },
  balance: { fontFamily: 'SpaceMono', fontSize: 28, marginVertical: 4 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  name: { fontFamily: 'Cinzel_700Bold', fontSize: 18 },
  coins: { fontFamily: 'SpaceMono', fontSize: 14, marginTop: 2 },
  detail: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 4 },
  badge: { fontFamily: 'Outfit_700Bold', fontSize: 11, overflow: 'hidden', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  status: { fontFamily: 'Outfit_500Medium', marginTop: 12 },
  modal: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 18 },
});

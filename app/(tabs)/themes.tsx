import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Particles } from '@/src/components/fx';
import { BackgroundScene } from '@/src/components/scenes';
import { SymbolTile, CoinPill, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { levelFromXp } from '@/src/data/economy';
import { SEASON_STYLE_IDS, seasonFor } from '@/src/data/live';
import { getProduct } from '@/src/data/products';
import { formatCoins, todayKey } from '@/src/lib/format';
import { playSfx } from '@/src/services/audio';
import { iap } from '@/src/services/iap';
import { useGame } from '@/src/store/gameStore';
import { BACKGROUNDS } from '@/src/theme/backgrounds';
import { STYLES, type GameStyle } from '@/src/theme/styles';
import { THEMES, type Theme } from '@/src/theme/themes';
import { useTheme } from '@/src/theme/useTheme';

type Tab = 'rooms' | 'backgrounds' | 'styles';

const TABS: { id: Tab; label: string }[] = [
  { id: 'rooms', label: 'Rooms' },
  { id: 'backgrounds', label: 'Backgrounds' },
  { id: 'styles', label: 'Styles' },
];

export default function ThemesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const save = useGame((state) => state.save);
  const reduced = save.settings.reducedMotion;
  const level = levelFromXp(save.xp).level;
  const [tab, setTab] = useState<Tab>('rooms');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function buyIap(productId: string, label: string) {
    setBusy(productId);
    const purchase = await iap.purchase(productId);
    setBusy(null);
    if (!purchase.ok) {
      setMessage(purchase.error ?? 'Mock purchase cancelled.');
      return;
    }
    const granted = useGame.getState().grantProduct(productId);
    setMessage(granted.ok ? `${label} is yours. No real charge.` : granted.error ?? 'Could not unlock that.');
    if (granted.ok) void playSfx('unlock');
  }

  return (
    <Screen scroll back="lobby">
      <Display size={26}>The atelier</Display>
      <Muted>Rooms recolor the cards. Backgrounds are the scene behind them. Game styles reskin the reels, foil, balls, buttons, type, and sounds.</Muted>
      <View style={styles.balanceRow}>
        <CoinPill amount={save.coins} onPress={() => router.push('/shop')} />
        <Text style={[styles.level, { color: theme.colors.muted }]}>Level {level}</Text>
      </View>
      <View style={styles.tabs}>
        {TABS.map((item) => {
          const on = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => setTab(item.id)}
              style={[styles.tab, { borderColor: on ? theme.colors.gold : theme.colors.cardBorder, backgroundColor: on ? theme.colors.card : 'transparent' }]}
            >
              <Text style={{ color: on ? theme.colors.gold : theme.colors.text, fontFamily: 'Outfit_700Bold', fontSize: 13 }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {message ? <Text style={[styles.message, { color: theme.colors.gold }]}>{message}</Text> : null}

      {tab === 'rooms'
        ? THEMES.map((item) => (
            <RoomCard
              key={item.id}
              item={item}
              owned={save.ownedThemes.includes(item.id)}
              active={save.activeTheme === item.id}
              busy={busy === item.iapProductId}
              onEquip={() => {
                const result = useGame.getState().applyTheme(item.id);
                setMessage(result.ok ? `${item.name} is the room.` : result.error ?? 'Could not apply it.');
                if (result.ok) void playSfx('tap');
              }}
              onBuy={() => {
                const before = useGame.getState().save.coins;
                const result = useGame.getState().buyThemeWithCoins(item.id);
                const after = useGame.getState().save.coins;
                setMessage(result.ok ? `${item.name} unlocked. ${formatCoins(before - after)} coins.` : result.error ?? 'Could not unlock.');
                if (result.ok) void playSfx(item.coinPrice >= 25_000 || item.id === 'hearth' || item.id === 'diamond' ? 'fanfare' : 'unlock');
              }}
              onIap={() => item.iapProductId && void buyIap(item.iapProductId, item.name)}
            />
          ))
        : null}

      {tab === 'backgrounds'
        ? BACKGROUNDS.map((item) => (
            <View key={item.id} style={[styles.card, { borderColor: save.activeBackground === item.id ? theme.colors.gold : theme.colors.cardBorder }]}>
              <View style={styles.preview}>
                {item.id === 'hall' ? null : <BackgroundScene scene={item} reduced={reduced} scrim={false} />}
                {item.id === 'hall' ? (
                  <View style={[StyleSheetFill, { backgroundColor: theme.colors.bg1 }]} />
                ) : null}
                <View style={styles.previewCopy}>
                  <Text style={styles.previewName}>{item.name}</Text>
                  <Text style={styles.previewTag}>{item.tagline}</Text>
                </View>
              </View>
              <Actions
                owned={owns(save.ownedBackgrounds, item, level)}
                active={save.activeBackground === item.id}
                coinPrice={item.coinPrice}
                levelRequired={item.levelRequired}
                level={level}
                iapPrice={storePrice(item.iapProductId)}
                busy={busy === item.iapProductId}
                onEquip={() => {
                  const result = useGame.getState().applyBackground(item.id);
                  setMessage(result.ok ? `${item.name} is behind the room.` : result.error ?? 'Could not apply it.');
                  if (result.ok) void playSfx('tap');
                }}
                onBuy={() => reportBuy(() => useGame.getState().buyBackgroundWithCoins(item.id), item.name, setMessage)}
                onIap={() => item.iapProductId && void buyIap(item.iapProductId, item.name)}
              />
            </View>
          ))
        : null}

      {tab === 'styles'
        ? STYLES.map((item) => {
            const month = seasonFor(todayKey());
            const seasonal = SEASON_STYLE_IDS.has(item.id);
            const thisMonth = seasonal && item.id === month.styleId;
            const passOpen = save.seasonId === month.id && save.seasonPremium;
            return (
            <View key={item.id} style={[styles.card, { borderColor: save.activeStyle === item.id ? theme.colors.gold : theme.colors.cardBorder }]}>
              <StylePreview item={item} />
              {seasonal && !save.ownedStyles.includes(item.id) && !thisMonth ? (
                <Text style={[styles.message, { color: theme.colors.muted, paddingHorizontal: 12 }]}>Another month’s style. Owned seasons stay in your collection.</Text>
              ) : null}
              <Actions
                owned={owns(save.ownedStyles, item, level)}
                active={save.activeStyle === item.id}
                coinPrice={item.coinPrice}
                levelRequired={item.levelRequired}
                level={level}
                iapPrice={thisMonth && !passOpen ? storePrice('season.pass') : seasonal ? undefined : storePrice(item.iapProductId)}
                busy={busy === item.iapProductId}
                onEquip={() => {
                  const result = useGame.getState().applyStyle(item.id);
                  setMessage(result.ok ? `${item.name} is on the games.` : result.error ?? 'Could not apply it.');
                  if (result.ok) void playSfx('tap');
                }}
                onBuy={() => reportBuy(() => useGame.getState().buyStyleWithCoins(item.id), item.name, setMessage, item.coinPrice >= 12_000 || item.id === 'gilded' || item.id === 'royal' ? 'fanfare' : 'unlock')}
                onIap={() => item.iapProductId && void buyIap(item.iapProductId, item.name)}
              />
            </View>
            );
          })
        : null}
      <LegalLine />
    </Screen>
  );
}

function reportBuy(
  run: () => { ok: boolean; error?: string },
  name: string,
  setMessage: (value: string) => void,
  cue: 'unlock' | 'fanfare' = 'unlock',
) {
  const before = useGame.getState().save.coins;
  const result = run();
  const after = useGame.getState().save.coins;
  setMessage(result.ok ? `${name} unlocked for ${formatCoins(before - after)} coins.` : result.error ?? 'Could not unlock.');
  if (result.ok) void playSfx(cue);
}

function storePrice(productId: string | undefined): string | undefined {
  if (!productId) return undefined;
  return getProduct(productId)?.priceString;
}

function owns(owned: string[], item: { id: string; coinPrice: number; levelRequired: number; iapProductId?: string }, level: number) {
  if (owned.includes(item.id)) return true;
  if (item.coinPrice === 0 && item.levelRequired === 0 && !item.iapProductId) return true;
  if (item.levelRequired > 0 && item.coinPrice === 0 && !item.iapProductId && level >= item.levelRequired) return true;
  return false;
}

function RoomCard({
  item,
  owned,
  active,
  busy,
  onEquip,
  onBuy,
  onIap,
}: {
  item: Theme;
  owned: boolean;
  active: boolean;
  busy: boolean;
  onEquip: () => void;
  onBuy: () => void;
  onIap: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { borderColor: active ? theme.colors.gold : item.colors.cardBorder }]}>
      <View style={[styles.preview, { backgroundColor: item.colors.bg1 }]}>
        <Particles theme={item} reduced={useGame((state) => state.save.settings.reducedMotion)} count={roomMotion(item)} />
        <Text style={[styles.previewName, { color: item.colors.gold }]}>{item.name}</Text>
        <Text style={[styles.previewTag, { color: item.colors.text }]}>{item.tagline}</Text>
        <View style={styles.symbols}>
          <SymbolTile icon="cherry" size={46} />
          <SymbolTile icon="seven" size={46} />
          <SymbolTile icon="crown" size={46} />
        </View>
      </View>
      <Actions
        owned={owned}
        active={active}
        coinPrice={item.coinPrice}
        levelRequired={0}
        level={1}
        iapPrice={storePrice(item.iapProductId)}
        busy={busy}
        onEquip={onEquip}
        onBuy={onBuy}
        onIap={onIap}
      />
    </View>
  );
}

function roomMotion(item: Theme): number {
  if (item.id === 'hearth' || item.id === 'diamond') return 28;
  if (item.coinPrice >= 40_000) return 26;
  if (item.coinPrice >= 25_000) return 16;
  if (item.coinPrice > 0) return 8;
  return 0;
}

function StylePreview({ item }: { item: GameStyle }) {
  const theme = useTheme();
  const reduced = useGame((state) => state.save.settings.reducedMotion);
  const count = item.id === 'gilded' || item.id === 'royal' || item.coinPrice >= 14_000 ? 20 : item.coinPrice >= 10_000 ? 10 : 0;
  return (
    <View style={[styles.preview, { backgroundColor: item.reel }]}>
      {count > 0 ? <Particles theme={theme} reduced={reduced} kind={item.particle} count={count} /> : null}
      <View style={styles.previewCopy}>
      <Text style={[styles.previewName, { fontFamily: item.displayFont, fontSize: 22 * item.displayScale, color: item.accent }]}>{item.name}</Text>
      <Text style={[styles.previewTag, { color: '#fbf6ea' }]}>{item.tagline}</Text>
      <View style={styles.symbols}>
        <SymbolTile icon="cherry" size={52} look={item} />
        <SymbolTile icon="seven" size={52} look={item} />
        <SymbolTile icon="crown" size={52} look={item} />
        <View style={[styles.sampleBall, { backgroundColor: item.ball, borderRadius: item.ballRadius }]} />
      </View>
      </View>
    </View>
  );
}

function Actions({
  owned,
  active,
  coinPrice,
  levelRequired,
  level,
  iapPrice,
  busy,
  onEquip,
  onBuy,
  onIap,
}: {
  owned: boolean;
  active: boolean;
  coinPrice: number;
  levelRequired: number;
  level: number;
  iapPrice?: string;
  busy: boolean;
  onEquip: () => void;
  onBuy: () => void;
  onIap: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.actions}>
      {active ? <Text style={[styles.active, { color: theme.colors.gold }]}>In use</Text> : null}
      {owned && !active ? <GoldButton compact label="Equip" onPress={onEquip} /> : null}
      {!owned && levelRequired > 0 && coinPrice === 0 ? (
        <Text style={[styles.active, { color: theme.colors.muted }]}>{level >= levelRequired ? 'Ready' : `Reach level ${levelRequired}`}</Text>
      ) : null}
      {!owned && coinPrice > 0 ? <GoldButton compact label={`${formatCoins(coinPrice)} coins`} onPress={onBuy} /> : null}
      {!owned && iapPrice ? <GhostButton label={busy ? '…' : `Mock store ${iapPrice}`} onPress={onIap} /> : null}
    </View>
  );
}

const StyleSheetFill = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };

const styles = StyleSheet.create({
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  level: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tab: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  message: { fontFamily: 'Outfit_500Medium', marginTop: 10 },
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginTop: 12 },
  preview: { height: 176, padding: 14, justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' },
  previewCopy: { zIndex: 2 },
  previewName: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 22,
    color: '#fbf6ea',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  previewTag: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#fbf6ea', marginTop: 4 },
  symbols: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sampleBall: { width: 36, height: 36, marginLeft: 8 },
  actions: { padding: 12, gap: 8 },
  active: { fontFamily: 'Outfit_700Bold' },
});

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { SymbolTile, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { formatCoins } from '@/src/lib/format';
import { playSfx } from '@/src/services/audio';
import { iap } from '@/src/services/iap';
import { useGame } from '@/src/store/gameStore';
import { THEMES, type Theme } from '@/src/theme/themes';

export default function ThemesScreen() {
  const save = useGame((state) => state.save);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function buyIap(theme: Theme) {
    if (!theme.iapProductId) return;
    setBusy(theme.id);
    const purchase = await iap.purchase(theme.iapProductId);
    setBusy(null);
    if (!purchase.ok) {
      setMessage(purchase.error ?? 'Mock purchase cancelled.');
      return;
    }
    const granted = useGame.getState().grantProduct(theme.iapProductId);
    setMessage(granted.ok ? `${theme.name} is yours. No real charge.` : granted.error ?? 'Could not unlock the theme.');
    if (granted.ok) void playSfx('unlock');
  }

  return (
    <Screen scroll back="lobby">
      <Display>Theme atelier</Display>
      <Muted>Three rooms are free. The others are cosmetics: backgrounds, chrome, particles, win light, and music. Buy with coins or a mock purchase.</Muted>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={{ gap: 14, marginTop: 12 }}>
        {THEMES.map((theme) => {
          const owned = save.ownedThemes.includes(theme.id);
          const active = save.activeTheme === theme.id;
          return (
            <View key={theme.id} style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
              <LinearGradient colors={[theme.colors.bg0, theme.colors.bg1, theme.colors.bg2]} style={styles.preview}>
                <Text style={[styles.name, { color: theme.colors.gold }]}>{theme.name}</Text>
                <Text style={[styles.tag, { color: theme.colors.text }]}>{theme.tagline}</Text>
                <View style={styles.symbols}>
                  <SymbolTile icon={theme.lavish ? 'crown' : 'cherry'} size={48} />
                  <SymbolTile icon={theme.particle === 'ember' ? 'dragon' : theme.particle === 'star' ? 'planet' : 'seven'} size={48} />
                  <SymbolTile icon="wild" size={48} hot={theme.lavish} />
                </View>
                {theme.lavish ? <Text style={[styles.lavish, { color: theme.colors.accent2 }]}>Lavish · animated light · unique wins</Text> : <Text style={[styles.lavish, { color: theme.colors.muted }]}>Included</Text>}
              </LinearGradient>
              <View style={styles.actions}>
                {active ? <Text style={styles.active}>In use</Text> : null}
                {owned && !active ? <GoldButton compact label="Apply" onPress={() => { useGame.getState().applyTheme(theme.id); void playSfx('tap'); }} /> : null}
                {!owned ? (
                  <>
                    <GoldButton
                      compact
                      label={`${formatCoins(theme.coinPrice)} coins`}
                      onPress={() => {
                        const result = useGame.getState().buyThemeWithCoins(theme.id);
                        setMessage(result.ok ? `${theme.name} unlocked.` : result.error ?? 'Could not unlock.');
                        if (result.ok) void playSfx('unlock');
                      }}
                    />
                    {theme.iapPrice ? (
                      <GhostButton label={busy === theme.id ? '…' : `or ${theme.iapPrice}`} onPress={() => void buyIap(theme)} />
                    ) : null}
                  </>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
      <LegalLine />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  preview: { padding: 16, minHeight: 150 },
  name: { fontFamily: 'Cinzel_700Bold', fontSize: 22 },
  tag: { fontFamily: 'Outfit_400Regular', fontSize: 14, marginTop: 4 },
  symbols: { flexDirection: 'row', marginTop: 10 },
  lavish: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, marginTop: 8 },
  actions: { padding: 12, gap: 8 },
  active: { fontFamily: 'Outfit_700Bold', color: '#f0d78c' },
  message: { fontFamily: 'Outfit_500Medium', color: '#f0d78c', marginTop: 10 },
});

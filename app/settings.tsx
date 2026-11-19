import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Display, GhostButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { RESPONSIBLE } from '@/src/content/copy';
import { useGame } from '@/src/store/gameStore';
import { useTheme } from '@/src/theme/useTheme';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const settings = useGame((state) => state.save.settings);
  const [confirmReset, setConfirmReset] = useState(false);

  function toggle(key: 'sound' | 'music' | 'haptics' | 'reducedMotion') {
    useGame.getState().updateSettings({ [key]: !settings[key] });
  }

  return (
    <Screen scroll bottomInset>
      <View style={styles.header}>
        <Display>Settings</Display>
        <GhostButton label="Close" onPress={() => router.back()} />
      </View>
      <Card>
        <Row label="Sound effects" value={settings.sound} onPress={() => toggle('sound')} />
        <Row label="Music" value={settings.music} onPress={() => toggle('music')} />
        <Row label="Haptics" value={settings.haptics} onPress={() => toggle('haptics')} />
        <Row label="Reduce motion" value={settings.reducedMotion} onPress={() => toggle('reducedMotion')} />
      </Card>
      <Text style={[styles.section, { color: theme.colors.gold }]}>Play responsibly</Text>
      {RESPONSIBLE.map((line) => (
        <Text key={line} style={[styles.line, { color: theme.colors.text }]}>{line}</Text>
      ))}
      <Muted>Velvet Vault is simulated gambling for ages 18 and older. It is the sort of game stores rate 17+ for frequent simulated gambling. Coins have no cash value.</Muted>
      <View style={{ marginTop: 12 }}>
        <GhostButton label="Read the full notice" onPress={() => router.push('/legal')} />
      </View>
      <Text style={[styles.section, { color: theme.colors.gold }]}>This device</Text>
      <Muted>Progress is stored only on this device. Uninstalling the app deletes it. There is no account.</Muted>
      {confirmReset ? (
        <View style={{ gap: 8, marginTop: 10 }}>
          <Text style={{ color: theme.colors.danger, fontFamily: 'Outfit_600SemiBold' }}>Reset the vault? Coins, level, and themes go back to the welcome gift.</Text>
          <GhostButton
            label="Yes, reset progress"
            onPress={() => {
              useGame.getState().resetProgress();
              setConfirmReset(false);
            }}
          />
          <GhostButton label="Cancel" onPress={() => setConfirmReset(false)} />
        </View>
      ) : (
        <View style={{ marginTop: 10 }}>
          <GhostButton label="Reset progress" onPress={() => setConfirmReset(true)} />
        </View>
      )}
      <Text style={[styles.version, { color: theme.colors.muted }]}>Velvet Vault 1.0.0 · mock store</Text>
      <LegalLine />
    </Screen>
  );
}

function Row({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={{ color: theme.colors.text, fontFamily: 'Outfit_500Medium', fontSize: 16 }}>{label}</Text>
      <View style={[styles.switch, { backgroundColor: value ? theme.colors.gold : 'rgba(255,255,255,0.12)' }]}>
        <View style={[styles.knob, { alignSelf: value ? 'flex-end' : 'flex-start' }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  switch: { width: 52, height: 30, borderRadius: 16, padding: 3 },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1a120c' },
  section: { fontFamily: 'Cinzel_700Bold', fontSize: 18, marginTop: 18, marginBottom: 8 },
  line: { fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  version: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 16 },
});

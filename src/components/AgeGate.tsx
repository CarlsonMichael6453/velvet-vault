import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GoldButton, GhostButton, Muted } from '@/src/components/ui';
import { VaultMark } from '@/src/components/art';
import { AGE_GATE } from '@/src/content/copy';
import { playSfx } from '@/src/services/audio';
import { useGame } from '@/src/store/gameStore';

export function AgeGate() {
  const confirmed = useGame((state) => state.save.ageConfirmed);
  const [blocked, setBlocked] = useState(false);
  if (confirmed) return null;
  if (blocked) {
    return (
      <View style={styles.scrim}>
        <VaultMark size={64} />
        <Text style={styles.title}>This room is for adults</Text>
        <Muted center>Velvet Vault is a social casino with simulated gambling. Come back when you are 18 or older.</Muted>
      </View>
    );
  }
  return (
    <View style={styles.scrim}>
      <VaultMark size={64} />
      <Text style={styles.kicker}>SOCIAL CASINO</Text>
      <Text style={styles.title}>{AGE_GATE.title}</Text>
      <Text style={styles.body}>{AGE_GATE.body}</Text>
      <Text style={styles.body}>{AGE_GATE.coins}</Text>
      <GoldButton
        label={AGE_GATE.confirm}
        onPress={() => {
          useGame.getState().confirmAge();
          void playSfx('unlock');
        }}
      />
      <GhostButton label={AGE_GATE.deny} onPress={() => setBlocked(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#12060c',
    zIndex: 50,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  kicker: { color: '#e23b6a', fontFamily: 'Outfit_600SemiBold', letterSpacing: 2, fontSize: 12 },
  title: { color: '#f0d78c', fontFamily: 'Cinzel_700Bold', fontSize: 32 },
  body: { color: '#fbf6ea', fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 22 },
});

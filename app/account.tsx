import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { useCloud } from '@/src/services/cloud';
import { useTheme } from '@/src/theme/useTheme';

export default function AccountScreen() {
  const theme = useTheme();
  const configured = useCloud((state) => state.configured);
  const status = useCloud((state) => state.status);
  const email = useCloud((state) => state.email);
  const message = useCloud((state) => state.message);
  const signIn = useCloud((state) => state.signIn);
  const signUp = useCloud((state) => state.signUp);
  const signOut = useCloud((state) => state.signOut);
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(kind: 'in' | 'up') {
    setBusy(true);
    try {
      if (kind === 'in') await signIn(address.trim(), password);
      else await signUp(address.trim(), password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen padded={false} bottomInset back>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
        <Display size={26}>Cloud save</Display>
        <Muted>The vault on this device is the copy you play. A cloud account can keep the same coins when you change phones. Coins still have no cash value.</Muted>
        {!configured ? (
          <Card style={{ marginTop: 14 }}>
            <Text style={[styles.title, { color: theme.colors.gold }]}>Cloud save coming soon</Text>
            <Muted>Sign-in will use email first. Apple and Google come after that. Until the Supabase keys are set, nothing leaves this device.</Muted>
            <Field label="Email" value="" editable={false} placeholder="you@example.com" />
            <Field label="Password" value="" editable={false} placeholder="At least 6 characters" secure />
            <View style={{ marginTop: 10 }}>
              <GoldButton label="Sign in" onPress={() => undefined} disabled />
            </View>
          </Card>
        ) : email ? (
          <Card style={{ marginTop: 14 }}>
            <Text style={[styles.title, { color: theme.colors.gold }]}>Signed in</Text>
            <Text style={[styles.email, { color: theme.colors.text }]}>{email}</Text>
            <Muted>{message ?? 'This vault can sync.'}</Muted>
            <View style={{ marginTop: 10, gap: 8 }}>
              <GhostButton label="Sign out" onPress={() => void signOut()} />
            </View>
          </Card>
        ) : (
          <Card style={{ marginTop: 14 }}>
            <Text style={[styles.title, { color: theme.colors.gold }]}>Sign in</Text>
            <Muted>Email and a password. Apple and Google are planned, not wired yet.</Muted>
            <Field label="Email" value={address} onChangeText={setAddress} placeholder="you@example.com" />
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secure />
            <View style={{ marginTop: 10, gap: 8 }}>
              <GoldButton label={busy || status === 'saving' ? 'Working…' : 'Sign in'} onPress={() => void run('in')} disabled={busy} />
              <GhostButton label="Create account" onPress={() => void run('up')} />
            </View>
          </Card>
        )}
        {configured && message ? <Text style={[styles.message, { color: theme.colors.accent2 }]}>{message}</Text> : null}
        <Text style={[styles.later, { color: theme.colors.muted }]}>Apple · later</Text>
        <Text style={[styles.later, { color: theme.colors.muted }]}>Google · later</Text>
        <LegalLine />
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  editable?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[styles.label, { color: theme.colors.muted }]}>{label}</Text>
      <TextInput
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secure}
        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.cardBorder, opacity: editable ? 1 : 0.55 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 20 },
  email: { fontFamily: 'Outfit_500Medium', fontSize: 16, marginTop: 6 },
  message: { fontFamily: 'Outfit_500Medium', marginTop: 12 },
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 44, paddingHorizontal: 12, fontFamily: 'Outfit_400Regular', fontSize: 16 },
  later: { fontFamily: 'Outfit_500Medium', marginTop: 8, fontSize: 13 },
});

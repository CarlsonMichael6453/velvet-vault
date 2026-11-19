import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FEEDBACK_EMAIL } from '@/src/config';
import { Card, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { deviceSnapshot } from '@/src/services/deviceInfo';
import { feedbackBody, feedbackMailto, feedbackValidation, type FeedbackDraft } from '@/src/services/feedbackMail';
import { useTheme } from '@/src/theme/useTheme';

export default function FeedbackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const device = deviceSnapshot();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [bug, setBug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [mailState, setMailState] = useState<'idle' | 'handed-off' | 'unavailable'>('idle');

  const draft: FeedbackDraft = {
    rating,
    message,
    email,
    bug,
    version: device.version,
    model: device.model,
    os: device.os,
  };

  async function submit() {
    const problem = feedbackValidation(draft);
    if (problem) {
      setError(problem);
      setFallback(null);
      setMailState('idle');
      return;
    }
    const url = feedbackMailto(draft);
    const note = feedbackBody(draft);
    setError(null);
    setFallback(note);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        setMailState('unavailable');
        return;
      }
      await Linking.openURL(url);
      setMailState('handed-off');
    } catch {
      setMailState('unavailable');
    }
  }

  return (
    <Screen scroll bottomInset>
      <View style={styles.header}>
        <Display>Feedback</Display>
        <GhostButton label="Close" onPress={() => router.back()} />
      </View>
      <Muted>Tell us how the vault feels. This opens your mail app with the note filled in. Nothing is sent until you send that email.</Muted>

      <Text style={[styles.label, { color: theme.colors.gold }]}>How is Velvet Vault?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => {
          const on = star <= rating;
          return (
            <Pressable key={star} accessibilityRole="button" accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`} onPress={() => setRating(star)} hitSlop={6}>
              <Text style={{ fontSize: 36, color: on ? theme.colors.gold : theme.colors.muted }}>{on ? '★' : '☆'}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: theme.colors.gold }]}>Your note</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="What worked, what got in the way, or what you wish was here."
        placeholderTextColor={theme.colors.muted}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.note, { color: theme.colors.text, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.card }]}
      />

      <Text style={[styles.label, { color: theme.colors.gold }]}>Email, if you want a reply</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Optional"
        placeholderTextColor={theme.colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.card }]}
      />

      <Pressable accessibilityRole="switch" accessibilityState={{ checked: bug }} onPress={() => setBug((value) => !value)} style={styles.bugRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontFamily: 'Outfit_600SemiBold', fontSize: 16 }}>This is a bug report</Text>
          <Text style={{ color: theme.colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 2 }}>Marks the subject so it lands in the bug pile.</Text>
        </View>
        <View style={[styles.switch, { backgroundColor: bug ? theme.colors.gold : 'rgba(255,255,255,0.12)' }]}>
          <View style={[styles.knob, { alignSelf: bug ? 'flex-end' : 'flex-start' }]} />
        </View>
      </Pressable>

      <Card>
        <Text style={[styles.meta, { color: theme.colors.muted }]}>Attached automatically</Text>
        <Text style={[styles.metaLine, { color: theme.colors.text }]}>Version {device.version}</Text>
        <Text style={[styles.metaLine, { color: theme.colors.text }]}>{device.model}</Text>
        <Text style={[styles.metaLine, { color: theme.colors.text }]}>{device.os}</Text>
      </Card>

      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      {mailState === 'handed-off' ? (
        <Text style={[styles.ok, { color: theme.colors.success }]}>If a mail window opened, send it when it looks right. If nothing opened, the note below is ready to copy.</Text>
      ) : null}

      <View style={{ marginTop: 14 }}>
        <GoldButton label="Send feedback" onPress={() => void submit()} />
      </View>

      {fallback ? (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.meta, { color: theme.colors.gold }]}>
            {mailState === 'unavailable' ? 'No mail app is available' : 'Send it yourself if mail did not open'}
          </Text>
          <Muted>Write to {FEEDBACK_EMAIL} and paste this note. Nothing has been sent yet.</Muted>
          <Text selectable style={[styles.fallback, { color: theme.colors.text }]}>{fallback}</Text>
        </Card>
      ) : null}
      <LegalLine />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontFamily: 'Cinzel_700Bold', fontSize: 16, marginTop: 16, marginBottom: 8 },
  stars: { flexDirection: 'row', gap: 10 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 16 },
  note: { minHeight: 140 },
  bugRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  switch: { width: 52, height: 30, borderRadius: 16, padding: 3 },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1a120c' },
  meta: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, letterSpacing: 0.4, marginBottom: 6 },
  metaLine: { fontFamily: 'Outfit_400Regular', fontSize: 14, marginTop: 2 },
  error: { fontFamily: 'Outfit_500Medium', marginTop: 12 },
  ok: { fontFamily: 'Outfit_500Medium', marginTop: 12 },
  fallback: { fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 20, marginTop: 10 },
});

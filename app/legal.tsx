import { StyleSheet, Text } from 'react-native';

import { Display, Screen } from '@/src/components/ui';
import { useTheme } from '@/src/theme/useTheme';

const SECTIONS = [
  {
    title: 'Entertainment only',
    body: 'Velvet Vault is a social casino. The slots, scratch tickets, number draw, and wheel are simulated games played for fun. Nothing here is real-money gambling.',
  },
  {
    title: 'Coins have no cash value',
    body: 'Velvet Coins are a virtual item. They cannot be cashed out, redeemed, transferred, sold, or exchanged for money, gift cards, merchandise, or any other prize. There is no sweepstakes currency and no second wallet.',
  },
  {
    title: 'Purchases',
    body: 'Coin packs and premium themes are optional. This build uses a mock store so the flow can be tested without a charge. A production release would use Apple In-App Purchase and Google Play Billing. Purchases would be for virtual items only.',
  },
  {
    title: 'Age',
    body: 'You confirmed you are 18 or older. Simulated gambling is the kind of content app stores rate 17+. Do not play if that is not appropriate for you.',
  },
  {
    title: 'Play responsibly',
    body: 'Stop when it stops being fun. You can keep playing with the daily bonus, the hourly coin tray, and the daily wheel without buying anything. If spending on virtual coins is getting uncomfortable, stop and use the device settings to limit purchases.',
  },
  {
    title: 'Your data',
    body: 'A copy of your vault always stays on this device. That includes your coin balance, level, rooms, backdrops, styles, settings, streaks, daily and hourly claims, season progress, and play stats. You can play without an account. An account is optional. You can create one with an email address and a password, handled by Supabase. Apple and Google sign-in are not available yet. When you are signed in, the same vault is also saved with Supabase in a vault_saves record that only your account can read or change. A sign-in session is kept on this device so you can stay signed in. Signing out leaves the copy on this device and does not delete your account or the cloud save. Resetting progress in Settings starts this device\'s vault over; if you are signed in, that reset is also written to the cloud. Uninstalling the app removes the copy and session on this device, but not your account or the cloud save. There is no in-app button to delete your account or its cloud save. To ask that they be removed, use the feedback form in Settings and say you want the account deleted.',
  },
  {
    title: 'No affiliation',
    body: 'Velvet Vault is not affiliated with any casino, lottery, or slot manufacturer. It does not use the names or branding of real lotteries or real slot games.',
  },
];

export default function LegalScreen() {
  const theme = useTheme();
  return (
    <Screen scroll bottomInset back>
      <Display>House notice</Display>
      {SECTIONS.map((section) => (
        <Text key={section.title} style={[styles.block, { color: theme.colors.text }]}>
          <Text style={{ fontFamily: 'Cinzel_700Bold', color: theme.colors.gold }}>{section.title}. </Text>
          {section.body}
        </Text>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 22, marginTop: 14 },
});

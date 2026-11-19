import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Display, GhostButton, Screen } from '@/src/components/ui';
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
    body: 'This version stores your balance, level, themes, and settings on this device only. There is no account. Uninstalling the app removes that save. A future release that adds accounts or a real store would need a privacy policy covering purchase and diagnostic data.',
  },
  {
    title: 'No affiliation',
    body: 'Velvet Vault is not affiliated with any casino, lottery, or slot manufacturer. It does not use the names or branding of real lotteries or real slot games.',
  },
];

export default function LegalScreen() {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Screen scroll bottomInset>
      <Display>House notice</Display>
      {SECTIONS.map((section) => (
        <Text key={section.title} style={[styles.block, { color: theme.colors.text }]}>
          <Text style={{ fontFamily: 'Cinzel_700Bold', color: theme.colors.gold }}>{section.title}. </Text>
          {section.body}
        </Text>
      ))}
      <GhostButton label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 22, marginTop: 14 },
});

import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/src/theme/useTheme';

export default function TabLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.bg0,
          borderTopColor: theme.colors.cardBorder,
          height: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: 'Outfit_600SemiBold', fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Lobby', tabBarIcon: ({ color }) => <Mark color={String(color)} label="V" /> }} />
      <Tabs.Screen name="games" options={{ title: 'Games', tabBarIcon: ({ color }) => <Mark color={String(color)} label="G" /> }} />
      <Tabs.Screen name="shop" options={{ title: 'Shop', tabBarIcon: ({ color }) => <Mark color={String(color)} label="$" /> }} />
      <Tabs.Screen name="themes" options={{ title: 'Themes', tabBarIcon: ({ color }) => <Mark color={String(color)} label="T" /> }} />
      <Tabs.Screen name="club" options={{ title: 'Club', tabBarIcon: ({ color }) => <Mark color={String(color)} label="C" /> }} />
    </Tabs>
  );
}

function Mark({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.mark, { borderColor: color }]}>
      <Text style={{ color, fontSize: 11, fontFamily: 'Cinzel_700Bold' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

import 'react-native-gesture-handler';

import { Cinzel_700Bold, Cinzel_900Black } from '@expo-google-fonts/cinzel';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VaultMark } from '@/src/components/art';
import { AgeGate } from '@/src/components/AgeGate';
import { NoticeStack } from '@/src/components/ui';
import { syncMusic } from '@/src/services/audio';
import { useGame } from '@/src/store/gameStore';
import { getTheme } from '@/src/theme/themes';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

let sessionNoted = false;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Cinzel_700Bold,
    Cinzel_900Black,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const hydrated = useGame((state) => state.hydrated);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (useGame.persist.hasHydrated()) useGame.getState().setHydrated();
    return useGame.persist.onFinishHydration(() => {
      useGame.getState().setHydrated();
    });
  }, []);

  useEffect(() => {
    if (loaded && hydrated) void SplashScreen.hideAsync();
  }, [loaded, hydrated]);

  useEffect(() => {
    if (!hydrated || sessionNoted) return;
    sessionNoted = true;
    useGame.getState().bumpSession();
  }, [hydrated]);

  if (!loaded || !hydrated) return <BootScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.desktop}>
          <View style={styles.phone}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                fullScreenGestureEnabled: false,
                gestureResponseDistance: { start: 16 },
                contentStyle: { backgroundColor: '#12060c' },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="slots/[id]" />
              <Stack.Screen name="scratch/index" />
              <Stack.Screen name="scratch/[id]" />
              <Stack.Screen name="draw" />
              <Stack.Screen name="wheel" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="legal" />
              <Stack.Screen name="feedback" />
            </Stack>
            <AgeGate />
            <AudioBridge />
            <NoticeStack />
          </View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AudioBridge() {
  const enabled = useGame((state) => state.save.settings.music);
  const themeId = useGame((state) => state.save.activeTheme);
  const age = useGame((state) => state.save.ageConfirmed);
  useEffect(() => {
    if (!age) return;
    void syncMusic(getTheme(themeId).music, enabled);
  }, [enabled, themeId, age]);
  return null;
}

function BootScreen() {
  return (
    <View style={styles.boot}>
      <VaultMark size={72} />
      <Text style={styles.bootTitle}>VELVET VAULT</Text>
      <Text style={styles.bootSub}>Opening the doors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  desktop: { flex: 1, backgroundColor: '#070509', alignItems: 'center' },
  phone: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: '#12060c' },
  boot: { flex: 1, backgroundColor: '#12060c', alignItems: 'center', justifyContent: 'center', gap: 12 },
  bootTitle: { color: '#f0d78c', fontSize: 28, letterSpacing: 2, fontWeight: '700' },
  bootSub: { color: '#cbb8be', fontSize: 14 },
});

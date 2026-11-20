import { useRouter, useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoinIcon, SymbolGlyph, VaultMark, tilePalette } from '@/src/components/art';
import { Orbs, Particles } from '@/src/components/fx';
import { BackgroundScene } from '@/src/components/scenes';
import type { GameStyle } from '@/src/theme/styles';
import { useBackground, useStyle, useTheme } from '@/src/theme/useTheme';
import { COIN_DISCLAIMER } from '@/src/content/copy';
import { formatCoins } from '@/src/lib/format';
import { playSfx } from '@/src/services/audio';
import { buzz } from '@/src/services/haptics';
import { useGame } from '@/src/store/gameStore';
import type { Theme } from '@/src/theme/themes';

export function Screen({
  children,
  scroll = false,
  padded = true,
  bottomInset = false,
  back = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bottomInset?: boolean;
  /** True pops the stack. "lobby" returns to the home tab (Games, Shop, Themes, Club). */
  back?: boolean | 'lobby';
}) {
  const theme = useTheme();
  const scene = useBackground();
  const look = useStyle();
  const insets = useSafeAreaInsets();
  const reduced = useGame((state) => state.save.settings.reducedMotion);
  const scenic = scene.id !== 'hall';
  const router = useRouter();
  const pad = padded ? 16 : 0;
  const leave = useCallback(() => {
    if (back === 'lobby' || !router.canGoBack()) router.navigate('/');
    else router.back();
  }, [back, router]);

  useFocusEffect(
    useCallback(() => {
      if (back !== 'lobby') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.navigate('/');
        return true;
      });
      return () => sub.remove();
    }, [back, router]),
  );

  const showEdge = Boolean(back) && (Platform.OS === 'web' || back === 'lobby');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg0, position: 'relative', overflow: 'hidden' }}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
        {scenic ? (
          <BackgroundScene scene={scene} reduced={reduced} />
        ) : (
          <>
            <LinearGradient colors={[theme.colors.bg0, theme.colors.bg1, theme.colors.bg2]} style={StyleSheet.absoluteFill} />
            <Orbs theme={theme} reduced={reduced} />
            <Particles theme={theme} reduced={reduced} kind={look.id === 'classic' ? undefined : look.particle} />
          </>
        )}
      </View>
      <View style={{ flex: 1, paddingTop: insets.top, zIndex: 2, position: 'relative' }}>
        {back ? <BackBar onPress={leave} /> : null}
        <View style={{ flex: 1 }}>
          {scroll ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: pad, paddingBottom: 32 + (bottomInset ? insets.bottom : 0) }}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, padding: pad, paddingBottom: bottomInset ? insets.bottom : 0 }}>{children}</View>
          )}
          {showEdge ? <EdgeBack onBack={leave} /> : null}
        </View>
      </View>
    </View>
  );
}

function BackBar({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => {
        buzz('tap');
        void playSfx('tap');
        onPress();
      }}
      hitSlop={{ top: 6, bottom: 6, right: 12 }}
      style={styles.backBar}
    >
      <Text style={[styles.backChevron, { color: theme.colors.gold }]}>‹</Text>
      <Text style={[styles.backLabel, { color: theme.colors.gold }]}>Back</Text>
    </Pressable>
  );
}

/** Left-edge swipe only. The strip is narrower than the scratch ticket's inset, so a finger on the foil does not pop the screen. */
function EdgeBack({ onBack }: { onBack: () => void }) {
  const startX = useRef<number | null>(null);
  return (
    <View
      accessibilityLabel="Swipe back"
      style={styles.edge}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        startX.current = event.nativeEvent.pageX;
      }}
      onResponderRelease={(event) => {
        const start = startX.current;
        startX.current = null;
        if (start != null && event.nativeEvent.pageX - start > 56) onBack();
      }}
      onResponderTerminate={() => {
        startX.current = null;
      }}
    />
  );
}

export function GoldButton({
  label,
  onPress,
  disabled,
  icon,
  compact,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  compact?: boolean;
}) {
  const theme = useTheme();
  const look = useStyle();
  const scale = useSharedValue(1);
  const buttonColors = look.id === 'classic' ? ([theme.colors.gold, theme.colors.goldDeep] as const) : ([look.buttonFrom, look.buttonTo] as const);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={() => {
        buzz('tap');
        void playSfx('tap');
        onPress();
      }}
    >
      <Animated.View style={[style, disabled && { opacity: 0.45 }]}>
        <LinearGradient
          colors={buttonColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gold, { borderRadius: look.buttonRadius }, compact && { paddingVertical: 10 }]}
        >
          {look.gloss ? <View style={styles.gloss} /> : null}
          {icon}
          <Text style={[styles.goldLabel, { color: look.id === 'classic' ? theme.colors.ink : look.symbolInk, fontFamily: look.displayFont, fontSize: 16 * Math.max(look.displayScale, 0.72) }]}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, color }: { label: string; onPress: () => void; color?: string }) {
  const theme = useTheme();
  const look = useStyle();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        buzz('tap');
        void playSfx('tap');
        onPress();
      }}
      style={[styles.ghost, { borderColor: look.id === 'classic' ? theme.colors.cardBorder : look.accent, borderRadius: look.buttonRadius }]}
    >
      <Text style={[styles.ghostLabel, { color: color ?? theme.colors.text, fontFamily: look.displayFont, fontSize: 15 * Math.max(look.displayScale, 0.72) }]}>{label}</Text>
    </Pressable>
  );
}

export function CoinPill({ amount, onPress }: { amount: number; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.pill, { borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.card }]}>
      <CoinIcon size={16} color={theme.colors.gold} />
      <Text style={[styles.pillText, { color: theme.colors.gold }]}>{formatCoins(amount)}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const look = useStyle();
  const scenic = useBackground().id !== 'hall';
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: scenic ? opaqueCard(theme.colors.card) : theme.colors.card,
          borderColor: theme.colors.cardBorder,
          borderRadius: Math.max(8, look.frameRadius),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function opaqueCard(color: string): string {
  const match = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return color;
  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0.96)`;
}

export function Display({ children, size = 28 }: { children: ReactNode; size?: number }) {
  const theme = useTheme();
  const look = useStyle();
  return (
    <Text style={{ color: theme.colors.text, fontFamily: look.displayFont, fontSize: size * look.displayScale, lineHeight: size * look.displayScale * 1.25 }}>
      {children}
    </Text>
  );
}

export function Muted({ children, center }: { children: ReactNode; center?: boolean }) {
  const theme = useTheme();
  const look = useStyle();
  return (
    <Text style={{ color: theme.colors.muted, fontFamily: look.displayScale < 0.7 ? look.displayFont : 'Outfit_400Regular', fontSize: 14 * Math.max(look.displayScale, 0.72), lineHeight: 20, textAlign: center ? 'center' : 'left' }}>
      {children}
    </Text>
  );
}

export function LegalLine() {
  const theme = useTheme();
  return <Text style={[styles.legal, { color: theme.colors.muted }]}>{COIN_DISCLAIMER}</Text>;
}

export function SymbolTile({
  icon,
  size,
  hot,
  dim,
  look,
}: {
  icon: string;
  size: number;
  hot?: boolean;
  dim?: boolean;
  look?: GameStyle;
}) {
  const theme = useTheme();
  const equipped = useStyle();
  const style = look ?? equipped;
  const classic = style.id === 'classic';
  const palette = classic ? tilePalette(icon, theme) : { from: style.symbolFrom, to: style.symbolTo, ink: style.symbolInk, edge: style.accent };
  return (
    <View style={{ width: size, height: size, padding: 3, opacity: dim ? 0.35 : 1 }}>
      <LinearGradient
        colors={[palette.from, palette.to]}
        style={{
          flex: 1,
          borderRadius: size * style.plateRadius,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: hot ? style.plateBorder + 1 : style.plateBorder,
          borderColor: hot ? theme.colors.gold : palette.edge,
          overflow: 'hidden',
        }}
      >
        <SymbolGlyph name={icon} size={size * 0.62} color={palette.ink} accent={classic ? theme.colors.gold : style.accent} />
        {style.gloss ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: size * 0.08, left: size * 0.16, width: size * 0.34, height: size * 0.14, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.5)' }}
          />
        ) : null}
        {style.frost ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: 3, right: 4, width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.9)' }} />
        ) : null}
        {style.pixel ? <View pointerEvents="none" style={{ position: 'absolute', left: 2, bottom: 2, width: 5, height: 5, backgroundColor: style.accent }} /> : null}
      </LinearGradient>
    </View>
  );
}

export function NoticeStack() {
  const notices = useGame((state) => state.notices);
  const dismiss = useGame((state) => state.dismissNotice);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const latest = notices[notices.length - 1]?.id;
  useEffect(() => {
    if (!latest) return;
    const timer = setTimeout(() => dismiss(latest), 2800);
    return () => clearTimeout(timer);
  }, [dismiss, latest]);
  if (notices.length === 0) return null;
  return (
    <View pointerEvents="box-none" style={[styles.notices, { bottom: 72 + insets.bottom }]}>
      {notices.slice(-2).map((notice) => (
        <Pressable key={notice.id} onPress={() => dismiss(notice.id)} style={[styles.notice, { backgroundColor: theme.colors.card, borderColor: theme.colors.gold }]}>
          <Text style={[styles.noticeTitle, { color: theme.colors.gold }]}>{notice.title}</Text>
          <Text style={[styles.noticeBody, { color: theme.colors.text }]}>{notice.detail}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Wordmark({ compact }: { compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <VaultMark size={compact ? 28 : 36} color={theme.colors.gold} />
      <View>
        <Text style={{ color: theme.colors.gold, fontFamily: 'Cinzel_700Bold', fontSize: compact ? 16 : 20, letterSpacing: 1.4 }}>VELVET VAULT</Text>
        {compact ? null : <Text style={{ color: theme.colors.muted, fontFamily: 'Outfit_500Medium', fontSize: 12 }}>Social casino · coins only</Text>}
      </View>
    </View>
  );
}

export function themeButtonColors(theme: Theme) {
  return [theme.colors.gold, theme.colors.goldDeep] as const;
}

const styles = StyleSheet.create({
  backBar: {
    minHeight: 44,
    paddingLeft: 10,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    zIndex: 6,
  },
  backChevron: { fontSize: 34, lineHeight: 36, marginRight: 2, marginTop: -2 },
  backLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 17 },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, zIndex: 4 },
  gold: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, overflow: 'hidden' },
  gloss: { position: 'absolute', top: 4, left: 16, right: 16, height: 7, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.45)' },
  goldLabel: { fontFamily: 'Outfit_700Bold', fontSize: 16, letterSpacing: 0.4 },
  ghost: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  ghostLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontFamily: 'SpaceMono', fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14 },
  legal: { fontFamily: 'Outfit_400Regular', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8 },
  notices: { position: 'absolute', left: 16, right: 16, gap: 8, zIndex: 20 },
  notice: { borderWidth: 1, borderRadius: 14, padding: 12 },
  noticeTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 14 },
  noticeBody: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 2 },
});

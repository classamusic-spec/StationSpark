import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { hit, palette, radii, shadows, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui';

export type BottomTab = 'progress' | 'parents' | 'locker';

const StarGlyph = ({ color }: { color: string }) => (
  <Svg width={30} height={30} viewBox="0 0 24 24">
    <Path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9z" fill={color} />
  </Svg>
);

const PeopleGlyph = ({ color }: { color: string }) => (
  <Svg width={30} height={30} viewBox="0 0 24 24">
    <Circle cx={8} cy={8} r={3.6} fill={color} />
    <Circle cx={16.5} cy={8.6} r={3} fill={color} opacity={0.8} />
    <Path d="M2.4 19c0-3.3 2.6-5.6 5.6-5.6S13.6 15.7 13.6 19z" fill={color} />
    <Path d="M13 19c0-2.8 1.9-4.8 4.2-4.8S21.6 16.2 21.6 19z" fill={color} opacity={0.8} />
  </Svg>
);

const LockerGlyph = ({ color }: { color: string }) => (
  <Svg width={30} height={30} viewBox="0 0 24 24">
    <Rect x={3.4} y={2.6} width={7.4} height={18.8} rx={2} fill={color} />
    <Rect x={13.2} y={2.6} width={7.4} height={18.8} rx={2} fill={color} opacity={0.78} />
    <Circle cx={9} cy={12.4} r={1.2} fill={palette.white} />
    <Circle cx={18.8} cy={12.4} r={1.2} fill={palette.white} />
    <Rect x={5.4} y={5.4} width={3.4} height={1.5} rx={0.75} fill={palette.white} opacity={0.85} />
    <Rect x={15.2} y={5.4} width={3.4} height={1.5} rx={0.75} fill={palette.white} opacity={0.85} />
  </Svg>
);

const TABS: { id: BottomTab; label: string; href: '/badges' | '/grownups' | '/locker'; glyph: (c: string) => React.ReactNode; color: string }[] = [
  { id: 'progress', label: 'Progress', href: '/badges', glyph: (c) => <StarGlyph color={c} />, color: palette.safetyYellow },
  { id: 'parents', label: 'Parents', href: '/grownups', glyph: (c) => <PeopleGlyph color={c} />, color: '#4FA3F7' },
  { id: 'locker', label: 'Locker', href: '/locker', glyph: (c) => <LockerGlyph color={c} />, color: palette.leafGreen },
];

function TabButton({
  label,
  active,
  color,
  onPress,
  children,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPressIn={() => {
        scale.value = withSpring(0.9, springs.pop);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.bounce);
      }}
      onPress={() => {
        sfx.play('tap');
        haptics.tap();
        onPress();
      }}
      style={styles.tab}
      hitSlop={6}
    >
      <Animated.View style={[styles.tabInner, style]}>
        {children}
        <Text variant="tiny" color={active ? color : palette.navySoft} center>
          {label}
        </Text>
        <View style={[styles.underline, { backgroundColor: active ? color : 'transparent' }]} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * The three chunky destinations that follow the child everywhere:
 * Progress · Parents · Locker.
 */
export function BottomBar({ active }: { active?: BottomTab }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const go = useCallback(
    (href: '/badges' | '/grownups' | '/locker') => {
      router.push(href);
    },
    [router],
  );

  return (
    <View style={[styles.bar, shadows.card, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      {TABS.map((t, i) => {
        const isActive = active === t.id;
        return (
          <React.Fragment key={t.id}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <TabButton label={t.label} active={isActive} color={t.color} onPress={() => go(t.href)}>
              {t.glyph(isActive ? t.color : palette.slate)}
            </TabButton>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: palette.white,
    borderTopLeftRadius: radii.panel + 6,
    borderTopRightRadius: radii.panel + 6,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tab: { flex: 1, minHeight: hit.min, justifyContent: 'center' },
  tabInner: { alignItems: 'center', gap: 2, paddingVertical: 4 },
  underline: { width: 26, height: 4, borderRadius: 2, marginTop: 2 },
  divider: { width: 1, backgroundColor: palette.slateLight, marginVertical: 12 },
});

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { hit, palette, radii, shadows, spacing, springs } from '@/theme';
import { usePulse } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui';
import { mix } from '@/characters/rig/palettes';

export type BottomTab = 'progress' | 'parents' | 'locker';

const ICON = 32;
/** rule 2 — one shade, one highlight, on every glyph */
const HI = 'rgba(255,255,255,0.32)';
const shadeOf = (c: string) => mix(c, palette.navy, 0.3);

const STAR = 'M12 2.4l2.9 6.1 6.7.9-4.9 4.6 1.3 6.6L12 17.4l-6 3.2 1.3-6.6L2.4 9.4l6.7-.9z';

const StarGlyph = ({ color }: { color: string }) => (
  <Svg width={ICON} height={ICON} viewBox="0 0 24 24" pointerEvents="none">
    <Path d={STAR} fill={shadeOf(color)} transform="translate(0 1.5)" />
    <Path d={STAR} fill={color} />
    <Path d="M12 5.4l1.7 3.7 4 .5-2.9 2.7-2.8-1.7z" fill={HI} />
  </Svg>
);

const PeopleGlyph = ({ color }: { color: string }) => {
  const shade = shadeOf(color);
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 24 24" pointerEvents="none">
      {/* the friend behind, in the shade tone */}
      <Circle cx={16.6} cy={8.4} r={3.3} fill={shade} />
      <Path d="M11.6 20c0-3.4 2.2-6 5-6s5 2.6 5 6z" fill={shade} />
      {/* the friend in front */}
      <Circle cx={8.4} cy={8.6} r={3.9} fill={shade} transform="translate(0 1)" />
      <Circle cx={8.4} cy={8.4} r={3.9} fill={color} />
      <Path d="M1.8 20.6c0-3.8 2.9-6.6 6.6-6.6s6.6 2.8 6.6 6.6z" fill={shade} transform="translate(0 0.9)" />
      <Path d="M1.8 20c0-3.8 2.9-6.6 6.6-6.6s6.6 2.8 6.6 6.6z" fill={color} />
      <Circle cx={7} cy={7} r={1.3} fill={HI} />
    </Svg>
  );
};

const LockerGlyph = ({ color }: { color: string }) => {
  const shade = shadeOf(color);
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 24 24" pointerEvents="none">
      <Rect x={3.2} y={3.4} width={7.6} height={18.6} rx={2} fill={shade} />
      <Rect x={13.2} y={3.4} width={7.6} height={18.6} rx={2} fill={shade} />
      <Rect x={3.2} y={2.4} width={7.6} height={18.6} rx={2} fill={color} />
      <Rect x={13.2} y={2.4} width={7.6} height={18.6} rx={2} fill={color} />
      {/* vents */}
      <Rect x={5.1} y={5} width={3.8} height={1.4} rx={0.7} fill={shade} />
      <Rect x={5.1} y={7.6} width={3.8} height={1.4} rx={0.7} fill={shade} />
      <Rect x={15.1} y={5} width={3.8} height={1.4} rx={0.7} fill={shade} />
      <Rect x={15.1} y={7.6} width={3.8} height={1.4} rx={0.7} fill={shade} />
      {/* handles */}
      <Rect x={8} y={12.4} width={1.6} height={3.6} rx={0.8} fill={palette.white} opacity={0.9} />
      <Rect x={18} y={12.4} width={1.6} height={3.6} rx={0.8} fill={palette.white} opacity={0.9} />
      <Rect x={4.2} y={3.4} width={1.6} height={16} rx={0.8} fill={HI} />
      <Rect x={14.2} y={3.4} width={1.6} height={16} rx={0.8} fill={HI} />
    </Svg>
  );
};

const TABS: { id: BottomTab; label: string; href: '/badges' | '/grownups' | '/locker'; glyph: (c: string) => React.ReactNode; color: string }[] = [
  { id: 'progress', label: 'Progress', href: '/badges', glyph: (c) => <StarGlyph color={c} />, color: palette.safetyYellow },
  { id: 'parents', label: 'Parents', href: '/grownups', glyph: (c) => <PeopleGlyph color={c} />, color: '#4FA3F7' },
  { id: 'locker', label: 'Locker', href: '/locker', glyph: (c) => <LockerGlyph color={c} />, color: palette.leafGreen },
];

/** The soft halo that breathes behind the active tab's icon. */
function TabGlow({ id, color }: { id: string; color: string }) {
  const pulse = usePulse(2100, 0.5);
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
    transform: [{ scale: 0.9 + pulse.value * 0.16 }],
  }));
  const gid = `tabGlow-${id}`;
  return (
    <Animated.View pointerEvents="none" style={[styles.glow, style]}>
      <Svg width={64} height={64} viewBox="0 0 64 64">
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.5} />
            <Stop offset="0.6" stopColor={color} stopOpacity={0.16} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={32} cy={32} r={32} fill={`url(#${gid})`} />
      </Svg>
    </Animated.View>
  );
}

function TabButton({
  id,
  label,
  active,
  color,
  onPress,
  children,
}: {
  id: BottomTab;
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
        <View style={styles.iconWell}>
          {active ? <TabGlow id={id} color={color} /> : null}
          {children}
        </View>
        <Text variant="tiny" color={active ? mix(color, palette.navy, 0.35) : palette.navySoft} center>
          {label}
        </Text>
        <View style={[styles.underline, { backgroundColor: active ? color : 'transparent' }]} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * The three chunky destinations that follow the child everywhere:
 * Progress · Parents · Locker. Icons are drawn in the sticker language
 * (base → shade → highlight); the active one sits in a breathing glow.
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
            <TabButton id={t.id} label={t.label} active={isActive} color={t.color} onPress={() => go(t.href)}>
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
  tabInner: { alignItems: 'center', gap: 2, paddingVertical: 2 },
  iconWell: { width: ICON + 8, height: ICON + 4, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', left: (ICON + 8) / 2 - 32, top: (ICON + 4) / 2 - 32, width: 64, height: 64 },
  underline: { width: 26, height: 4, borderRadius: 2, marginTop: 1 },
  divider: { width: 1, backgroundColor: palette.slateLight, marginVertical: 12 },
});

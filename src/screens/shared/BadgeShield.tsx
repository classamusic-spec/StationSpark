import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { palette, radii, shadows, springs, stagger } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { LockIcon, Text } from '@/ui';

/**
 * LOCAL FALLBACK for `<BadgeArt/>` — a shield with a coloured rim and a simple
 * white glyph. Swap to the kit version when `@/ui` exports it; the icon ids are
 * the ones `src/content/badges.ts` uses.
 */

function Glyph({ icon, size }: { icon: string; size: number }) {
  const w = size * 0.46;
  const c = palette.white;
  const common = { width: w, height: w, viewBox: '0 0 24 24' } as const;
  switch (icon) {
    case 'flame':
      return (
        <Svg {...common}>
          <Path d="M12 2c5 5 6.5 9 0 20C5.5 11 7 7 12 2z" fill={c} />
          <Path d="M12 11c2 2.2 2.6 4 0 8-2.6-4-2-5.8 0-8z" fill={palette.safetyYellow} />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...common}>
          <Path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9z" fill={c} />
        </Svg>
      );
    case 'chef-hat':
    case 'chef':
      return (
        <Svg {...common}>
          <Path d="M6 14c-3 0-4-2.6-3-4.6C1.4 6 4 2.4 7.4 3.6 8.6.6 15 .4 16.4 3.6c2.8-.6 5 3 3.6 5.8 1 2 0 4.6-3 4.6z" fill={c} />
          <Rect x={6} y={14} width={12} height={7} rx={2} fill={c} opacity={0.82} />
        </Svg>
      );
    case 'ladder':
      return (
        <Svg {...common}>
          <Rect x={5} y={2} width={3} height={20} rx={1.5} fill={c} />
          <Rect x={16} y={2} width={3} height={20} rx={1.5} fill={c} />
          <Rect x={5} y={6} width={14} height={2.4} fill={c} />
          <Rect x={5} y={11} width={14} height={2.4} fill={c} />
          <Rect x={5} y={16} width={14} height={2.4} fill={c} />
        </Svg>
      );
    case 'hose':
      return (
        <Svg {...common}>
          <Path d="M4 20c0-8 6-8 6-13 0-2.6 2-4 4-4s4 1.6 4 4" stroke={c} strokeWidth={3.2} fill="none" strokeLinecap="round" />
          <Circle cx={18} cy={7} r={2.6} fill={palette.safetyYellow} />
        </Svg>
      );
    case 'book':
      return (
        <Svg {...common}>
          <Path d="M3 4.5c3-1.4 6-1.4 9 0v15c-3-1.4-6-1.4-9 0z" fill={c} />
          <Path d="M21 4.5c-3-1.4-6-1.4-9 0v15c3-1.4 6-1.4 9 0z" fill={c} opacity={0.8} />
        </Svg>
      );
    case 'speech-bubble':
    case 'chat':
      return (
        <Svg {...common}>
          <Path d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H10l-5 4v-4a2 2 0 0 1-2-2z" fill={c} />
        </Svg>
      );
    case 'map':
      return (
        <Svg {...common}>
          <Path d="M3 6l6-2.6 6 2.6 6-2.6v15L15 21l-6-2.6L3 21z" fill={c} />
        </Svg>
      );
    case 'pattern':
      return (
        <Svg {...common}>
          <Circle cx={7} cy={7} r={3.4} fill={c} />
          <Rect x={13.6} y={3.6} width={6.8} height={6.8} rx={2} fill={c} />
          <Rect x={3.6} y={13.6} width={6.8} height={6.8} rx={2} fill={c} />
          <Circle cx={17} cy={17} r={3.4} fill={c} />
        </Svg>
      );
    case 'hands':
    case 'team':
      return (
        <Svg {...common}>
          <Circle cx={8} cy={8} r={3.4} fill={c} />
          <Circle cx={16} cy={8} r={3.4} fill={c} opacity={0.85} />
          <Path d="M2 20c0-3.4 2.6-6 6-6s6 2.6 6 6z" fill={c} />
          <Path d="M12 20c0-3.4 2.2-6 5-6s5 2.6 5 6z" fill={c} opacity={0.85} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...common}>
          <Path d="M12 21S3 14.6 3 8.9A5 5 0 0 1 12 6a5 5 0 0 1 9 2.9C21 14.6 12 21 12 21z" fill={c} />
        </Svg>
      );
    case 'cat':
      return (
        <Svg {...common}>
          <Path d="M4 20l1-9 3 3h8l3-3 1 9z" fill={c} />
          <Path d="M5 11L4 3l5 4z" fill={c} />
          <Path d="M19 11l1-8-5 4z" fill={c} />
          <Circle cx={9.6} cy={15} r={1.4} fill={palette.navy} />
          <Circle cx={14.4} cy={15} r={1.4} fill={palette.navy} />
        </Svg>
      );
    case 'bread':
      return (
        <Svg {...common}>
          <Ellipse cx={12} cy={13} rx={9.4} ry={6.4} fill={c} />
          <Path d="M7 10.4q2.4-2.4 4.8 0M11.6 10.4q2.4-2.4 4.8 0" stroke={palette.gold} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'pizza':
      return (
        <Svg {...common}>
          <Path d="M12 2l9 18H3z" fill={c} />
          <Circle cx={12} cy={12} r={1.7} fill={palette.engineRed} />
          <Circle cx={9} cy={17} r={1.5} fill={palette.engineRed} />
          <Circle cx={15} cy={17} r={1.5} fill={palette.engineRed} />
        </Svg>
      );
    case 'picnic':
    case 'tree':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={9} r={6.4} fill={c} />
          <Rect x={10.4} y={13} width={3.2} height={8} rx={1.6} fill={c} opacity={0.85} />
        </Svg>
      );
    case 'school':
      return (
        <Svg {...common}>
          <Path d="M3 10l9-6 9 6v10H3z" fill={c} />
          <Rect x={10} y={13} width={4} height={7} rx={1} fill={palette.navy} opacity={0.35} />
        </Svg>
      );
    case 'broom':
    case 'recycle':
      return (
        <Svg {...common}>
          <Path d="M12 3l3.4 5.6h-6.8z" fill={c} />
          <Path d="M20 15l-3 5.6-4.6-2.4z" fill={c} opacity={0.85} />
          <Path d="M4 15l3 5.6 4.6-2.4z" fill={c} opacity={0.7} />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={9.4} fill={c} />
          <Path d="M12 12V7M12 12l3.6 2.4" stroke={palette.navy} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'numbers':
    default:
      return (
        <Svg {...common}>
          <Path d="M4 9h6M4 15h6M6.4 4v16M13 15.6h7M16.5 12v7.2" stroke={c} strokeWidth={2.8} strokeLinecap="round" />
          <Path d="M13 8h7" stroke={c} strokeWidth={2.8} strokeLinecap="round" />
        </Svg>
      );
  }
}

const ShieldFace = memo(function ShieldFace({ size, color, earned }: { size: number; color: string; earned: boolean }) {
  const rim = earned ? color : palette.lockedGrey;
  const inner = earned ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.4)';
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110">
      <Path d="M50 4 L94 20 v38c0 27-21 45-44 50C27 103 6 85 6 58V20z" fill={rim} />
      <Path d="M50 13 L85 26 v32c0 22-17 37-35 41C32 95 15 80 15 58V26z" fill={inner} />
    </Svg>
  );
});

export interface BadgeShieldProps {
  name: string;
  color: string;
  icon: string;
  earned: boolean;
  size?: number;
  index?: number;
  onPress?: () => void;
}

/** One badge on the wall: shield, glyph, name plaque, lock when not yet earned. */
export function BadgeShield({ name, color, icon, earned, size = 84, index = 0, onPress }: BadgeShieldProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={ZoomIn.delay(index * stagger.tile).springify().damping(13)} style={[styles.wrap, { width: size + 16 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={earned ? `${name}, earned` : `${name}, not earned yet`}
        onPressIn={() => {
          scale.value = withSpring(0.92, springs.pop);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.bounce);
        }}
        onPress={() => {
          sfx.play(earned ? 'pop' : 'tap-soft');
          haptics.tap();
          onPress?.();
        }}
        style={styles.press}
        hitSlop={6}
      >
        <View style={[styles.shield, { width: size, height: size * 1.1 }]}>
          <ShieldFace size={size} color={color} earned={earned} />
          <View style={styles.glyph}>{earned ? <Glyph icon={icon} size={size} /> : <LockIcon size={size * 0.36} color="#FFFFFF" />}</View>
        </View>
        <View style={[styles.plaque, earned ? styles.plaqueOn : styles.plaqueOff]}>
          <Text variant="tiny" color={earned ? palette.navy : palette.slate} center numberOfLines={2}>
            {earned ? name : 'Keep going!'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  press: { alignItems: 'center' },
  shield: { alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  glyph: { position: 'absolute', top: '26%' },
  plaque: { marginTop: -8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.tag, maxWidth: 100 },
  plaqueOn: { backgroundColor: palette.creamDeep },
  plaqueOff: { backgroundColor: '#E7EAF3' },
});

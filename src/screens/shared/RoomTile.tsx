import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { palette, radii, shadows, springs, stagger } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui';
import { useLoop, usePulse } from '@/hooks';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';

export type RoomId = 'dispatch' | 'map' | 'training' | 'kitchen' | 'garage' | 'badges';

/* ── room icons: each one is alive ────────────────────────────────── */

/**
 * One drawing language for all six (critique #7): every icon sits on the same
 * navy contact ellipse, carries exactly one shade tone and one highlight, and
 * is drawn — never a glyph, never an emoji.
 */
const GROUND = 43.5;

const Shadow = ({ rx = 16, cx = 24 }: { rx?: number; cx?: number }) => (
  <Ellipse cx={cx} cy={GROUND} rx={rx} ry={shadowRy(rx)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
);

const RadioBody = memo(function RadioBody({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Shadow rx={14} cx={22} />
      <Rect x={16} y={3} width={4} height={11} rx={2} fill={palette.charcoal} />
      <Circle cx={18} cy={3.4} r={2.6} fill={palette.safetyYellow} />
      <Rect x={10} y={12} width={24} height={30} rx={6} fill={palette.navy} />
      <Rect x={26} y={14} width={7} height={26} rx={3.5} fill={SHADE} />
      <Rect x={12} y={14} width={4} height={26} rx={2} fill={HIGHLIGHT} />
      <Rect x={13} y={16} width={18} height={9} rx={3} fill={palette.safetyYellow} />
      <Rect x={13} y={22} width={18} height={3} rx={1.5} fill={SHADE} />
      <Circle cx={17} cy={31} r={2.4} fill={palette.slateLight} />
      <Circle cx={25} cy={31} r={2.4} fill={palette.slateLight} />
      <Circle cx={17} cy={37} r={2.4} fill={palette.slateLight} />
      <Circle cx={25} cy={37} r={2.4} fill={palette.orange} />
    </Svg>
  );
});

function DispatchIcon({ size }: { size: number }) {
  const pulse = usePulse(1300, 0.5);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.65, transform: [{ scale: 0.86 + pulse.value * 0.22 }] }));
  return (
    <View style={{ width: size, height: size }}>
      <RadioBody s={size} />
      <Animated.View style={[styles.overlay, style]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Path d="M34 10 L42 6 M35 16 L44 15 M35 22 L43 25" stroke={palette.safetyYellow} strokeWidth={4} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Not the folded-paper map emoji shape: a *survey board* of Spark City — a cream chart
 * on a tan board with drawn asphalt, a park block and the river running
 * through it. Reads as a hand-drawn map, not as a glyph.
 */
const MapBody = memo(function MapBody({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Shadow rx={17} />
      <Rect x={5} y={8} width={38} height={33} rx={7} fill={palette.tanDark} />
      <Rect x={6.5} y={9} width={35} height={29.5} rx={6} fill={palette.cream} />
      {/* park block + river + roads, drawn not stroked-in */}
      <Path d="M7 30 q 8 -3 14 1 q 8 4 20 0 v 6 q -1 1.5 -3 1.5 H 10 q -3 0 -3 -3 Z" fill="#B6E39A" />
      <Path d="M6.5 20 q 8 -6 15 -1 q 7 5 20 -2 v 4 q -12 8 -20 3 q -7 -4 -15 2 Z" fill={palette.waterCyanLight} />
      <Rect x={19} y={9} width={5} height={29.5} fill="#DDE2EF" />
      <Rect x={6.5} y={25} width={35} height={4.4} fill="#DDE2EF" />
      <Rect x={20.4} y={9} width={2.2} height={29.5} fill={palette.white} opacity={0.75} />
      <Rect x={6.5} y={26.7} width={35} height={1.8} fill={palette.white} opacity={0.75} />
      {/* two little town blocks so the plan has buildings on it */}
      <Rect x={10} y={13} width={7} height={7} rx={2} fill={palette.tan} />
      <Rect x={29} y={31} width={8} height={6} rx={2} fill={palette.tan} />
      <Rect x={6.5} y={9} width={35} height={3} rx={1.5} fill={HIGHLIGHT} />
      <Path d="M41.5 9 v29.5 q 0 1.5 -2 1.5 h -3 v -31 Z" fill={SHADE} />
    </Svg>
  );
});

function MapIcon({ size }: { size: number }) {
  const hop = usePulse(1700, 0.5);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -hop.value * size * 0.09 }] }));
  return (
    <View style={{ width: size, height: size }}>
      <MapBody s={size} />
      <Animated.View style={[styles.overlay, style]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Ellipse cx={31} cy={33.4} rx={5} ry={1.4} fill={SHADOW_FILL} opacity={0.18} />
          <Path d="M31 9 c6 0 10 4.4 10 10 c0 7 -10 14.6 -10 14.6 s-10 -7.6 -10 -14.6 c0 -5.6 4 -10 10 -10 z" fill={palette.engineRedDark} />
          <Path d="M31 10 c5.4 0 9 4 9 9 c0 6.2 -9 13 -9 13 s-9 -6.8 -9 -13 c0 -5 3.6 -9 9 -9 z" fill={palette.engineRed} />
          <Path d="M31 10 c-4 0 -7 2.4 -8.4 5.6 c1.8 -2 4.4 -3.2 8.4 -3.2 z" fill={HIGHLIGHT} />
          <Circle cx={31} cy={19} r={3.8} fill={palette.white} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const ConeBody = memo(function ConeBody({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Shadow rx={16} />
      <Path d="M24 5 q 2.6 0 3.4 3 L 35 38 q 0.6 2 -1.6 2 H 14.6 q -2.2 0 -1.6 -2 L 20.6 8 Q 21.4 5 24 5 Z" fill={palette.orange} />
      <Path d="M24 5 q 2.6 0 3.4 3 L 35 38 q 0.6 2 -1.6 2 H 25 Z" fill={SHADE} />
      <Path d="M24 5 q -2.6 0 -3.4 3 L 18.6 20 h 3.2 L 24 5 Z" fill={HIGHLIGHT} />
      <Path d="M20.8 19 h 6.4 l 1.2 5.4 h -8.8 Z" fill={palette.white} />
      <Path d="M18.4 28 h 11.2 l 1.2 5.4 H 17.2 Z" fill={palette.white} />
      <Rect x={8} y={37.6} width={32} height={6} rx={3} fill={palette.orangeDark} />
      <Rect x={10} y={38.4} width={12} height={2} rx={1} fill={HIGHLIGHT} />
    </Svg>
  );
});

function TrainingIcon({ size }: { size: number }) {
  const tilt = usePulse(2400, 0.5);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${(tilt.value - 0.5) * 8}deg` }] }));
  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <ConeBody s={size} />
    </Animated.View>
  );
}

const HatBody = memo(function HatBody({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Shadow rx={14} />
      <Path d="M12 30 c-6 0 -8 -5 -6 -9 c-3 -5 2 -11 7 -9 c2 -5 10 -6 12 -1 c3 -4 11 -2 11 4 c5 1 6 8 1 11 c1 3 -1 4 -3 4 z" fill={palette.white} />
      <Path d="M32 12 c4 0 6 4 5 7 c5 1 6 8 1 11 c1 3 -1 4 -3 4 h -8 c 6 -6 8 -16 5 -22 z" fill={SHADE} />
      <Path d="M13 12 c2 -5 10 -6 12 -1 c-4 -1 -8 1 -9 4 c-2 -2 -4 -2.6 -3 -3 z" fill={HIGHLIGHT} />
      <Path d="M13 29 h22 q 2 0 2 2 v 7 q 0 2 -2 2 H 13 q -2 0 -2 -2 v -7 q 0 -2 2 -2 z" fill="#EDF1FA" />
      <Path d="M30 29 h5 q 2 0 2 2 v 7 q 0 2 -2 2 h -5 Z" fill={SHADE} />
      <Rect x={12} y={32.4} width={24} height={1.8} rx={0.9} fill="#D6DCEC" />
      <Rect x={12} y={36} width={24} height={1.8} rx={0.9} fill="#D6DCEC" />
    </Svg>
  );
});

function KitchenIcon({ size }: { size: number }) {
  const rise = useLoop(3000);
  const style = useAnimatedStyle(() => {
    const p = rise.value;
    return { opacity: 0.9 - p * 0.85, transform: [{ translateY: -p * size * 0.3 }, { scale: 0.7 + p * 0.5 }] };
  });
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[styles.overlay, style]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx={17} cy={9} r={4} fill={palette.white} opacity={0.75} />
          <Circle cx={26} cy={5} r={3.4} fill={palette.white} opacity={0.65} />
          <Circle cx={33} cy={10} r={3} fill={palette.white} opacity={0.6} />
        </Svg>
      </Animated.View>
      <HatBody s={size} />
    </View>
  );
}

const TruckMini = memo(function TruckMini({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Shadow rx={19} />
      <Rect x={5} y={18} width={38} height={16} rx={5} fill={palette.engineRed} />
      <Rect x={5} y={29} width={38} height={5} rx={2.5} fill={SHADE} />
      <Rect x={5} y={19} width={38} height={3} rx={1.5} fill={HIGHLIGHT} />
      <Rect x={5} y={25.6} width={38} height={3.6} fill={palette.safetyYellow} />
      <Rect x={9} y={20} width={12} height={6} rx={2.5} fill="#204A86" />
      <Rect x={9} y={20} width={12} height={3} rx={2} fill="#3C6FB4" />
      <Rect x={26} y={20} width={12} height={6} rx={2.5} fill="#204A86" />
      <Rect x={26} y={20} width={12} height={3} rx={2} fill="#3C6FB4" />
      <Rect x={17} y={12} width={14} height={5} rx={2.5} fill={palette.charcoal} />
      <Circle cx={14} cy={35.4} r={5.2} fill={palette.charcoalDark} />
      <Circle cx={34} cy={35.4} r={5.2} fill={palette.charcoalDark} />
      <Circle cx={14} cy={35.4} r={2.2} fill={palette.slateLight} />
      <Circle cx={34} cy={35.4} r={2.2} fill={palette.slateLight} />
    </Svg>
  );
});

function GarageIcon({ size }: { size: number }) {
  const flash = usePulse(700, 0.5);
  const left = useAnimatedStyle(() => ({ opacity: 0.25 + flash.value * 0.75 }));
  const right = useAnimatedStyle(() => ({ opacity: 1 - flash.value * 0.75 }));
  const u = size / 48;
  return (
    <View style={{ width: size, height: size }}>
      <TruckMini s={size} />
      <Animated.View style={[styles.abs, { left: 18 * u, top: 12.5 * u, width: 5.5 * u, height: 4 * u, borderRadius: 2 * u, backgroundColor: palette.engineRedLight }, left]} />
      <Animated.View style={[styles.abs, { left: 25 * u, top: 12.5 * u, width: 5.5 * u, height: 4 * u, borderRadius: 2 * u, backgroundColor: '#7FC0F5' }, right]} />
    </View>
  );
}

const ShieldBody = memo(function ShieldBody({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Shadow rx={14} />
      <Path d="M24 3 L41 9 v14 c0 10 -8 17 -17 20 C15 40 7 33 7 23 V9 Z" fill={palette.navy} />
      <Path d="M24 7 L37 11.6 v11.4 c0 8 -6.4 13.6 -13 16 C17.4 36.6 11 31 11 23 V11.6 Z" fill="#2E3C74" />
      <Path d="M24 3 L41 9 v14 c0 10 -8 17 -17 20 Z" fill={SHADE} />
      <Path d="M24 7 L13 10.8 v3 L24 10 Z" fill={HIGHLIGHT} />
      <Path d="M24 14 l3.4 7 7.6 1 -5.5 5.2 1.4 7.5 -6.9 -3.7 -6.9 3.7 1.4 -7.5 -5.5 -5.2 7.6 -1 z" fill={palette.gold} />
      <Path d="M24 15.4 l2.9 6 6.4 0.9 -4.7 4.4 1.2 6.4 -5.8 -3.2 -5.8 3.2 1.2 -6.4 -4.7 -4.4 6.4 -0.9 z" fill={palette.safetyYellow} />
    </Svg>
  );
});

function BadgesIcon({ size }: { size: number }) {
  const glint = useLoop(3400);
  const style = useAnimatedStyle(() => {
    const p = glint.value;
    return { opacity: p > 0.72 ? (1 - p) / 0.28 : p < 0.06 ? p / 0.06 : p < 0.72 ? 1 : 0, transform: [{ translateX: (p * 1.9 - 0.5) * size }, { rotate: '18deg' }] };
  });
  return (
    <View style={[{ width: size, height: size }, styles.clip]}>
      <ShieldBody s={size} />
      <Animated.View style={[styles.abs, { top: -size * 0.2, width: size * 0.22, height: size * 1.4, backgroundColor: '#FFFFFF', opacity: 0 }, style]} pointerEvents="none" />
    </View>
  );
}

const ICONS: Record<RoomId, (p: { size: number }) => React.ReactElement> = {
  dispatch: DispatchIcon,
  map: MapIcon,
  training: TrainingIcon,
  kitchen: KitchenIcon,
  garage: GarageIcon,
  badges: BadgesIcon,
};

/* ── the tile ─────────────────────────────────────────────────────── */

export interface RoomTileProps {
  room: RoomId;
  label: string;
  index?: number;
  width: number;
  height: number;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * A room on the station façade. Cream face on a tan edge, its icon idling, and
 * a squash on press before the screen zooms into the room.
 */
export function RoomTile({ room, label, index = 0, width, height, onPress, disabled }: RoomTileProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Icon = ICONS[room];
  const iconSize = Math.min(width * 0.48, height * 0.5);

  return (
    <Animated.View entering={FadeInDown.delay(index * stagger.tile).springify().damping(15)} style={{ width, height }}>
      <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withSpring(0.93, springs.pop);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.bounce);
        }}
        onPress={() => {
          if (disabled) return;
          sfx.play('tap');
          haptics.tap();
          onPress();
        }}
        style={[styles.tile, shadows.soft, { width, height }, disabled && styles.disabled]}
      >
        <Icon size={iconSize} />
        <Text variant={height >= 82 ? 'small' : 'tiny'} color={palette.navy} center numberOfLines={1} style={styles.label}>
          {label}
        </Text>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: palette.cream,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  disabled: { opacity: 0.55 },
  label: { includeFontPadding: false, paddingHorizontal: 2 },
  overlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  abs: { position: 'absolute' },
  clip: { overflow: 'hidden', borderRadius: 8 },
});

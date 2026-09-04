import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { palette, radii, shadows, springs, stagger } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui';
import { useLoop, usePulse } from '@/hooks';

export type RoomId = 'dispatch' | 'map' | 'training' | 'kitchen' | 'garage' | 'badges';

/* ── room icons: each one is alive ────────────────────────────────── */

const RadioBody = memo(function RadioBody({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Rect x={13} y={4} width={4} height={10} rx={2} fill={palette.navy} />
      <Rect x={9} y={12} width={22} height={32} rx={5} fill={palette.navy} />
      <Rect x={12} y={16} width={16} height={9} rx={2} fill={palette.safetyYellow} />
      <Circle cx={16} cy={31} r={2.4} fill={palette.slateLight} />
      <Circle cx={24} cy={31} r={2.4} fill={palette.slateLight} />
      <Circle cx={16} cy={38} r={2.4} fill={palette.slateLight} />
      <Circle cx={24} cy={38} r={2.4} fill={palette.orange} />
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

const MapBody = memo(function MapBody({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Path d="M4 12 L17 7 L31 12 L44 7 L44 38 L31 43 L17 38 L4 43 Z" fill="#DDF0C9" />
      <Path d="M17 7 L17 38 M31 12 L31 43" stroke="#B8D9A0" strokeWidth={2} />
      <Path d="M4 24 Q 16 18 30 26 Q 38 30 44 25" stroke={palette.waterCyan} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <Path d="M8 36 Q 22 30 44 33" stroke={palette.slateLight} strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
});

function MapIcon({ size }: { size: number }) {
  const hop = usePulse(1700, 0.5);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -hop.value * size * 0.11 }] }));
  return (
    <View style={{ width: size, height: size }}>
      <MapBody s={size} />
      <Animated.View style={[styles.overlay, style]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Path d="M28 8 c6 0 10 4 10 10 c0 7 -10 16 -10 16 s-10 -9 -10 -16 c0 -6 4 -10 10 -10 z" fill={palette.engineRed} />
          <Circle cx={28} cy={18} r={4} fill={palette.white} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const ConeBody = memo(function ConeBody({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Ellipse cx={24} cy={41} rx={16} ry={3.6} fill={palette.navy} opacity={0.12} />
      <Path d="M24 5 L36 39 L12 39 Z" fill={palette.orange} />
      <Path d="M24 5 L30 22 L18 22 Z" fill={palette.orangeDark} opacity={0.35} />
      <Rect x={17} y={20} width={14} height={5.4} fill={palette.white} />
      <Rect x={14.6} y={28} width={18.8} height={5.4} fill={palette.white} />
      <Rect x={8} y={38} width={32} height={6} rx={3} fill={palette.orangeDark} />
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
      <Path d="M12 30 c-6 0 -8 -5 -6 -9 c-3 -5 2 -11 7 -9 c2 -5 10 -6 12 -1 c3 -4 11 -2 11 4 c5 1 6 8 1 11 c1 3 -1 4 -3 4 z" fill={palette.white} />
      <Rect x={13} y={29} width={22} height={11} rx={3} fill="#EDF1FA" />
      <Path d="M13 33 h22 M13 37 h22" stroke="#D6DCEC" strokeWidth={1.6} />
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
      <Ellipse cx={24} cy={40} rx={19} ry={3.4} fill={palette.navy} opacity={0.12} />
      <Rect x={5} y={18} width={38} height={16} rx={4} fill={palette.engineRed} />
      <Rect x={5} y={26} width={38} height={4} fill={palette.safetyYellow} />
      <Rect x={9} y={20} width={12} height={6} rx={2} fill="#2F5FA8" />
      <Rect x={26} y={20} width={12} height={6} rx={2} fill="#2F5FA8" />
      <Rect x={17} y={12} width={14} height={5} rx={2.5} fill={palette.charcoal} />
      <Circle cx={14} cy={36} r={5} fill={palette.charcoalDark} />
      <Circle cx={34} cy={36} r={5} fill={palette.charcoalDark} />
      <Circle cx={14} cy={36} r={2} fill={palette.slateLight} />
      <Circle cx={34} cy={36} r={2} fill={palette.slateLight} />
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
      <Path d="M24 4 L41 10 v14 c0 10 -8 17 -17 20 C15 41 7 34 7 24 V10 Z" fill={palette.navy} />
      <Path d="M24 8 L37 12.6 v11.4 c0 8 -6.4 13.6 -13 16 C17.4 37.6 11 32 11 24 V12.6 Z" fill="#2E3C74" />
      <Path d="M24 15 l3.4 7 7.6 1 -5.5 5.2 1.4 7.5 -6.9 -3.7 -6.9 3.7 1.4 -7.5 -5.5 -5.2 7.6 -1 z" fill={palette.safetyYellow} />
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
    <Animated.View entering={FadeInDown.delay(index * stagger.tile).springify().damping(15)} style={[{ width, height }, style]}>
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

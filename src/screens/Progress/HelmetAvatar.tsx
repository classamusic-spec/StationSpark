import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import type { Emotion } from '@/content/types';
import { palette, shadows } from '@/theme';
import type { Avatar } from '@/state/store';
import { Rookie } from '@/characters/Rookie';

const helmetColors: Record<Avatar['helmet'], { face: string; shade: string }> = {
  red: { face: palette.engineRed, shade: palette.engineRedDark },
  yellow: { face: palette.safetyYellow, shade: palette.goldDark },
  blue: { face: '#3E8FE0', shade: '#25649F' },
  pink: { face: palette.pink, shade: '#D95A8C' },
};

/**
 * How the Rookie rig is framed inside the disc: rig height as a multiple of
 * the disc, its aspect, and where the head sits inside the rig box.
 */
const FRAME = { scale: 1.8, aspect: 120 / 165, cx: 0.5, cy: 0.364, headY: 0.5 } as const;

/** The warm gold disc behind every portrait. */
const Disc = memo(function Disc({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <RadialGradient id="helmDisc" cx="50%" cy="42%" r="62%">
          <Stop offset="0" stopColor="#FFE07A" />
          <Stop offset="1" stopColor={palette.gold} />
        </RadialGradient>
      </Defs>
      <Circle cx={50} cy={50} r={50} fill="url(#helmDisc)" />
      <Circle cx={50} cy={50} r={44} fill="#FFD24D" opacity={0.5} />
    </Svg>
  );
});

export interface HelmetAvatarProps {
  /** helmet colour for the drawn-helmet fallback */
  helmet?: Avatar['helmet'];
  /** when given, the child's actual Rookie head (skin, hair, helmet) — blinking and breathing */
  avatar?: Avatar;
  emotion?: Emotion;
  size?: number;
}

/**
 * The profile portrait: the child's own Rookie head on a warm gold disc.
 * Without an `avatar` it falls back to a drawn helmet on the same disc.
 */
export const HelmetAvatar = memo(function HelmetAvatar({ helmet = 'red', avatar, emotion = 'happy', size = 118 }: HelmetAvatarProps) {
  const c = helmetColors[helmet] ?? helmetColors.red;

  if (avatar) {
    const rigH = FRAME.scale * size;
    const rigW = rigH * FRAME.aspect;
    const left = size * 0.5 - FRAME.cx * rigW;
    const top = size * FRAME.headY - FRAME.cy * rigH;
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="Your helmet portrait"
        style={[styles.wrap, shadows.soft, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Disc size={size} />
        <View pointerEvents="none" style={{ position: 'absolute', left, top, width: rigW, height: rigH }}>
          <Rookie size={rigH} avatar={avatar} pose="stand" emotion={emotion} />
        </View>
        {/* the disc's soft inner rim keeps the crop reading as a portrait */}
        <View pointerEvents="none" style={[styles.rim, { borderRadius: size / 2, borderWidth: Math.max(3, size * 0.04) }]} />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, shadows.soft, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="helmDiscFallback" cx="50%" cy="42%" r="62%">
            <Stop offset="0" stopColor="#FFE07A" />
            <Stop offset="1" stopColor={palette.gold} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill="url(#helmDiscFallback)" />
        <Circle cx={50} cy={50} r={44} fill="#FFD24D" opacity={0.5} />
        {/* helmet dome */}
        <Path d="M22 62 C22 38 34 24 50 24 C66 24 78 38 78 62 Z" fill={c.face} />
        <Path d="M50 24 C66 24 78 38 78 62 L62 62 C62 40 58 28 50 24 Z" fill={c.shade} opacity={0.45} />
        <Path d="M34 40 C38 32 44 28 50 27" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.4} />
        {/* front shield with a flame */}
        <Path d="M50 34 L59 38 v9 c0 6 -4 9 -9 11 c-5 -2 -9 -5 -9 -11 v-9 z" fill={palette.safetyYellow} />
        <Path d="M50 39 c3 3 4 5 0 9 c-4 -4 -3 -6 0 -9 z" fill={palette.engineRed} />
        {/* brim */}
        <Ellipse cx={50} cy={64} rx={34} ry={9} fill={c.face} />
        <Ellipse cx={50} cy={66} rx={34} ry={7} fill={c.shade} />
        <Ellipse cx={50} cy={61} rx={28} ry={5} fill="#FFFFFF" opacity={0.22} />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: palette.cream, alignItems: 'center', justifyContent: 'center' },
  rim: { ...StyleSheet.absoluteFill, borderColor: 'rgba(255,255,255,0.45)' },
});

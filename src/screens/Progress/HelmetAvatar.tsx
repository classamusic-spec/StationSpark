import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { palette, shadows } from '@/theme';
import type { Avatar } from '@/state/store';

const helmetColors: Record<Avatar['helmet'], { face: string; shade: string }> = {
  red: { face: palette.engineRed, shade: palette.engineRedDark },
  yellow: { face: palette.safetyYellow, shade: palette.goldDark },
  blue: { face: '#3E8FE0', shade: '#25649F' },
  pink: { face: palette.pink, shade: '#D95A8C' },
};

/** The profile portrait: the child's helmet on a warm gold disc. */
export const HelmetAvatar = memo(function HelmetAvatar({ helmet = 'red', size = 118 }: { helmet?: Avatar['helmet']; size?: number }) {
  const c = helmetColors[helmet] ?? helmetColors.red;
  return (
    <View style={[styles.wrap, shadows.soft, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="helmDisc" cx="50%" cy="42%" r="62%">
            <Stop offset="0" stopColor="#FFE07A" />
            <Stop offset="1" stopColor={palette.gold} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill="url(#helmDisc)" />
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
});

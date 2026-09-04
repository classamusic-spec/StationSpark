import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette, radii, shadows } from '@/theme';
import { Text } from '@/ui';

/** The shift clipboard: "Shift: 1 / 3 missions". */
export function ShiftChip({ label, active }: { label: string; active: boolean }) {
  return (
    <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} style={[styles.chip, shadows.soft]}>
      <Svg width={20} height={22} viewBox="0 0 20 22">
        <Rect x={1.6} y={2.6} width={16.8} height={18.4} rx={3} fill={palette.wood} />
        <Rect x={3.6} y={5} width={12.8} height={13.6} rx={2} fill={palette.white} />
        <Rect x={6.6} y={0.6} width={6.8} height={4} rx={2} fill={palette.slate} />
        <Path d="M6 9.4h8M6 12.4h8M6 15.4h5" stroke={active ? palette.leafGreen : palette.slateLight} strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
      <Text variant="tiny" color={palette.navy} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    height: 40,
  },
});

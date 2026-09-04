import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';

export type TreeTone = 'light' | 'mid' | 'dark';

const tones: Record<TreeTone, { leaf: string; shade: string }> = {
  light: { leaf: '#8FD16B', shade: '#6FBB56' },
  mid: { leaf: '#5DBB63', shade: '#4A9E52' },
  dark: { leaf: '#3E8E4A', shade: '#31743C' },
};

/** A chunky round tree — flat fill + one shade tone + a soft ground ellipse. */
export const Tree = memo(function Tree({ size = 74, tone = 'mid' }: { size?: number; tone?: TreeTone }) {
  const t = tones[tone];
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 60 69" pointerEvents="none">
      <Ellipse cx={30} cy={65} rx={17} ry={4} fill={palette.navy} opacity={0.12} />
      <Rect x={26} y={40} width={8} height={24} rx={4} fill={palette.wood} />
      <Ellipse cx={30} cy={28} rx={24} ry={22} fill={t.leaf} />
      <Ellipse cx={17} cy={36} rx={14} ry={13} fill={t.leaf} />
      <Ellipse cx={43} cy={36} rx={14} ry={13} fill={t.shade} />
      <Ellipse cx={24} cy={20} rx={10} ry={8} fill="#FFFFFF" opacity={0.22} />
    </Svg>
  );
});

/** A low round bush for foreground edges and flower boxes. */
export const Bush = memo(function Bush({ size = 56, tone = 'mid' }: { size?: number; tone?: TreeTone }) {
  const t = tones[tone];
  return (
    <Svg width={size} height={size * 0.62} viewBox="0 0 60 37" pointerEvents="none">
      <Ellipse cx={30} cy={33} rx={22} ry={4} fill={palette.navy} opacity={0.1} />
      <Ellipse cx={18} cy={24} rx={14} ry={11} fill={t.leaf} />
      <Ellipse cx={42} cy={24} rx={14} ry={11} fill={t.shade} />
      <Ellipse cx={30} cy={19} rx={15} ry={13} fill={t.leaf} />
      <Ellipse cx={25} cy={13} rx={7} ry={5} fill="#FFFFFF" opacity={0.24} />
    </Svg>
  );
});

/** A pine, for the town edges. */
export const Pine = memo(function Pine({ size = 66, tone = 'dark' }: { size?: number; tone?: TreeTone }) {
  const t = tones[tone];
  return (
    <Svg width={size * 0.75} height={size} viewBox="0 0 45 60" pointerEvents="none">
      <Ellipse cx={22} cy={57} rx={13} ry={3.4} fill={palette.navy} opacity={0.12} />
      <Rect x={19} y={44} width={7} height={13} rx={3} fill={palette.woodDark} />
      <Path d="M 22 4 L 39 26 L 5 26 Z" fill={t.leaf} />
      <Path d="M 22 18 L 42 46 L 3 46 Z" fill={t.shade} />
      <Path d="M 22 18 L 22 46 L 3 46 Z" fill={t.leaf} />
    </Svg>
  );
});

export interface TreeLineProps {
  /** how many trees across */
  count?: number;
  height?: number;
  bottom?: number;
  tone?: TreeTone;
}

/** A row of trees hugging the bottom of a backdrop band. */
export const TreeLine = memo(function TreeLine({ count = 7, height = 92, bottom = 120, tone = 'mid' }: TreeLineProps) {
  const items = Array.from({ length: Math.max(1, count) }, (_, i) => i);
  return (
    <View style={[styles.row, { bottom, height }]} pointerEvents="none">
      {items.map((i) => (
        <View key={i} style={{ marginBottom: (i % 3) * 6 }}>
          {i % 4 === 3 ? <Pine size={height * 0.86} tone={tone} /> : <Tree size={height * (0.72 + ((i % 3) * 0.1))} tone={i % 2 ? tone : 'light'} />}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: -10,
    right: -10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
});

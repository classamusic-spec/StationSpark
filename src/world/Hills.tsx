import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { palette } from '@/theme';

export interface HillsProps {
  /** total height of the hill band */
  height?: number;
  /** sit this far from the bottom of the parent */
  bottom?: number;
  /** darker far hills for evening skies */
  mood?: 'day' | 'evening';
}

/**
 * Three layered green hills. Pure static art — memoized so it never re-renders
 * behind the drifting clouds and animated characters.
 */
export const Hills = memo(function Hills({ height = 190, bottom = 0, mood = 'day' }: HillsProps) {
  const { width } = useWindowDimensions();
  const w = Math.max(320, width);
  const h = height;
  const far = mood === 'evening' ? '#6FA86B' : '#7FC468';
  const mid = mood === 'evening' ? '#5D9A5C' : palette.grass;
  const near = mood === 'evening' ? '#4E8A50' : palette.grassDark;

  return (
    <View style={[styles.wrap, { height: h, bottom }]} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={near} />
            <Stop offset="1" stopColor={mood === 'evening' ? '#3E7342' : '#4CAF50'} />
          </LinearGradient>
        </Defs>
        {/* far ridge */}
        <Path
          d={`M 0 ${h * 0.52} Q ${w * 0.16} ${h * 0.2} ${w * 0.36} ${h * 0.46} Q ${w * 0.54} ${h * 0.68} ${w * 0.72} ${h * 0.36} Q ${w * 0.88} ${h * 0.14} ${w} ${h * 0.44} L ${w} ${h} L 0 ${h} Z`}
          fill={far}
        />
        {/* mid ridge */}
        <Path
          d={`M 0 ${h * 0.74} Q ${w * 0.22} ${h * 0.44} ${w * 0.46} ${h * 0.68} Q ${w * 0.68} ${h * 0.88} ${w * 0.86} ${h * 0.58} Q ${w * 0.95} ${h * 0.44} ${w} ${h * 0.6} L ${w} ${h} L 0 ${h} Z`}
          fill={mid}
        />
        {/* near bank */}
        <Path d={`M 0 ${h * 0.9} Q ${w * 0.3} ${h * 0.74} ${w * 0.58} ${h * 0.88} Q ${w * 0.82} ${h * 0.99} ${w} ${h * 0.86} L ${w} ${h} L 0 ${h} Z`} fill="url(#hillNear)" />
        {/* highlight tufts */}
        <Ellipse cx={w * 0.2} cy={h * 0.93} rx={w * 0.12} ry={6} fill="#FFFFFF" opacity={0.14} />
        <Ellipse cx={w * 0.72} cy={h * 0.95} rx={w * 0.1} ry={5} fill="#FFFFFF" opacity={0.12} />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});

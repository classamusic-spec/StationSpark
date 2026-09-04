import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export interface TownSkylineProps {
  height?: number;
  bottom?: number;
  /** hazy blue-grey distance (default) or warmer evening tint */
  mood?: 'day' | 'evening';
  opacity?: number;
}

const BUILDINGS: { x: number; w: number; h: number; roof?: 'flat' | 'pitch' }[] = [
  { x: 4, w: 34, h: 62 },
  { x: 40, w: 24, h: 92, roof: 'flat' },
  { x: 66, w: 30, h: 48, roof: 'pitch' },
  { x: 98, w: 22, h: 78 },
  { x: 122, w: 36, h: 56, roof: 'pitch' },
  { x: 196, w: 28, h: 84 },
  { x: 226, w: 34, h: 60, roof: 'pitch' },
  { x: 262, w: 22, h: 96 },
  { x: 286, w: 30, h: 52 },
];

/**
 * Hazy pastel town on the horizon: blocks of flats, a clock tower and a
 * suspension bridge. Static art (memoized) — it never animates.
 */
export const TownSkyline = memo(function TownSkyline({ height = 120, bottom = 150, mood = 'day', opacity = 0.55 }: TownSkylineProps) {
  const { width } = useWindowDimensions();
  const w = Math.max(340, width);
  const vbW = 340;
  const vbH = 120;
  const base = mood === 'evening' ? '#8C93C8' : '#A9C9E8';
  const light = mood === 'evening' ? '#A7ADDD' : '#C3DCF3';
  const roofTint = mood === 'evening' ? '#7C84BC' : '#93B6DC';

  return (
    <View style={[styles.wrap, { height, bottom }]} pointerEvents="none">
      <Svg width={w} height={height} viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="xMidYMax slice">
        <G opacity={opacity}>
          {BUILDINGS.map((b) => (
            <G key={`b${b.x}`}>
              <Rect x={b.x} y={vbH - b.h} width={b.w} height={b.h} rx={3} fill={b.x % 3 === 0 ? light : base} />
              {b.roof === 'pitch' ? (
                <Path d={`M ${b.x - 3} ${vbH - b.h} L ${b.x + b.w / 2} ${vbH - b.h - 12} L ${b.x + b.w + 3} ${vbH - b.h} Z`} fill={roofTint} />
              ) : null}
              {/* window grid — two columns of soft squares */}
              <Rect x={b.x + 5} y={vbH - b.h + 12} width={6} height={7} rx={1.5} fill="#FFFFFF" opacity={0.42} />
              <Rect x={b.x + b.w - 11} y={vbH - b.h + 12} width={6} height={7} rx={1.5} fill="#FFFFFF" opacity={0.42} />
              <Rect x={b.x + 5} y={vbH - b.h + 26} width={6} height={7} rx={1.5} fill="#FFFFFF" opacity={0.3} />
              <Rect x={b.x + b.w - 11} y={vbH - b.h + 26} width={6} height={7} rx={1.5} fill="#FFFFFF" opacity={0.3} />
            </G>
          ))}

          {/* clock tower */}
          <Rect x={162} y={16} width={26} height={104} rx={4} fill={light} />
          <Path d="M 158 18 L 175 2 L 192 18 Z" fill={roofTint} />
          <Circle cx={175} cy={38} r={9} fill="#FFFFFF" opacity={0.85} />
          <Path d="M 175 38 L 175 33 M 175 38 L 179 40" stroke={base} strokeWidth={1.6} strokeLinecap="round" />

          {/* suspension bridge on the right */}
          <Path d="M 292 96 L 340 96" stroke={base} strokeWidth={4} strokeLinecap="round" />
          <Path d="M 296 96 L 296 70 M 330 96 L 330 70" stroke={base} strokeWidth={3.4} strokeLinecap="round" />
          <Path d="M 292 88 Q 313 62 334 88" stroke={base} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', overflow: 'hidden' },
});

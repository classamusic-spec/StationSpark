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
export const TownSkyline = memo(function TownSkyline({ height = 120, bottom = 150, mood = 'day', opacity = 0.82 }: TownSkylineProps) {
  const { width } = useWindowDimensions();
  const w = Math.max(340, width);
  const vbW = 340;
  const vbH = 120;
  // saturated enough to actually read against the sky — the old pale blue on
  // pale blue was invisible (critique #5).
  const base = mood === 'evening' ? '#6B72AE' : '#7FA9D8';
  const light = mood === 'evening' ? '#828AC4' : '#94BBE2';
  const roofTint = mood === 'evening' ? '#5B62A0' : '#6B93C6';
  const side = 'rgba(31,42,90,0.14)';

  return (
    <View style={[styles.wrap, { height, bottom }]} pointerEvents="none">
      <Svg width={w} height={height} viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="xMidYMax slice">
        <G opacity={opacity}>
          {BUILDINGS.map((b) => (
            <G key={`b${b.x}`}>
              <Rect x={b.x} y={vbH - b.h} width={b.w} height={b.h} rx={3} fill={b.x % 3 === 0 ? light : base} />
              {/* shaded side plane — even at horizon scale a block reads as a solid */}
              <Rect x={b.x + b.w - 7} y={vbH - b.h} width={7} height={b.h} rx={3} fill={side} />
              {b.roof === 'pitch' ? (
                <Path d={`M ${b.x - 3} ${vbH - b.h} L ${b.x + b.w / 2} ${vbH - b.h - 12} L ${b.x + b.w + 3} ${vbH - b.h} Z`} fill={roofTint} />
              ) : null}
              {/* soffit shadow under the roof line */}
              <Rect x={b.x} y={vbH - b.h} width={b.w} height={4} rx={2} fill={side} />
              {/* window grid — two columns of soft squares, each with a sill */}
              <Rect x={b.x + 5} y={vbH - b.h + 12} width={6} height={7} rx={1.5} fill="#FFF6E5" opacity={0.66} />
              <Rect x={b.x + b.w - 11} y={vbH - b.h + 12} width={6} height={7} rx={1.5} fill="#FFF6E5" opacity={0.62} />
              <Rect x={b.x + 5} y={vbH - b.h + 26} width={6} height={7} rx={1.5} fill="#FFF6E5" opacity={0.52} />
              <Rect x={b.x + b.w - 11} y={vbH - b.h + 26} width={6} height={7} rx={1.5} fill="#FFF6E5" opacity={0.48} />
            </G>
          ))}

          {/* clock tower */}
          <Rect x={162} y={16} width={26} height={104} rx={4} fill={light} />
          <Rect x={181} y={18} width={7} height={102} rx={3} fill={side} />
          <Path d="M 158 18 L 175 2 L 192 18 Z" fill={roofTint} />
          <Rect x={162} y={16} width={26} height={4} rx={2} fill={side} />
          <Circle cx={175} cy={38} r={9} fill="#FFF6E5" opacity={0.92} />
          <Path d="M 175 38 L 175 33 M 175 38 L 179 40" stroke={roofTint} strokeWidth={1.6} strokeLinecap="round" />

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

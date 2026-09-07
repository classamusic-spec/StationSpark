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

interface Block {
  x: number;
  w: number;
  h: number;
  /** the roofline is what stops a row reading as one rectangle repeated */
  roof?: 'flat' | 'pitch' | 'step' | 'mansard';
  chimney?: boolean;
  /** a shopfront awning across the ground floor */
  awning?: boolean;
  /** a water tank on the roof */
  tank?: boolean;
}

const BUILDINGS: Block[] = [
  { x: 4, w: 34, h: 62, roof: 'step', chimney: true },
  { x: 40, w: 24, h: 92, roof: 'flat', tank: true },
  { x: 66, w: 30, h: 48, roof: 'pitch', chimney: true, awning: true },
  { x: 98, w: 22, h: 78, roof: 'mansard' },
  { x: 122, w: 36, h: 56, roof: 'pitch', awning: true },
  { x: 196, w: 28, h: 84, roof: 'flat', chimney: true },
  { x: 226, w: 34, h: 60, roof: 'step', awning: true },
  { x: 262, w: 22, h: 96, roof: 'mansard', tank: true },
  { x: 286, w: 30, h: 52, roof: 'pitch', chimney: true },
];

/**
 * Hazy pastel town on the horizon: a terrace of individual houses — stepped
 * gables, mansards, pitched roofs, chimneys, roof tanks and shop awnings — plus
 * a domed hall, a clock tower and a suspension bridge. Static art (memoized),
 * it never animates. Distance is carried by *value*: everything here is one
 * flat tint plus a single darker side, and nothing is crisper than the near
 * world in front of it.
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
  const warm = mood === 'evening' ? '#8A6E9E' : '#8FA2CF';
  const side = 'rgba(31,42,90,0.14)';
  const glass = '#FFF6E5';

  return (
    <View style={[styles.wrap, { height, bottom }]} pointerEvents="none">
      <Svg width={w} height={height} viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="xMidYMax slice">
        <G opacity={opacity}>
          {BUILDINGS.map((b) => {
            const top = vbH - b.h;
            return (
              <G key={`b${b.x}`}>
                <Rect x={b.x} y={top} width={b.w} height={b.h} rx={3} fill={b.x % 3 === 0 ? light : base} />
                {/* shaded side plane — even at horizon scale a block reads as a solid */}
                <Rect x={b.x + b.w - 7} y={top} width={7} height={b.h} rx={3} fill={side} />
                {b.chimney ? (
                  <G>
                    <Rect x={b.x + b.w * 0.66} y={top - 11} width={5} height={13} fill={roofTint} />
                    <Rect x={b.x + b.w * 0.66 - 1.4} y={top - 13} width={8} height={3} rx={1.5} fill={roofTint} />
                  </G>
                ) : null}
                {b.roof === 'pitch' ? (
                  <Path d={`M ${b.x - 3} ${top} L ${b.x + b.w / 2} ${top - 12} L ${b.x + b.w + 3} ${top} Z`} fill={roofTint} />
                ) : null}
                {b.roof === 'step' ? (
                  <G>
                    <Rect x={b.x - 1} y={top - 4} width={b.w + 2} height={5} rx={2} fill={roofTint} />
                    <Rect x={b.x + b.w * 0.18} y={top - 8} width={b.w * 0.64} height={5} rx={2} fill={roofTint} />
                    <Rect x={b.x + b.w * 0.36} y={top - 12} width={b.w * 0.3} height={5} rx={2} fill={roofTint} />
                  </G>
                ) : null}
                {b.roof === 'mansard' ? (
                  <Path d={`M ${b.x - 2} ${top} L ${b.x + b.w * 0.22} ${top - 10} L ${b.x + b.w * 0.78} ${top - 10} L ${b.x + b.w + 2} ${top} Z`} fill={roofTint} />
                ) : null}
                {b.roof === 'flat' ? <Rect x={b.x - 2} y={top - 4} width={b.w + 4} height={5} rx={2} fill={roofTint} /> : null}
                {b.tank ? (
                  <G>
                    <Rect x={b.x + b.w * 0.24} y={top - 20} width={b.w * 0.5} height={9} rx={3} fill={warm} />
                    <Rect x={b.x + b.w * 0.3} y={top - 11} width={2.4} height={7} fill={warm} />
                    <Rect x={b.x + b.w * 0.62} y={top - 11} width={2.4} height={7} fill={warm} />
                  </G>
                ) : null}
                {/* soffit shadow under the roof line */}
                <Rect x={b.x} y={top} width={b.w} height={4} rx={2} fill={side} />
                {/* window grid — two columns of soft squares, each with a sill */}
                <Rect x={b.x + 5} y={top + 12} width={6} height={7} rx={1.5} fill={glass} opacity={0.66} />
                <Rect x={b.x + b.w - 11} y={top + 12} width={6} height={7} rx={1.5} fill={glass} opacity={0.62} />
                <Rect x={b.x + 5} y={top + 26} width={6} height={7} rx={1.5} fill={glass} opacity={0.52} />
                <Rect x={b.x + b.w - 11} y={top + 26} width={6} height={7} rx={1.5} fill={glass} opacity={0.48} />
                {b.awning ? (
                  <G>
                    <Path d={`M ${b.x + 2} ${vbH - 16} h ${b.w - 4} l -2 6 h ${-(b.w - 8)} z`} fill={warm} />
                    <Rect x={b.x + 4} y={vbH - 22} width={b.w - 8} height={5} rx={2} fill={glass} opacity={0.55} />
                  </G>
                ) : (
                  <Rect x={b.x + b.w * 0.34} y={vbH - 14} width={b.w * 0.32} height={14} rx={2} fill={side} />
                )}
              </G>
            );
          })}

          {/* the domed hall on the corner, just left of the tower */}
          <G>
            <Rect x={132} y={78} width={28} height={42} rx={3} fill={light} />
            <Path d="M 130 78 a 16 15 0 0 1 32 0 z" fill={roofTint} />
            <Rect x={144.8} y={52} width={2.4} height={9} fill={roofTint} />
            <Rect x={153} y={78} width={7} height={42} rx={3} fill={side} />
            <Rect x={140} y={92} width={12} height={10} rx={2} fill={glass} opacity={0.5} />
          </G>

          {/* clock tower */}
          <Rect x={162} y={16} width={26} height={104} rx={4} fill={light} />
          <Rect x={181} y={18} width={7} height={102} rx={3} fill={side} />
          <Path d="M 158 18 L 175 2 L 192 18 Z" fill={roofTint} />
          <Rect x={162} y={16} width={26} height={4} rx={2} fill={side} />
          <Circle cx={175} cy={38} r={9} fill={glass} opacity={0.92} />
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

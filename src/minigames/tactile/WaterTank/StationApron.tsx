/**
 * THE YARD THE ENGINE IS PARKED ON.
 *
 * `PlayGround` gives Water Tank its concrete; on its own that is a flat grey
 * band with an engine standing in the middle of it and nothing else happening
 * anywhere — the "empty band" defect, right under the thing the child is
 * looking at. This is the dressing that turns it into a station apron:
 *
 *   the painted parking bay the engine is standing in · expansion joints in
 *   the slab · a gully and its grate · a puddle from the last drill · a wheel
 *   chock · a coil of spare hose against the near edge.
 *
 * All of it is scenery: `pointerEvents` none, no touch targets, one light from
 * the upper left, and every solid object gets its navy contact ellipse.
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { HILITE, HILITE_SOFT, SHADE, SHADE_DEEP, SHADE_SOFT } from '../shared';

export interface StationApronProps {
  width: number;
  height: number;
  /** y of the ground line inside the play area */
  groundY: number;
  scale: number;
}

export const StationApron = memo(function StationApron({ width, height, groundY, scale }: StationApronProps) {
  const s = Math.max(0.7, Math.min(1.7, scale));
  const depth = Math.max(18, height - groundY);
  /** how far down the apron a thing sits, 0 at the ground line, 1 at the foot */
  const at = (f: number) => groundY + depth * f;
  const bayTop = at(0.12);
  const bayBottom = at(0.94);
  /* the coil stands wholly on the apron: at 0.93 of the width it was sliced in
     half by the frame, which reads as a bug rather than as the yard going on */
  const coilX = width - Math.max(34, 30 * s);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* the painted bay: two side lines that converge slightly, so the slab
          reads as a floor going away from us rather than as a flat wall */}
      <G opacity={0.55}>
        <Path
          d={`M ${width * 0.09} ${bayBottom} L ${width * 0.15} ${bayTop} h ${6 * s} L ${width * 0.115} ${bayBottom} z`}
          fill={palette.safetyYellow}
        />
        <Path
          d={`M ${width * 0.91} ${bayBottom} L ${width * 0.85} ${bayTop} h ${-6 * s} L ${width * 0.885} ${bayBottom} z`}
          fill={palette.safetyYellow}
        />
        <Rect x={width * 0.15} y={bayTop} width={width * 0.7} height={5 * s} rx={2.5 * s} fill={palette.safetyYellow} />
      </G>

      {/* expansion joints, so the concrete is slabs and not one grey field */}
      {[0.22, 0.52, 0.78].map((f) => (
        <Path
          key={f}
          d={`M ${width * f - depth * 0.12} ${at(0.06)} L ${width * f + depth * 0.1} ${at(1)}`}
          stroke={SHADE_SOFT}
          strokeWidth={Math.max(1.4, 2 * s)}
          strokeLinecap="round"
        />
      ))}
      <Path
        d={`M 0 ${at(0.46)} Q ${width / 2} ${at(0.4)} ${width} ${at(0.46)}`}
        stroke={SHADE_SOFT}
        strokeWidth={Math.max(1.2, 1.8 * s)}
        fill="none"
      />

      {/* the gully the wash-down water runs into */}
      <G>
        <Rect x={width * 0.06} y={at(0.58)} width={Math.max(30, 46 * s)} height={Math.max(11, 15 * s)} rx={4 * s} fill="#9AA4C0" />
        <Rect x={width * 0.06} y={at(0.58)} width={Math.max(30, 46 * s)} height={Math.max(3, 4 * s)} rx={2 * s} fill={HILITE_SOFT} />
        {[0, 1, 2, 3].map((i) => (
          <Rect
            key={i}
            x={width * 0.06 + (5 + i * 10) * s}
            y={at(0.58) + 4.5 * s}
            width={4 * s}
            height={Math.max(5, 8 * s)}
            rx={2 * s}
            fill={SHADE_DEEP}
          />
        ))}
      </G>

      {/* a puddle from the last drill, with the sky in it */}
      <G>
        <Ellipse cx={width * 0.72} cy={at(0.74)} rx={Math.max(34, 58 * s)} ry={Math.max(8, 13 * s)} fill={palette.waterCyanLight} opacity={0.55} />
        <Ellipse cx={width * 0.69} cy={at(0.7)} rx={Math.max(12, 20 * s)} ry={Math.max(2.6, 4 * s)} fill={palette.white} opacity={0.6} />
      </G>

      {/* a wheel chock, because an engine on an apron has one */}
      <G>
        <Ellipse cx={width * 0.3} cy={at(0.9) + 3 * s} rx={16 * s} ry={4 * s} fill={palette.navy} opacity={0.12} />
        <Path
          d={`M ${width * 0.3 - 15 * s} ${at(0.9)} h ${26 * s} l ${-8 * s} ${-13 * s} h ${-10 * s} z`}
          fill={palette.safetyYellow}
        />
        <Path d={`M ${width * 0.3 - 15 * s} ${at(0.9)} h ${8 * s} l ${5 * s} ${-13 * s} h ${-5 * s} z`} fill={HILITE} />
        <Rect x={width * 0.3 - 16 * s} y={at(0.9) - 3 * s} width={28 * s} height={4 * s} rx={2 * s} fill={SHADE} />
      </G>

      {/* the spare hose, coiled on the near edge of the apron */}
      <G>
        <Ellipse cx={coilX} cy={at(0.9) + 3 * s} rx={26 * s} ry={7 * s} fill={palette.navy} opacity={0.12} />
        {[1, 0.72, 0.46].map((k, i) => (
          <Ellipse
            key={k}
            cx={coilX}
            cy={at(0.9) - i * 4.5 * s}
            rx={24 * s * k}
            ry={8 * s * k}
            fill={i % 2 === 0 ? palette.engineRed : palette.engineRedDark}
          />
        ))}
        <Path
          d={`M ${coilX - 22 * s} ${at(0.9) - 11 * s} a ${22 * s} ${7 * s} 0 0 1 ${19 * s} ${-4 * s}`}
          stroke={HILITE}
          strokeWidth={Math.max(1.6, 2.4 * s)}
          fill="none"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
});

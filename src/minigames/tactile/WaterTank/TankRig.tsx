/**
 * THE HARDWARE THAT MAKES THE TANK PART OF THE ENGINE.
 *
 * `TankShell` (src/world/props) draws the glass. On its own that reads as a
 * measuring jug someone left on a truck — which is exactly what the art
 * critique said. These are the fittings a booster tank actually has, drawn
 * around the glass so the two read as one object bolted to the load deck:
 *
 *   a welded cradle it sits in · two steel retaining bands with rivets ·
 *   a hinged filler cap on top · a pressure gauge on the front band ·
 *   an outlet valve and the feed pipe from the pump lever.
 *
 * Nothing here is interactive and nothing here restates the task: the fill line
 * and the target flag stay on the glass, where the child is looking.
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { HILITE, SHADE, SHADE_DEEP, SHEEN } from '../shared';

export interface TankRigProps {
  width: number;
  height: number;
  /** 0..1 — where the needle sits, so the gauge tells the truth */
  fill: number;
}

/** Drawn behind the glass: the welded cradle the tank stands in. */
export const TankCradle = memo(function TankCradle({ width, height }: { width: number; height: number }) {
  const s = Math.max(0.6, width / 160);
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={-6 * s} y={height - 20 * s} width={width + 12 * s} height={20 * s} rx={6 * s} fill={palette.charcoal} />
      <Rect x={-6 * s} y={height - 20 * s} width={width + 12 * s} height={6 * s} rx={3 * s} fill={HILITE} />
      {[0.1, 0.5, 0.9].map((f) => (
        <Rect key={f} x={width * f - 5 * s} y={height - 34 * s} width={10 * s} height={18 * s} rx={4 * s} fill={palette.charcoalDark} />
      ))}
    </Svg>
  );
});

/** Drawn over the glass: bands, rivets, cap, gauge, outlet. */
export const TankRig = memo(function TankRig({ width, height, fill }: TankRigProps) {
  const s = Math.max(0.6, width / 160);
  const bandH = Math.max(9, 13 * s);
  const bands = [height * 0.24, height * 0.68];
  const rivets = Math.max(3, Math.round(width / (18 * s)));
  const needle = -125 + Math.max(0, Math.min(1, fill)) * 250;
  const gx = width * 0.78;
  const gy = height * 0.86;
  const gr = Math.max(11, 17 * s);

  return (
    <Svg width={width} height={height + 26 * s} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* steel retaining bands, each with a rivet line */}
      {bands.map((y, bi) => (
        <G key={bi}>
          <Rect x={-4 * s} y={y} width={width + 8 * s} height={bandH} rx={bandH / 2} fill={palette.slate} />
          <Rect x={-4 * s} y={y} width={width + 8 * s} height={bandH * 0.38} rx={bandH * 0.19} fill={HILITE} />
          <Rect x={-4 * s} y={y + bandH * 0.7} width={width + 8 * s} height={bandH * 0.3} rx={bandH * 0.15} fill={SHADE} />
          {Array.from({ length: rivets }, (_, i) => (
            <Circle
              key={i}
              cx={(width / rivets) * (i + 0.5)}
              cy={y + bandH / 2}
              r={Math.max(1.6, 2.4 * s)}
              fill={palette.slateLight}
            />
          ))}
          {/* the buckle on the shaded side */}
          <Rect x={width - 20 * s} y={y - 2 * s} width={13 * s} height={bandH + 4 * s} rx={3 * s} fill={palette.charcoal} />
          <Rect x={width - 18 * s} y={y} width={4 * s} height={bandH} rx={2 * s} fill={HILITE} />
        </G>
      ))}

      {/* hinged filler cap, seated on the tank's crown */}
      <G>
        <Ellipse cx={width * 0.34} cy={15 * s} rx={19 * s} ry={7 * s} fill={palette.slate} />
        <Ellipse cx={width * 0.34} cy={11 * s} rx={19 * s} ry={7 * s} fill={palette.slateLight} />
        <Ellipse cx={width * 0.34} cy={10 * s} rx={12 * s} ry={4.4 * s} fill={palette.slate} />
        <Path d={`M ${width * 0.34 - 12 * s} ${9 * s} q ${12 * s} ${-5 * s} ${24 * s} 0`} stroke={SHEEN} strokeWidth={2 * s} fill="none" />
        <Rect x={width * 0.34 + 17 * s} y={7 * s} width={9 * s} height={8 * s} rx={3 * s} fill={palette.charcoal} />
      </G>

      {/* pressure gauge — it reads what the tank holds, nothing else */}
      <G>
        <Circle cx={gx} cy={gy} r={gr + 3 * s} fill={palette.charcoal} />
        <Circle cx={gx} cy={gy} r={gr} fill={palette.cream} />
        <Path d={`M ${gx - gr * 0.7} ${gy - gr * 0.5} a ${gr} ${gr} 0 0 1 ${gr * 1.4} 0`} stroke={SHADE} strokeWidth={1.6 * s} fill="none" />
        {[-125, -62, 0, 62, 125].map((a) => {
          const r = (a * Math.PI) / 180;
          return (
            <Line
              key={a}
              x1={gx + Math.sin(r) * gr * 0.62}
              y1={gy - Math.cos(r) * gr * 0.62}
              x2={gx + Math.sin(r) * gr * 0.82}
              y2={gy - Math.cos(r) * gr * 0.82}
              stroke={palette.navySoft}
              strokeWidth={1.8 * s}
              strokeLinecap="round"
            />
          );
        })}
        <Path
          d={`M ${gx} ${gy} L ${gx + Math.sin((needle * Math.PI) / 180) * gr * 0.72} ${gy - Math.cos((needle * Math.PI) / 180) * gr * 0.72}`}
          stroke={palette.engineRed}
          strokeWidth={2.4 * s}
          strokeLinecap="round"
        />
        <Circle cx={gx} cy={gy} r={Math.max(1.8, 2.6 * s)} fill={palette.navy} />
        <Path d={`M ${gx - gr * 0.6} ${gy - gr * 0.6} a ${gr} ${gr} 0 0 1 ${gr * 0.5} ${-gr * 0.2}`} stroke={SHEEN} strokeWidth={2.2 * s} fill="none" strokeLinecap="round" />
      </G>

      {/* outlet valve at the foot, where the water would actually leave */}
      <G>
        <Rect x={width * 0.1} y={height - 16 * s} width={16 * s} height={11 * s} rx={4 * s} fill={palette.slate} />
        <Rect x={width * 0.1} y={height - 16 * s} width={16 * s} height={3.4 * s} rx={1.7 * s} fill={HILITE} />
        <Circle cx={width * 0.1 + 8 * s} cy={height - 22 * s} r={6 * s} fill={palette.engineRed} />
        <Circle cx={width * 0.1 + 8 * s} cy={height - 22 * s} r={2.6 * s} fill={SHADE_DEEP} />
      </G>
    </Svg>
  );
});

/**
 * THE STREET AROUND THE BURNING WINDOW.
 *
 * `BuildingFacade` (src/world/props) draws the shop itself. What Hose Hero was
 * missing is everything *around* it: the block it stands in, and the pavement
 * the child is standing on. Two layers, both scenery, both `pointerEvents`
 * none, and both deliberately quieter than the flames — nothing here may
 * compete with the thing a child has to aim at.
 *
 *   `NeighbourBlock` goes BEHIND the façade and fills the sky either side of
 *   the roof with the rest of the street, hazed back so it stays distant.
 *   `StreetApron` goes in FRONT and gives the pavement a kerb, a drain, a
 *   puddle and the hose coil the jet is fed from.
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import type { FacadeLayout } from '@/world/props';
import { HILITE, HILITE_SOFT, SHADE, SHADE_DEEP, SHADE_SOFT } from '../shared';

/** One hazed 2.5D neighbour, standing on the same pavement line. */
function block(x: number, w: number, top: number, gy: number, wall: string, roof: string, key: string, chimney: boolean) {
  const side = Math.max(8, w * 0.1);
  const front = w - side;
  const rows = Math.max(1, Math.floor((gy - top - 40) / 62));
  const wins: React.ReactElement[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < 2; c += 1) {
      const wx = x + front * (0.22 + c * 0.4);
      const wy = top + 40 + r * 62;
      if (wy + 26 > gy - 20 || wx + front * 0.22 > x + front) continue;
      wins.push(
        <G key={`${key}w${r}${c}`}>
          <Rect x={wx} y={wy} width={front * 0.22} height={26} rx={5} fill="#33477A" />
          <Path d={`M ${wx + 2} ${wy + 24} L ${wx + front * 0.11} ${wy + 2} L ${wx + front * 0.16} ${wy + 2} L ${wx + front * 0.07} ${wy + 24} Z`} fill={palette.white} opacity={0.2} />
          <Rect x={wx - 3} y={wy + 27} width={front * 0.22 + 6} height={4} rx={2} fill={SHADE} />
        </G>,
      );
    }
  }
  return (
    <G key={key}>
      <Path d={`M ${x + front} ${top + 8} L ${x + w} ${top + 18} L ${x + w} ${gy} L ${x + front} ${gy} Z`} fill={wall} />
      <Path d={`M ${x + front} ${top + 8} L ${x + w} ${top + 18} L ${x + w} ${gy} L ${x + front} ${gy} Z`} fill={SHADE} />
      <Rect x={x} y={top + 8} width={front} height={gy - top - 8} rx={6} fill={wall} />
      <Rect x={x} y={top + 8} width={front * 0.14} height={gy - top - 8} fill={HILITE_SOFT} />
      <Rect x={x - 7} y={top} width={w + 12} height={15} rx={7} fill={roof} />
      <Rect x={x - 7} y={top + 10} width={w + 12} height={6} rx={3} fill={SHADE} />
      <Rect x={x - 3} y={top + 1} width={w * 0.46} height={4} rx={2} fill={HILITE} />
      {chimney ? (
        <G>
          <Rect x={x + front * 0.6} y={top - 26} width={20} height={28} rx={4} fill={wall} />
          <Rect x={x + front * 0.6} y={top - 26} width={7} height={28} fill={HILITE_SOFT} />
          <Rect x={x + front * 0.6 - 4} y={top - 31} width={28} height={8} rx={3} fill={roof} />
        </G>
      ) : null}
      {wins}
      <Rect x={x} y={gy - 26} width={front} height={26} rx={5} fill={SHADE_SOFT} />
    </G>
  );
}

/** The rest of the block, hazed back behind the burning shop. */
export const NeighbourBlock = memo(function NeighbourBlock({
  width,
  height,
  layout,
}: {
  width: number;
  height: number;
  layout: FacadeLayout;
}) {
  const { box, roof, groundY, u } = layout;
  const top = Math.max(4, roof.y - u * 1.6);
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <G opacity={0.52}>
        {block(-26, Math.max(70, box.x + box.w * 0.3 + 26), top + u * 0.5, groundY, '#CBD6EA', '#8E9BBE', 'nl', true)}
        {block(box.x + box.w * 0.7, Math.max(70, width - box.x - box.w * 0.7 + 26), top, groundY, '#D6DCEC', '#98A4C4', 'nr', false)}
      </G>
      {/* the haze that keeps them in the distance */}
      <Rect x={0} y={Math.max(0, groundY - u * 5)} width={width} height={u * 5} fill={palette.skyBottom} opacity={0.3} />
    </Svg>
  );
});

/** Kerb, drain, puddle and the coiled hose the jet is fed from. */
export const StreetApron = memo(function StreetApron({
  width,
  height,
  groundY,
  u,
  nozzle,
}: {
  width: number;
  height: number;
  groundY: number;
  u: number;
  nozzle: { x: number; y: number };
}) {
  const kerbY = groundY + u * 1.5;
  const edge = (y: number) => `M -20 ${y + 5} Q ${width / 2} ${y - 5} ${width + 20} ${y + 5}`;
  const coil = Math.max(20, u * 1.5);
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* kerb: a pale slab with a shaded lip, the one hard line on the street */}
      <Path d={`${edge(kerbY)} L ${width + 20} ${kerbY + u * 0.85} Q ${width / 2} ${kerbY + u * 0.85 - 5} -20 ${kerbY + u * 0.85} Z`} fill="#E8ECF6" />
      <Path d={`${edge(kerbY + u * 0.85)} L ${width + 20} ${kerbY + u * 1.2} Q ${width / 2} ${kerbY + u * 1.2 - 5} -20 ${kerbY + u * 1.2} Z`} fill={SHADE} />
      {/* paving joints */}
      {[0.2, 0.46, 0.72].map((f) => (
        <Path key={f} d={`M ${width * f} ${groundY + u * 0.3} l ${-u * 0.3} ${u * 1.1}`} stroke={SHADE_SOFT} strokeWidth={Math.max(1.4, u * 0.1)} strokeLinecap="round" />
      ))}
      {/* a drain, because a street has one */}
      <G>
        <Rect x={width * 0.66} y={kerbY + u * 1.5} width={u * 2.4} height={u * 1.1} rx={u * 0.35} fill="#9AA4C0" />
        {[0, 1, 2].map((i) => (
          <Rect key={i} x={width * 0.66 + u * 0.35 + i * u * 0.65} y={kerbY + u * 1.72} width={u * 0.28} height={u * 0.68} rx={u * 0.14} fill={SHADE_DEEP} />
        ))}
      </G>
      {/* a puddle from the last drill */}
      <Ellipse cx={width * 0.42} cy={kerbY + u * 2.1} rx={u * 3} ry={u * 0.7} fill={palette.waterCyanLight} opacity={0.5} />
      <Ellipse cx={width * 0.38} cy={kerbY + u * 2} rx={u * 1.1} ry={u * 0.24} fill={palette.white} opacity={0.55} />
      {/* the hose coil the jet comes out of */}
      <G>
        <Ellipse cx={nozzle.x} cy={nozzle.y + coil * 0.5} rx={coil * 1.15} ry={coil * 0.34} fill={palette.navy} opacity={0.12} />
        {[1, 0.72, 0.46].map((k, i) => (
          <Ellipse
            key={i}
            cx={nozzle.x}
            cy={nozzle.y + coil * 0.3 - i * coil * 0.13}
            rx={coil * k}
            ry={coil * k * 0.34}
            fill={i % 2 === 0 ? palette.engineRed : palette.engineRedDark}
          />
        ))}
        <Ellipse cx={nozzle.x} cy={nozzle.y - coil * 0.02} rx={coil * 0.4} ry={coil * 0.14} fill={SHADE_DEEP} />
        <Path d={`M ${nozzle.x - coil} ${nozzle.y + coil * 0.28} a ${coil} ${coil * 0.34} 0 0 1 ${coil * 0.8} ${-coil * 0.28}`} stroke={HILITE} strokeWidth={Math.max(1.6, coil * 0.1)} fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  );
});

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
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
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
      {/* the same daylight wash the shop in front of them carries: without it a
          neighbour is a flat swatch and the block behind the fire has no depth */}
      <Rect x={x} y={top + 8} width={front} height={gy - top - 8} rx={6} fill="url(#ss-neighbour-sky)" />
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
      <Defs>
        <LinearGradient id="ss-neighbour-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.26} />
          <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.02} />
          <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0.12} />
        </LinearGradient>
      </Defs>
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
  shopX = 0,
  shopW = 0,
}: {
  width: number;
  height: number;
  groundY: number;
  u: number;
  nozzle: { x: number; y: number };
  /** the shop's footprint, so the pavement carries the building's shadow */
  shopX?: number;
  shopW?: number;
}) {
  /* The pavement is only as deep as the play area left it — on a phone that is
     about 70 px. Dressing placed at fixed multiples of a wall unit fell clean
     off the bottom of the frame and none of it was ever seen, so everything
     here is placed at a FRACTION of the depth that actually exists. */
  const depth = Math.max(24, height - groundY);
  const at = (f: number) => groundY + depth * f;
  const kerbY = at(0.34);
  const edge = (y: number) => `M -20 ${y + 5} Q ${width / 2} ${y - 5} ${width + 20} ${y + 5}`;
  const coil = Math.max(18, Math.min(u * 1.4, depth * 0.3));
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* the shop's own shadow, cast down the pavement away from the light */}
      {shopW > 0 ? (
        <Path
          d={`M ${shopX + u * 0.4} ${groundY} L ${shopX + shopW + u * 1.6} ${groundY} L ${shopX + shopW + u * 2.6} ${groundY + u * 1.15} L ${shopX + u * 1.3} ${groundY + u * 1.15} Z`}
          fill={palette.navy}
          opacity={0.09}
        />
      ) : null}
      {/* kerb: a pale slab with a shaded lip, the one hard line on the street */}
      <Path d={`${edge(kerbY)} L ${width + 20} ${at(0.48)} Q ${width / 2} ${at(0.48) - 5} -20 ${at(0.48)} Z`} fill="#E8ECF6" />
      <Path d={`${edge(at(0.48))} L ${width + 20} ${at(0.56)} Q ${width / 2} ${at(0.56) - 5} -20 ${at(0.56)} Z`} fill={SHADE} />
      {/* paving joints across the slab in front of the shop */}
      {[0.2, 0.46, 0.72].map((f) => (
        <Path
          key={f}
          d={`M ${width * f} ${at(0.06)} l ${-depth * 0.1} ${depth * 0.26}`}
          stroke={SHADE_SOFT}
          strokeWidth={Math.max(1.4, u * 0.1)}
          strokeLinecap="round"
        />
      ))}
      {/* the painted fire lane — flat markings give the slab a direction and
          stop it reading as one grey band */}
      <G opacity={0.45}>
        <Rect x={0} y={at(0.62)} width={width} height={Math.max(2, depth * 0.028)} fill={palette.safetyYellow} />
        {[0.08, 0.28, 0.48, 0.68, 0.88].map((f) => (
          <Path
            key={f}
            d={`M ${width * f} ${at(0.66)} l ${-depth * 0.16} ${depth * 0.2} h ${depth * 0.1} l ${depth * 0.16} ${-depth * 0.2} z`}
            fill={palette.safetyYellow}
          />
        ))}
      </G>
      {/* a gully at the kerb, because a street has one */}
      <G>
        <Rect x={width * 0.64} y={at(0.72)} width={Math.max(24, depth * 0.42)} height={Math.max(8, depth * 0.15)} rx={depth * 0.05} fill="#9AA4C0" />
        {[0, 1, 2].map((i) => (
          <Rect
            key={i}
            x={width * 0.64 + depth * (0.06 + i * 0.11)}
            y={at(0.745)}
            width={Math.max(2.4, depth * 0.045)}
            height={Math.max(4, depth * 0.1)}
            rx={depth * 0.02}
            fill={SHADE_DEEP}
          />
        ))}
      </G>
      {/* a manhole cover in the middle of the slab */}
      <G>
        <Ellipse cx={width * 0.3} cy={at(0.9)} rx={depth * 0.22} ry={depth * 0.07} fill="#8F99B4" />
        <Ellipse cx={width * 0.3} cy={at(0.875)} rx={depth * 0.22} ry={depth * 0.07} fill="#9AA4C0" />
        <Ellipse cx={width * 0.3} cy={at(0.87)} rx={depth * 0.15} ry={depth * 0.045} fill={SHADE_SOFT} />
        <Path
          d={`M ${width * 0.3 - depth * 0.16} ${at(0.845)} a ${depth * 0.18} ${depth * 0.06} 0 0 1 ${depth * 0.2} ${-depth * 0.022}`}
          stroke={HILITE}
          strokeWidth={Math.max(1.2, depth * 0.016)}
          fill="none"
          strokeLinecap="round"
        />
      </G>
      {/* a puddle from the last drill */}
      <Ellipse cx={width * 0.52} cy={at(0.86)} rx={depth * 0.58} ry={depth * 0.11} fill={palette.waterCyanLight} opacity={0.5} />
      <Ellipse cx={width * 0.47} cy={at(0.83)} rx={depth * 0.2} ry={depth * 0.04} fill={palette.white} opacity={0.55} />
      {/* the hose coil the jet comes out of */}
      <G>
        <Ellipse cx={nozzle.x} cy={nozzle.y + coil * 0.5} rx={coil * 1.15} ry={coil * 0.3} fill={palette.navy} opacity={0.12} />
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

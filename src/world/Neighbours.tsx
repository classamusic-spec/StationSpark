/**
 * NEIGHBOURS — the rest of the block, kept deliberately quiet.
 *
 * This band used to be a wall of near-identical canopies stacked directly
 * behind the firehouse; nine tree blobs and two buildings all shouting at the
 * same volume, which is what made the home screen hard to read. It is now a
 * *midground*: a handful of hazed, low-contrast buildings placed outside the
 * station's silhouette, so the eye goes station → Start Shift and the block
 * only tells you the firehouse is on a street.
 *
 * Everything here is drawn one value step paler and cooler than the near
 * world, then washed with sky, which is how distance reads without blur.
 * Nothing is placed inside `clear` — the station covers that anyway, and art
 * hidden behind a building is just noise waiting for a wider screen.
 */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { HIGHLIGHT, SHADE, SHADE_DEEP } from './tone';

interface Tone {
  wallTop: string;
  wallBottom: string;
  roof: string;
  roofDark: string;
  glass: string;
  tower: string;
  towerTop: string;
  dome: string;
  leaf: string;
  leafBack: string;
  trunk: string;
  haze: string;
  hazeOpacity: number;
}

const TONES: Record<'day' | 'evening', Tone> = {
  day: {
    wallTop: '#F4E8D0',
    wallBottom: '#E4D4B4',
    roof: '#D9806F',
    roofDark: '#BC685A',
    glass: '#8FB1D9',
    tower: '#D5E2F2',
    towerTop: '#E8F0FA',
    dome: '#AEC6E4',
    leaf: '#7CBC79',
    leafBack: '#5FA164',
    trunk: '#A98A6B',
    haze: '#BDE7FF',
    hazeOpacity: 0.3,
  },
  evening: {
    wallTop: '#DCCDB8',
    wallBottom: '#C6B69C',
    roof: '#B26A5F',
    roofDark: '#95544C',
    glass: '#FFD98A',
    tower: '#BAC6DC',
    towerTop: '#CBD6E8',
    dome: '#93A6C6',
    leaf: '#5E8F63',
    leafBack: '#456F4E',
    trunk: '#836B54',
    haze: '#9FA9D8',
    hazeOpacity: 0.34,
  },
};

/* ── the three pieces of the block ────────────────────────────────── *
 * Each is drawn with its origin on the ground line, growing upwards, so a
 * caller only has to say where the pavement is.
 */

/** A two-storey shop terrace: awning, sill, shopfront, chimney. */
function Shop({ x, ground, h, t }: { x: number; ground: number; h: number; t: Tone }) {
  const w = h * 0.86;
  const wall = h * 0.78;
  const winW = w * 0.24;
  const winH = wall * 0.26;
  const winY = -wall * 0.78;
  return (
    <G transform={`translate(${x} ${ground})`}>
      {/* the side plane, receding away from the light */}
      <Path d={`M ${w} ${-wall} L ${w + h * 0.09} ${-wall + h * 0.06} L ${w + h * 0.09} 0 L ${w} 0 Z`} fill={t.wallBottom} />
      <Path d={`M ${w} ${-wall} L ${w + h * 0.09} ${-wall + h * 0.06} L ${w + h * 0.09} 0 L ${w} 0 Z`} fill={SHADE} />
      <Rect x={0} y={-wall} width={w} height={wall} rx={h * 0.02} fill="url(#nbWall)" />
      {/* roof + the soffit shadow it drops on the wall */}
      <Path d={`M ${-h * 0.07} ${-wall + h * 0.03} L ${w * 0.5} ${-h} L ${w + h * 0.13} ${-wall + h * 0.03} Z`} fill={t.roofDark} />
      <Path d={`M ${-h * 0.05} ${-wall} L ${w * 0.5} ${-h + h * 0.035} L ${w + h * 0.11} ${-wall} Z`} fill={t.roof} />
      <Rect x={0} y={-wall} width={w} height={h * 0.045} fill={SHADE} />
      {/* chimney */}
      <Rect x={w * 0.7} y={-h * 0.94} width={h * 0.07} height={h * 0.16} rx={2} fill={t.roofDark} />
      {/* two upstairs windows with sills */}
      {[w * 0.16, w * 0.6].map((wx) => (
        <G key={wx}>
          <Rect x={wx - 1.5} y={winY - 1.5} width={winW + 3} height={winH + 3} rx={3} fill={SHADE_DEEP} />
          <Rect x={wx} y={winY} width={winW} height={winH} rx={2.5} fill={t.glass} />
          <Path d={`M ${wx} ${winY + winH * 0.66} L ${wx + winW * 0.6} ${winY} L ${wx + winW} ${winY} L ${wx + winW} ${winY + winH * 0.2} L ${wx + winW * 0.3} ${winY + winH} L ${wx} ${winY + winH} Z`} fill={HIGHLIGHT} />
          <Rect x={wx - 3} y={winY + winH} width={winW + 6} height={3} rx={1.5} fill={t.wallTop} />
        </G>
      ))}
      {/* the shopfront: an awning, a window and a door */}
      <Rect x={-h * 0.02} y={-wall * 0.42} width={w + h * 0.04} height={h * 0.05} rx={h * 0.02} fill={t.roof} />
      <Rect x={-h * 0.02} y={-wall * 0.42 + h * 0.032} width={w + h * 0.04} height={h * 0.018} fill={SHADE} />
      <Rect x={w * 0.08} y={-wall * 0.34} width={w * 0.46} height={wall * 0.34} rx={3} fill={t.glass} />
      <Path d={`M ${w * 0.08} ${-wall * 0.06} L ${w * 0.4} ${-wall * 0.34} L ${w * 0.54} ${-wall * 0.34} L ${w * 0.22} ${-wall * 0.06} Z`} fill={HIGHLIGHT} />
      <Path d={`M ${w * 0.64} 0 L ${w * 0.64} ${-wall * 0.28} A ${w * 0.11} ${w * 0.11} 0 0 1 ${w * 0.86} ${-wall * 0.28} L ${w * 0.86} 0 Z`} fill={t.trunk} />
      <Path d={`M ${w * 0.75} 0 L ${w * 0.75} ${-wall * 0.32} A ${w * 0.11} ${w * 0.11} 0 0 1 ${w * 0.86} ${-wall * 0.28} L ${w * 0.86} 0 Z`} fill={SHADE} />
    </G>
  );
}

/** The domed civic tower — the block's one tall note. */
function Tower({ x, ground, h, t }: { x: number; ground: number; h: number; t: Tone }) {
  const w = h * 0.36;
  const shaft = h * 0.78;
  /** the dome's control point, solved so its crown actually lands on -h */
  const crown = shaft - 2 * h;
  return (
    <G transform={`translate(${x} ${ground})`}>
      <Rect x={0} y={-shaft} width={w} height={shaft} rx={h * 0.016} fill="url(#nbTower)" />
      <Rect x={w * 0.7} y={-shaft} width={w * 0.3} height={shaft} fill={SHADE} />
      <Path d={`M ${-w * 0.1} ${-shaft} Q ${w * 0.5} ${crown} ${w * 1.1} ${-shaft} Z`} fill={t.dome} />
      <Path d={`M ${w * 0.5} ${-h} Q ${w * 0.95} ${-h * 0.9} ${w * 1.1} ${-shaft} L ${w * 0.5} ${-shaft} Z`} fill={SHADE} />
      <Rect x={w * 0.43} y={-h - h * 0.07} width={w * 0.14} height={h * 0.08} rx={w * 0.07} fill={t.dome} />
      <Circle cx={w * 0.5} cy={-h - h * 0.085} r={w * 0.11} fill={t.towerTop} />
      <Rect x={0} y={-shaft} width={w} height={h * 0.03} fill={SHADE} />
      {/* two window bands and the string courses between them */}
      {[0.68, 0.42].map((f) => (
        <G key={f}>
          <Rect x={w * 0.28} y={-shaft * f} width={w * 0.44} height={shaft * 0.16} rx={w * 0.1} fill={t.glass} />
          <Path d={`M ${w * 0.28} ${-shaft * f + shaft * 0.13} L ${w * 0.56} ${-shaft * f} L ${w * 0.72} ${-shaft * f} L ${w * 0.44} ${-shaft * f + shaft * 0.16} Z`} fill={HIGHLIGHT} />
        </G>
      ))}
      <Rect x={-w * 0.06} y={-shaft * 0.76} width={w * 1.12} height={h * 0.022} rx={h * 0.011} fill={t.towerTop} />
      <Rect x={-w * 0.06} y={-shaft * 0.5} width={w * 1.12} height={h * 0.022} rx={h * 0.011} fill={t.towerTop} />
      <Path d={`M ${w * 0.3} 0 L ${w * 0.3} ${-shaft * 0.2} A ${w * 0.2} ${w * 0.2} 0 0 1 ${w * 0.7} ${-shaft * 0.2} L ${w * 0.7} 0 Z`} fill={t.trunk} />
    </G>
  );
}

/** A street lamp, standing at the back of the footpath to bookend the block. */
function Lamp({ x, ground, h, t, flip = false }: { x: number; ground: number; h: number; t: Tone; flip?: boolean }) {
  const s = flip ? -1 : 1;
  const arm = h * 0.16;
  return (
    <G transform={`translate(${x} ${ground}) scale(${s} 1)`}>
      <Ellipse cx={0} cy={-1} rx={h * 0.055} ry={h * 0.014} fill={SHADE} />
      <Path d={`M ${-h * 0.032} 0 L ${h * 0.032} 0 L ${h * 0.018} ${-h} L ${-h * 0.018} ${-h} Z`} fill={t.tower} />
      <Path d={`M ${h * 0.004} 0 L ${h * 0.032} 0 L ${h * 0.018} ${-h} L ${h * 0.002} ${-h} Z`} fill={SHADE} />
      <Path d={`M 0 ${-h} q ${arm * 0.9} 0 ${arm} ${arm * 0.5}`} stroke={t.tower} strokeWidth={h * 0.03} fill="none" strokeLinecap="round" />
      <Path d={`M ${arm * 0.72} ${-h + arm * 0.4} l ${arm * 0.62} 0 l ${-arm * 0.16} ${arm * 0.34} l ${-arm * 0.3} 0 Z`} fill={t.towerTop} />
      <Rect x={-h * 0.05} y={-h * 0.09} width={h * 0.1} height={h * 0.05} rx={h * 0.02} fill={t.tower} />
    </G>
  );
}

/** One quiet tree, at the far edge of the block. */
function FarTree({ x, ground, h, t, flip = false }: { x: number; ground: number; h: number; t: Tone; flip?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <G transform={`translate(${x} ${ground}) scale(${s} 1)`}>
      <Ellipse cx={0} cy={-1} rx={h * 0.16} ry={h * 0.034} fill={SHADE} />
      <Path d={`M ${-h * 0.045} 0 Q ${-h * 0.028} ${-h * 0.2} ${-h * 0.03} ${-h * 0.42} L ${h * 0.03} ${-h * 0.42} Q ${h * 0.028} ${-h * 0.2} ${h * 0.045} 0 Z`} fill={t.trunk} />
      <Ellipse cx={h * 0.08} cy={-h * 0.6} rx={h * 0.27} ry={h * 0.25} fill={t.leafBack} />
      <Ellipse cx={-h * 0.11} cy={-h * 0.56} rx={h * 0.2} ry={h * 0.18} fill={t.leaf} />
      <Ellipse cx={h * 0.05} cy={-h * 0.78} rx={h * 0.2} ry={h * 0.17} fill={t.leaf} />
      <Ellipse cx={h * 0.19} cy={-h * 0.5} rx={h * 0.15} ry={h * 0.12} fill={SHADE} />
      <Ellipse cx={-h * 0.12} cy={-h * 0.68} rx={h * 0.11} ry={h * 0.07} fill={HIGHLIGHT} />
    </G>
  );
}

export interface NeighboursProps {
  /** the band always spans this width */
  width: number;
  /** how tall the block stands above its ground line */
  height: number;
  /** px across the middle the station already covers — nothing is drawn there */
  clear?: number;
  mood?: 'day' | 'evening';
  style?: React.ComponentProps<typeof View>['style'];
}

const Art = memo(function Art({ width, height, clear, mood }: Required<Omit<NeighboursProps, 'style'>>) {
  const t = TONES[mood];
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const ground = h;
  /** where the station's own silhouette ends */
  const edge = Math.max(0, (w - clear) / 2);

  const shopH = h * 0.6;
  const towerH = h * 0.88;
  const treeH = h * 0.52;

  return (
    <Svg width={w} height={h + 2} viewBox={`0 0 ${w} ${h + 2}`} pointerEvents="none">
      <Defs>
        <LinearGradient id="nbWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.wallTop} />
          <Stop offset="1" stopColor={t.wallBottom} />
        </LinearGradient>
        <LinearGradient id="nbTower" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.towerTop} />
          <Stop offset="1" stopColor={t.tower} />
        </LinearGradient>
        <LinearGradient id="nbHaze" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.haze} stopOpacity={t.hazeOpacity * 1.15} />
          <Stop offset="0.7" stopColor={t.haze} stopOpacity={t.hazeOpacity * 0.85} />
          <Stop offset="1" stopColor={t.haze} stopOpacity={t.hazeOpacity * 0.55} />
        </LinearGradient>
      </Defs>

      {/* left of the station: a shop tucked against it, then one tree */}
      <Shop x={edge - shopH * 0.86 + 26} ground={ground} h={shopH} t={t} />
      <FarTree x={edge - shopH * 0.86 - treeH * 0.24} ground={ground} h={treeH} t={t} flip />
      <Lamp x={edge - shopH * 0.86 - treeH * 0.78} ground={ground} h={treeH * 0.96} t={t} flip />

      {/* right of the station: the tower, then one tree */}
      <Tower x={w - edge - 26} ground={ground} h={towerH} t={t} />
      <FarTree x={w - edge + towerH * 0.36 + treeH * 0.26} ground={ground} h={treeH} t={t} />
      <Lamp x={w - edge + towerH * 0.36 + treeH * 0.8} ground={ground} h={treeH * 0.96} t={t} />

      {/* the wash that puts the whole block behind the station */}
      <Rect x={0} y={0} width={w} height={h + 2} fill="url(#nbHaze)" />
    </Svg>
  );
});

/**
 * The block the firehouse stands on. Static art — memoized, never re-rendered
 * behind the drifting clouds and the idling crew.
 */
export function Neighbours({ width, height, clear = 0, mood = 'day', style }: NeighboursProps) {
  return (
    <View style={[styles.wrap, { width, height: height + 2 }, style]} pointerEvents="none">
      <Art width={width} height={height} clear={clear} mood={mood} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
});

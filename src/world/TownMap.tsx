import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { useIdleBob, useLoop, usePulse } from '@/hooks';
import type { LocationId } from '@/content/types';

/** Design box for Spark City. Pins and the truck are placed in these units. */
export const MAP_VB = { w: 360, h: 600 } as const;

export interface MapPlace {
  id: LocationId;
  name: string;
  nameEs: string;
  /** pin colour (matches the reference art's coloured teardrops) */
  color: string;
  /** anchor for the white pin label: centre-x, top-y in MAP_VB units */
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ *
 * The town plan.
 *
 * Spark City is laid out on a grid, not scattered: roads run in fixed
 * lanes, buildings stand inside the blocks between them, and each block
 * keeps a strip of grass along its foot for the place's label. Nothing but
 * a bridge or the boat may cross the river.
 *
 * Every number below is in MAP_VB units. Change the grid here, not inside
 * the drawings — each building is placed by `PLOTS`, which scales and
 * translates its art into a block without touching a single path.
 * ------------------------------------------------------------------ */

/** Road centre lines and widths. */
const ROADS = {
  h1: { y: 180, w: 22 },
  h2: { y: 322, w: 22 },
  h3: { y: 464, w: 22 },
  /** the one avenue running the length of the town */
  v1: { x: 124, w: 20, y0: 52, y1: 580 },
} as const;

/**
 * The water's left edge, sampled off `RIVER_D`, is never further left than
 * x ≈ 269. Buildings stop at 262 so there is always a green bank.
 */
const RIVER_KEEP_OUT = 262;

/** Every stop in Spark City, in reading order down the map. */
export const MAP_PLACES: readonly MapPlace[] = [
  { id: 'station', name: 'Fire Station', nameEs: 'Estación', color: palette.engineRed, x: 45, y: 137 },
  { id: 'school', name: 'School', nameEs: 'Escuela', color: palette.orange, x: 175, y: 137 },
  { id: 'clock-tower', name: 'Clock Tower', nameEs: 'Reloj', color: palette.safetyYellow, x: 241, y: 137 },
  { id: 'bakery', name: 'Bakery', nameEs: 'Panadería', color: palette.pink, x: 48, y: 279 },
  { id: 'library', name: 'Library', nameEs: 'Biblioteca', color: palette.purple, x: 174, y: 279 },
  { id: 'park', name: 'Park', nameEs: 'Parque', color: palette.leafGreen, x: 240, y: 279 },
  { id: 'pet-shop', name: 'Pet Shop', nameEs: 'Mascotas', color: palette.waterCyan, x: 50, y: 421 },
  { id: 'pizza', name: 'Pizza Piazza', nameEs: 'Pizzería', color: palette.engineRedLight, x: 176, y: 421 },
  { id: 'apartments', name: 'Homes', nameEs: 'Casas', color: '#3E8FE0', x: 240, y: 421 },
  { id: 'market', name: 'Market', nameEs: 'Mercado', color: palette.grassDark, x: 52, y: 550 },
  { id: 'construction', name: 'Construction Site', nameEs: 'Obra', color: palette.woodDark, x: 176, y: 550 },
] as const;

/**
 * Where each drawing lands. `box` is the art's own bounding box in the
 * coordinates it was drawn in; `at` is the top-left corner of the block it
 * should occupy, and `s` how much to shrink it to fit. The drawings
 * themselves are untouched.
 */
interface Plot {
  box: readonly [number, number, number, number];
  at: readonly [number, number];
  s: number;
}

/*
 * Boxes are measured off the drawings themselves, not estimated: a building
 * whose real box is wider than assumed pokes an awning across a road, which is
 * exactly the bug this table exists to prevent.
 *
 * The top 58 units are sky and hills — the screen's back button and title
 * banner float there, so no building may stand in that band.
 *
 * Columns:  left 10…95   ·  avenue 114…134  ·  right 138…216  ·  bank 218…262
 * Rows, each with the strip of grass its labels sit in:
 *   row 1  buildings  60…134   labels 137…167   road at 180
 *   row 2  buildings 202…276   labels 279…309   road at 322
 *   row 3  buildings 344…418   labels 421…451   road at 464
 *   row 4  buildings 486…556   labels 559…589
 */
const PLOTS = {
  station: { box: [6, 16, 124, 142.2], at: [10, 60], s: 0.586 },
  school: { box: [116, 18, 236, 139], at: [138, 60], s: 0.61 },
  clockTower: { box: [226, 26, 282, 140.4], at: [224, 60], s: 0.6 },
  bakery: { box: [8, 178, 117, 283.6], at: [10, 202], s: 0.7 },
  library: { box: [124, 190, 224, 284.4], at: [138, 202], s: 0.72 },
  petShop: { box: [8, 332, 112, 419.8], at: [10, 344], s: 0.78 },
  pizza: { box: [104, 330, 208, 420.4], at: [138, 344], s: 0.75 },
  homes: { box: [212.5, 336, 308, 404], at: [218, 372], s: 0.46 },
  market: { box: [10, 484, 116, 546.4], at: [10, 492], s: 0.76 },
  construction: { box: [112, 470, 247, 576], at: [138, 486], s: 0.58 },
  lighthouse: { box: [320, 326, 356, 397.4], at: [310, 350], s: 0.8 },
} as const satisfies Record<string, Plot>;

/** `translate(...) scale(...)` that drops a drawing onto its plot. */
function plotTransform(p: Plot): string {
  const [x0, y0] = p.box;
  return `translate(${(p.at[0] - p.s * x0).toFixed(2)} ${(p.at[1] - p.s * y0).toFixed(2)}) scale(${p.s})`;
}

/** Where the fire truck parks, on the avenue outside the station. */
export const TRUCK_PARK = { x: 46, y: 180 } as const;

const RIVER_D =
  'M 330 -10 C 322 60 300 96 308 150 C 316 204 288 232 296 292 C 304 352 278 384 286 444 C 294 504 318 546 314 630';

/* ------------------------------------------------------------------ */
/* House tones — three per object: base → navy shade → white highlight  */
/* ------------------------------------------------------------------ */

const SHADE = 'rgba(31,42,90,0.14)';
const SHADE_SOFT = 'rgba(31,42,90,0.08)';
const HI = 'rgba(255,255,255,0.32)';
const GLASS = '#3A5FA8';

/** The navy contact ellipse every building stands on (consistency rule #3). */
function ground(cx: number, cy: number, rx: number) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={Math.max(3, rx * 0.16)} fill={palette.navy} opacity={0.12} />;
}

/** A window with real mullions and a sill — never a bare blue square. */
function win(x: number, y: number, w: number, h: number, bars = true) {
  return (
    <G>
      <Rect x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 3} rx={3} fill={palette.creamDeep} />
      <Rect x={x} y={y} width={w} height={h} rx={2} fill={GLASS} />
      <Path d={`M ${x + 1} ${y + h - 1} L ${x + w * 0.55} ${y + 1} L ${x + w * 0.8} ${y + 1} L ${x + w * 0.28} ${y + h - 1} Z`} fill={palette.white} opacity={0.22} />
      {bars ? (
        <G>
          <Rect x={x + w / 2 - 0.7} y={y} width={1.4} height={h} fill={palette.creamDeep} opacity={0.9} />
          <Rect x={x} y={y + h / 2 - 0.7} width={w} height={1.4} fill={palette.creamDeep} opacity={0.9} />
        </G>
      ) : null}
      <Rect x={x - 2.5} y={y + h + 1} width={w + 5} height={2.4} rx={1.2} fill={SHADE} />
    </G>
  );
}

/** A striped shop awning that scallops along its lower edge. */
function awning(x: number, y: number, w: number, h: number, a: string, b: string) {
  const n = Math.max(3, Math.round(w / 9));
  const step = w / n;
  /*
   * The scalloped valance runs back along the bottom edge, right to left. It
   * used to advance rightwards, which drew a second awning's worth of orange
   * off the side of every stall — invisible while the map was crowded, and
   * very visible once the buildings were spaced apart.
   */
  const scallop = Array.from({ length: n }, () => `q ${-step / 2} 3 ${-step} 0`).join(' ');
  return (
    <G>
      <Path d={`M ${x} ${y} h ${w} l -2 ${h} ${scallop} l 2 ${-h} z`} fill={a} />
      {Array.from({ length: n }, (_, i) =>
        i % 2 === 1 ? <Rect key={i} x={x + 1 + i * step} y={y} width={step} height={h} fill={b} /> : null,
      )}
      <Rect x={x - 1.5} y={y - 2} width={w + 3} height={3.4} rx={1.7} fill={SHADE} />
    </G>
  );
}

/** A chimney with a cap and a shaded side. */
function chimney(x: number, y: number, w: number, h: number, brick = '#C9755A') {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={1.5} fill={brick} />
      <Rect x={x} y={y} width={w * 0.34} height={h} fill={HI} />
      <Rect x={x + w * 0.72} y={y} width={w * 0.28} height={h} fill={SHADE} />
      <Rect x={x - 1.6} y={y - 2.6} width={w + 3.2} height={3.4} rx={1.7} fill="#A85F48" />
    </G>
  );
}

/** A small cream signage plate (the pin label carries the name). */
function plate(x: number, y: number, w: number, h: number, ink: string) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={h * 0.42} fill={palette.cream} />
      <Rect x={x + 1.4} y={y + 1.2} width={w - 2.8} height={h * 0.34} rx={h * 0.17} fill={palette.white} opacity={0.7} />
      <Rect x={x + w * 0.16} y={y + h * 0.5} width={w * 0.68} height={h * 0.2} rx={h * 0.1} fill={ink} opacity={0.55} />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Roads + greenery                                                    */
/* ------------------------------------------------------------------ */

/** Asphalt, not lavender: a dark edge, a neutral grey surface, white dashes. */
function Road({ d, width = 22 }: { d: string; width?: number }) {
  return (
    <G>
      <Path d={d} stroke="#7E879F" strokeWidth={width + 5} strokeLinecap="round" fill="none" />
      <Path d={d} stroke="#9AA3B8" strokeWidth={width} strokeLinecap="round" fill="none" />
      <Path d={d} stroke="#A7B0C4" strokeWidth={width * 0.45} strokeLinecap="round" fill="none" opacity={0.5} />
      <Path d={d} stroke="#FFFFFF" strokeWidth={2.4} strokeDasharray="9 11" strokeLinecap="round" fill="none" opacity={0.9} />
    </G>
  );
}

/** A layered tree: dark back mass, lit front mass, one highlight, a trunk. */
/**
 * The only way a road may touch the water. Sits on the road's centre line at
 * the river's crossing point, so a bridge can never drift off the water.
 */
function Bridge({ y, cx, red = false }: { y: number; cx: number; red?: boolean }) {
  const w = 58;
  const x = cx - w / 2;
  if (red) {
    return (
      <G>
        <Path d={`M ${x + 2} ${y + 4} Q ${cx} ${y - 28} ${x + w - 2} ${y + 4}`} stroke={palette.engineRedDark} strokeWidth={11} fill="none" strokeLinecap="round" />
        <Path d={`M ${x + 2} ${y + 2} Q ${cx} ${y - 30} ${x + w - 2} ${y + 2}`} stroke={palette.engineRed} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Rect x={x} y={y - 5} width={w} height={10} rx={4} fill={palette.engineRedDark} />
        <Rect x={x} y={y - 5} width={w} height={3.4} rx={1.7} fill={HI} />
      </G>
    );
  }
  return (
    <G>
      <Rect x={x} y={y - 15} width={w} height={30} rx={7} fill="#DCE1EE" />
      <Rect x={x} y={y - 15} width={w} height={6} rx={3} fill="#C2C9DC" />
      <Rect x={x} y={y - 9} width={w} height={3} rx={1.5} fill={HI} />
      <Path d={`M ${x + 12} ${y + 15} Q ${cx} ${y - 7} ${x + w - 12} ${y + 15} Z`} fill={palette.waterCyanDark} opacity={0.45} />
    </G>
  );
}

function Trees({ pts }: { pts: readonly [number, number, number][] }) {
  return (
    <G>
      {pts.map(([x, y, s], i) => (
        <G key={i}>
          <Ellipse cx={x} cy={y + s * 0.92} rx={s * 0.6} ry={s * 0.16} fill={palette.navy} opacity={0.12} />
          <Rect x={x - s * 0.11} y={y + s * 0.3} width={s * 0.22} height={s * 0.62} rx={s * 0.11} fill={palette.woodDark} />
          <Rect x={x - s * 0.11} y={y + s * 0.3} width={s * 0.08} height={s * 0.62} fill={HI} />
          <Path
            d={`M ${x - s * 0.62} ${y + s * 0.3} q ${-s * 0.1} ${-s * 0.5} ${s * 0.34} ${-s * 0.6} q ${s * 0.14} ${-s * 0.3} ${s * 0.44} ${-s * 0.12} q ${s * 0.42} ${-s * 0.04} ${s * 0.34} ${s * 0.42} q ${s * 0.16} ${s * 0.32} ${-s * 0.26} ${s * 0.3} z`}
            fill={i % 3 === 0 ? '#2F8748' : '#2F7F45'}
          />
          <Path
            d={`M ${x - s * 0.5} ${y + s * 0.24} q ${-s * 0.06} ${-s * 0.38} ${s * 0.28} ${-s * 0.46} q ${s * 0.12} ${-s * 0.24} ${s * 0.36} ${-s * 0.1} q ${s * 0.32} ${-s * 0.02} ${s * 0.26} ${s * 0.32} q ${s * 0.12} ${s * 0.24} ${-s * 0.2} ${s * 0.24} z`}
            fill={i % 2 === 0 ? palette.leafGreen : palette.grassDark}
          />
          <Path d={`M ${x - s * 0.26} ${y - s * 0.16} q ${s * 0.12} ${-s * 0.18} ${s * 0.34} ${-s * 0.14} q ${-s * 0.16} ${s * 0.08} ${-s * 0.34} ${s * 0.14} z`} fill={HI} />
        </G>
      ))}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* The eleven places — each with its own architecture                   */
/* ------------------------------------------------------------------ */

/** 1 · Fire Station — gabled bay house with a bell gable and a hose tower. */
function FireStation() {
  return (
    <G>
      {ground(64, 126, 54)}
      {/* hose tower on the right, with a shaded return */}
      <Rect x={96} y={44} width={24} height={80} rx={3} fill={palette.tanDark} />
      <Rect x={96} y={44} width={8} height={80} fill={HI} />
      <Path d="M 92 48 L 108 32 L 124 48 Z" fill={palette.engineRedDark} />
      {win(102, 60, 12, 14)}
      {/* main body */}
      <Rect x={16} y={62} width={84} height={62} rx={4} fill={palette.tan} />
      <Rect x={16} y={62} width={13} height={62} fill={HI} />
      <Rect x={88} y={62} width={12} height={62} fill={SHADE} />
      {/* gable roof + cornice */}
      <Path d="M 8 68 L 58 30 L 108 68 Z" fill={palette.engineRed} />
      <Path d="M 58 30 L 108 68 L 58 68 Z" fill={SHADE} />
      <Rect x={6} y={64} width={104} height={9} rx={4.5} fill={palette.engineRedDark} />
      <Rect x={10} y={73} width={96} height={3.4} rx={1.7} fill={SHADE_SOFT} />
      {/* bell gable with a flame emblem */}
      <Path d="M 44 46 a 14 14 0 0 1 28 0 v 12 h -28 z" fill={palette.creamDeep} />
      <Circle cx={58} cy={50} r={8} fill="#F4E3C4" />
      <Path d="M 58 44 c 5 4 6 7 0 12 c -6 -5 -5 -8 0 -12 z" fill={palette.engineRed} />
      {/* two bay doors with panel bands and glass */}
      {[24, 62].map((x) => (
        <G key={x}>
          <Rect x={x} y={84} width={32} height={40} rx={3} fill={palette.engineRed} />
          <Rect x={x} y={84} width={32} height={5} rx={2.5} fill={palette.engineRedDark} />
          <Rect x={x + 3} y={92} width={26} height={11} rx={2} fill={GLASS} />
          <Rect x={x + 3} y={92} width={26} height={4} rx={2} fill={palette.white} opacity={0.22} />
          <Rect x={x + 2} y={108} width={28} height={2.6} rx={1.3} fill={SHADE} />
          <Rect x={x + 2} y={115} width={28} height={2.6} rx={1.3} fill={SHADE} />
        </G>
      ))}
      {plate(38, 76, 40, 7, palette.navy)}
      {/* apron kerb + a hydrant beside the doors */}
      <Rect x={12} y={122} width={92} height={4} rx={2} fill="#D6DCE9" />
      <G>
        <Rect x={106} y={112} width={5} height={12} rx={2.5} fill={palette.engineRed} />
        <Rect x={103} y={110} width={11} height={4} rx={2} fill={palette.engineRedDark} />
        <Circle cx={108.5} cy={108} r={3} fill={palette.engineRed} />
      </G>
      {/* flag pole (the flag itself waves in MapLife) */}
      <Rect x={106} y={16} width={3.4} height={40} rx={1.7} fill={palette.charcoal} />
    </G>
  );
}

/** 2 · School — hipped roof, bell cupola, arched doors, four mullioned bays. */
function School() {
  return (
    <G>
      {ground(168, 124, 50)}
      <Rect x={124} y={70} width={88} height={52} rx={4} fill="#FBD9A5" />
      <Rect x={124} y={70} width={13} height={52} fill={HI} />
      <Rect x={200} y={70} width={12} height={52} fill={SHADE} />
      {/* hipped roof */}
      <Path d="M 118 74 L 140 46 L 196 46 L 218 74 Z" fill="#C7473B" />
      <Path d="M 196 46 L 218 74 L 168 74 L 168 46 Z" fill={SHADE} />
      <Rect x={116} y={70} width={104} height={8} rx={4} fill="#A83A30" />
      {/* bell cupola */}
      <Rect x={158} y={30} width={20} height={16} rx={3} fill={palette.creamDeep} />
      <Path d="M 154 32 L 168 18 L 182 32 Z" fill="#C7473B" />
      <Circle cx={168} cy={38} r={5} fill={palette.safetyYellow} />
      <Path d="M 165 41 h 6" stroke={palette.gold} strokeWidth={1.6} strokeLinecap="round" />
      {/* mullioned bays */}
      {[130, 148, 182, 200].map((x) => win(x, 84, 14, 16))}
      {/* arched double doors + steps */}
      <Path d="M 158 122 v -16 a 10 10 0 0 1 20 0 v 16 z" fill="#5C4632" />
      <Rect x={167.2} y={106} width={1.6} height={16} fill="#43331F" />
      <Circle cx={164} cy={114} r={1.4} fill={palette.safetyYellow} />
      <Circle cx={172} cy={114} r={1.4} fill={palette.safetyYellow} />
      <Rect x={152} y={120} width={32} height={4} rx={2} fill="#E1E6F1" />
      <Rect x={148} y={124} width={40} height={4} rx={2} fill="#CDD5E4" />
      {plate(146, 76, 44, 7, palette.navy)}
      <Rect x={208} y={30} width={3.4} height={42} rx={1.7} fill={palette.charcoal} />
      <Path d="M 211 32 L 236 38 L 211 47 Z" fill={palette.safetyYellow} />
    </G>
  );
}

/** 3 · Clock Tower — stone shaft, cornice bands, louvres, a real dial. */
function ClockTower() {
  return (
    <G>
      {ground(254, 132, 28)}
      <Rect x={236} y={54} width={36} height={76} rx={3} fill="#F0E3C6" />
      <Rect x={236} y={54} width={7} height={76} fill={HI} />
      <Rect x={265} y={54} width={7} height={76} fill={SHADE} />
      <Path d="M 230 58 L 254 26 L 278 58 Z" fill="#4B6FB5" />
      <Path d="M 254 26 L 278 58 L 254 58 Z" fill={SHADE} />
      <Rect x={228} y={54} width={52} height={7} rx={3.5} fill="#33478A" />
      {/* cornice bands */}
      <Rect x={233} y={86} width={42} height={4} rx={2} fill="#DCC79F" />
      <Rect x={233} y={90} width={42} height={2} rx={1} fill={SHADE} />
      <Rect x={233} y={118} width={42} height={4} rx={2} fill="#DCC79F" />
      {/* the dial */}
      <Circle cx={254} cy={72} r={12.5} fill="#DCC79F" />
      <Circle cx={254} cy={71} r={11} fill={palette.white} />
      <Circle cx={254} cy={69} r={9} fill={HI} />
      <Path d="M 254 71 L 254 64 M 254 71 L 259 74" stroke={palette.navy} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={254} cy={71} r={1.4} fill={palette.engineRed} />
      {/* louvred belfry window */}
      <Path d="M 247 116 v -14 a 7 7 0 0 1 14 0 v 14 z" fill={GLASS} />
      <Rect x={247} y={104} width={14} height={1.6} fill={palette.creamDeep} opacity={0.8} />
      <Rect x={247} y={109} width={14} height={1.6} fill={palette.creamDeep} opacity={0.8} />
      <Rect x={244} y={123} width={20} height={7} rx={2} fill="#8E5A26" />
    </G>
  );
}

/** 4 · Bakery — bread sign on the gable, striped awning, a smoking chimney. */
function Bakery() {
  return (
    <G>
      {ground(62, 268, 52)}
      {chimney(90, 178, 11, 22)}
      <Rect x={16} y={212} width={92} height={54} rx={4} fill={palette.tan} />
      <Rect x={16} y={212} width={14} height={54} fill={HI} />
      <Rect x={96} y={212} width={12} height={54} fill={SHADE} />
      <Path d="M 10 216 L 62 186 L 114 216 Z" fill="#C44B3F" />
      <Path d="M 62 186 L 114 216 L 62 216 Z" fill={SHADE} />
      <Rect x={8} y={212} width={108} height={8} rx={4} fill="#A83A30" />
      {/* the loaf sign, tucked into the gable */}
      <Ellipse cx={62} cy={206} rx={17} ry={9} fill="#C98C34" />
      <Ellipse cx={62} cy={204} rx={16} ry={8} fill="#F0BC63" />
      <Ellipse cx={57} cy={201} rx={7} ry={2.6} fill="rgba(255,255,255,0.32)" />
      {[-8, -1, 6].map((dx) => (
        <Path key={dx} d={`M ${62 + dx} 200 q 3 3 -1.6 7`} stroke="#B87A28" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      ))}
      {/* shop window + striped awning */}
      <Rect x={22} y={234} width={40} height={22} rx={3} fill={palette.creamDeep} />
      <Rect x={24} y={236} width={36} height={18} rx={2} fill={GLASS} />
      <Ellipse cx={32} cy={248} rx={5} ry={3.4} fill="#E4A13E" />
      <Ellipse cx={44} cy={247} rx={5} ry={3.4} fill="#F0BC63" />
      <Ellipse cx={54} cy={249} rx={4} ry={3} fill="#E4A13E" />
      {awning(20, 230, 44, 7, palette.engineRed, palette.white)}
      {/* door with a canopy and an OPEN tag */}
      <Rect x={70} y={236} width={24} height={30} rx={2.5} fill="#8E5A26" />
      <Rect x={73} y={240} width={18} height={12} rx={2} fill={GLASS} />
      <Rect x={68} y={232} width={28} height={5} rx={2.5} fill={palette.engineRedDark} />
      <Rect x={78} y={253} width={7} height={2.6} rx={1.3} fill={palette.cream} />
      {plate(30, 220, 40, 7, '#7A4A22')}
      {/* pavement and two planters */}
      <Rect x={12} y={264} width={100} height={4} rx={2} fill="#D6DCE9" />
      <Circle cx={16} cy={258} r={5} fill={palette.leafGreen} />
      <Circle cx={112} cy={259} r={5} fill={palette.grassDark} />
    </G>
  );
}

/** 5 · Library — a pediment, two columns and tall arched windows. */
function Library() {
  return (
    <G>
      {ground(174, 270, 48)}
      <Rect x={132} y={216} width={84} height={52} rx={3} fill="#F3E6CD" />
      <Rect x={132} y={216} width={13} height={52} fill={HI} />
      <Rect x={204} y={216} width={12} height={52} fill={SHADE} />
      {/* pediment */}
      <Path d="M 126 220 L 174 190 L 222 220 Z" fill="#4B6FB5" />
      <Path d="M 174 190 L 222 220 L 174 220 Z" fill={SHADE} />
      <Rect x={124} y={216} width={100} height={7} rx={3.5} fill="#33478A" />
      {/* open-book plaque in the tympanum */}
      <Path d="M 162 204 h 11 v 11 h -11 z" fill={palette.white} />
      <Path d="M 175 204 h 11 v 11 h -11 z" fill="#E7EFFF" />
      <Rect x={173.2} y={203} width={1.6} height={13} fill="#33478A" />
      {/* columns */}
      {[150, 194].map((x) => (
        <G key={x}>
          <Rect x={x} y={228} width={8} height={38} rx={2} fill={palette.cream} />
          <Rect x={x} y={228} width={3} height={38} fill={HI} />
          <Rect x={x - 2} y={224} width={12} height={5} rx={2} fill="#E4D8BC" />
          <Rect x={x - 2} y={264} width={12} height={4} rx={2} fill="#E4D8BC" />
        </G>
      ))}
      {/* tall arched windows */}
      {[136, 208].map((x) => (
        <G key={x}>
          <Path d={`M ${x} 258 v -20 a 6 6 0 0 1 12 0 v 20 z`} fill={GLASS} />
          <Rect x={x + 5.2} y={238} width={1.6} height={20} fill={palette.creamDeep} opacity={0.85} />
          <Rect x={x - 1.5} y={258} width={15} height={2.4} rx={1.2} fill={SHADE} />
        </G>
      ))}
      {/* door + steps */}
      <Path d="M 165 268 v -22 a 9 9 0 0 1 18 0 v 22 z" fill="#8E5A26" />
      <Circle cx={179} cy={258} r={1.5} fill={palette.safetyYellow} />
      <Rect x={158} y={266} width={32} height={4} rx={2} fill="#E1E6F1" />
      <Rect x={154} y={270} width={40} height={4} rx={2} fill="#CDD5E4" />
      {plate(152, 222, 44, 7, '#33478A')}
    </G>
  );
}

/** 6 · Park — a bowl of grass, the fountain basin, a bench and a bin. */
/**
 * 6 · Riverside Park — a green strip on the bank between the avenue and the
 * water. It stops at `RIVER_KEEP_OUT`, so the lawn never floats on the river;
 * the only thing on the water here is the boat drifting past.
 */
function Park() {
  const x0 = 216;
  const x1 = RIVER_KEEP_OUT;
  const w = x1 - x0;
  return (
    <G>
      <Rect x={x0} y={198} width={w} height={80} rx={15} fill="#93D671" />
      <Rect x={x0 + 3} y={201} width={w - 6} height={74} rx={12} fill={palette.grass} />
      {/* fountain: basin only — the jet is animated in MapLife */}
      <Ellipse cx={239} cy={228} rx={15} ry={8} fill="#B9C3D9" />
      <Ellipse cx={239} cy={226} rx={12} ry={6} fill={palette.waterCyanLight} />
      <Ellipse cx={239} cy={225} rx={9} ry={4.5} fill={palette.waterCyan} />
      <Rect x={236.5} y={214} width={5} height={12} rx={2.5} fill="#CBD3E4" />
      <Ellipse cx={239} cy={214} rx={6.5} ry={3} fill="#DDE3EF" />
      {/* a bench facing the water */}
      <G>
        <Rect x={224} y={252} width={22} height={3.6} rx={1.8} fill={palette.wood} />
        <Rect x={224} y={246} width={22} height={3} rx={1.5} fill={palette.woodDark} />
        <Rect x={226} y={255} width={2.6} height={6} rx={1.3} fill={palette.woodDark} />
        <Rect x={242} y={255} width={2.6} height={6} rx={1.3} fill={palette.woodDark} />
      </G>
      {/* a flower bed on the bank */}
      <G>
        <Ellipse cx={254} cy={266} rx={6} ry={4} fill="#7FC45F" />
        <Circle cx={252} cy={265} r={1.8} fill={palette.pink} />
        <Circle cx={256} cy={267} r={1.8} fill={palette.safetyYellow} />
      </G>
    </G>
  );
}

function PetShop() {
  return (
    <G>
      {ground(56, 406, 46)}
      <Rect x={16} y={356} width={80} height={48} rx={4} fill="#FFE0B2" />
      <Rect x={16} y={356} width={12} height={48} fill={HI} />
      <Rect x={85} y={356} width={11} height={48} fill={SHADE} />
      <Path d="M 10 360 L 56 332 L 102 360 Z" fill={palette.waterCyanDark} />
      <Path d="M 56 332 L 102 360 L 56 360 Z" fill={SHADE} />
      <Rect x={8} y={356} width={96} height={7} rx={3.5} fill="#1789C4" />
      {/* paw badge in the gable */}
      <Circle cx={56} cy={346} r={8.5} fill={palette.white} />
      <Ellipse cx={56} cy={348} rx={4} ry={3.2} fill={palette.waterCyanDark} />
      <Circle cx={51.5} cy={343} r={1.7} fill={palette.waterCyanDark} />
      <Circle cx={56} cy={341.5} r={1.7} fill={palette.waterCyanDark} />
      <Circle cx={60.5} cy={343} r={1.7} fill={palette.waterCyanDark} />
      {/* shop window with a puppy silhouette */}
      <Rect x={22} y={372} width={32} height={20} rx={3} fill={palette.creamDeep} />
      <Rect x={24} y={374} width={28} height={16} rx={2} fill={GLASS} />
      <Circle cx={34} cy={384} r={4} fill={palette.white} />
      <Circle cx={31} cy={380} r={2} fill={palette.white} />
      <Circle cx={41} cy={385} r={3} fill="#E7EFFF" />
      {awning(20, 368, 36, 6, palette.waterCyan, palette.white)}
      <Rect x={62} y={374} width={20} height={30} rx={2.5} fill="#8E5A26" />
      <Rect x={65} y={378} width={14} height={10} rx={2} fill={GLASS} />
      {plate(30, 362, 34, 6, '#1789C4')}
      {/* kennel outside */}
      <G>
        {ground(102, 404, 9)}
        <Rect x={94} y={392} width={16} height={12} rx={2} fill="#C9755A" />
        <Path d="M 92 393 L 102 384 L 112 393 Z" fill="#A85F48" />
        <Circle cx={102} cy={399} r={4} fill="#7A4A3A" />
      </G>
      <Rect x={12} y={402} width={92} height={4} rx={2} fill="#D6DCE9" />
    </G>
  );
}

/** 8 · Pizza Piazza — green awning, a slice sign, café tables on the paving. */
function Pizza() {
  return (
    <G>
      {ground(156, 406, 48)}
      {chimney(184, 330, 10, 20, '#B86A50')}
      <Rect x={112} y={356} width={88} height={48} rx={4} fill={palette.cream} />
      <Rect x={112} y={356} width={13} height={48} fill={HI} />
      <Rect x={189} y={356} width={11} height={48} fill={SHADE} />
      <Path d="M 106 360 L 156 330 L 206 360 Z" fill="#2E9E52" />
      <Path d="M 156 330 L 206 360 L 156 360 Z" fill={SHADE} />
      <Rect x={104} y={356} width={104} height={7} rx={3.5} fill="#1F7C3C" />
      {/* pizza badge — the same signage motif as the pet shop's paw disc */}
      <Circle cx={156} cy={346} r={8.5} fill={palette.white} />
      <Path d="M 156 340 l 6 11 a 13 13 0 0 1 -12 0 z" fill="#F3C463" />
      <Path d="M 156 342.5 l 4.2 7.7 a 9 9 0 0 1 -8.4 0 z" fill="#E8523F" />
      <Circle cx={154} cy={348} r={1.3} fill="#FFF3D6" />
      <Circle cx={158} cy={349.4} r={1.1} fill="#FFF3D6" />
      {awning(114, 366, 50, 7, '#2E9E52', palette.white)}
      <Rect x={118} y={376} width={34} height={20} rx={3} fill={palette.creamDeep} />
      <Rect x={120} y={378} width={30} height={16} rx={2} fill={GLASS} />
      <Rect x={122} y={384} width={26} height={5} rx={2} fill="#F3C463" opacity={0.8} />
      <Rect x={162} y={376} width={22} height={28} rx={2.5} fill="#8E5A26" />
      <Rect x={165} y={380} width={16} height={10} rx={2} fill={GLASS} />
      {plate(130, 362, 40, 6, '#B9261C')}
      {/* two café tables on the paving */}
      <Rect x={108} y={402} width={96} height={4} rx={2} fill="#D6DCE9" />
      {[192, 206].map((x, i) => (
        <G key={x}>
          {ground(x, 404, 6)}
          <Rect x={x - 1.4} y={394} width={2.8} height={10} rx={1.4} fill={palette.slate} />
          <Ellipse cx={x} cy={393} rx={7} ry={2.8} fill={i === 0 ? palette.engineRed : palette.white} />
          <Ellipse cx={x} cy={392} rx={5} ry={1.8} fill={HI} />
        </G>
      ))}
    </G>
  );
}

/** 9 · Homes — two cottages with chimneys, a picket fence and a garden. */
function Homes() {
  const house = (x: number, y: number, w: number, h: number, wall: string, roof: string, roofDark: string) => (
    <G>
      {ground(x + w / 2, y + h + 2, w * 0.56)}
      <Rect x={x} y={y + h * 0.36} width={w} height={h * 0.64} rx={3} fill={wall} />
      <Rect x={x} y={y + h * 0.36} width={w * 0.2} height={h * 0.64} fill={HI} />
      <Rect x={x + w * 0.84} y={y + h * 0.36} width={w * 0.16} height={h * 0.64} fill={SHADE} />
      <Path d={`M ${x - 4} ${y + h * 0.38} L ${x + w / 2} ${y} L ${x + w + 4} ${y + h * 0.38} Z`} fill={roof} />
      <Path d={`M ${x + w / 2} ${y} L ${x + w + 4} ${y + h * 0.38} L ${x + w / 2} ${y + h * 0.38} Z`} fill={SHADE} />
      <Rect x={x - 5} y={y + h * 0.34} width={w + 10} height={5} rx={2.5} fill={roofDark} />
      {win(x + w * 0.14, y + h * 0.5, w * 0.26, h * 0.24)}
      <Rect x={x + w * 0.56} y={y + h * 0.52} width={w * 0.26} height={h * 0.48} rx={2} fill="#8E5A26" />
      <Circle cx={x + w * 0.6} cy={y + h * 0.74} r={1.2} fill={palette.safetyYellow} />
    </G>
  );
  return (
    <G>
      {chimney(232, 336, 8, 14)}
      {house(222, 342, 44, 60, palette.cream, '#3E8FE0', '#2F6FB5')}
      {house(258, 356, 40, 48, '#FFE7C2', palette.engineRed, palette.engineRedDark)}
      {/* picket fence + garden bushes */}
      <Rect x={220} y={401} width={80} height={2.6} rx={1.3} fill={palette.white} />
      {[224, 238, 252, 266, 280, 294].map((x) => (
        <G key={x}>
          <Rect x={x - 1.3} y={395} width={2.6} height={11} rx={1.3} fill={palette.white} />
          <Path d={`M ${x - 1.3} 395 L ${x} 392.6 L ${x + 1.3} 395 Z`} fill={palette.white} />
        </G>
      ))}
      <Circle cx={218} cy={398} r={5.5} fill={palette.grassDark} />
      <Circle cx={303} cy={399} r={5} fill={palette.leafGreen} />
    </G>
  );
}

/** 10 · Market — an open stall under a striped canopy, crates and a board. */
function Market() {
  return (
    <G>
      {ground(58, 532, 48)}
      <Rect x={16} y={490} width={84} height={40} rx={3} fill={palette.creamDeep} />
      <Rect x={16} y={490} width={12} height={40} fill={HI} />
      <Rect x={90} y={490} width={10} height={40} fill={SHADE} />
      {/* striped canopy on two poles */}
      {awning(10, 484, 96, 10, palette.orange, palette.white)}
      <Rect x={12} y={492} width={3.4} height={38} rx={1.7} fill={palette.wood} />
      <Rect x={101} y={492} width={3.4} height={38} rx={1.7} fill={palette.wood} />
      {/* produce table */}
      <Rect x={18} y={508} width={80} height={6} rx={3} fill={palette.wood} />
      <Rect x={18} y={508} width={80} height={2.4} rx={1.2} fill={HI} />
      <Path d="M 18 514 h 80 l -3 16 h -74 z" fill="#A8752F" />
      {[
        { x: 26, c: palette.engineRed },
        { x: 40, c: palette.leafGreen },
        { x: 54, c: palette.orange },
        { x: 68, c: '#C86BD6' },
        { x: 82, c: palette.safetyYellow },
      ].map((b) => (
        <G key={b.x}>
          <Circle cx={b.x} cy={504} r={4.4} fill={b.c} />
          <Circle cx={b.x - 1.4} cy={502.4} r={1.6} fill={HI} />
        </G>
      ))}
      {/* chalk price board */}
      <G>
        <Rect x={100} y={508} width={16} height={20} rx={2.5} fill={palette.woodDark} />
        <Rect x={102} y={510} width={12} height={15} rx={1.6} fill="#2E3A46" />
        <Rect x={104} y={514} width={8} height={1.6} rx={0.8} fill={palette.white} opacity={0.6} />
        <Rect x={104} y={518} width={6} height={1.6} rx={0.8} fill={palette.white} opacity={0.5} />
      </G>
      {plate(34, 494, 40, 7, '#B36A18')}
      <Rect x={12} y={528} width={100} height={4} rx={2} fill="#D6DCE9" />
    </G>
  );
}

/** 11 · Construction site — scaffold, hut, excavator, spoil heaps, hoarding. */
function Construction() {
  return (
    <G>
      {/* the frame going up */}
      <Rect x={116} y={470} width={8} height={62} rx={2} fill="#98A0BA" />
      <Rect x={116} y={470} width={3} height={62} fill={HI} />
      <Rect x={186} y={470} width={8} height={62} rx={2} fill="#98A0BA" />
      <Rect x={112} y={484} width={86} height={7} rx={3} fill="#B0B7CD" />
      <Rect x={112} y={506} width={86} height={7} rx={3} fill="#B0B7CD" />
      <Path d="M 124 491 L 186 506" stroke="#B0B7CD" strokeWidth={3.4} strokeLinecap="round" />
      {/* site hut */}
      <G>
        {ground(210, 516, 16)}
        <Rect x={196} y={496} width={28} height={20} rx={2.5} fill="#E4D3AE" />
        <Rect x={196} y={496} width={7} height={20} fill={HI} />
        <Rect x={194} y={492} width={32} height={6} rx={3} fill={palette.slate} />
        {win(200, 502, 8, 7, false)}
        <Rect x={214} y={502} width={7} height={14} rx={1.5} fill="#8E5A26" />
      </G>
      {/* excavator */}
      {ground(158, 558, 42)}
      <Rect x={132} y={532} width={44} height={20} rx={5} fill={palette.safetyYellow} />
      <Rect x={132} y={532} width={44} height={6} rx={3} fill="#FFE07A" />
      <Rect x={140} y={518} width={26} height={18} rx={4} fill={palette.safetyYellow} />
      <Rect x={144} y={522} width={17} height={11} rx={2} fill={palette.waterCyanLight} />
      <Rect x={144} y={522} width={7} height={11} rx={2} fill={palette.white} opacity={0.5} />
      <Path d="M 174 528 L 200 512 L 206 522 L 184 538 Z" fill={palette.gold} />
      <Path d="M 200 520 q 12 4 10 16 l -12 -2 z" fill={palette.charcoal} />
      <Rect x={128} y={550} width={52} height={9} rx={4.5} fill={palette.charcoalDark} />
      <Circle cx={138} cy={554} r={5} fill={palette.slate} />
      <Circle cx={170} cy={554} r={5} fill={palette.slate} />
      {/* spoil heaps with a lit face */}
      {[
        { x: 96, w: 32 },
        { x: 206, w: 28 },
      ].map((h) => (
        <G key={h.x}>
          <Path d={`M ${h.x} 552 q ${h.w / 2} -22 ${h.w} 0 z`} fill="#C08B4E" />
          <Path d={`M ${h.x + 3} 552 q ${h.w / 3} -16 ${h.w / 2} -13 q ${-h.w / 5} 5 ${-h.w / 3} 13 z`} fill="#D9A852" />
        </G>
      ))}
      {/* cones and a hoarding panel */}
      {[110, 200, 224].map((x) => (
        <G key={x}>
          <Path d={`M ${x} 544 l 7 16 l -14 0 z`} fill={palette.orange} />
          <Rect x={x - 8} y={558} width={16} height={3.4} rx={1.7} fill={palette.orangeDark} />
          <Rect x={x - 4} y={550} width={8} height={3} fill={palette.white} />
        </G>
      ))}
      <G>
        <Rect x={124} y={560} width={44} height={9} rx={2} fill={palette.white} />
        {[0, 1, 2, 3].map((i) => (
          <Path key={i} d={`M ${128 + i * 11} 569 l 7 -9 h 5 l -7 9 z`} fill={palette.engineRed} />
        ))}
        <Rect x={126} y={568} width={2.6} height={8} rx={1.3} fill={palette.slate} />
        <Rect x={163} y={568} width={2.6} height={8} rx={1.3} fill={palette.slate} />
      </G>
      {/* warning sign */}
      <Path d="M 236 528 l 11 19 l -22 0 z" fill={palette.safetyYellow} />
      <Path d="M 236 533 l 6.6 11.4 l -13.2 0 z" fill="#FFE07A" />
      <Rect x={234.7} y={534} width={2.6} height={7} rx={1.3} fill={palette.navy} />
      <Circle cx={236} cy={543} r={1.4} fill={palette.navy} />
    </G>
  );
}

/** The lighthouse on the far bank. */
function Lighthouse() {
  return (
    <G>
      {ground(338, 392, 18)}
      <Path d="M 330 390 L 332 344 L 344 344 L 346 390 Z" fill={palette.white} />
      <Path d="M 330 390 L 332 344 L 336 344 L 335 390 Z" fill={HI} />
      <Path d="M 343 344 L 346 390 L 342 390 Z" fill={SHADE} />
      <Rect x={331} y={356} width={14} height={8} fill={palette.engineRed} />
      <Rect x={330} y={374} width={16} height={8} fill={palette.engineRed} />
      <Rect x={330} y={336} width={16} height={9} rx={3} fill={palette.safetyYellow} />
      <Path d="M 328 336 L 338 326 L 348 336 Z" fill={palette.engineRed} />
      <Rect x={326} y={388} width={24} height={4} rx={2} fill="#C7CEE0" />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Static map                                                          */
/* ------------------------------------------------------------------ */

/** All of Spark City as one static SVG. Memoized — life and pins sit on top. */
const MapArt = memo(function MapArt({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${MAP_VB.w} ${MAP_VB.h}`} pointerEvents="none">
      <Defs>
        <LinearGradient id="mapGrass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A6DE84" />
          <Stop offset="0.5" stopColor={palette.grass} />
          <Stop offset="1" stopColor="#7CC55F" />
        </LinearGradient>
        <LinearGradient id="mapRiver" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.waterCyan} />
          <Stop offset="1" stopColor={palette.waterCyanDark} />
        </LinearGradient>
        {/* critique #14: the map is edge-to-edge and hazes into the sky rather
            than sitting on it as a hard green rectangle */}
        <LinearGradient id="mapHazeTop" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#BDE7FF" stopOpacity={0.95} />
          <Stop offset="0.55" stopColor="#CFEBD6" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#A6DE84" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="mapHazeBottom" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7CC55F" stopOpacity={0} />
          <Stop offset="1" stopColor="#5FA94A" stopOpacity={0.55} />
        </LinearGradient>
      </Defs>

      {/* ground */}
      <Rect x={0} y={0} width={MAP_VB.w} height={MAP_VB.h} fill="url(#mapGrass)" />
      {/* soft meadow patches */}
      <Ellipse cx={58} cy={392} rx={54} ry={30} fill="#B4E693" opacity={0.5} />
      <Ellipse cx={242} cy={430} rx={42} ry={30} fill="#B4E693" opacity={0.45} />
      {/* the construction site's sand lot, inside its block */}
      <Ellipse cx={180} cy={520} rx={40} ry={34} fill="#E9CE9A" />
      {/* distant hills behind the top haze */}
      <Path d="M -10 62 q 46 -34 96 -6 q 40 -30 92 -2 q 44 -26 96 0 q 40 -22 96 4 L 370 0 L -10 0 Z" fill="#8FCF87" opacity={0.55} />

      {/* ── river ─────────────────────────────────────────────────── */}
      <Path d={RIVER_D} stroke="#7FD3F7" strokeWidth={30} fill="none" strokeLinecap="round" />
      <Path d={RIVER_D} stroke="url(#mapRiver)" strokeWidth={23} fill="none" strokeLinecap="round" />
      <Path d={RIVER_D} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="14 30" fill="none" opacity={0.35} strokeLinecap="round" />

      {/* ── roads: fixed lanes, and every building lives between them ── */}
      <Road d={`M -10 ${ROADS.h1.y} L 370 ${ROADS.h1.y}`} width={ROADS.h1.w} />
      <Road d={`M -10 ${ROADS.h2.y} L 370 ${ROADS.h2.y}`} width={ROADS.h2.w} />
      <Road d={`M -10 ${ROADS.h3.y} L 370 ${ROADS.h3.y}`} width={ROADS.h3.w} />
      <Road d={`M ${ROADS.v1.x} ${ROADS.v1.y0} L ${ROADS.v1.x} ${ROADS.v1.y1}`} width={ROADS.v1.w} />

      {/* ── bridges: the only places a road may touch the water ───────── */}
      <Bridge y={ROADS.h1.y} cx={307} />
      <Bridge y={ROADS.h2.y} cx={296} />
      <Bridge y={ROADS.h3.y} cx={286} red />

      {/* ── the eleven places, each drawn as itself and dropped on its plot ── */}
      <G transform={plotTransform(PLOTS.station)}>
        <FireStation />
      </G>
      <G transform={plotTransform(PLOTS.school)}>
        <School />
      </G>
      <G transform={plotTransform(PLOTS.clockTower)}>
        <ClockTower />
      </G>
      <G transform={plotTransform(PLOTS.bakery)}>
        <Bakery />
      </G>
      <G transform={plotTransform(PLOTS.library)}>
        <Library />
      </G>
      <Park />
      <G transform={plotTransform(PLOTS.petShop)}>
        <PetShop />
      </G>
      <G transform={plotTransform(PLOTS.pizza)}>
        <Pizza />
      </G>
      <G transform={plotTransform(PLOTS.market)}>
        <Market />
      </G>
      <G transform={plotTransform(PLOTS.homes)}>
        <Homes />
      </G>
      <G transform={plotTransform(PLOTS.construction)}>
        <Construction />
      </G>
      <G transform={plotTransform(PLOTS.lighthouse)}>
        <Lighthouse />
      </G>

      {/* ── greenery: in the verges and the park, never on the tarmac ── */}
      <Trees
        pts={[
          [104, 104, 14],
          [104, 158, 13],
          [24, 158, 14],
          [204, 156, 14],
          [104, 246, 13],
          [24, 300, 14],
          [204, 298, 14],
          [104, 362, 13],
          [24, 442, 14],
          [204, 440, 14],
          [248, 348, 15],
          [104, 490, 13],
          [248, 452, 14],
          [24, 574, 14],
          [248, 540, 15],
        ]}
      />


      {/* haze at both edges so the board never reads as a rectangle on the sky */}
      <Rect x={0} y={0} width={MAP_VB.w} height={74} fill="url(#mapHazeTop)" />
      <Rect x={0} y={MAP_VB.h - 40} width={MAP_VB.w} height={40} fill="url(#mapHazeBottom)" />
    </Svg>
  );
});

/* ------------------------------------------------------------------ */
/* Life (critique #15) — nothing on this map used to move               */
/* ------------------------------------------------------------------ */

/** Three light streaks drifting along the river — the water is never still. */
function RiverShimmer({ width, height }: { width: number; height: number }) {
  const t = useLoop(9000);
  const glow = usePulse(2600, 0.5);
  const style = useAnimatedStyle(() => ({ opacity: 0.28 + glow.value * 0.32, transform: [{ translateY: t.value * 26 }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${MAP_VB.w} ${MAP_VB.h}`}>
        <Path d={RIVER_D} stroke="#FFFFFF" strokeWidth={5} strokeDasharray="8 46" fill="none" strokeLinecap="round" />
        <Path d={RIVER_D} stroke="#FFFFFF" strokeWidth={2.4} strokeDasharray="16 62" strokeDashoffset={30} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

/** A little car looping the middle road, left to right, forever. */
function LoopingCar({ u }: { u: number }) {
  const t = useLoop(17000);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: (-40 + t.value * 440) * u }] }));
  return (
    <Animated.View style={[styles.layer, { left: 0, top: 312 * u }, style]} pointerEvents="none">
      <Svg width={34 * u} height={20 * u} viewBox="0 0 34 20">
        <Ellipse cx={17} cy={17.5} rx={14} ry={2.6} fill={palette.navy} opacity={0.12} />
        <Rect x={2} y={5} width={30} height={11} rx={5} fill="#3E8FE0" />
        <Rect x={2} y={5} width={30} height={4} rx={2} fill="rgba(255,255,255,0.32)" />
        <Rect x={9} y={1.5} width={15} height={6} rx={2.6} fill="#2F6FB5" />
        <Rect x={10.5} y={2.6} width={12} height={3.4} rx={1.7} fill="#BDE7FF" />
        <Circle cx={9} cy={16} r={3} fill={palette.charcoalDark} />
        <Circle cx={25} cy={16} r={3} fill={palette.charcoalDark} />
        <Circle cx={9} cy={16} r={1.2} fill={palette.slateLight} />
        <Circle cx={25} cy={16} r={1.2} fill={palette.slateLight} />
        <Rect x={30} y={8} width={3} height={3} rx={1.5} fill={palette.safetyYellow} />
      </Svg>
    </Animated.View>
  );
}

/** Two birds arcing across the top of the town. */
function Birds({ u }: { u: number }) {
  const t = useLoop(23000);
  const flap = usePulse(720, 0.5);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (-50 + t.value * 450) * u },
      { translateY: Math.sin(t.value * Math.PI * 2) * 8 * u },
    ],
  }));
  const wing = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.68 + flap.value * 0.64 }] }));
  return (
    <Animated.View style={[styles.layer, { left: 0, top: 10 * u }, style]} pointerEvents="none">
      <Animated.View style={wing}>
        <Svg width={54 * u} height={20 * u} viewBox="0 0 54 20">
          <Path d="M4 10 q 6 -8 12 0 q 6 -8 12 0" stroke={palette.navySoft} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.6} />
          <Path d="M30 16 q 5 -6 10 0 q 5 -6 10 0" stroke={palette.navySoft} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.45} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** The fountain jet, rising and falling in the park basin. */
function Fountain({ u }: { u: number }) {
  const p = usePulse(2200, 0.5);
  const jet = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.72 + p.value * 0.5 }], opacity: 0.75 + p.value * 0.25 }));
  const ripple = useAnimatedStyle(() => ({ transform: [{ scale: 0.7 + p.value * 0.5 }], opacity: 0.5 - p.value * 0.35 }));
  return (
    <View style={[styles.layer, { left: 223 * u, top: 198 * u }]} pointerEvents="none">
      <Animated.View style={[styles.jet, jet]}>
        <Svg width={32 * u} height={30 * u} viewBox="0 0 32 30">
          <Path d="M16 30 q -7 -12 0 -22 q 7 10 0 22 z" fill={palette.waterCyanLight} />
          <Path d="M16 28 q -4 -9 0 -16 q 4 7 0 16 z" fill={palette.white} opacity={0.7} />
          <Circle cx={9} cy={13} r={2.2} fill={palette.waterCyanLight} />
          <Circle cx={23} cy={15} r={1.8} fill={palette.waterCyanLight} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.ripple, { left: 1 * u, top: 24 * u }, ripple]}>
        <Svg width={30 * u} height={16 * u} viewBox="0 0 30 16">
          <Ellipse cx={15} cy={8} rx={14} ry={7} fill="none" stroke={palette.white} strokeWidth={2} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** A little boat drifting down the river. */
function Boat({ u }: { u: number }) {
  const t = useLoop(26000);
  const rock = useIdleBob(4, 2600);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: t.value * 300 * u },
      { translateX: Math.sin(t.value * Math.PI * 3) * 9 * u },
      { rotate: `${rock.value}deg` },
    ],
    opacity: t.value > 0.94 ? (1 - t.value) / 0.06 : t.value < 0.06 ? t.value / 0.06 : 1,
  }));
  return (
    <Animated.View style={[styles.layer, { left: 291 * u, top: 196 * u }, style]} pointerEvents="none">
      <Svg width={30 * u} height={30 * u} viewBox="0 0 30 30">
        <Ellipse cx={15} cy={26} rx={13} ry={3} fill={palette.waterCyanDark} opacity={0.35} />
        <Path d="M3 20 h24 l -4 6 h -16 z" fill={palette.engineRed} />
        <Path d="M3 20 h24 l -1.4 2.2 h -21.2 z" fill="rgba(255,255,255,0.32)" />
        <Rect x={14} y={5} width={2.4} height={15} rx={1.2} fill={palette.woodDark} />
        <Path d="M16.4 6 L 25 17 L 16.4 17 Z" fill={palette.white} />
        <Path d="M13.6 8 L 7 17 L 13.6 17 Z" fill="#E7EFFF" />
      </Svg>
    </Animated.View>
  );
}

/** Puffs from the bakery chimney. */
function ChimneySmoke({ u }: { u: number }) {
  return (
    <View style={[styles.layer, { left: 72 * u, top: 204 * u }]} pointerEvents="none">
      <Puff u={u} periodMs={5200} delay={0} size={12} />
      <Puff u={u} periodMs={6100} delay={0.34} size={9} />
      <Puff u={u} periodMs={5600} delay={0.68} size={7} />
    </View>
  );
}

function Puff({ u, periodMs, delay, size }: { u: number; periodMs: number; delay: number; size: number }) {
  const t = useLoop(periodMs);
  const style = useAnimatedStyle(() => {
    const p = (t.value + delay) % 1;
    return {
      opacity: p < 0.12 ? p / 0.12 : (1 - p) * 0.7,
      transform: [{ translateY: -p * 34 * u }, { translateX: p * 9 * u }, { scale: 0.5 + p * 0.9 }],
    };
  });
  return (
    <Animated.View style={[styles.layer, { left: 8 * u, top: 26 * u }, style]} pointerEvents="none">
      <Svg width={size * 2 * u} height={size * 2 * u} viewBox={`0 0 ${size * 2} ${size * 2}`}>
        <Circle cx={size} cy={size} r={size * 0.8} fill={palette.smoke} opacity={0.75} />
        <Circle cx={size * 0.7} cy={size * 0.8} r={size * 0.5} fill="#D6DCEC" opacity={0.8} />
      </Svg>
    </Animated.View>
  );
}

/** The station flag, waving on its pole. */
function StationFlag({ u }: { u: number }) {
  const wave = useIdleBob(2.6, 1400);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wave.value}deg` }, { scaleX: 1 - Math.abs(wave.value) * 0.012 }],
  }));
  return (
    <Animated.View
      style={[styles.layer, { left: 69 * u, top: 60 * u, transformOrigin: 'left top' }, style]}
      pointerEvents="none"
    >
      <Svg width={24 * u} height={15 * u} viewBox="0 0 30 18">
        <Path d="M0 0 h 26 q -5 5 0 10 q -6 5 -12 2 q -8 -3 -14 1 z" fill={palette.engineRed} />
        <Path d="M0 0 h 9 q -2 5 0 10 q -4 2 -9 1 z" fill="rgba(255,255,255,0.32)" />
      </Svg>
    </Animated.View>
  );
}

/** Spark City: static art plus its ambient life, sized to `width`. */
export function TownMap({ width }: { width: number }) {
  const height = (MAP_VB.h / MAP_VB.w) * width;
  const u = width / MAP_VB.w;
  return (
    <View style={{ width, height }} pointerEvents="none">
      <MapArt width={width} height={height} />
      <RiverShimmer width={width} height={height} />
      <Fountain u={u} />
      <Boat u={u} />
      <ChimneySmoke u={u} />
      <StationFlag u={u} />
      <LoopingCar u={u} />
      <Birds u={u} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute' },
  jet: { position: 'absolute', transformOrigin: 'bottom center' },
  ripple: { position: 'absolute' },
});

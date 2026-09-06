import React, { memo } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { fontFamily, palette } from '@/theme';
import type { StationUpgradeId } from '@/content/types';
import { HIGHLIGHT, SHADE, SHADE_DEEP, SHADOW_FILL, SHADOW_OPACITY } from './tone';

/**
 * Design box for the firehouse façade. Every number below is in these units.
 *
 * y 40–188 roof and bell gable · 184–418 wall (sign, room grid, plates)
 * 412–488 garage band · 486–566 the apron the crew and the props stand on.
 */
export const FACADE_VB = { w: 360, h: 548 } as const;

const GRID = { x: 30, y: 216, w: 300, h: 164, cols: 3, rows: 2, gap: 9 } as const;

/** top of the apron slab, in design units */
const APRON_Y = 486;

export interface Rect2 {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FacadeLayout {
  width: number;
  height: number;
  scale: number;
  /** design-box units → screen px */
  px: (n: number) => number;
  /** six room tiles, left→right then top→bottom, in px */
  tiles: Rect2[];
  sign: Rect2;
  bell: { x: number; y: number; size: number };
  flag: { x: number; y: number; width: number; poleHeight: number };
  chimney: { x: number; y: number; size: number };
  catWindow: { x: number; y: number; size: number };
  pigeons: { x: number; y: number; size: number }[];
  doorLights: Rect2[];
  garageDoors: Rect2[];
  /** top edge of the apron slab, in px from the top of the façade */
  apronTop: number;
  /** height of the apron slab in px — the band the crew stands on */
  apronHeight: number;
}

/** Compute every anchor the Firehouse screen needs, for a façade of `width` px. */
export function facadeLayout(width: number): FacadeLayout {
  const scale = width / FACADE_VB.w;
  const px = (n: number) => n * scale;
  const tileW = (GRID.w - GRID.gap * (GRID.cols - 1)) / GRID.cols;
  const tileH = (GRID.h - GRID.gap * (GRID.rows - 1)) / GRID.rows;
  const tiles: Rect2[] = [];
  for (let r = 0; r < GRID.rows; r += 1) {
    for (let c = 0; c < GRID.cols; c += 1) {
      tiles.push({
        x: px(GRID.x + c * (tileW + GRID.gap)),
        y: px(GRID.y + r * (tileH + GRID.gap)),
        w: px(tileW),
        h: px(tileH),
      });
    }
  }
  return {
    width,
    height: FACADE_VB.h * scale,
    scale,
    px,
    tiles,
    sign: { x: px(64), y: px(162), w: px(232), h: px(41) },
    bell: { x: px(162), y: px(104), size: px(36) },
    flag: { x: px(282), y: px(46), width: px(52), poleHeight: px(104) },
    chimney: { x: px(38), y: px(64), size: px(30) },
    catWindow: { x: px(119), y: px(105), size: px(30) },
    pigeons: [
      { x: px(76), y: px(114), size: px(26) },
      { x: px(300), y: px(114), size: px(24) },
    ],
    doorLights: [
      { x: px(86), y: px(419), w: px(18), h: px(7) },
      { x: px(256), y: px(419), w: px(18), h: px(7) },
    ],
    garageDoors: [
      { x: px(30), y: px(428), w: px(130), h: px(56) },
      { x: px(200), y: px(428), w: px(130), h: px(56) },
    ],
    apronTop: px(APRON_Y),
    apronHeight: px(FACADE_VB.h - APRON_Y),
  };
}

/**
 * A bay door with a real opening: a masonry jamb, a 4-unit reveal inset into
 * it, the shutter face sitting inside that, and the shadow the reveal casts
 * across the top and left of the face (critique #4).
 */
function GarageDoor({ x, y, w, h, label }: Rect2 & { label: string }) {
  const slats = [0.3, 0.5, 0.7];
  const r = 4; // the reveal
  const fx = x + r;
  const fy = y + r;
  const fw = w - r * 2;
  const fh = h - r;
  return (
    <G>
      {/* jamb + head, then the dark reveal behind the shutter */}
      <Rect x={x - 5} y={y - 7} width={w + 10} height={h + 7} rx={7} fill="#8E3A22" />
      <Rect x={x - 5} y={y - 7} width={w + 10} height={5} rx={2.5} fill="#B15A2E" />
      <Rect x={x} y={y} width={w} height={h} rx={5} fill="#4A2214" />
      {/* shutter face */}
      <Rect x={fx} y={fy} width={fw} height={fh} rx={4} fill={palette.engineRed} />
      <Rect x={fx} y={fy} width={fw} height={fh * 0.2} rx={4} fill={palette.engineRedLight} opacity={0.5} />
      {/* the reveal's cast shadow onto the face */}
      <Rect x={fx} y={fy} width={fw} height={5} rx={2.5} fill={SHADE_DEEP} />
      <Rect x={fx} y={fy} width={4.5} height={fh} rx={2.2} fill={SHADE} />
      {/* window band */}
      {[0, 1, 2, 3].map((i) => (
        <G key={i}>
          <Rect x={fx + 9 + i * ((fw - 18) / 4)} y={fy + fh * 0.15} width={(fw - 18) / 4 - 6} height={fh * 0.26} rx={3} fill="#204A86" />
          <Rect x={fx + 9 + i * ((fw - 18) / 4)} y={fy + fh * 0.15} width={(fw - 18) / 4 - 6} height={fh * 0.14} rx={3} fill="#3C6FB4" />
        </G>
      ))}
      {slats.map((t) => (
        <Rect key={t} x={fx + 3} y={fy + fh * (t + 0.2)} width={fw - 6} height={2.4} rx={1.2} fill={palette.engineRedDark} opacity={0.7} />
      ))}
      {/* the engine plate */}
      <Rect x={fx + fw * 0.24} y={fy + fh * 0.58} width={fw * 0.52} height={13} rx={5} fill={palette.cream} />
      <Rect x={fx + fw * 0.24} y={fy + fh * 0.58 + 9.4} width={fw * 0.52} height={3.6} rx={1.8} fill={SHADE} />
      <SvgText
        x={fx + fw * 0.5}
        y={fy + fh * 0.58 + 9.8}
        fontFamily={fontFamily.display}
        fontSize={9}
        fontWeight="700"
        fill={palette.navy}
        textAnchor="middle"
        letterSpacing={0.7}
      >
        {label}
      </SvgText>
      <Rect x={fx + fw * 0.36} y={fy + fh - 7} width={fw * 0.28} height={3.6} rx={1.8} fill={palette.safetyYellow} />
    </G>
  );
}

/** A recessed room panel: shadowed well, a sill ledge, a lintel above. */
function TileWell({ x, y, w, h }: Rect2) {
  return (
    <G>
      <Rect x={x - 4} y={y - 4} width={w + 8} height={h + 10} rx={17} fill="#E4C48E" />
      <Rect x={x - 4} y={y - 4} width={w + 8} height={7} rx={3.5} fill={SHADE} />
      <Rect x={x - 6} y={y + h + 2} width={w + 12} height={5.4} rx={2.7} fill="#F3DCAF" />
      <Rect x={x - 6} y={y + h + 5.4} width={w + 12} height={3} rx={1.5} fill={SHADE} />
    </G>
  );
}

/* ── apron dressing ───────────────────────────────────────────────── */

/** The station hydrant. Small, friendly, three tones, on a contact ellipse. */
function ApronHydrant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={1} rx={16} ry={3.5} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Rect x={-13} y={-6} width={26} height={7} rx={3.5} fill={palette.engineRedDark} />
      <Rect x={-9} y={-33} width={18} height={28} rx={7} fill={palette.engineRed} />
      <Rect x={2} y={-31} width={6} height={24} rx={3} fill={SHADE} />
      <Rect x={-8} y={-31} width={4} height={24} rx={2} fill={HIGHLIGHT} />
      <Rect x={-15} y={-27} width={7} height={8} rx={3.4} fill={palette.engineRedDark} />
      <Rect x={8} y={-27} width={7} height={8} rx={3.4} fill={palette.engineRedDark} />
      <Rect x={-11} y={-39} width={22} height={7} rx={3.5} fill={palette.engineRedDark} />
      <Path d="M -8 -39 q 0 -8 8 -8 q 8 0 8 8 z" fill={palette.engineRed} />
      <Circle cx={0} cy={-48} r={3.4} fill={palette.gold} />
      <Ellipse cx={-3.5} cy={-42} rx={3.4} ry={1.8} fill={HIGHLIGHT} />
    </G>
  );
}

/** A coiled hose lying on the apron. */
function CoiledHose({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={2} rx={19} ry={4.2} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Ellipse cx={0} cy={-4} rx={18} ry={9} fill={palette.gold} />
      <Ellipse cx={0} cy={-6} rx={18} ry={9} fill={palette.safetyYellow} />
      <Ellipse cx={0} cy={-6} rx={11.5} ry={5.6} fill={palette.goldDark} />
      <Ellipse cx={0} cy={-7} rx={11.5} ry={5.6} fill="#FFD766" />
      <Ellipse cx={0} cy={-7} rx={5} ry={2.4} fill={palette.woodDark} opacity={0.5} />
      <Ellipse cx={-7} cy={-11} rx={6} ry={2.2} fill={HIGHLIGHT} />
      <Rect x={12} y={-9} width={12} height={6} rx={3} fill={palette.slate} />
      <Rect x={12} y={-9} width={12} height={2.6} rx={1.3} fill={palette.slateLight} />
    </G>
  );
}

/** A yellow bollard guarding the apron. */
function Bollard({ x, y, h = 30 }: { x: number; y: number; h?: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={9} ry={2.4} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Rect x={x - 6} y={y - h} width={12} height={h} rx={6} fill={palette.safetyYellow} />
      <Rect x={x + 1} y={y - h + 2} width={4} height={h - 4} rx={2} fill={SHADE} />
      <Rect x={x - 5} y={y - h + 3} width={3} height={h - 8} rx={1.5} fill={HIGHLIGHT} />
      <Rect x={x - 6} y={y - h * 0.62} width={12} height={5} fill={palette.white} opacity={0.85} />
    </G>
  );
}

/** A traffic cone, parked at the apron edge. */
function ApronCone({ x, y, h = 26 }: { x: number; y: number; h?: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={12} ry={2.8} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Rect x={x - 11} y={y - 5} width={22} height={5.6} rx={2.8} fill={palette.orangeDark} />
      <Path d={`M ${x} ${y - h} q 3 0 4 4 L ${x + 8} ${y - 4} L ${x - 8} ${y - 4} L ${x - 4} ${y - h + 4} q 1 -4 4 -4 Z`} fill={palette.orange} />
      <Path d={`M ${x} ${y - h} q 3 0 4 4 L ${x + 8} ${y - 4} L ${x + 1} ${y - 4} Z`} fill={SHADE} />
      <Path d={`M ${x - 4.6} ${y - h * 0.56} L ${x + 4.6} ${y - h * 0.56} L ${x + 5.6} ${y - h * 0.32} L ${x - 5.6} ${y - h * 0.32} Z`} fill={palette.white} />
    </G>
  );
}

/** The wall-mounted hose reel between the bays, on its own backing plate. */
function HoseReel({ x, y }: { x: number; y: number }) {
  return (
    <G>
      {/* backing plate, so the reel is mounted rather than floating */}
      <Rect x={x - 17} y={y - 4} width={34} height={44} rx={9} fill={SHADE_DEEP} />
      <Rect x={x - 15} y={y - 2} width={30} height={40} rx={8} fill={palette.creamDeep} />
      <Rect x={x - 15} y={y - 2} width={30} height={5} rx={2.5} fill={HIGHLIGHT} />
      <Circle cx={x} cy={y + 17} r={13} fill={palette.charcoal} />
      <Circle cx={x} cy={y + 16} r={11} fill={palette.engineRed} />
      <Circle cx={x} cy={y + 16} r={7.6} fill={palette.engineRedDark} />
      <Circle cx={x} cy={y + 16} r={4.4} fill={palette.slateLight} />
      <Path d={`M ${x - 9} ${y + 12} a 10 10 0 0 1 6 -6`} stroke={HIGHLIGHT} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Path d={`M ${x + 9} ${y + 21} q 5 7 1 12`} stroke={palette.safetyYellow} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Circle cx={x} cy={y + 16} r={1.8} fill={palette.charcoalDark} />
    </G>
  );
}

/** The station noticeboard — a cream board with a red header and pinned notes. */
function NoticeBoard({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 1} y={y + 1} width={54} height={30} rx={6} fill={SHADE} />
      <Rect x={x} y={y} width={54} height={30} rx={6} fill={palette.cream} />
      <Rect x={x} y={y} width={54} height={9} rx={4.5} fill={palette.engineRed} />
      <Rect x={x} y={y + 6} width={54} height={3} fill={SHADE} />
      <Rect x={x + 5} y={y + 14} width={30} height={2.6} rx={1.3} fill={palette.navyMuted} opacity={0.5} />
      <Rect x={x + 5} y={y + 19} width={40} height={2.6} rx={1.3} fill={palette.navyMuted} opacity={0.4} />
      <Rect x={x + 5} y={y + 24} width={22} height={2.6} rx={1.3} fill={palette.navyMuted} opacity={0.35} />
      <Circle cx={x + 45} cy={y + 20} r={3} fill={palette.safetyYellow} />
    </G>
  );
}

/** The street number, screwed to the wall by the doors. */
function AddressPlate({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 1} y={y + 1} width={52} height={22} rx={7} fill={SHADE} />
      <Rect x={x} y={y} width={52} height={22} rx={7} fill={palette.cream} />
      <Rect x={x} y={y} width={52} height={5} rx={2.5} fill={HIGHLIGHT} />
      <Rect x={x} y={y + 17} width={52} height={5} rx={2.5} fill={SHADE} />
      <SvgText
        x={x + 26}
        y={y + 16}
        fontFamily={fontFamily.display}
        fontSize={12}
        fontWeight="700"
        fill={palette.navy}
        textAnchor="middle"
        letterSpacing={0.4}
      >
        No. 1
      </SvgText>
    </G>
  );
}

export interface StationFacadeProps {
  width: number;
  /** station upgrades the child has bought — they change the art */
  unlocked?: readonly StationUpgradeId[];
}

/**
 * The 2.5D firehouse: bell tower, flag mast, "STATION SPARK" plaque, a 3×2 grid
 * of recessed room panels (the pressable tiles are laid over these by the
 * screen) and two big red garage doors. Purely static art — memoized, because
 * the whole station lives under drifting clouds and animated crew.
 */
export const StationFacade = memo(function StationFacade({ width, unlocked = [] }: StationFacadeProps) {
  const has = (id: StationUpgradeId) => unlocked.includes(id);
  const height = (FACADE_VB.h / FACADE_VB.w) * width;
  const tileW = (GRID.w - GRID.gap * (GRID.cols - 1)) / GRID.cols;
  const tileH = (GRID.h - GRID.gap * (GRID.rows - 1)) / GRID.rows;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${FACADE_VB.w} ${FACADE_VB.h}`} pointerEvents="none">
      <Defs>
        <LinearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F8E2B6" />
          <Stop offset="1" stopColor={palette.tan} />
        </LinearGradient>
        <LinearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.engineRedLight} />
          <Stop offset="1" stopColor={palette.engineRed} />
        </LinearGradient>
        <LinearGradient id="soffit" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1F2A5A" stopOpacity={0.2} />
          <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0} />
        </LinearGradient>
        {/* the apron reads a value step *under* the footpath it crosses, so
            the driveway is a slab of its own rather than more paving */}
        <LinearGradient id="apronGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#BAC1D6" />
          <Stop offset="1" stopColor="#CFD5E5" />
        </LinearGradient>
        <LinearGradient id="baseShade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1F2A5A" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* ── training tower (upgrade) — behind everything ─────────────── */}
      {has('training-tower') ? (
        <G>
          <Path d="M 6 44 L 42 18 L 78 44 Z" fill={palette.engineRedDark} />
          <Rect x={10} y={42} width={64} height={11} rx={4} fill={palette.wood} />
          <Rect x={18} y={52} width={8} height={132} rx={3} fill={palette.woodDark} />
          <Rect x={58} y={52} width={8} height={132} rx={3} fill={palette.woodDark} />
          <Rect x={14} y={86} width={56} height={7} rx={3} fill={palette.wood} />
          <Rect x={14} y={126} width={56} height={7} rx={3} fill={palette.wood} />
          <Path d="M 22 92 L 62 126 M 62 92 L 22 126" stroke={palette.wood} strokeWidth={4} strokeLinecap="round" />
        </G>
      ) : null}

      {/* ── bell gable ───────────────────────────────────────────────── */}
      <Path d="M 96 94 L 180 40 L 264 94 Z" fill="url(#roofGrad)" />
      <Rect x={92} y={88} width={176} height={13} rx={5} fill={palette.engineRedDark} />
      <Rect x={116} y={96} width={128} height={48} fill="url(#wallGrad)" />
      <Rect x={116} y={96} width={128} height={6} fill={palette.tanDark} opacity={0.5} />
      {/* bell niche (the <Bell/> rig is layered over this by the screen) */}
      <Path d="M 156 144 L 156 124 A 24 24 0 0 1 204 124 L 204 144 Z" fill={has('bell-brass') ? '#7A4A18' : '#B5652F'} />
      <Path d="M 160 144 L 160 125 A 20 20 0 0 1 200 125 L 200 144 Z" fill={has('bell-brass') ? '#5E3712' : '#8E4A20'} />
      {/* round tower window (the cat lives here) */}
      <Circle cx={134} cy={120} r={16} fill={palette.tanDark} />
      <Circle cx={226} cy={120} r={11} fill={palette.tanDark} />
      <Circle cx={226} cy={120} r={8} fill={palette.charcoal} opacity={0.55} />

      {/* ── chimney ──────────────────────────────────────────────────── */}
      <Rect x={38} y={94} width={24} height={48} rx={3} fill="#C96A3A" />
      <Rect x={34} y={92} width={32} height={10} rx={4} fill="#A2512A" />

      {/* ── roof-garden (upgrade) ────────────────────────────────────── */}
      {has('roof-garden') ? (
        <G>
          <Ellipse cx={262} cy={132} rx={17} ry={12} fill={palette.grass} />
          <Ellipse cx={252} cy={136} rx={11} ry={8} fill={palette.grassDark} />
          <Circle cx={258} cy={124} r={3.4} fill={palette.pink} />
          <Circle cx={270} cy={128} r={3} fill={palette.safetyYellow} />
          <Ellipse cx={290} cy={134} rx={12} ry={9} fill={palette.grass} />
          <Circle cx={288} cy={127} r={3} fill={palette.purple} />
        </G>
      ) : null}

      {/* ── main roof ────────────────────────────────────────────────── */}
      {/* the side plane first: the building's right return, receding away */}
      <Path d="M 332 190 L 352 208 L 352 486 L 332 486 Z" fill={palette.tanDark} />
      <Path d="M 332 190 L 352 208 L 352 486 L 332 486 Z" fill={SHADE} />
      <Path d="M 2 178 L 34 140 L 326 140 L 358 178 Z" fill="url(#roofGrad)" />
      <Path d="M 34 140 L 326 140 L 322 150 L 38 150 Z" fill={HIGHLIGHT} />
      <Path d="M 326 140 L 358 178 L 352 178 L 320 142 Z" fill={SHADE} />
      <Rect x={0} y={174} width={360} height={14} rx={6} fill={palette.engineRedDark} />

      {/* ── wall ─────────────────────────────────────────────────────── */}
      <Rect x={14} y={184} width={332} height={234} rx={6} fill="url(#wallGrad)" />
      <Rect x={24} y={194} width={312} height={214} rx={10} fill={palette.creamDeep} />
      {/* roof soffit shadow: the eaves sitting on the wall (critique #4) */}
      <Rect x={14} y={184} width={332} height={16} rx={6} fill="url(#soffit)" />
      <Rect x={24} y={200} width={312} height={4} rx={2} fill={HIGHLIGHT} />

      {/* ── the STATION SPARK name board (the screen lays the text over it) ── */}
      <G>
        <Rect x={60} y={158} width={240} height={54} rx={20} fill={SHADOW_FILL} opacity={0.16} />
        <Rect x={60} y={156} width={240} height={52} rx={20} fill={palette.tanDark} />
        <Rect x={64} y={160} width={232} height={44} rx={17} fill={palette.cream} />
        <Rect x={64} y={160} width={232} height={6} rx={3} fill={HIGHLIGHT} />
        <Rect x={64} y={198} width={232} height={6} rx={3} fill={SHADE} />
      </G>

      {/* pilasters between the rooms */}
      <Rect x={GRID.x + tileW + 1} y={206} width={5} height={190} rx={2} fill={palette.tanDark} opacity={0.4} />
      <Rect x={GRID.x + 2 * (tileW + GRID.gap) - 6} y={206} width={5} height={190} rx={2} fill={palette.tanDark} opacity={0.4} />

      {/* recessed wells behind the six room tiles */}
      {Array.from({ length: 6 }, (_, i) => {
        const c = i % GRID.cols;
        const r = Math.floor(i / GRID.cols);
        return <TileWell key={i} x={GRID.x + c * (tileW + GRID.gap)} y={GRID.y + r * (tileH + GRID.gap)} w={tileW} h={tileH} />;
      })}

      {/* ── mural (upgrade) ──────────────────────────────────────────── */}
      {has('mural') ? (
        <G>
          <Rect x={30} y={386} width={300} height={20} rx={7} fill="#CFE9FF" />
          <Path d="M 30 402 Q 90 386 150 402 Q 210 416 270 398 Q 300 390 330 400 L 330 406 L 30 406 Z" fill={palette.grass} />
          <Circle cx={62} cy={393} r={6} fill={palette.safetyYellow} />
          <Path d="M 100 400 l 5 -8 l 5 8 z" fill={palette.leafGreen} />
          <Path d="M 196 401 l 6 -9 l 6 9 z" fill={palette.leafGreenDark} />
          <Path d="M 246 400 c 3 -4 8 -1 4 3 l -4 4 l -4 -4 c -4 -4 1 -7 4 -3 z" fill={palette.engineRed} />
          <Rect x={140} y={393} width={12} height={10} rx={2} fill={palette.cream} />
          <Path d="M 138 393 L 146 387 L 154 393 Z" fill={palette.engineRed} />
        </G>
      ) : null}

      {/* ── flower boxes (upgrade) ───────────────────────────────────── */}
      {has('garden') ? (
        <G>
          {[42, 258].map((bx) => (
            <G key={bx}>
              <Rect x={bx} y={398} width={60} height={14} rx={4} fill={palette.wood} />
              <Rect x={bx} y={398} width={60} height={4} rx={2} fill={palette.woodDark} opacity={0.6} />
              <Ellipse cx={bx + 14} cy={396} rx={11} ry={7} fill={palette.grassDark} />
              <Ellipse cx={bx + 34} cy={394} rx={12} ry={8} fill={palette.grass} />
              <Ellipse cx={bx + 50} cy={396} rx={10} ry={7} fill={palette.grassDark} />
              <Circle cx={bx + 12} cy={391} r={3.4} fill={palette.pink} />
              <Circle cx={bx + 32} cy={388} r={3.4} fill={palette.safetyYellow} />
              <Circle cx={bx + 50} cy={391} r={3.2} fill={palette.purple} />
            </G>
          ))}
        </G>
      ) : null}

      {/* ── wall plates: the address and the crew noticeboard ─────────── */}
      <AddressPlate x={26} y={386} />
      <NoticeBoard x={278} y={380} />

      {/* ── garage band ──────────────────────────────────────────────── */}
      <Rect x={6} y={412} width={348} height={76} rx={8} fill="#C96A3A" />
      <Rect x={6} y={412} width={348} height={8} rx={4} fill="#A2512A" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Rect key={i} x={12 + i * 43} y={424} width={38} height={3} rx={1.5} fill="#B15A2E" opacity={0.55} />
      ))}
      <GarageDoor x={30} y={428} w={130} h={56} label="ENGINE 1" />
      <GarageDoor x={200} y={428} w={130} h={56} label="ENGINE 2" />
      {/* the hose reel on the pier between the bays */}
      <HoseReel x={180} y={432} />
      {/* lamp housings above the doors (the glow itself is animated by the screen) */}
      <Rect x={82} y={415} width={26} height={9} rx={4} fill={palette.charcoal} />
      <Rect x={252} y={415} width={26} height={9} rx={4} fill={palette.charcoal} />

      {/* ── doghouse (upgrade) ───────────────────────────────────────── */}
      {has('pet-area') ? (
        <G>
          <Rect x={298} y={452} width={54} height={34} rx={5} fill={palette.wood} />
          <Path d="M 292 454 L 325 434 L 358 454 Z" fill={palette.engineRed} />
          <Path d="M 313 486 L 313 466 A 12 12 0 0 1 337 466 L 337 486 Z" fill="#7A4A22" />
          <Circle cx={325} cy={448} r={5} fill={palette.safetyYellow} />
        </G>
      ) : null}

      {/* ── the apron ────────────────────────────────────────────────── */}
      {/*
        The forecourt, gathering from the full frontage into the width of the
        crossover. It used to splay *outward* to the frame edges, which meant
        that at phone size it covered the footpath and the kerb entirely — the
        building met the road with no street between them. Drawing it as a
        funnel gives the kerb line somewhere to run, and lets the tyre marks
        converge onto the dropped kerb the engines actually use.
      */}
      <Path
        d={`M 6 ${APRON_Y} L 354 ${APRON_Y} Q 348 ${APRON_Y + 34} 326 548 L 34 548 Q 12 ${APRON_Y + 34} 6 ${APRON_Y} Z`}
        fill="url(#apronGrad)"
      />
      {/* soft top lip, never a hard seam (rule #7) */}
      <Path d={`M 6 ${APRON_Y} L 354 ${APRON_Y} Q 356 ${APRON_Y + 5} 356 ${APRON_Y + 8} L 4 ${APRON_Y + 8} Q 4 ${APRON_Y + 5} 6 ${APRON_Y} Z`} fill="#EDF1F8" />
      {/* the two gathered edges, lit so the ramp reads as a slab with a shape */}
      <Path d={`M 6 ${APRON_Y} Q 12 ${APRON_Y + 34} 34 548 L 42 548 Q 20 ${APRON_Y + 34} 12 ${APRON_Y} Z`} fill="#E7EBF5" />
      <Path d={`M 354 ${APRON_Y} Q 348 ${APRON_Y + 34} 326 548 L 318 548 Q 340 ${APRON_Y + 34} 348 ${APRON_Y} Z`} fill="#E7EBF5" />
      {/* the building's cast shadow spilling onto it */}
      <Rect x={-6} y={APRON_Y} width={372} height={22} fill="url(#baseShade)" />
      {/* tyre marks rolling out of both bays — a whisper, not a skid */}
      <G opacity={0.62}>
        <Path d={`M 66 ${APRON_Y + 6} Q 58 ${APRON_Y + 32} 50 548`} stroke={SHADE} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d={`M 126 ${APRON_Y + 6} Q 126 ${APRON_Y + 32} 124 548`} stroke={SHADE} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d={`M 234 ${APRON_Y + 6} Q 234 ${APRON_Y + 32} 236 548`} stroke={SHADE} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d={`M 294 ${APRON_Y + 6} Q 302 ${APRON_Y + 32} 310 548`} stroke={SHADE} strokeWidth={7} fill="none" strokeLinecap="round" />
      </G>
      {/* the yellow guide dashes between the bays */}
      {[0, 1].map((i) => (
        <Rect key={i} x={177} y={APRON_Y + 18 + i * 15} width={7} height={11} rx={3.5} fill={palette.safetyYellow} opacity={0.9} />
      ))}

      {/* ── apron dressing (critique #3) ─────────────────────────────── */}
      {/* set back up the apron so the crew standing at the front edge never
          covers them */}
      <ApronHydrant x={96} y={520} s={0.8} />
      <CoiledHose x={138} y={526} s={0.74} />
      <Bollard x={172} y={516} h={26} />
      <Bollard x={200} y={516} h={26} />
      <ApronCone x={276} y={522} h={24} />
      {/* the yard drain, so the apron reads as a real surface */}
      <G>
        <Rect x={224} y={506} width={24} height={11} rx={5} fill={SHADE_DEEP} />
        <Rect x={226} y={508} width={20} height={7} rx={3.5} fill="#AEB6CC" />
        <Rect x={228} y={509.6} width={16} height={1.6} rx={0.8} fill={SHADE_DEEP} />
        <Rect x={228} y={512.4} width={16} height={1.6} rx={0.8} fill={SHADE_DEEP} />
      </G>
      {/*
        Two planters, where the hedges used to sprawl.

        The apron used to sit in grass, so its corners were tucked in with two
        big hedge masses. It now meets a footpath and a kerb, and a shrub
        growing out of paving reads as a mistake — so the green is potted. Same
        job (the slab's corners are softened, the station keeps a touch of
        life), one third of the ink.
      */}
      {[16, 344].map((cx) => (
        <G key={cx}>
          <Ellipse cx={cx} cy={528} rx={21} ry={4.6} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
          <Ellipse cx={cx - 5} cy={504} rx={16} ry={13} fill="#3F944E" />
          <Ellipse cx={cx + 7} cy={506} rx={14} ry={12} fill="#4FA858" />
          <Ellipse cx={cx} cy={496} rx={12} ry={10} fill="#5CB861" />
          <Ellipse cx={cx - 4} cy={492} rx={7} ry={4} fill={HIGHLIGHT} />
          <Path d={`M ${cx - 17} 512 L ${cx + 17} 512 L ${cx + 13} 530 L ${cx - 13} 530 Z`} fill={palette.tanDark} />
          <Path d={`M ${cx + 4} 512 L ${cx + 17} 512 L ${cx + 13} 530 L ${cx + 3} 530 Z`} fill={SHADE} />
          <Rect x={cx - 19} y={509} width={38} height={7} rx={3.5} fill={palette.creamDeep} />
          <Rect x={cx - 19} y={513} width={38} height={3} rx={1.5} fill={SHADE} />
        </G>
      ))}
    </Svg>
  );
});

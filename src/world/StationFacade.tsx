import React, { memo } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import type { StationUpgradeId } from '@/content/types';

/** Design box for the firehouse façade. Every number below is in these units. */
export const FACADE_VB = { w: 360, h: 500 } as const;

const GRID = { x: 30, y: 216, w: 300, h: 164, cols: 3, rows: 2, gap: 9 } as const;

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
    sign: { x: px(68), y: px(164), w: px(224), h: px(42) },
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
  };
}

function GarageDoor({ x, y, w, h }: Rect2) {
  const slats = [0.28, 0.52, 0.76];
  return (
    <G>
      <Rect x={x - 4} y={y - 6} width={w + 8} height={h + 6} rx={6} fill="#8E3A22" />
      <Rect x={x} y={y} width={w} height={h} rx={5} fill={palette.engineRed} />
      <Rect x={x} y={y} width={w} height={h * 0.22} rx={5} fill={palette.engineRedLight} opacity={0.45} />
      {[0, 1, 2, 3].map((i) => (
        <Rect key={i} x={x + 10 + i * ((w - 20) / 4)} y={y + h * 0.16} width={(w - 20) / 4 - 6} height={h * 0.28} rx={3} fill="#2F5FA8" />
      ))}
      {slats.map((t) => (
        <Rect key={t} x={x + 4} y={y + h * (t + 0.22)} width={w - 8} height={2.6} rx={1.3} fill={palette.engineRedDark} opacity={0.7} />
      ))}
      <Rect x={x + w * 0.36} y={y + h - 9} width={w * 0.28} height={4} rx={2} fill={palette.safetyYellow} />
    </G>
  );
}

function TileWell({ x, y, w, h }: Rect2) {
  return (
    <G>
      <Rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={16} fill="#E4C48E" />
      <Rect x={x - 3} y={y + h - 1} width={w + 6} height={8} rx={4} fill="#D6B47C" />
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
      <Path d="M 2 178 L 34 140 L 326 140 L 358 178 Z" fill="url(#roofGrad)" />
      <Path d="M 34 140 L 326 140 L 322 150 L 38 150 Z" fill="#FFFFFF" opacity={0.22} />
      <Rect x={0} y={174} width={360} height={14} rx={6} fill={palette.engineRedDark} />

      {/* ── wall ─────────────────────────────────────────────────────── */}
      <Rect x={14} y={184} width={332} height={234} rx={6} fill="url(#wallGrad)" />
      <Rect x={24} y={194} width={312} height={214} rx={10} fill={palette.creamDeep} />
      <Rect x={24} y={194} width={312} height={5} rx={2} fill="#FFFFFF" opacity={0.5} />
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

      {/* ── garage band ──────────────────────────────────────────────── */}
      <Rect x={6} y={412} width={348} height={76} rx={8} fill="#C96A3A" />
      <Rect x={6} y={412} width={348} height={8} rx={4} fill="#A2512A" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Rect key={i} x={12 + i * 43} y={424} width={38} height={3} rx={1.5} fill="#B15A2E" opacity={0.55} />
      ))}
      <GarageDoor x={30} y={428} w={130} h={56} />
      <GarageDoor x={200} y={428} w={130} h={56} />
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

      {/* ── driveway ─────────────────────────────────────────────────── */}
      <Rect x={0} y={486} width={360} height={14} fill="#C9CFE0" />
      <Rect x={0} y={486} width={360} height={4} fill="#B4BBD0" />
      {[60, 140, 220, 300].map((x) => (
        <Rect key={x} x={x} y={492} width={22} height={4} rx={2} fill={palette.safetyYellow} opacity={0.75} />
      ))}
    </Svg>
  );
});

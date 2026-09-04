import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import type { SceneId } from '@/learning/types';
import { palette } from '@/theme';

const SHADE = 'rgba(31,42,90,0.14)';
const SHEEN = 'rgba(255,255,255,0.32)';

/* ================================================================= */
/* Fire truck — side view with the equipment bay open                 */
/* ================================================================= */

export const TRUCK_VIEW = { w: 360, h: 214 } as const;
export const TRUCK_BAY = { x: 76, y: 40, w: 266, h: 112 } as const;

/** Pixel rectangle of the open compartment for a given rendered width. */
export function truckBayRect(width: number) {
  const k = width / TRUCK_VIEW.w;
  return {
    k,
    x: TRUCK_BAY.x * k,
    y: TRUCK_BAY.y * k,
    width: TRUCK_BAY.w * k,
    height: TRUCK_BAY.h * k,
    height_total: TRUCK_VIEW.h * k,
  };
}

export function TruckSide({ width }: { width: number }) {
  const height = (width * TRUCK_VIEW.h) / TRUCK_VIEW.w;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${TRUCK_VIEW.w} ${TRUCK_VIEW.h}`}>
      <Ellipse cx={180} cy={200} rx={168} ry={12} fill="rgba(31,42,90,0.13)" />
      {/* body */}
      <Rect x={4} y={26} width={352} height={148} rx={20} fill={palette.engineRed} />
      <Rect x={4} y={26} width={352} height={12} rx={6} fill={SHEEN} />
      {/* cab */}
      <Path d="M4 46c0-11 9-20 20-20h44v148H4z" fill={palette.engineRedDark} />
      <Rect x={12} y={44} width={46} height={34} rx={9} fill={palette.waterCyanLight} />
      <Path d="M12 62h46v16a9 9 0 0 1-9 9H21a9 9 0 0 1-9-9z" fill={palette.waterCyan} opacity={0.55} />
      <Rect x={14} y={96} width={16} height={7} rx={3.5} fill={palette.charcoal} />
      {/* light bar */}
      <Rect x={16} y={16} width={44} height={12} rx={6} fill={palette.navySoft} />
      <Rect x={20} y={18} width={16} height={8} rx={4} fill={palette.waterCyan} />
      <Rect x={40} y={18} width={16} height={8} rx={4} fill={palette.engineRedLight} />
      {/* reflective stripe */}
      <Rect x={4} y={128} width={352} height={13} fill={palette.safetyYellow} />
      <Rect x={4} y={128} width={352} height={4} fill="rgba(255,255,255,0.35)" />
      {/* open bay */}
      <Rect
        x={TRUCK_BAY.x - 8}
        y={TRUCK_BAY.y - 10}
        width={TRUCK_BAY.w + 16}
        height={TRUCK_BAY.h + 20}
        rx={14}
        fill={palette.slateLight}
      />
      <Rect x={TRUCK_BAY.x} y={TRUCK_BAY.y} width={TRUCK_BAY.w} height={TRUCK_BAY.h} rx={8} fill={palette.charcoal} />
      <Rect x={TRUCK_BAY.x} y={TRUCK_BAY.y} width={TRUCK_BAY.w} height={10} rx={5} fill="rgba(0,0,0,0.18)" />
      {/* roller door slats tucked above the bay */}
      {[0, 1, 2].map((i) => (
        <Rect
          key={i}
          x={TRUCK_BAY.x - 4}
          y={TRUCK_BAY.y - 20 + i * 6}
          width={TRUCK_BAY.w + 8}
          height={4.5}
          rx={2.2}
          fill={i % 2 ? palette.slate : palette.slateLight}
        />
      ))}
      {/* running board + wheels */}
      <Rect x={30} y={168} width={300} height={12} rx={6} fill={palette.charcoalDark} />
      {[86, 286].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={182} r={26} fill={palette.charcoal} />
          <Circle cx={cx} cy={182} r={13} fill={palette.slateLight} />
          <Circle cx={cx} cy={182} r={5} fill={palette.slate} />
        </G>
      ))}
    </Svg>
  );
}

/* ================================================================= */
/* Dispatch radio                                                     */
/* ================================================================= */

export const RADIO_VIEW = { w: 320, h: 190 } as const;
export const RADIO_LCD = { x: 30, y: 44, w: 260, h: 78 } as const;

export function radioLcdRect(width: number) {
  const k = width / RADIO_VIEW.w;
  return { k, x: RADIO_LCD.x * k, y: RADIO_LCD.y * k, width: RADIO_LCD.w * k, height: RADIO_LCD.h * k };
}

export function RadioBody({ width, lit = true }: { width: number; lit?: boolean }) {
  const height = (width * RADIO_VIEW.h) / RADIO_VIEW.w;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${RADIO_VIEW.w} ${RADIO_VIEW.h}`}>
      <Rect x={248} y={2} width={9} height={30} rx={4.5} fill={palette.slate} />
      <Circle cx={252} cy={4} r={7} fill={lit ? palette.waterCyan : palette.slate} />
      <Rect x={6} y={22} width={308} height={162} rx={26} fill={palette.navy} />
      <Rect x={6} y={22} width={308} height={12} rx={6} fill="rgba(255,255,255,0.16)" />
      <Rect x={18} y={34} width={284} height={138} rx={20} fill={palette.charcoal} />
      {/* LCD */}
      <Rect
        x={RADIO_LCD.x - 6}
        y={RADIO_LCD.y - 6}
        width={RADIO_LCD.w + 12}
        height={RADIO_LCD.h + 12}
        rx={14}
        fill={palette.charcoalDark}
      />
      <Rect
        x={RADIO_LCD.x}
        y={RADIO_LCD.y}
        width={RADIO_LCD.w}
        height={RADIO_LCD.h}
        rx={10}
        fill={lit ? '#0F3D2A' : '#14202E'}
      />
      <Rect x={RADIO_LCD.x} y={RADIO_LCD.y} width={RADIO_LCD.w} height={12} rx={6} fill="rgba(255,255,255,0.06)" />
      {/* speaker grille */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
          <Circle key={`${row}-${col}`} cx={44 + col * 20} cy={140 + row * 12} r={4} fill={palette.navySoft} />
        )),
      )}
      <Circle cx={274} cy={152} r={16} fill={palette.slate} />
      <Circle cx={274} cy={152} r={9} fill={palette.slateLight} />
      <Rect x={272} y={140} width={4} height={9} rx={2} fill={palette.charcoal} />
    </Svg>
  );
}

/* ================================================================= */
/* Hydrant                                                            */
/* ================================================================= */

export const HYDRANT_VIEW = { w: 96, h: 130 } as const;

export function Hydrant({ width, tone = 'red', wet }: { width: number; tone?: 'red' | 'yellow'; wet?: boolean }) {
  const height = (width * HYDRANT_VIEW.h) / HYDRANT_VIEW.w;
  const face = tone === 'red' ? palette.engineRed : palette.safetyYellow;
  const edge = tone === 'red' ? palette.engineRedDark : palette.gold;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${HYDRANT_VIEW.w} ${HYDRANT_VIEW.h}`}>
      <Ellipse cx={48} cy={122} rx={34} ry={7} fill="rgba(31,42,90,0.14)" />
      <Rect x={12} y={110} width={72} height={14} rx={7} fill={edge} />
      <Rect x={22} y={34} width={52} height={78} rx={20} fill={face} />
      <Rect x={28} y={40} width={12} height={62} rx={6} fill={SHEEN} />
      <Rect x={4} y={58} width={22} height={18} rx={9} fill={edge} />
      <Rect x={70} y={58} width={22} height={18} rx={9} fill={edge} />
      <Circle cx={11} cy={67} r={5} fill={palette.slateLight} />
      <Circle cx={85} cy={67} r={5} fill={palette.slateLight} />
      <Rect x={16} y={24} width={64} height={14} rx={7} fill={edge} />
      <Path d="M34 24c0-8 6-14 14-14s14 6 14 14z" fill={face} />
      <Circle cx={48} cy={12} r={7} fill={edge} />
      {wet ? <Circle cx={48} cy={70} r={30} fill="rgba(166,228,255,0.35)" /> : null}
    </Svg>
  );
}

/* ================================================================= */
/* Station wall clock (hands are drawn by the game so they can spin)  */
/* ================================================================= */

export const CLOCK_VIEW = 220;

export function ClockFace({ size }: { size: number }) {
  const c = CLOCK_VIEW / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${CLOCK_VIEW} ${CLOCK_VIEW}`}>
      <Circle cx={c} cy={c} r={104} fill={palette.navy} />
      <Circle cx={c} cy={c} r={104} fill={SHEEN} opacity={0.12} />
      <Circle cx={c} cy={c} r={92} fill={palette.cream} />
      <Circle cx={c} cy={c} r={92} fill="none" stroke={palette.creamDeep} strokeWidth={4} />
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0;
        const a = (i * Math.PI) / 30;
        const r1 = major ? 74 : 82;
        const r2 = 88;
        return (
          <Line
            key={i}
            x1={c + Math.sin(a) * r1}
            y1={c - Math.cos(a) * r1}
            x2={c + Math.sin(a) * r2}
            y2={c - Math.cos(a) * r2}
            stroke={major ? palette.navy : palette.slateLight}
            strokeWidth={major ? 5 : 2.5}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

/* ================================================================= */
/* Top-down fire truck (route grid)                                   */
/* ================================================================= */

export function TruckTop({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Rect x={13} y={5} width={34} height={50} rx={11} fill={palette.engineRed} />
      <Rect x={13} y={5} width={34} height={16} rx={9} fill={palette.engineRedDark} />
      <Rect x={19} y={9} width={22} height={9} rx={4} fill={palette.waterCyanLight} />
      <Rect x={17} y={25} width={26} height={26} rx={6} fill={palette.engineRedLight} />
      <Rect x={21} y={28} width={18} height={20} rx={4} fill={palette.safetyYellow} opacity={0.85} />
      {[31, 37, 43].map((y) => (
        <Rect key={y} x={21} y={y} width={18} height={3} rx={1.5} fill={palette.creamDeep} />
      ))}
      <Rect x={9} y={16} width={5} height={13} rx={2.5} fill={palette.charcoal} />
      <Rect x={46} y={16} width={5} height={13} rx={2.5} fill={palette.charcoal} />
      <Rect x={9} y={38} width={5} height={13} rx={2.5} fill={palette.charcoal} />
      <Rect x={46} y={38} width={5} height={13} rx={2.5} fill={palette.charcoal} />
      <Circle cx={24} cy={7} r={3} fill={palette.waterCyan} />
      <Circle cx={36} cy={7} r={3} fill={palette.safetyYellow} />
    </Svg>
  );
}

/* ================================================================= */
/* Town scenery                                                       */
/* ================================================================= */

type Emblem = 'bread' | 'pizza' | 'flag' | 'tree' | 'clock' | 'paw' | 'book' | 'basket' | 'window' | 'helmet';

const SCENES: Record<SceneId, { body: string; roof: string; emblem: Emblem }> = {
  bakery: { body: palette.tan, roof: palette.engineRed, emblem: 'bread' },
  pizza: { body: palette.cream, roof: palette.leafGreen, emblem: 'pizza' },
  school: { body: palette.creamDeep, roof: palette.navySoft, emblem: 'flag' },
  park: { body: palette.mint, roof: palette.leafGreen, emblem: 'tree' },
  'clock-tower': { body: palette.cream, roof: palette.engineRedDark, emblem: 'clock' },
  apartments: { body: palette.slateLight, roof: palette.navySoft, emblem: 'window' },
  'pet-shop': { body: palette.pinkSoft, roof: palette.pink, emblem: 'paw' },
  library: { body: palette.creamDeep, roof: palette.purple, emblem: 'book' },
  market: { body: palette.cream, roof: palette.orange, emblem: 'basket' },
  'station-yard': { body: palette.tan, roof: palette.engineRed, emblem: 'helmet' },
};

function EmblemShape({ kind }: { kind: Emblem }) {
  switch (kind) {
    case 'bread':
      return <Ellipse cx={30} cy={30} rx={16} ry={11} fill={palette.wood} />;
    case 'pizza':
      return (
        <G>
          <Polygon points="30,16 46,44 14,44" fill={palette.safetyYellow} />
          <Circle cx={30} cy={36} r={3} fill={palette.engineRed} />
          <Circle cx={24} cy={40} r={2.6} fill={palette.engineRed} />
        </G>
      );
    case 'flag':
      return (
        <G>
          <Rect x={22} y={14} width={4} height={32} rx={2} fill={palette.charcoal} />
          <Path d="M26 16h20l-6 7 6 7H26z" fill={palette.engineRed} />
        </G>
      );
    case 'tree':
      return (
        <G>
          <Rect x={27} y={32} width={6} height={14} rx={3} fill={palette.wood} />
          <Circle cx={30} cy={26} r={14} fill={palette.leafGreenDark} />
          <Circle cx={24} cy={30} r={9} fill={palette.grassDark} />
        </G>
      );
    case 'clock':
      return (
        <G>
          <Circle cx={30} cy={30} r={15} fill={palette.cream} stroke={palette.navy} strokeWidth={3} />
          <Path d="M30 21v10l7 4" stroke={palette.navy} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'paw':
      return (
        <G>
          <Circle cx={30} cy={34} r={9} fill={palette.navySoft} />
          {[
            [20, 24],
            [27, 19],
            [35, 19],
            [41, 25],
          ].map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r={4.4} fill={palette.navySoft} />
          ))}
        </G>
      );
    case 'book':
      return (
        <G>
          <Rect x={14} y={20} width={32} height={22} rx={4} fill={palette.purple} />
          <Rect x={28} y={20} width={4} height={22} fill={palette.white} />
        </G>
      );
    case 'basket':
      return (
        <G>
          <Path d="M15 26h30l-4 18H19z" fill={palette.wood} />
          <Path d="M20 26a10 10 0 0 1 20 0" stroke={palette.woodDark} strokeWidth={3} fill="none" />
        </G>
      );
    case 'helmet':
      return (
        <G>
          <Path d="M13 38c0-11 8-18 17-18s17 7 17 18z" fill={palette.engineRed} />
          <Rect x={9} y={36} width={42} height={7} rx={3.5} fill={palette.engineRedDark} />
          <Circle cx={30} cy={28} r={5} fill={palette.safetyYellow} />
        </G>
      );
    case 'window':
    default:
      return (
        <G>
          {[18, 34].map((x) =>
            [18, 34].map((y) => <Rect key={`${x}-${y}`} x={x} y={y} width={10} height={10} rx={2} fill={palette.waterCyanLight} />),
          )}
        </G>
      );
  }
}

/** A chunky little building front for the town grid / map strips. */
export function SceneBuilding({ scene, size = 72, tint }: { scene: SceneId; size?: number; tint?: string }) {
  const s = SCENES[scene];
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Rect x={6} y={20} width={48} height={36} rx={7} fill={s.body} />
      <Path d="M2 22L30 4l28 18z" fill={tint ?? s.roof} />
      <Rect x={6} y={20} width={48} height={5} fill={SHADE} />
      <G transform="translate(0,6) scale(0.86) translate(4,0)">
        <EmblemShape kind={s.emblem} />
      </G>
      <Rect x={24} y={42} width={12} height={14} rx={3} fill={palette.woodDark} />
    </Svg>
  );
}

/** Green town cell decorations for the route grid. */
export function TreeCluster({ size = 60 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Ellipse cx={30} cy={50} rx={20} ry={5} fill="rgba(31,42,90,0.10)" />
      <Rect x={26} y={30} width={7} height={18} rx={3.5} fill={palette.wood} />
      <Circle cx={29} cy={26} r={15} fill={palette.leafGreenDark} />
      <Circle cx={19} cy={32} r={10} fill={palette.grassDark} />
      <Circle cx={41} cy={31} r={11} fill={palette.leafGreen} />
    </Svg>
  );
}

export function RoadworkPile({ size = 60 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Path d="M6 46h48l-6-10H12z" fill={palette.wood} />
      <Rect x={14} y={16} width={26} height={16} rx={5} fill={palette.safetyYellow} />
      <Rect x={36} y={20} width={16} height={6} rx={3} fill={palette.gold} transform="rotate(28 36 20)" />
      <Circle cx={20} cy={40} r={6} fill={palette.charcoal} />
      <Circle cx={40} cy={40} r={6} fill={palette.charcoal} />
    </Svg>
  );
}

/* ================================================================= */
/* Bins & crates (gear sort, listen & count)                          */
/* ================================================================= */

export function BinBox({ width, height, tint }: { width: number; height: number; tint: string }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 100">
      <Path d="M8 22h104l-9 66a10 10 0 0 1-10 9H27a10 10 0 0 1-10-9z" fill={palette.panel} />
      <Path d="M8 22h104l-2 14H10z" fill={tint} opacity={0.35} />
      <Rect x={2} y={8} width={116} height={18} rx={9} fill={tint} />
      <Rect x={6} y={11} width={108} height={5} rx={2.5} fill="rgba(255,255,255,0.4)" />
      <Path d="M17 97l-9-66h6l9 66z" fill={SHADE} />
    </Svg>
  );
}

export function CrateBox({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 140 100">
      <Path d="M6 20h128l-8 70a10 10 0 0 1-10 9H24a10 10 0 0 1-10-9z" fill={palette.wood} />
      <Rect x={0} y={8} width={140} height={16} rx={8} fill={palette.woodDark} />
      <Path d="M22 34h96l-5 46H27z" fill={palette.tan} />
      <Path d="M22 34h96l-2 14H24z" fill={SHADE} />
    </Svg>
  );
}

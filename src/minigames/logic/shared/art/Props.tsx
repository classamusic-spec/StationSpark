import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
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

/**
 * The station's appliance, side on.
 *
 * `bay` opens the equipment locker the child packs into; with it closed the
 * engine is scenery and shows its pump panel instead, so it stops reading as a
 * dark delivery van. Three tones per object, no outlines, contact shadow under
 * the tyres plus a soft ambient pool.
 */
export function TruckSide({ width, bay = true }: { width: number; bay?: boolean }) {
  const height = (width * TRUCK_VIEW.h) / TRUCK_VIEW.w;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${TRUCK_VIEW.w} ${TRUCK_VIEW.h}`}>
      {/* ambient pool + hard contact shadows under the tyres */}
      <Ellipse cx={180} cy={202} rx={170} ry={11} fill="rgba(31,42,90,0.10)" />
      <Ellipse cx={86} cy={207} rx={30} ry={5} fill="rgba(31,42,90,0.22)" />
      <Ellipse cx={286} cy={207} rx={30} ry={5} fill="rgba(31,42,90,0.22)" />

      {/* body */}
      <Rect x={4} y={26} width={352} height={148} rx={20} fill={palette.engineRed} />
      <Rect x={4} y={26} width={352} height={12} rx={6} fill={SHEEN} />
      <Rect x={4} y={150} width={352} height={24} fill={palette.engineRedDark} opacity={0.45} />

      {/* roof ladder rack */}
      <G>
        <Rect x={104} y={14} width={224} height={7} rx={3.5} fill={palette.slate} />
        <Rect x={104} y={14} width={224} height={2.6} rx={1.3} fill={SHEEN} />
        {[120, 300].map((x) => (
          <Rect key={x} x={x} y={20} width={7} height={8} rx={3} fill={palette.slate} />
        ))}
        <Rect x={118} y={6} width={196} height={5} rx={2.5} fill={palette.safetyYellow} />
        <Rect x={118} y={16} width={196} height={5} rx={2.5} fill={palette.safetyYellow} />
        {Array.from({ length: 8 }, (_, i) => (
          <Rect key={`rg${i}`} x={132 + i * 23} y={6} width={5} height={15} rx={2.5} fill={palette.gold} />
        ))}
      </G>

      {/* cab */}
      <Path d="M4 46c0-11 9-20 20-20h44v148H4z" fill={palette.engineRedDark} />
      <Rect x={12} y={44} width={46} height={34} rx={9} fill={palette.waterCyanLight} />
      <Path d="M12 62h46v16a9 9 0 0 1-9 9H21a9 9 0 0 1-9-9z" fill={palette.waterCyan} opacity={0.55} />
      <Rect x={14} y={48} width={16} height={8} rx={4} fill="rgba(255,255,255,0.55)" />
      {/* door line, handle and mirror */}
      <Rect x={60} y={40} width={4} height={116} rx={2} fill="rgba(31,42,90,0.16)" />
      <Rect x={40} y={96} width={17} height={7} rx={3.5} fill={palette.slateLight} />
      <Rect x={4} y={54} width={9} height={20} rx={4} fill={palette.charcoal} />
      <Rect x={14} y={104} width={44} height={9} rx={4.5} fill={palette.safetyYellow} />

      {/* light bar */}
      <Rect x={16} y={16} width={44} height={12} rx={6} fill={palette.navySoft} />
      <Rect x={20} y={18} width={16} height={8} rx={4} fill={palette.waterCyan} />
      <Rect x={40} y={18} width={16} height={8} rx={4} fill={palette.engineRedLight} />

      {/* reflective stripe */}
      <Rect x={4} y={128} width={352} height={13} fill={palette.safetyYellow} />
      <Rect x={4} y={128} width={352} height={4} fill="rgba(255,255,255,0.35)" />

      {bay ? (
        <G>
          {/* the open equipment locker: a bright metal interior, lit from above */}
          <Rect
            x={TRUCK_BAY.x - 8}
            y={TRUCK_BAY.y - 10}
            width={TRUCK_BAY.w + 16}
            height={TRUCK_BAY.h + 20}
            rx={14}
            fill={palette.slateLight}
          />
          <Rect x={TRUCK_BAY.x} y={TRUCK_BAY.y} width={TRUCK_BAY.w} height={TRUCK_BAY.h} rx={8} fill="#55607F" />
          <Rect x={TRUCK_BAY.x} y={TRUCK_BAY.y} width={TRUCK_BAY.w} height={26} rx={8} fill="rgba(255,255,255,0.14)" />
          <Rect x={TRUCK_BAY.x} y={TRUCK_BAY.y + TRUCK_BAY.h - 12} width={TRUCK_BAY.w} height={12} rx={6} fill="rgba(0,0,0,0.16)" />
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
        </G>
      ) : (
        <G>
          {/* closed: the pump panel, two lockers and a coiled line */}
          <Rect x={84} y={44} width={118} height={80} rx={10} fill={palette.slateLight} />
          <Rect x={90} y={50} width={106} height={68} rx={7} fill="#B4BCD2" />
          {[0, 1].map((r) =>
            [0, 1, 2].map((c) => (
              <G key={`gg${r}-${c}`}>
                <Circle cx={110 + c * 36} cy={70 + r * 32} r={11} fill={palette.cream} />
                <Path d={`M${110 + c * 36} ${70 + r * 32} l6 -6`} stroke={palette.engineRedDark} strokeWidth={2.6} strokeLinecap="round" />
              </G>
            )),
          )}
          <Rect x={214} y={44} width={128} height={80} rx={10} fill={palette.engineRedDark} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Rect key={`sl${i}`} x={220} y={52 + i * 14} width={116} height={9} rx={4.5} fill={palette.engineRed} />
          ))}
          <Rect x={262} y={116} width={32} height={7} rx={3.5} fill={palette.slateLight} />
        </G>
      )}

      {/* running board, mudguards + wheels */}
      <Rect x={30} y={168} width={300} height={12} rx={6} fill={palette.charcoalDark} />
      {[86, 286].map((cx) => (
        <G key={cx}>
          <Path d={`M${cx - 36} 174 a36 36 0 0 1 72 0 z`} fill={palette.engineRedDark} />
          <Circle cx={cx} cy={182} r={26} fill={palette.charcoal} />
          <Circle cx={cx} cy={182} r={13} fill={palette.slateLight} />
          <Circle cx={cx} cy={182} r={5} fill={palette.slate} />
          <Path d={`M${cx - 18} ${170} a20 20 0 0 1 12 -12`} stroke="rgba(255,255,255,0.25)" strokeWidth={4} fill="none" strokeLinecap="round" />
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

/**
 * EVERY PLACE HAS ITS OWN ARCHITECTURE.
 *
 * These used to be one template — box + triangle + emblem — so School and
 * Library were the same house in two roof colours, which made the Dispatch
 * answer tiles unreadable. Each of the ten places is now drawn as itself:
 * its own roofline, its own signage, its own openings, so a child can tell
 * them apart by silhouette before they can read the name.
 *
 * Drawn in a 60 × 60 box, three tones per object, no outlines, and a navy
 * contact ellipse under every one of them.
 */
const SHEEN_STRONG = 'rgba(255,255,255,0.5)';

function Base({ children }: { children: React.ReactNode }) {
  return (
    <G>
      <Ellipse cx={30} cy={55} rx={24} ry={4} fill="rgba(31,42,90,0.12)" />
      {children}
    </G>
  );
}

/** Striped awning used by the shopfronts. */
function Awning({ x, y, w, tone }: { x: number; y: number; w: number; tone: string }) {
  const n = 4;
  return (
    <G>
      {Array.from({ length: n }, (_, i) => (
        <Path
          key={i}
          d={`M${x + (w / n) * i} ${y} h${w / n} v5 q${-w / n / 2} 3 ${-w / n} 0 z`}
          fill={i % 2 ? palette.cream : tone}
        />
      ))}
      <Rect x={x - 1} y={y - 2.4} width={w + 2} height={3.4} rx={1.7} fill={tone} />
    </G>
  );
}

function SceneArt({ scene, tint }: { scene: SceneId; tint?: string }) {
  switch (scene) {
    case 'bakery':
      return (
        <Base>
          <Rect x={8} y={24} width={44} height={30} rx={4} fill={palette.tan} />
          <Rect x={8} y={24} width={6} height={30} fill={SHEEN} />
          <Path d="M4 25L30 8l26 17z" fill={tint ?? palette.engineRed} />
          <Path d="M4 25L30 8l4 2.6L12 25z" fill={SHEEN_STRONG} opacity={0.4} />
          <Ellipse cx={30} cy={18} rx={8} ry={5} fill={palette.creamDeep} />
          <Path d="M25 17q5-3 10 0" stroke={palette.woodDark} strokeWidth={1.4} fill="none" />
          <Rect x={12} y={34} width={22} height={12} rx={2} fill="#9FC9E8" />
          <Awning x={11} y={32} w={24} tone={palette.engineRed} />
          <Rect x={38} y={34} width={11} height={20} rx={2} fill={palette.woodDark} />
          <Circle cx={41} cy={45} r={1.4} fill={palette.safetyYellow} />
        </Base>
      );
    case 'pizza':
      return (
        <Base>
          <Rect x={8} y={20} width={44} height={34} rx={4} fill={palette.cream} />
          <Rect x={8} y={20} width={6} height={34} fill={SHEEN} />
          <Rect x={5} y={16} width={50} height={7} rx={3.5} fill={tint ?? palette.leafGreen} />
          <Rect x={5} y={16} width={50} height={2.4} rx={1.2} fill={SHEEN_STRONG} opacity={0.5} />
          <Rect x={40} y={6} width={7} height={11} rx={2} fill={palette.tanDark} />
          <Circle cx={20} cy={30} r={6} fill="#9FC9E8" />
          <Circle cx={18} cy={28} r={2} fill={SHEEN_STRONG} />
          <Awning x={10} y={38} w={26} tone={palette.engineRed} />
          <Rect x={38} y={36} width={12} height={18} rx={2} fill={palette.woodDark} />
          <Rect x={12} y={44} width={22} height={10} rx={2} fill="#9FC9E8" />
        </Base>
      );
    case 'school':
      return (
        <Base>
          <Rect x={4} y={26} width={52} height={28} rx={4} fill={palette.creamDeep} />
          <Rect x={4} y={26} width={52} height={5} fill={SHADE} />
          <Rect x={2} y={22} width={56} height={6} rx={3} fill={tint ?? palette.navySoft} />
          <Path d="M20 22h20v-6H20z" fill={palette.creamDeep} />
          <Path d="M18 16L30 6l12 10z" fill={tint ?? palette.navySoft} />
          <Circle cx={30} cy={19} r={3.4} fill={palette.white} />
          <Rect x={29.4} y={4} width={1.6} height={4} fill={palette.charcoal} />
          <Path d="M31 4h8l-2.4 3L39 10h-8z" fill={palette.engineRed} />
          {[9, 20, 40, 49].map((x) => (
            <Rect key={x} x={x} y={33} width={8} height={9} rx={1.6} fill="#9FC9E8" />
          ))}
          <Rect x={26} y={38} width={12} height={16} rx={2} fill={palette.woodDark} />
          <Rect x={22} y={52} width={20} height={3} rx={1.5} fill={palette.slateLight} />
        </Base>
      );
    case 'park':
      return (
        <Base>
          <Path d="M2 46q28-12 56 0v8H2z" fill={palette.grass} />
          <Rect x={12} y={22} width={4} height={26} rx={2} fill={palette.woodDark} />
          <Rect x={44} y={22} width={4} height={26} rx={2} fill={palette.woodDark} />
          <Path d="M12 24q18-14 36 0" stroke={tint ?? palette.leafGreenDark} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Circle cx={30} cy={18} r={4} fill={palette.safetyYellow} />
          <Rect x={20} y={40} width={20} height={3} rx={1.5} fill={palette.wood} />
          <Rect x={22} y={43} width={2.6} height={6} rx={1.3} fill={palette.woodDark} />
          <Rect x={35} y={43} width={2.6} height={6} rx={1.3} fill={palette.woodDark} />
          <Circle cx={8} cy={34} r={9} fill={palette.leafGreenDark} />
          <Circle cx={53} cy={32} r={8} fill={palette.leafGreen} />
        </Base>
      );
    case 'clock-tower':
      return (
        <Base>
          <Rect x={18} y={16} width={24} height={38} rx={3} fill={palette.cream} />
          <Rect x={18} y={16} width={5} height={38} fill={SHEEN} />
          <Rect x={15} y={13} width={30} height={5} rx={2.5} fill="#E2CDA6" />
          <Path d="M13 14L30 2l17 12z" fill={tint ?? palette.engineRedDark} />
          <Circle cx={30} cy={28} r={9} fill={palette.white} />
          <Circle cx={30} cy={28} r={7.4} fill={palette.panel} />
          <Path d="M30 22v6.4l4 2.4" stroke={palette.navy} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M24 54v-8a6 6 0 0 1 12 0v8z" fill="#4A5578" />
          {[46, 50].map((y) => (
            <Rect key={y} x={25} y={y} width={10} height={2} rx={1} fill="#B7A788" />
          ))}
        </Base>
      );
    case 'apartments':
      return (
        <Base>
          <Rect x={10} y={10} width={40} height={44} rx={3} fill={palette.slateLight} />
          <Rect x={10} y={10} width={6} height={44} fill={SHEEN} />
          <Rect x={44} y={10} width={6} height={44} fill={SHADE} />
          <Rect x={8} y={7} width={44} height={5} rx={2.5} fill={tint ?? palette.navySoft} />
          <Rect x={36} y={1} width={9} height={7} rx={2} fill={palette.slate} />
          {[15, 26, 37].map((y) =>
            [15, 27, 37].map((x) => (
              <G key={`${x}-${y}`}>
                <Rect x={x} y={y} width={8} height={7} rx={1.4} fill="#33477A" />
                <Rect x={x} y={y} width={8} height={2.4} rx={1.2} fill="#4A5FA8" />
              </G>
            )),
          )}
          {[22, 33].map((y) => (
            <Rect key={y} x={13} y={y} width={34} height={1.8} rx={0.9} fill={SHADE} />
          ))}
          <Rect x={25} y={45} width={10} height={9} rx={1.6} fill={palette.woodDark} />
        </Base>
      );
    case 'pet-shop':
      return (
        <Base>
          <Rect x={8} y={24} width={44} height={30} rx={4} fill={palette.pinkSoft} />
          <Rect x={8} y={24} width={6} height={30} fill={SHEEN} />
          <Path d="M6 25q24-18 48 0z" fill={tint ?? palette.pink} />
          <Circle cx={30} cy={17} r={5} fill={palette.white} />
          <Circle cx={30} cy={18} r={2.6} fill={palette.navySoft} />
          {[
            [27, 14],
            [33, 14],
          ].map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r={1.5} fill={palette.navySoft} />
          ))}
          <Awning x={10} y={33} w={24} tone={palette.pink} />
          <Rect x={12} y={38} width={22} height={12} rx={3} fill="#9FC9E8" />
          <Path d="M38 54v-8a7 7 0 0 1 14 0v8z" fill={palette.wood} />
          <Circle cx={45} cy={49} r={4} fill={palette.woodDark} />
        </Base>
      );
    case 'library':
      return (
        <Base>
          <Rect x={8} y={26} width={44} height={28} rx={2} fill={palette.creamDeep} />
          <Path d="M4 26L30 12l26 14z" fill={tint ?? palette.purple} />
          <Rect x={4} y={25} width={52} height={4} rx={2} fill="#E2CDA6" />
          {[13, 22, 31, 40].map((x) => (
            <G key={x}>
              <Rect x={x} y={31} width={5} height={19} rx={2.5} fill={palette.panel} />
              <Rect x={x} y={31} width={1.8} height={19} fill={SHEEN} />
            </G>
          ))}
          <Rect x={9} y={49} width={42} height={3} rx={1.5} fill={palette.slateLight} />
          <Rect x={6} y={52} width={48} height={3} rx={1.5} fill={palette.slate} opacity={0.6} />
          <Rect x={22} y={16} width={16} height={9} rx={2} fill={palette.cream} />
          <Rect x={29.2} y={16} width={1.6} height={9} fill={palette.purple} />
        </Base>
      );
    case 'market':
      return (
        <Base>
          <Rect x={10} y={26} width={40} height={26} rx={3} fill={palette.tan} />
          {[32, 39, 46].map((y) => (
            <Rect key={y} x={12} y={y} width={36} height={1.6} rx={0.8} fill="rgba(158,106,54,0.3)" />
          ))}
          <G>
            {Array.from({ length: 5 }, (_, i) => (
              <Path
                key={i}
                d={`M${6 + i * 9.6} 16 h9.6 v7 q-4.8 3 -9.6 0 z`}
                fill={i % 2 ? palette.cream : tint ?? palette.orange}
              />
            ))}
            <Rect x={5} y={13} width={50} height={4} rx={2} fill={tint ?? palette.orange} />
          </G>
          <Rect x={7} y={23} width={3.4} height={30} rx={1.7} fill={palette.woodDark} />
          <Rect x={49} y={23} width={3.4} height={30} rx={1.7} fill={palette.woodDark} />
          <Path d="M18 40h24l-3 12H21z" fill={palette.wood} />
          {[
            [24, 38, palette.engineRed],
            [31, 36, palette.leafGreen],
            [37, 38, palette.safetyYellow],
          ].map(([cx, cy, fill], i) => (
            <Circle key={i} cx={cx as number} cy={cy as number} r={4} fill={fill as string} />
          ))}
        </Base>
      );
    case 'station-yard':
    default:
      return (
        <Base>
          <Rect x={6} y={24} width={48} height={30} rx={3} fill={palette.tan} />
          <Rect x={6} y={24} width={6} height={30} fill={SHEEN} />
          <Rect x={3} y={20} width={54} height={6} rx={3} fill={tint ?? palette.engineRed} />
          <Rect x={3} y={20} width={54} height={2} rx={1} fill={SHEEN_STRONG} opacity={0.5} />
          <Rect x={38} y={6} width={12} height={16} rx={2} fill={palette.creamDeep} />
          <Path d="M36 7l8-5 8 5z" fill={palette.engineRedDark} />
          <Path d="M41 12a3 3 0 0 1 6 0v4h-6z" fill={palette.safetyYellow} />
          <Rect x={11} y={31} width={22} height={23} rx={2} fill={palette.engineRedDark} />
          {[34, 39, 44, 49].map((y) => (
            <Rect key={y} x={12} y={y} width={20} height={3} rx={1.5} fill={palette.engineRed} />
          ))}
          <Rect x={37} y={38} width={14} height={16} rx={2} fill={palette.woodDark} />
          <Circle cx={40} cy={46} r={1.4} fill={palette.safetyYellow} />
        </Base>
      );
  }
}

/** A chunky little building front for the town grid / map strips. */
export function SceneBuilding({ scene, size = 72, tint }: { scene: SceneId; size?: number; tint?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <SceneArt scene={scene} tint={tint} />
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

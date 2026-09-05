/**
 * SceneHero — the illustrated "you are here" panel on the Mission Brief, and
 * the backdrop behind dialogue beats.
 *
 * One charming storefront per `SceneId`, drawn as flat vector stickers: a solid
 * fill, one darker shade tone, one white highlight, no black outlines, soft
 * navy ellipse shadows on the ground (docs/ART_DIRECTION.md).
 *
 * `<SceneThumb/>` is the same art at dispatch-slip size with the background
 * detail dropped, so a card and its mission always look like the same place.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { SceneId } from '@/learning/types';
import { fontFamily, palette, radii, shadows } from '@/theme';

const VB_W = 320;
const VB_H = 200;
const GROUND_Y = 158;

export interface SceneStyleDef {
  /** kid-facing name of the place */
  name: string;
  /** drawn icon id for tiny surfaces (recap chips, lists) — never an emoji */
  icon: string;
  sky: readonly [string, string];
  ground: string;
  groundShade: string;
  /** the tint a dispatch-slip thumbnail washes over the art */
  tint: readonly [string, string];
}

export const sceneStyles: Record<SceneId, SceneStyleDef> = {
  bakery: {
    name: 'Bakery',
    icon: 'bakery',
    sky: ['#8FD3FB', '#D6F0FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#FFE3B8', '#FFF6E5'],
  },
  pizza: {
    name: 'Pizza Shop',
    icon: 'pizza',
    sky: ['#8FD3FB', '#DCF2FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#FFD3C2', '#FFF1E6'],
  },
  school: {
    name: 'School',
    icon: 'school',
    sky: ['#7FCCFA', '#D2EEFF'],
    ground: '#B7DE93',
    groundShade: '#96C874',
    tint: ['#FFE7B8', '#FFF8E8'],
  },
  park: {
    name: 'Park',
    icon: 'park',
    sky: ['#7FCCFA', '#D8F3FF'],
    ground: '#9BDA74',
    groundShade: '#77C458',
    tint: ['#C9F0B4', '#EFFBE6'],
  },
  'clock-tower': {
    name: 'Clock Tower',
    icon: 'museum',
    sky: ['#6FC3F8', '#CDEBFF'],
    ground: '#B7DE93',
    groundShade: '#96C874',
    tint: ['#CFE0FF', '#EEF4FF'],
  },
  apartments: {
    name: 'Apartments',
    icon: 'house',
    sky: ['#84CFFA', '#D9F1FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#D5DCF2', '#F1F4FF'],
  },
  'pet-shop': {
    name: 'Pet Shop',
    icon: 'pet-shop',
    sky: ['#8FD3FB', '#DFF4FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#C7F0E4', '#EDFBF6'],
  },
  library: {
    name: 'Library',
    icon: 'library',
    sky: ['#7FCCFA', '#D6F0FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#D3E4FF', '#EFF6FF'],
  },
  market: {
    name: 'Market',
    icon: 'market',
    sky: ['#8FD3FB', '#DFF4FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#FFE0D0', '#FFF4EA'],
  },
  'station-yard': {
    name: 'Station Yard',
    icon: 'truck',
    sky: ['#6FC3F8', '#CFEBFF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#FFD3CE', '#FFF0EE'],
  },
};

export const sceneName = (scene: SceneId): string => sceneStyles[scene].name;
/** rule #5: the world layer never uses emoji — this is a `VocabIcon` id. */
export const sceneIcon = (scene: SceneId): string => sceneStyles[scene].icon;

/* ------------------------------------------------------------------ */
/* Shared sticker parts                                                 */
/* ------------------------------------------------------------------ */

const SHADE = 'rgba(31,42,90,0.14)';
const SHEEN = 'rgba(255,255,255,0.32)';

function Blob({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <Ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} fill="rgba(31,42,90,0.12)" />;
}

function Tree({ x, y, s = 1, deep }: { x: number; y: number; s?: number; deep?: boolean }) {
  const leaf = deep ? '#3F9E56' : '#5FBB63';
  const leafHi = deep ? '#57B36B' : '#7ACD7C';
  return (
    <G x={x} y={y} scale={s}>
      <Blob x={0} y={4} w={34} h={9} />
      <Rect x={-5} y={-14} width={10} height={20} rx={5} fill={palette.woodDark} />
      <Circle cx={0} cy={-30} r={19} fill={leaf} />
      <Circle cx={-14} cy={-18} r={14} fill={leafHi} />
      <Circle cx={14} cy={-19} r={13} fill={leafHi} />
      <Circle cx={-6} cy={-38} r={9} fill={SHEEN} />
    </G>
  );
}

function Bush({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Blob x={0} y={2} w={30} h={7} />
      <Circle cx={-9} cy={-4} r={10} fill="#5FBB63" />
      <Circle cx={9} cy={-4} r={10} fill="#5FBB63" />
      <Circle cx={0} cy={-10} r={13} fill="#6FC470" />
      <Circle cx={-4} cy={-15} r={5} fill={SHEEN} />
    </G>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s} opacity={0.9}>
      <Circle cx={0} cy={0} r={12} fill={palette.white} />
      <Circle cx={14} cy={3} r={9} fill={palette.white} />
      <Circle cx={-14} cy={4} r={8} fill={palette.white} />
      <Rect x={-16} y={0} width={32} height={10} rx={5} fill={palette.white} />
    </G>
  );
}

/** Striped canopy over a shopfront. */
function Awning({
  x,
  y,
  w,
  stripe = palette.engineRed,
  alt = palette.white,
  bands = 7,
}: {
  x: number;
  y: number;
  w: number;
  stripe?: string;
  alt?: string;
  bands?: number;
}) {
  const bw = w / bands;
  const h = 26;
  return (
    <G x={x} y={y}>
      {Array.from({ length: bands }, (_, i) => (
        <Path
          key={i}
          d={`M ${i * bw} 0 L ${(i + 1) * bw} 0 L ${(i + 1) * bw - 2} ${h} Q ${i * bw + bw / 2} ${h + 7} ${i * bw + 2} ${h} Z`}
          fill={i % 2 === 0 ? stripe : alt}
        />
      ))}
      <Rect x={-3} y={-5} width={w + 6} height={8} rx={4} fill={stripe} />
      <Rect x={-3} y={-5} width={w + 6} height={3} rx={1.5} fill={SHEEN} />
    </G>
  );
}

function Window({ x, y, w, h, glow }: { x: number; y: number; w: number; h: number; glow?: boolean }) {
  return (
    <G x={x} y={y}>
      <Rect x={0} y={0} width={w} height={h} rx={6} fill={glow ? '#FFE9A8' : '#7FB6E8'} />
      <Path d={`M 2 ${h - 2} L ${w * 0.55} 2 L ${w * 0.8} 2 L 2 ${h * 0.7} Z`} fill="rgba(255,255,255,0.4)" />
      <Rect x={0} y={0} width={w} height={h} rx={6} fill="none" stroke={SHADE} strokeWidth={2} />
    </G>
  );
}

/** Cream sign board with the shop name. */
function SignBoard({ x, y, w, label, fill = palette.cream, ink = '#7A4A24' }: { x: number; y: number; w: number; label: string; fill?: string; ink?: string }) {
  const h = 26;
  return (
    <G x={x} y={y}>
      <Rect x={-4} y={-4} width={w + 8} height={h + 8} rx={12} fill={palette.tanDark} />
      <Rect x={0} y={0} width={w} height={h} rx={9} fill={fill} />
      <SvgText
        x={w / 2}
        y={h / 2 + 6}
        fontFamily={fontFamily.display}
        fontSize={15}
        fontWeight="700"
        fill={ink}
        textAnchor="middle"
      >
        {label}
      </SvgText>
    </G>
  );
}

function LampPost({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <Blob x={0} y={0} w={22} h={7} />
      <Rect x={-3} y={-74} width={6} height={74} rx={3} fill={palette.navySoft} />
      <Circle cx={0} cy={-80} r={9} fill={palette.safetyYellow} />
      <Circle cx={-3} cy={-83} r={3} fill={SHEEN} />
      <Path d="M -10 -74 L 10 -74 L 6 -88 L -6 -88 Z" fill={palette.navy} opacity={0.18} />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Per-scene art                                                        */
/* ------------------------------------------------------------------ */

function BakeryScene() {
  return (
    <G>
      <Rect x={62} y={62} width={196} height={96} rx={10} fill="#F6DFB4" />
      <Rect x={62} y={62} width={196} height={8} fill={SHEEN} />
      <Path d="M 52 66 L 160 30 L 268 66 Z" fill={palette.engineRed} />
      <Path d="M 52 66 L 160 30 L 268 66 Z" fill={SHEEN} opacity={0.25} />
      <Rect x={52} y={62} width={216} height={12} rx={6} fill={palette.engineRedDark} />
      {/* bread sign in the gable */}
      <Circle cx={160} cy={54} r={19} fill={palette.cream} />
      <Path d="M 146 56 q 14 -14 28 0 q -14 8 -28 0 z" fill="#D6A05A" />
      <Path d="M 152 52 l 4 4 M 160 50 l 4 4 M 168 52 l 4 4" stroke="#B47C3C" strokeWidth={2.4} strokeLinecap="round" />
      <SignBoard x={92} y={74} w={136} label="BAKERY" />
      <Awning x={72} y={104} w={112} bands={7} />
      {/* window with bread */}
      <Rect x={78} y={116} width={100} height={42} rx={8} fill="#5E3A20" />
      <Rect x={84} y={122} width={88} height={30} rx={6} fill="#8FC7EC" />
      <Ellipse cx={104} cy={140} rx={13} ry={7} fill="#E3A960" />
      <Ellipse cx={130} cy={140} rx={13} ry={7} fill="#D69B52" />
      <Circle cx={155} cy={138} r={7} fill="#E8B978" />
      <Circle cx={101} cy={128} r={4} fill={palette.safetyYellow} />
      <Circle cx={140} cy={128} r={4} fill={palette.safetyYellow} />
      {/* door */}
      <Rect x={196} y={104} width={46} height={54} rx={8} fill="#8A5A32" />
      <Rect x={202} y={110} width={34} height={24} rx={5} fill="#9FD3F2" />
      <Circle cx={236} cy={136} r={3} fill={palette.safetyYellow} />
      <Rect x={204} y={116} width={30} height={12} rx={4} fill={palette.cream} />
      <SvgText x={219} y={126} fontFamily={fontFamily.display} fontSize={9} fill={palette.engineRed} textAnchor="middle">
        OPEN
      </SvgText>
      <Bush x={54} y={158} s={0.9} />
      <Bush x={266} y={158} s={0.8} />
      <LampPost x={294} y={158} />
    </G>
  );
}

function PizzaScene() {
  return (
    <G>
      <Rect x={64} y={64} width={192} height={94} rx={10} fill="#F3D9A4" />
      <Rect x={64} y={64} width={192} height={8} fill={SHEEN} />
      <Path d="M 54 68 L 160 32 L 266 68 Z" fill={palette.engineRed} />
      <Rect x={54} y={64} width={212} height={12} rx={6} fill={palette.engineRedDark} />
      {/* pizza slice sign */}
      <G x={160} y={50}>
        <Path d="M 0 -16 L 16 14 L -16 14 Z" fill="#F7C86A" />
        <Path d="M 0 -10 L 12 12 L -12 12 Z" fill="#E9584A" />
        <Circle cx={-4} cy={4} r={3} fill="#B92B22" />
        <Circle cx={5} cy={7} r={3} fill="#B92B22" />
        <Circle cx={1} cy={-3} r={2.6} fill="#B92B22" />
      </G>
      <SignBoard x={96} y={76} w={128} label="PIZZA" ink="#A32B20" />
      <Awning x={74} y={106} w={110} bands={9} stripe="#3F9E56" alt={palette.white} />
      <Rect x={74} y={106} width={110} height={5} rx={2} fill={palette.engineRed} />
      <Rect x={80} y={118} width={98} height={40} rx={8} fill="#5E3A20" />
      <Rect x={86} y={124} width={86} height={28} rx={6} fill="#8FC7EC" />
      <Circle cx={110} cy={138} r={9} fill="#F0C971" />
      <Circle cx={110} cy={138} r={6} fill="#E9584A" />
      <Rect x={132} y={132} width={30} height={12} rx={4} fill={palette.cream} />
      <Rect x={198} y={106} width={44} height={52} rx={8} fill="#8A5A32" />
      <Rect x={204} y={112} width={32} height={22} rx={5} fill="#9FD3F2" />
      <Circle cx={236} cy={136} r={3} fill={palette.safetyYellow} />
      <Bush x={56} y={158} s={0.85} />
      <Tree x={288} y={158} s={0.7} deep />
    </G>
  );
}

function SchoolScene() {
  return (
    <G>
      <Rect x={54} y={70} width={212} height={88} rx={10} fill="#F6DFB4" />
      <Rect x={54} y={70} width={212} height={8} fill={SHEEN} />
      <Path d="M 44 74 L 160 34 L 276 74 Z" fill="#4F7FD6" />
      <Path d="M 44 74 L 160 34 L 276 74 Z" fill={SHEEN} opacity={0.2} />
      <Rect x={44} y={70} width={232} height={11} rx={5.5} fill="#3C63AE" />
      {/* clock in the gable */}
      <Circle cx={160} cy={56} r={17} fill={palette.cream} />
      <Circle cx={160} cy={56} r={17} fill="none" stroke={palette.tanDark} strokeWidth={3} />
      <Path d="M 160 56 L 160 47 M 160 56 L 167 59" stroke={palette.navy} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={160} cy={56} r={2.4} fill={palette.engineRed} />
      {/* flag */}
      <Rect x={272} y={16} width={4} height={62} rx={2} fill={palette.navySoft} />
      <Path d="M 276 20 L 306 27 L 276 36 Z" fill={palette.safetyYellow} />
      {/* windows */}
      {[0, 1, 2, 3].map((i) => (
        <Window key={`a${i}`} x={68 + i * 48} y={88} w={30} h={26} />
      ))}
      {[0, 3].map((i) => (
        <Window key={`b${i}`} x={68 + i * 48} y={124} w={30} h={26} />
      ))}
      {/* door + steps */}
      <Rect x={136} y={116} width={48} height={42} rx={8} fill="#6B4A2C" />
      <Rect x={142} y={122} width={36} height={20} rx={5} fill="#9FD3F2" />
      <Rect x={128} y={150} width={64} height={8} rx={4} fill="#DCE3F2" />
      <Bush x={44} y={158} s={0.85} />
      <Bush x={278} y={158} s={0.9} />
    </G>
  );
}

function ParkScene() {
  return (
    <G>
      {/* pond */}
      <Ellipse cx={248} cy={146} rx={54} ry={18} fill="#7FD0F5" />
      <Ellipse cx={248} cy={143} rx={44} ry={12} fill="#A6E4FF" opacity={0.7} />
      {/* path */}
      <Path d="M 0 176 Q 90 140 190 156 L 190 178 Q 90 166 0 194 Z" fill="#E3D3B2" opacity={0.85} />
      <Tree x={62} y={150} s={1.25} deep />
      <Tree x={128} y={140} s={0.95} />
      <Tree x={196} y={132} s={0.75} deep />
      {/* bench */}
      <G x={104} y={156}>
        <Blob x={0} y={4} w={64} h={10} />
        <Rect x={-30} y={-14} width={60} height={7} rx={3.5} fill={palette.wood} />
        <Rect x={-30} y={-24} width={60} height={6} rx={3} fill={palette.wood} />
        <Rect x={-30} y={-32} width={60} height={6} rx={3} fill="#D69B52" />
        <Rect x={-26} y={-14} width={6} height={16} rx={3} fill={palette.navySoft} />
        <Rect x={20} y={-14} width={6} height={16} rx={3} fill={palette.navySoft} />
      </G>
      {/* little fountain */}
      <G x={248} y={140}>
        <Rect x={-8} y={-18} width={16} height={20} rx={6} fill="#DCE3F2" />
        <Path d="M 0 -20 q -8 -14 0 -22 q 8 8 0 22 z" fill={palette.waterCyanLight} />
        <Circle cx={0} cy={-44} r={5} fill={palette.waterCyan} opacity={0.8} />
      </G>
      <Bush x={26} y={162} s={1} />
      <Bush x={300} y={160} s={0.9} />
    </G>
  );
}

function ClockTowerScene() {
  return (
    <G>
      <Rect x={116} y={44} width={88} height={114} rx={10} fill="#F6DFB4" />
      <Rect x={116} y={44} width={88} height={8} fill={SHEEN} />
      <Rect x={108} y={38} width={104} height={14} rx={7} fill="#C8D2E6" />
      <Path d="M 108 40 L 160 4 L 212 40 Z" fill="#4F7FD6" />
      <Circle cx={160} cy={14} r={5} fill={palette.safetyYellow} />
      {/* clock face */}
      <Circle cx={160} cy={82} r={30} fill={palette.cream} />
      <Circle cx={160} cy={82} r={30} fill="none" stroke={palette.tanDark} strokeWidth={5} />
      {[0, 3, 6, 9].map((h) => {
        const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <Circle key={h} cx={160 + Math.cos(a) * 22} cy={82 + Math.sin(a) * 22} r={2.6} fill={palette.navyMuted} />
        );
      })}
      <Path d="M 160 82 L 160 64 M 160 82 L 174 88" stroke={palette.navy} strokeWidth={4.4} strokeLinecap="round" />
      <Circle cx={160} cy={82} r={4} fill={palette.engineRed} />
      {/* base + arch */}
      <Rect x={104} y={122} width={112} height={36} rx={8} fill="#EAD3A6" />
      <Path d="M 140 158 L 140 138 a 20 20 0 0 1 40 0 L 180 158 Z" fill="#6B4A2C" />
      {/* the cat on the ledge */}
      <G x={214} y={116}>
        <Ellipse cx={0} cy={0} rx={13} ry={8} fill="#F0A24A" />
        <Circle cx={10} cy={-8} r={8} fill="#F0A24A" />
        <Path d="M 5 -14 l 3 -6 l 4 5 z M 13 -15 l 4 -5 l 2 6 z" fill="#F0A24A" />
        <Circle cx={8} cy={-9} r={1.6} fill={palette.navy} />
        <Circle cx={13} cy={-9} r={1.6} fill={palette.navy} />
        <Path d="M -12 0 q -8 -8 -2 -14" stroke="#F0A24A" strokeWidth={5} strokeLinecap="round" fill="none" />
      </G>
      <Tree x={54} y={158} s={1.1} deep />
      <Tree x={276} y={158} s={0.9} />
      <Bush x={96} y={158} s={0.7} />
    </G>
  );
}

function ApartmentsScene() {
  const blocks = [
    { x: 40, y: 78, w: 76, h: 80, fill: '#F0C9A0', roof: '#4F7FD6' },
    { x: 122, y: 52, w: 78, h: 106, fill: '#F6DFB4', roof: palette.engineRed },
    { x: 206, y: 86, w: 74, h: 72, fill: '#E9D6F2', roof: '#4F7FD6' },
  ];
  return (
    <G>
      {blocks.map((b, bi) => (
        <G key={bi}>
          <Rect x={b.x} y={b.y} width={b.w} height={b.h} rx={9} fill={b.fill} />
          <Rect x={b.x} y={b.y} width={b.w} height={7} fill={SHEEN} />
          <Path d={`M ${b.x - 8} ${b.y + 4} L ${b.x + b.w / 2} ${b.y - 22} L ${b.x + b.w + 8} ${b.y + 4} Z`} fill={b.roof} />
          {[0, 1].map((r) =>
            [0, 1].map((c) => (
              <Window
                key={`${r}-${c}`}
                x={b.x + 12 + c * (b.w / 2 - 2)}
                y={b.y + 16 + r * 30}
                w={b.w / 2 - 20}
                h={22}
                glow={bi === 1 && r === 0 && c === 1}
              />
            )),
          )}
          <Rect x={b.x + b.w / 2 - 13} y={b.y + b.h - 30} width={26} height={30} rx={6} fill="#8A5A32" />
        </G>
      ))}
      <Bush x={28} y={158} s={0.8} />
      <Tree x={300} y={158} s={0.8} deep />
      <LampPost x={122} y={158} />
    </G>
  );
}

function PetShopScene() {
  return (
    <G>
      <Rect x={62} y={66} width={196} height={92} rx={10} fill="#EAF6EC" />
      <Rect x={62} y={66} width={196} height={8} fill={SHEEN} />
      <Path d="M 52 70 L 160 34 L 268 70 Z" fill="#3FBFAE" />
      <Rect x={52} y={66} width={216} height={12} rx={6} fill="#2FA091" />
      {/* paw sign */}
      <G x={160} y={54}>
        <Circle cx={0} cy={4} r={11} fill={palette.cream} />
        <Circle cx={-6} cy={-7} r={4} fill={palette.cream} />
        <Circle cx={2} cy={-10} r={4} fill={palette.cream} />
        <Circle cx={10} cy={-4} r={4} fill={palette.cream} />
      </G>
      <SignBoard x={98} y={78} w={124} label="PET SHOP" ink="#1F7F72" />
      <Awning x={74} y={108} w={112} bands={7} stripe={palette.waterCyan} />
      <Rect x={80} y={120} width={100} height={38} rx={8} fill="#5E3A20" />
      <Rect x={86} y={126} width={88} height={26} rx={6} fill="#B9EAF8" />
      {/* puppy + kitten in the window */}
      <G x={110} y={142}>
        <Ellipse cx={0} cy={0} rx={12} ry={8} fill={palette.white} />
        <Circle cx={8} cy={-7} r={7} fill={palette.white} />
        <Circle cx={2} cy={-2} r={2.6} fill={palette.navy} opacity={0.5} />
        <Circle cx={6} cy={-8} r={1.5} fill={palette.navy} />
        <Circle cx={11} cy={-8} r={1.5} fill={palette.navy} />
        <Path d="M 3 -12 q -5 -1 -4 6 z" fill={palette.navySoft} />
      </G>
      <G x={150} y={143}>
        <Ellipse cx={0} cy={0} rx={10} ry={7} fill="#B9BFD4" />
        <Circle cx={7} cy={-6} r={6} fill="#B9BFD4" />
        <Path d="M 3 -11 l 2 -4 l 3 3 z M 10 -11 l 3 -4 l 1 4 z" fill="#B9BFD4" />
        <Circle cx={5} cy={-7} r={1.3} fill={palette.navy} />
        <Circle cx={10} cy={-7} r={1.3} fill={palette.navy} />
      </G>
      <Rect x={198} y={108} width={46} height={50} rx={8} fill="#8A5A32" />
      <Rect x={204} y={114} width={34} height={22} rx={5} fill="#B9EAF8" />
      <Bush x={52} y={158} s={0.85} />
      <Bush x={270} y={158} s={0.8} />
    </G>
  );
}

function LibraryScene() {
  return (
    <G>
      <Rect x={58} y={72} width={204} height={86} rx={8} fill="#F3E7CE" />
      <Rect x={58} y={72} width={204} height={7} fill={SHEEN} />
      <Path d="M 46 76 L 160 36 L 274 76 Z" fill="#4F7FD6" />
      <Rect x={46} y={72} width={228} height={11} rx={5.5} fill="#3C63AE" />
      {/* open book on the pediment */}
      <G x={160} y={58}>
        <Path d="M -18 6 q 9 -8 18 -2 q 9 -6 18 2 q -9 5 -18 1 q -9 4 -18 -1 z" fill={palette.white} />
        <Path d="M 0 4 L 0 -4" stroke={palette.navyMuted} strokeWidth={2} />
      </G>
      {/* columns */}
      {[0, 1, 2, 3].map((i) => (
        <G key={i}>
          <Rect x={76 + i * 52} y={90} width={18} height={58} rx={5} fill={palette.cream} />
          <Rect x={72 + i * 52} y={86} width={26} height={8} rx={4} fill="#E4D4B0" />
          <Rect x={72 + i * 52} y={146} width={26} height={8} rx={4} fill="#E4D4B0" />
          <Rect x={79 + i * 52} y={92} width={4} height={54} fill={SHEEN} />
        </G>
      ))}
      <Rect x={140} y={110} width={40} height={44} rx={7} fill="#6B4A2C" />
      <Circle cx={172} cy={134} r={3} fill={palette.safetyYellow} />
      <Rect x={58} y={150} width={204} height={8} rx={4} fill="#DCE3F2" />
      <Bush x={44} y={158} s={0.8} />
      <LampPost x={288} y={158} />
    </G>
  );
}

function MarketScene() {
  const stalls = [
    { x: 34, stripe: palette.engineRed },
    { x: 124, stripe: '#3F9E56' },
    { x: 214, stripe: palette.purple },
  ];
  return (
    <G>
      {/* back wall */}
      <Rect x={20} y={72} width={286} height={86} rx={10} fill="#EFE0C4" opacity={0.75} />
      {stalls.map((s, i) => (
        <G key={i}>
          <Rect x={s.x} y={100} width={72} height={12} rx={5} fill={palette.wood} />
          <Rect x={s.x + 4} y={112} width={64} height={40} rx={6} fill="#E7D3AE" />
          <Rect x={s.x + 2} y={148} width={68} height={10} rx={5} fill={palette.woodDark} />
          <Awning x={s.x} y={72} w={72} bands={5} stripe={s.stripe} />
          {/* produce crates */}
          <Rect x={s.x + 10} y={120} width={22} height={16} rx={4} fill={palette.woodDark} />
          <Circle cx={s.x + 15} cy={118} r={5} fill={i === 0 ? '#E9584A' : i === 1 ? '#6FC470' : '#F0A24A'} />
          <Circle cx={s.x + 25} cy={118} r={5} fill={i === 0 ? '#F26B5C' : i === 1 ? '#88D07F' : '#FFB865'} />
          <Rect x={s.x + 40} y={120} width={22} height={16} rx={4} fill={palette.woodDark} />
          <Circle cx={s.x + 45} cy={118} r={5} fill={palette.safetyYellow} />
          <Circle cx={s.x + 55} cy={118} r={5} fill="#FFD65C" />
        </G>
      ))}
      <Bush x={310} y={158} s={0.7} />
    </G>
  );
}

function StationYardScene() {
  return (
    <G>
      <Rect x={48} y={66} width={224} height={92} rx={10} fill="#F6DFB4" />
      <Rect x={48} y={66} width={224} height={8} fill={SHEEN} />
      <Path d="M 38 70 L 160 30 L 282 70 Z" fill={palette.engineRed} />
      <Rect x={38} y={66} width={244} height={12} rx={6} fill={palette.engineRedDark} />
      {/* bell in the gable */}
      <G x={160} y={52}>
        <Path d="M -13 8 q 0 -18 13 -18 q 13 0 13 18 z" fill={palette.safetyYellow} />
        <Rect x={-15} y={8} width={30} height={5} rx={2.5} fill={palette.gold} />
        <Circle cx={0} cy={15} r={3.4} fill={palette.gold} />
        <Path d="M -8 0 q 3 -8 8 -8" stroke={SHEEN} strokeWidth={3} fill="none" strokeLinecap="round" />
      </G>
      <SignBoard x={92} y={80} w={136} label="STATION SPARK" ink={palette.navy} />
      {/* two garage doors */}
      {[0, 1].map((i) => (
        <G key={i}>
          <Rect x={64 + i * 108} y={110} width={92} height={48} rx={8} fill={palette.engineRedDark} />
          <Rect x={68 + i * 108} y={114} width={84} height={40} rx={6} fill={palette.engineRed} />
          {[0, 1, 2].map((r) => (
            <Rect key={r} x={72 + i * 108} y={118 + r * 12} width={76} height={8} rx={3} fill="#C8301F" opacity={0.5} />
          ))}
          <Rect x={80 + i * 108} y={120} width={60} height={10} rx={4} fill="#5B87C9" />
        </G>
      ))}
      <Rect x={40} y={152} width={240} height={8} rx={4} fill="#DCE3F2" />
      <Bush x={30} y={158} s={0.8} />
      <Tree x={296} y={158} s={0.85} deep />
    </G>
  );
}

const sceneArt: Record<SceneId, () => React.JSX.Element> = {
  bakery: BakeryScene,
  pizza: PizzaScene,
  school: SchoolScene,
  park: ParkScene,
  'clock-tower': ClockTowerScene,
  apartments: ApartmentsScene,
  'pet-shop': PetShopScene,
  library: LibraryScene,
  market: MarketScene,
  'station-yard': StationYardScene,
};

/* ------------------------------------------------------------------ */
/* Public components                                                    */
/* ------------------------------------------------------------------ */

export interface SceneHeroProps {
  scene: SceneId;
  /** drop the sky detail (clouds, skyline) — used by the small thumbnails */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  /** rounded corners on the panel (default: card radius) */
  radius?: number;
  /**
   * Full-bleed hero (critique #12): widens the view box vertically so a
   * half-screen-tall panel is filled with sky and pavement instead of cropping
   * a third of the storefront off each side.
   */
  bleed?: boolean;
}

/** The big illustrated storefront panel. Fills whatever box it is given. */
export function SceneHero({ scene, compact, style, radius = radii.card, bleed }: SceneHeroProps) {
  const s = sceneStyles[scene] ?? sceneStyles.bakery;
  const Art = sceneArt[scene] ?? BakeryScene;
  const top = bleed ? -86 : 0;
  const height = bleed ? VB_H + 158 : VB_H;
  return (
    <View style={[styles.hero, { borderRadius: radius }, style]}>
      <Svg width="100%" height="100%" viewBox={`0 ${top} ${VB_W} ${height}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`sky-${scene}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={s.sky[0]} />
            <Stop offset="1" stopColor={s.sky[1]} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={top} width={VB_W} height={GROUND_Y - top} fill={`url(#sky-${scene})`} />
        {!compact ? (
          <G>
            <Cloud x={44} y={30} s={1} />
            <Cloud x={252} y={22} s={0.8} />
            {/* far skyline */}
            <Rect x={0} y={104} width={40} height={56} rx={6} fill="rgba(31,42,90,0.10)" />
            <Rect x={286} y={94} width={40} height={66} rx={6} fill="rgba(31,42,90,0.10)" />
          </G>
        ) : null}
        {/* ground */}
        <Rect x={0} y={GROUND_Y} width={VB_W} height={top + height - GROUND_Y} fill={s.ground} />
        <Rect x={0} y={GROUND_Y} width={VB_W} height={4} fill={s.groundShade} />
        <Art />
      </Svg>
    </View>
  );
}

export interface SceneThumbProps {
  scene: SceneId;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Dispatch-slip thumbnail: the same place, card-sized. */
export function SceneThumb({ scene, width = 108, height = 88, style }: SceneThumbProps) {
  const s = sceneStyles[scene] ?? sceneStyles.bakery;
  return (
    <View
      style={[
        styles.thumb,
        { width, height, borderRadius: radii.tile, backgroundColor: s.tint[1] },
        style,
      ]}
    >
      <SceneHero scene={scene} compact radius={radii.tile} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden', backgroundColor: palette.skyBottom },
  thumb: { overflow: 'hidden', ...shadows.soft },
});

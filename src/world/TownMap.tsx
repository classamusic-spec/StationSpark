import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { useLoop, usePulse } from '@/hooks';
import type { LocationId } from '@/content/types';

/** Design box for Spark City. Pins and the truck are placed in these units. */
export const MAP_VB = { w: 360, h: 620 } as const;

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

/** Every stop in Spark City, in reading order down the map. */
export const MAP_PLACES: readonly MapPlace[] = [
  { id: 'station', name: 'Fire Station', nameEs: 'Estación', color: palette.engineRed, x: 64, y: 126 },
  { id: 'school', name: 'School', nameEs: 'Escuela', color: palette.orange, x: 168, y: 124 },
  { id: 'clock-tower', name: 'Clock Tower', nameEs: 'Reloj', color: palette.safetyYellow, x: 258, y: 132 },
  { id: 'bakery', name: 'Bakery', nameEs: 'Panadería', color: palette.pink, x: 62, y: 272 },
  { id: 'library', name: 'Library', nameEs: 'Biblioteca', color: palette.purple, x: 174, y: 274 },
  { id: 'park', name: 'Park', nameEs: 'Parque', color: palette.leafGreen, x: 266, y: 268 },
  { id: 'pet-shop', name: 'Pet Shop', nameEs: 'Mascotas', color: palette.waterCyan, x: 56, y: 410 },
  { id: 'pizza', name: 'Pizza Piazza', nameEs: 'Pizzería', color: palette.engineRedLight, x: 156, y: 410 },
  { id: 'apartments', name: 'Homes', nameEs: 'Casas', color: '#3E8FE0', x: 257, y: 410 },
  { id: 'market', name: 'Market', nameEs: 'Mercado', color: palette.grassDark, x: 58, y: 534 },
  { id: 'construction', name: 'Construction Site', nameEs: 'Obra', color: palette.woodDark, x: 165, y: 558 },
] as const;

/** Where the fire truck parks outside the station, in MAP_VB units. */
export const TRUCK_PARK = { x: 96, y: 150 } as const;

/** The wooden board at the bottom of the map — the screen letters it. */
export const MAP_SIGN = { x: 246, y: 554, w: 86, h: 32 } as const;

const RIVER_D =
  'M 330 -10 C 322 60 300 96 308 150 C 316 204 288 232 296 292 C 304 352 278 384 286 444 C 294 504 318 546 314 630';

function Road({ d, width = 22 }: { d: string; width?: number }) {
  return (
    <G>
      <Path d={d} stroke="#B9C0D4" strokeWidth={width + 4} strokeLinecap="round" fill="none" />
      <Path d={d} stroke="#D6DAE8" strokeWidth={width} strokeLinecap="round" fill="none" />
      <Path d={d} stroke="#FFFFFF" strokeWidth={2.4} strokeDasharray="9 11" strokeLinecap="round" fill="none" />
    </G>
  );
}

function House({ x, y, w, h, wall, roof }: { x: number; y: number; w: number; h: number; wall: string; roof: string }) {
  return (
    <G>
      <Ellipse cx={x + w / 2} cy={y + h + 3} rx={w * 0.5} ry={4} fill={palette.navy} opacity={0.1} />
      <Rect x={x} y={y + h * 0.34} width={w} height={h * 0.66} rx={4} fill={wall} />
      <Path d={`M ${x - 4} ${y + h * 0.36} L ${x + w / 2} ${y} L ${x + w + 4} ${y + h * 0.36} Z`} fill={roof} />
      <Rect x={x + w * 0.18} y={y + h * 0.52} width={w * 0.22} height={h * 0.24} rx={2} fill={palette.waterCyanLight} />
      <Rect x={x + w * 0.58} y={y + h * 0.52} width={w * 0.24} height={h * 0.42} rx={2} fill="#B4772F" />
    </G>
  );
}

function Trees({ pts }: { pts: readonly [number, number, number][] }) {
  return (
    <G>
      {pts.map(([x, y, s], i) => (
        <G key={i}>
          <Ellipse cx={x} cy={y + s * 0.9} rx={s * 0.6} ry={s * 0.18} fill={palette.navy} opacity={0.1} />
          <Rect x={x - s * 0.11} y={y + s * 0.35} width={s * 0.22} height={s * 0.55} rx={s * 0.11} fill={palette.wood} />
          <Circle cx={x} cy={y + s * 0.16} r={s * 0.52} fill={i % 3 === 0 ? palette.grass : palette.leafGreen} />
          <Circle cx={x - s * 0.22} cy={y + s * 0.3} r={s * 0.34} fill={palette.grassDark} />
          <Circle cx={x - s * 0.18} cy={y - s * 0.08} r={s * 0.2} fill="#FFFFFF" opacity={0.2} />
        </G>
      ))}
    </G>
  );
}

/** All of Spark City as one static SVG. Memoized — pins and shimmer sit on top. */
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
      </Defs>

      {/* ground */}
      <Rect x={0} y={0} width={MAP_VB.w} height={MAP_VB.h} fill="url(#mapGrass)" />
      {/* soft meadow patches */}
      <Ellipse cx={70} cy={330} rx={70} ry={40} fill="#B4E693" opacity={0.5} />
      <Ellipse cx={280} cy={520} rx={80} ry={46} fill="#B4E693" opacity={0.45} />
      {/* construction sand lot */}
      <Ellipse cx={166} cy={520} rx={86} ry={56} fill="#E9CE9A" />

      {/* ── river ─────────────────────────────────────────────────── */}
      <Path d={RIVER_D} stroke="#7FD3F7" strokeWidth={30} fill="none" strokeLinecap="round" />
      <Path d={RIVER_D} stroke="url(#mapRiver)" strokeWidth={23} fill="none" strokeLinecap="round" />
      <Path d={RIVER_D} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="14 30" fill="none" opacity={0.35} strokeLinecap="round" />

      {/* ── roads ─────────────────────────────────────────────────── */}
      <Road d="M -10 150 L 370 150" />
      <Road d="M -10 318 L 250 318" />
      <Road d="M -10 444 L 370 444" />
      <Road d="M 86 30 L 86 560" />
      <Road d="M 214 60 L 214 560" width={18} />
      <Road d="M 214 240 L 300 240" width={16} />

      {/* ── bridges ───────────────────────────────────────────────── */}
      {/* stone arch on the north road */}
      <G>
        <Rect x={280} y={136} width={54} height={28} rx={7} fill="#DCE1EE" />
        <Path d="M 292 164 Q 307 142 322 164 Z" fill={palette.waterCyanDark} opacity={0.6} />
        <Rect x={280} y={134} width={54} height={6} rx={3} fill="#C2C9DC" />
      </G>
      {/* red arch on the south road */}
      <G>
        <Path d="M 258 448 Q 286 418 314 448" stroke={palette.engineRed} strokeWidth={9} fill="none" strokeLinecap="round" />
        <Rect x={256} y={444} width={60} height={9} rx={4} fill={palette.engineRedDark} />
        <Path d="M 268 444 L 268 432 M 286 444 L 286 425 M 304 444 L 304 432" stroke={palette.engineRed} strokeWidth={4} strokeLinecap="round" />
      </G>

      {/* ── fire station ──────────────────────────────────────────── */}
      <G>
        <Ellipse cx={64} cy={126} rx={52} ry={7} fill={palette.navy} opacity={0.12} />
        <Rect x={16} y={62} width={96} height={62} rx={5} fill={palette.tan} />
        <Path d="M 8 66 L 64 30 L 120 66 Z" fill={palette.engineRed} />
        <Rect x={6} y={62} width={116} height={10} rx={5} fill={palette.engineRedDark} />
        <Circle cx={64} cy={52} r={9} fill={palette.safetyYellow} opacity={0.9} />
        <Path d="M 64 46 c 4 3 5 6 0 10 c -5 -4 -4 -7 0 -10 z" fill={palette.engineRed} />
        <Rect x={26} y={84} width={32} height={38} rx={4} fill={palette.engineRed} />
        <Rect x={68} y={84} width={32} height={38} rx={4} fill={palette.engineRed} />
        <Rect x={30} y={90} width={24} height={11} rx={2} fill="#2F5FA8" />
        <Rect x={72} y={90} width={24} height={11} rx={2} fill="#2F5FA8" />
        <Rect x={106} y={16} width={4} height={40} rx={2} fill={palette.charcoal} />
        <Path d="M 110 18 L 138 24 L 110 34 Z" fill={palette.engineRed} />
      </G>

      {/* ── school ────────────────────────────────────────────────── */}
      <G>
        <Ellipse cx={168} cy={124} rx={48} ry={6} fill={palette.navy} opacity={0.12} />
        <Rect x={124} y={70} width={88} height={52} rx={5} fill={palette.tan} />
        <Path d="M 118 74 L 168 44 L 218 74 Z" fill={palette.engineRed} />
        <Circle cx={168} cy={66} r={11} fill={palette.white} />
        <Path d="M 168 66 L 168 60 M 168 66 L 172 69" stroke={palette.navy} strokeWidth={2} strokeLinecap="round" />
        {[130, 148, 182, 200].map((x) => (
          <Rect key={x} x={x} y={86} width={14} height={16} rx={2} fill="#2F5FA8" />
        ))}
        <Rect x={160} y={98} width={16} height={24} rx={3} fill="#8E5A26" />
        <Rect x={208} y={30} width={4} height={42} rx={2} fill={palette.charcoal} />
        <Path d="M 212 32 L 238 38 L 212 47 Z" fill={palette.safetyYellow} />
      </G>

      {/* ── clock tower ───────────────────────────────────────────── */}
      <G>
        <Ellipse cx={254} cy={132} rx={26} ry={5} fill={palette.navy} opacity={0.12} />
        <Rect x={236} y={54} width={36} height={76} rx={4} fill={palette.creamDeep} />
        <Path d="M 230 58 L 254 32 L 278 58 Z" fill="#4B6FB5" />
        <Circle cx={254} cy={74} r={12} fill={palette.white} />
        <Circle cx={254} cy={74} r={12} fill="none" stroke={palette.navy} strokeWidth={1.6} />
        <Path d="M 254 74 L 254 67 M 254 74 L 259 77" stroke={palette.navy} strokeWidth={2} strokeLinecap="round" />
        <Rect x={244} y={96} width={16} height={22} rx={3} fill="#2F5FA8" />
      </G>

      {/* ── bakery ────────────────────────────────────────────────── */}
      <G>
        <Ellipse cx={62} cy={268} rx={50} ry={6} fill={palette.navy} opacity={0.12} />
        <Rect x={16} y={212} width={92} height={54} rx={5} fill={palette.tan} />
        <Path d="M 10 216 L 62 186 L 114 216 Z" fill="#C44B3F" />
        <Ellipse cx={62} cy={196} rx={22} ry={13} fill="#E4A13E" />
        <Path d="M 48 194 q 14 -8 28 0" stroke="#B87A28" strokeWidth={2} fill="none" strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect key={i} x={18 + i * 18} y={220} width={18} height={12} fill={i % 2 ? palette.white : palette.engineRed} />
        ))}
        <Rect x={26} y={236} width={34} height={24} rx={3} fill="#2F5FA8" />
        <Rect x={70} y={236} width={26} height={30} rx={3} fill="#8E5A26" />
      </G>

      {/* ── library ───────────────────────────────────────────────── */}
      <G>
        <Ellipse cx={174} cy={270} rx={46} ry={6} fill={palette.navy} opacity={0.12} />
        <Rect x={132} y={216} width={84} height={52} rx={4} fill={palette.creamDeep} />
        <Path d="M 126 220 L 174 190 L 222 220 Z" fill="#4B6FB5" />
        <Rect x={158} y={196} width={32} height={18} rx={3} fill={palette.white} />
        <Path d="M 174 198 L 174 212" stroke="#4B6FB5" strokeWidth={2} />
        {[140, 158, 190, 206].map((x) => (
          <Rect key={x} x={x} y={230} width={12} height={20} rx={2} fill="#2F5FA8" />
        ))}
        <Rect x={166} y={240} width={16} height={28} rx={3} fill="#8E5A26" />
      </G>

      {/* ── park + fountain ───────────────────────────────────────── */}
      <G>
        <Ellipse cx={266} cy={236} rx={44} ry={38} fill="#8FD16B" />
        <Ellipse cx={266} cy={244} rx={22} ry={13} fill={palette.waterCyanLight} />
        <Ellipse cx={266} cy={244} rx={22} ry={13} fill="none" stroke={palette.white} strokeWidth={2.4} />
        <Rect x={263} y={224} width={6} height={20} rx={3} fill="#CBD3E4" />
        <Ellipse cx={266} cy={224} rx={9} ry={4} fill="#CBD3E4" />
        <Path d="M 266 220 q -6 -10 0 -16 q 6 6 0 16 z" fill={palette.waterCyanLight} />
        <Rect x={228} y={252} width={22} height={4} rx={2} fill="#B4772F" />
        <Rect x={230} y={256} width={3} height={6} rx={1.5} fill="#8E5A26" />
        <Rect x={245} y={256} width={3} height={6} rx={1.5} fill="#8E5A26" />
      </G>

      {/* ── pet shop / pizza / homes ──────────────────────────────── */}
      <G>
        <Ellipse cx={56} cy={406} rx={44} ry={6} fill={palette.navy} opacity={0.12} />
        <Rect x={16} y={356} width={80} height={48} rx={5} fill="#FFE0B2" />
        <Path d="M 10 360 L 56 332 L 102 360 Z" fill={palette.waterCyanDark} />
        <Circle cx={56} cy={346} r={9} fill={palette.white} />
        <Ellipse cx={56} cy={348} rx={4.5} ry={3.6} fill={palette.navy} />
        <Circle cx={51} cy={342} r={1.9} fill={palette.navy} />
        <Circle cx={61} cy={342} r={1.9} fill={palette.navy} />
        <Rect x={26} y={370} width={26} height={20} rx={3} fill="#2F5FA8" />
        <Rect x={62} y={370} width={22} height={34} rx={3} fill="#8E5A26" />
      </G>
      <G>
        <Ellipse cx={156} cy={406} rx={46} ry={6} fill={palette.navy} opacity={0.12} />
        <Rect x={112} y={356} width={88} height={48} rx={5} fill={palette.tan} />
        <Path d="M 106 360 L 156 330 L 206 360 Z" fill={palette.leafGreen} />
        <Path d="M 156 336 l 14 22 l -28 0 z" fill="#F3C463" />
        <Circle cx={152} cy={350} r={2.4} fill={palette.engineRed} />
        <Circle cx={160} cy={353} r={2.2} fill={palette.engineRed} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect key={i} x={114 + i * 17.6} y={362} width={17.6} height={10} fill={i % 2 ? palette.white : palette.leafGreen} />
        ))}
        <Rect x={122} y={376} width={30} height={20} rx={3} fill="#2F5FA8" />
        <Rect x={162} y={376} width={24} height={28} rx={3} fill="#8E5A26" />
      </G>
      <G>
        <House x={222} y={342} w={44} h={62} wall={palette.cream} roof="#3E8FE0" />
        <House x={258} y={356} w={40} h={50} wall="#FFE7C2" roof={palette.engineRed} />
        <Path d="M 220 402 L 300 402" stroke={palette.white} strokeWidth={3} strokeLinecap="round" />
        {[224, 238, 252, 266, 280, 294].map((x) => (
          <Path key={x} d={`M ${x} 396 L ${x} 406`} stroke={palette.white} strokeWidth={2.6} strokeLinecap="round" />
        ))}
      </G>

      {/* ── market ────────────────────────────────────────────────── */}
      <G>
        <Ellipse cx={58} cy={532} rx={46} ry={6} fill={palette.navy} opacity={0.12} />
        <Rect x={16} y={486} width={84} height={44} rx={5} fill={palette.creamDeep} />
        <Path d="M 10 490 L 58 466 L 106 490 Z" fill={palette.orange} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect key={i} x={18 + i * 16.8} y={492} width={16.8} height={10} fill={i % 2 ? palette.white : palette.orange} />
        ))}
        <Rect x={24} y={506} width={22} height={16} rx={2} fill="#2F5FA8" />
        <Circle cx={70} cy={512} r={7} fill={palette.leafGreen} />
        <Circle cx={82} cy={516} r={6} fill={palette.engineRed} />
      </G>

      {/* ── construction site ─────────────────────────────────────── */}
      <G>
        <Rect x={116} y={470} width={8} height={62} rx={2} fill="#98A0BA" />
        <Rect x={186} y={470} width={8} height={62} rx={2} fill="#98A0BA" />
        <Rect x={112} y={484} width={86} height={7} rx={3} fill="#B0B7CD" />
        <Rect x={112} y={506} width={86} height={7} rx={3} fill="#B0B7CD" />
        {/* excavator */}
        <Ellipse cx={158} cy={556} rx={40} ry={6} fill={palette.navy} opacity={0.12} />
        <Rect x={132} y={532} width={44} height={20} rx={5} fill={palette.safetyYellow} />
        <Rect x={140} y={518} width={26} height={18} rx={4} fill={palette.safetyYellow} />
        <Rect x={144} y={522} width={17} height={11} rx={2} fill={palette.waterCyanLight} />
        <Path d="M 174 528 L 200 512 L 206 522 L 184 538 Z" fill={palette.gold} />
        <Path d="M 200 520 q 12 4 10 16 l -12 -2 z" fill={palette.charcoal} />
        <Rect x={128} y={550} width={52} height={9} rx={4.5} fill={palette.charcoalDark} />
        <Circle cx={138} cy={554} r={5} fill={palette.slate} />
        <Circle cx={170} cy={554} r={5} fill={palette.slate} />
        {/* sand piles + cones */}
        <Path d="M 96 552 q 16 -22 32 0 z" fill="#D9A852" />
        <Path d="M 206 550 q 14 -18 28 0 z" fill="#D9A852" />
        {[110, 200, 224].map((x) => (
          <G key={x}>
            <Path d={`M ${x} 544 l 7 16 l -14 0 z`} fill={palette.orange} />
            <Rect x={x - 8} y={558} width={16} height={3.4} rx={1.7} fill={palette.orangeDark} />
            <Rect x={x - 4} y={550} width={8} height={3} fill={palette.white} />
          </G>
        ))}
        {/* warning sign */}
        <Path d="M 236 528 l 11 19 l -22 0 z" fill={palette.safetyYellow} stroke={palette.engineRed} strokeWidth={2} strokeLinejoin="round" />
        <Rect x={235} y={534} width={2.6} height={7} rx={1.3} fill={palette.navy} />
        <Circle cx={236.3} cy={543} r={1.4} fill={palette.navy} />
      </G>

      {/* ── lighthouse on the far bank ────────────────────────────── */}
      <G>
        <Ellipse cx={338} cy={392} rx={18} ry={5} fill={palette.navy} opacity={0.12} />
        <Path d="M 330 390 L 332 344 L 344 344 L 346 390 Z" fill={palette.white} />
        <Rect x={331} y={356} width={14} height={8} fill={palette.engineRed} />
        <Rect x={330} y={374} width={16} height={8} fill={palette.engineRed} />
        <Rect x={330} y={336} width={16} height={9} rx={3} fill={palette.safetyYellow} />
        <Path d="M 328 336 L 338 326 L 348 336 Z" fill={palette.engineRed} />
      </G>

      {/* ── greenery ──────────────────────────────────────────────── */}
      <Trees
        pts={[
          [124, 168, 22],
          [24, 176, 20],
          [232, 168, 22],
          [116, 292, 20],
          [232, 300, 22],
          [12, 300, 18],
          [104, 424, 20],
          [200, 428, 22],
          [312, 216, 20],
          [332, 292, 18],
          [28, 452, 18],
          [258, 484, 22],
          [300, 560, 20],
          [40, 574, 20],
          [128, 604, 18],
        ]}
      />

      {/* ── SPARK CITY wooden sign ────────────────────────────────── */}
      <G>
        <Rect x={252} y={584} width={7} height={26} rx={3} fill={palette.woodDark} />
        <Rect x={318} y={584} width={7} height={26} rx={3} fill={palette.woodDark} />
        <Rect x={240} y={548} width={98} height={44} rx={7} fill={palette.wood} />
        <Rect x={246} y={554} width={86} height={32} rx={5} fill="#A8703A" />
      </G>
    </Svg>
  );
});

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

/** Spark City: static art + the animated river shimmer, sized to `width`. */
export function TownMap({ width }: { width: number }) {
  const height = (MAP_VB.h / MAP_VB.w) * width;
  return (
    <View style={{ width, height }} pointerEvents="none">
      <MapArt width={width} height={height} />
      <RiverShimmer width={width} height={height} />
    </View>
  );
}

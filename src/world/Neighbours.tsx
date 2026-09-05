/**
 * NEIGHBOURS — the block the firehouse lives on.
 *
 * A single static band that sits *behind* the station: a layered hedge mass,
 * two neighbour buildings (a tan shop terrace on the left, a domed civic tower
 * on the right) and a stand of trees. It is what stops the home screen reading
 * as one building floating in an empty sky (critique #5).
 *
 * Everything is drawn to the 2.5D rule: shaded side plane, roof soffit shadow,
 * window recesses with sills, an awning or lintel over every window, and a
 * cast shadow onto the ground.
 */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { HIGHLIGHT, SHADE, SHADE_DEEP, SHADOW_FILL, SHADOW_OPACITY } from './tone';

/** Design box. Ground line is the bottom edge. */
export const NEIGHBOURS_VB = { w: 420, h: 300 } as const;

const LEAF = '#4FA858';
const LEAF_BACK = '#2F7A42';
const LEAF_LIT = '#6FC069';

/** one soft canopy blob cluster, used for the hedge mass and the tree stand */
function Canopy({ cx, cy, rx, ry, fill }: { cx: number; cy: number; rx: number; ry: number; fill: string }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />;
}

/** a window recess: sill, glass, one highlight, and a red-and-cream awning */
function Window({ x, y, w, h, awning = true }: { x: number; y: number; w: number; h: number; awning?: boolean }) {
  return (
    <G>
      <Rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={4} fill={SHADE_DEEP} />
      <Rect x={x} y={y} width={w} height={h} rx={3} fill="#3C6FB4" />
      <Path d={`M ${x} ${y + h * 0.62} L ${x + w * 0.55} ${y} L ${x + w} ${y} L ${x + w} ${y + h * 0.2} L ${x + w * 0.3} ${y + h} L ${x} ${y + h} Z`} fill={HIGHLIGHT} />
      <Rect x={x - 3} y={y + h} width={w + 6} height={3.4} rx={1.7} fill="#E9CE9A" />
      {awning ? (
        <G>
          <Path d={`M ${x - 4} ${y - 2} L ${x + w + 4} ${y - 2} L ${x + w + 2} ${y - 9} L ${x - 2} ${y - 9} Z`} fill={palette.engineRed} />
          <Path d={`M ${x + w * 0.24} ${y - 2} L ${x + w * 0.46} ${y - 2} L ${x + w * 0.44} ${y - 9} L ${x + w * 0.22} ${y - 9} Z`} fill={palette.cream} />
          <Path d={`M ${x + w * 0.68} ${y - 2} L ${x + w * 0.9} ${y - 2} L ${x + w * 0.86} ${y - 9} L ${x + w * 0.64} ${y - 9} Z`} fill={palette.cream} />
          <Path d={`M ${x - 4} ${y - 2} L ${x + w + 4} ${y - 2} L ${x + w + 4} ${y - 0.4} L ${x - 4} ${y - 0.4} Z`} fill={SHADE} />
        </G>
      ) : null}
    </G>
  );
}

const Art = memo(function Art({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${NEIGHBOURS_VB.w} ${NEIGHBOURS_VB.h}`} pointerEvents="none">
      <Defs>
        <LinearGradient id="nbWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6E1B8" />
          <Stop offset="1" stopColor={palette.tan} />
        </LinearGradient>
        <LinearGradient id="nbTower" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E4EDF9" />
          <Stop offset="1" stopColor="#C3D4EA" />
        </LinearGradient>
      </Defs>

      {/* ── the far tree mass, darkest, sitting on the horizon ───────── */}
      <G>
        <Canopy cx={26} cy={168} rx={62} ry={54} fill={LEAF_BACK} />
        <Canopy cx={96} cy={196} rx={54} ry={46} fill={LEAF_BACK} />
        <Canopy cx={210} cy={214} rx={72} ry={44} fill={LEAF_BACK} />
        <Canopy cx={324} cy={188} rx={58} ry={50} fill={LEAF_BACK} />
        <Canopy cx={398} cy={162} rx={64} ry={58} fill={LEAF_BACK} />
      </G>

      {/* ── left neighbour: a little tan shop terrace ─────────────────── */}
      <G>
        {/* cast shadow onto the ground */}
        <Ellipse cx={62} cy={294} rx={72} ry={12} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
        {/* side plane, receding to the right */}
        <Path d="M 104 158 L 126 174 L 126 292 L 104 292 Z" fill={palette.tanDark} />
        <Path d="M 104 158 L 126 174 L 126 292 L 104 292 Z" fill={SHADE} />
        <Rect x={4} y={156} width={100} height={136} rx={6} fill="url(#nbWall)" />
        {/* roof + soffit shadow */}
        <Path d="M -8 158 L 54 116 L 132 168 L 126 176 L 54 128 L -6 166 Z" fill={palette.engineRedDark} />
        <Path d="M -8 156 L 54 114 L 130 166 L 54 124 Z" fill={palette.engineRed} />
        <Rect x={4} y={156} width={100} height={10} fill={SHADE} />
        <Window x={16} y={186} w={32} h={26} />
        <Window x={62} y={186} w={30} h={26} />
        {/* shop front */}
        <Rect x={14} y={238} width={78} height={54} rx={5} fill="#E9CE9A" />
        <Rect x={20} y={246} width={66} height={30} rx={4} fill="#3C6FB4" />
        <Path d="M 20 268 L 52 246 L 68 246 L 36 276 Z" fill={HIGHLIGHT} />
        <Rect x={10} y={230} width={86} height={9} rx={4.5} fill={palette.creamDeep} />
        <Rect x={10} y={236} width={86} height={3.4} rx={1.7} fill={SHADE} />
      </G>

      {/* ── right neighbour: the domed civic tower from the reference ── */}
      <G>
        <Ellipse cx={358} cy={294} rx={62} ry={11} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
        {/* the low wing beside it */}
        <Rect x={286} y={200} width={56} height={92} rx={6} fill="url(#nbWall)" />
        <Path d="M 342 200 L 356 212 L 356 292 L 342 292 Z" fill={SHADE} />
        <Path d="M 278 202 L 314 176 L 358 212 L 352 220 L 314 188 L 280 210 Z" fill={palette.engineRedDark} />
        <Path d="M 278 200 L 314 174 L 356 210 L 314 184 Z" fill={palette.engineRed} />
        <Rect x={286} y={200} width={56} height={9} fill={SHADE} />
        <Window x={296} y={228} w={36} h={26} />

        {/* tower */}
        <Rect x={352} y={118} width={62} height={174} rx={7} fill="url(#nbTower)" />
        <Rect x={396} y={122} width={18} height={170} rx={7} fill={SHADE} />
        <Path d="M 346 122 Q 383 66 420 122 Z" fill="#7FA9D8" />
        <Path d="M 383 70 Q 405 84 418 120 L 383 120 Z" fill={SHADE} />
        <Rect x={378} y={54} width={10} height={20} rx={5} fill="#7FA9D8" />
        <Circle cx={383} cy={52} r={7} fill={palette.safetyYellow} />
        <Rect x={352} y={118} width={62} height={9} fill={SHADE} />
        <Window x={362} y={146} w={26} h={30} awning={false} />
        <Window x={362} y={200} w={26} h={30} awning={false} />
        <Rect x={352} y={252} width={62} height={40} rx={5} fill={palette.creamDeep} />
        <Path d="M 366 292 L 366 268 A 14 14 0 0 1 394 268 L 394 292 Z" fill="#8E5A2C" />
        <Path d="M 380 292 L 380 262 A 14 14 0 0 1 394 268 L 394 292 Z" fill={SHADE} />
      </G>

      {/* ── the tree stand: mid tone over the dark mass, then highlights ── */}
      <G>
        <Canopy cx={140} cy={214} rx={44} ry={40} fill={LEAF} />
        <Canopy cx={112} cy={236} rx={38} ry={32} fill={LEAF} />
        <Canopy cx={172} cy={240} rx={40} ry={30} fill={LEAF_BACK} />
        <Canopy cx={246} cy={232} rx={46} ry={34} fill={LEAF} />
        <Canopy cx={282} cy={248} rx={36} ry={26} fill={LEAF_BACK} />
        <Canopy cx={36} cy={218} rx={44} ry={38} fill={LEAF} />
        <Canopy cx={402} cy={222} rx={46} ry={40} fill={LEAF} />
        {/* one shade, one highlight — the whole mass, not per blob */}
        <Ellipse cx={156} cy={252} rx={54} ry={26} fill={SHADE} />
        <Ellipse cx={262} cy={252} rx={44} ry={22} fill={SHADE} />
        <Ellipse cx={124} cy={200} rx={22} ry={13} fill={LEAF_LIT} opacity={0.75} />
        <Ellipse cx={236} cy={218} rx={20} ry={12} fill={LEAF_LIT} opacity={0.7} />
        <Ellipse cx={26} cy={202} rx={20} ry={12} fill={LEAF_LIT} opacity={0.7} />
        <Ellipse cx={396} cy={206} rx={20} ry={12} fill={LEAF_LIT} opacity={0.68} />
      </G>

      {/* ── the hedge lip that meets the station's ground plane ───────── */}
      <G>
        <Path
          d="M -6 300 L -6 272 Q 40 254 84 270 Q 128 286 176 274 Q 226 262 272 276 Q 320 290 366 272 Q 398 260 426 272 L 426 300 Z"
          fill="#3F944E"
        />
        <Path
          d="M -6 300 L -6 284 Q 44 268 88 282 Q 132 296 178 286 Q 228 274 274 288 Q 322 300 368 284 Q 398 274 426 284 L 426 300 Z"
          fill={LEAF}
        />
        <Path d="M -6 292 Q 60 276 120 290 Q 180 302 240 288 Q 300 274 360 288 Q 396 296 426 288 L 426 294 Q 396 302 360 294 Q 300 280 240 294 Q 180 308 120 296 Q 60 282 -6 298 Z" fill={HIGHLIGHT} />
      </G>
    </Svg>
  );
});

export interface NeighboursProps {
  /** rendered width; the band keeps its own aspect */
  width: number;
  style?: React.ComponentProps<typeof View>['style'];
}

/** The block behind the firehouse. Static art — memoized, never re-rendered. */
export function Neighbours({ width, style }: NeighboursProps) {
  const height = (NEIGHBOURS_VB.h / NEIGHBOURS_VB.w) * width;
  return (
    <View style={[styles.wrap, { width, height }, style]} pointerEvents="none">
      <Art width={width} height={height} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
});

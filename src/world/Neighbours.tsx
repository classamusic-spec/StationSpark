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
import { HIGHLIGHT, SHADE, SHADE_DEEP } from './tone';

/** Design box. Ground line is the bottom edge. */
export const NEIGHBOURS_VB = { w: 420, h: 300 } as const;

/**
 * Deeper greens than the near world: this mass sits *behind* the station, so it
 * has to read as a darker silhouette or the building loses its edge.
 */
const LEAF = '#3E9450';
const LEAF_BACK = '#2A6E3B';
const LEAF_LIT = '#5CB061';
/** neighbour masonry, hazed toward the sky so it reads as distance */
const FAR_WALL = '#E7D7BA';
const FAR_ROOF = '#D06B5C';
const FAR_ROOF_DARK = '#B0554A';
const FAR_TOWER = '#C9DAEE';
const FAR_DOME = '#9FBBDC';

/** one soft canopy blob cluster, used for the hedge mass and the tree stand */
function Canopy({ cx, cy, rx, ry, fill }: { cx: number; cy: number; rx: number; ry: number; fill: string }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />;
}

/** a window recess: sill, glass, one highlight, and a red-and-cream awning */
function Window({ x, y, w, h, awning = true }: { x: number; y: number; w: number; h: number; awning?: boolean }) {
  return (
    <G>
      <Rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={4} fill={SHADE_DEEP} />
      <Rect x={x} y={y} width={w} height={h} rx={3} fill="#5480B8" />
      <Path d={`M ${x} ${y + h * 0.62} L ${x + w * 0.55} ${y} L ${x + w} ${y} L ${x + w} ${y + h * 0.2} L ${x + w * 0.3} ${y + h} L ${x} ${y + h} Z`} fill={HIGHLIGHT} />
      <Rect x={x - 3} y={y + h} width={w + 6} height={3.4} rx={1.7} fill="#E4CFA6" />
      {awning ? (
        <G>
          <Path d={`M ${x - 4} ${y - 2} L ${x + w + 4} ${y - 2} L ${x + w + 2} ${y - 9} L ${x - 2} ${y - 9} Z`} fill={FAR_ROOF} />
          <Path d={`M ${x + w * 0.24} ${y - 2} L ${x + w * 0.46} ${y - 2} L ${x + w * 0.44} ${y - 9} L ${x + w * 0.22} ${y - 9} Z`} fill={palette.creamDeep} />
          <Path d={`M ${x + w * 0.68} ${y - 2} L ${x + w * 0.9} ${y - 2} L ${x + w * 0.86} ${y - 9} L ${x + w * 0.64} ${y - 9} Z`} fill={palette.creamDeep} />
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
          <Stop offset="0" stopColor="#F2E4C8" />
          <Stop offset="1" stopColor={FAR_WALL} />
        </LinearGradient>
        <LinearGradient id="nbTower" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E4EDF9" />
          <Stop offset="1" stopColor={FAR_TOWER} />
        </LinearGradient>
      </Defs>

      {/* ── the far tree mass, darkest, climbing high at both flanks ──── */}
      <G>
        <Canopy cx={10} cy={92} rx={72} ry={64} fill={LEAF_BACK} />
        <Canopy cx={84} cy={126} rx={62} ry={56} fill={LEAF_BACK} />
        <Canopy cx={168} cy={196} rx={64} ry={46} fill={LEAF_BACK} />
        <Canopy cx={252} cy={198} rx={62} ry={44} fill={LEAF_BACK} />
        <Canopy cx={336} cy={122} rx={62} ry={56} fill={LEAF_BACK} />
        <Canopy cx={412} cy={86} rx={74} ry={66} fill={LEAF_BACK} />
      </G>

      {/* ── left neighbour: a hazy terrace rooftop peeking out ────────── */}
      <G>
        {/* side plane, receding to the right */}
        <Path d="M 72 132 L 92 150 L 92 292 L 72 292 Z" fill={FAR_WALL} />
        <Path d="M 72 132 L 92 150 L 92 292 L 72 292 Z" fill={SHADE} />
        <Rect x={-16} y={130} width={88} height={162} rx={6} fill="url(#nbWall)" />
        {/* roof + soffit shadow */}
        <Path d="M -26 134 L 28 92 L 100 144 L 94 152 L 28 104 L -24 142 Z" fill={FAR_ROOF_DARK} />
        <Path d="M -26 132 L 28 90 L 98 142 L 28 100 Z" fill={FAR_ROOF} />
        <Rect x={-16} y={130} width={88} height={10} fill={SHADE} />
        {/* chimney */}
        <Rect x={48} y={86} width={16} height={30} rx={3} fill="#C79176" />
        <Rect x={44} y={82} width={24} height={9} rx={4.5} fill="#A97460" />
        <Window x={-6} y={162} w={28} h={24} />
        <Window x={36} y={162} w={28} h={24} />
      </G>

      {/* ── right neighbour: the domed civic tower from the reference ── */}
      <G>
        {/* the low wing beside it */}
        <Rect x={318} y={186} width={50} height={106} rx={6} fill="url(#nbWall)" />
        <Path d="M 368 186 L 380 198 L 380 292 L 368 292 Z" fill={SHADE} />
        <Path d="M 310 188 L 342 162 L 384 198 L 378 206 L 342 174 L 312 196 Z" fill={FAR_ROOF_DARK} />
        <Path d="M 310 186 L 342 160 L 382 196 L 342 170 Z" fill={FAR_ROOF} />
        <Rect x={318} y={186} width={50} height={9} fill={SHADE} />
        <Window x={328} y={214} w={30} h={24} />

        {/* tower */}
        <Rect x={372} y={86} width={56} height={206} rx={7} fill="url(#nbTower)" />
        <Rect x={412} y={90} width={16} height={202} rx={7} fill={SHADE} />
        <Path d="M 366 90 Q 400 34 434 90 Z" fill={FAR_DOME} />
        <Path d="M 400 38 Q 421 54 432 88 L 400 88 Z" fill={SHADE} />
        <Rect x={395} y={16} width={9} height={22} rx={4.5} fill={FAR_DOME} />
        <Circle cx={399.5} cy={16} r={6.5} fill={palette.safetyYellow} />
        <Rect x={372} y={86} width={56} height={9} fill={SHADE} />
        <Window x={382} y={116} w={24} h={28} awning={false} />
        <Window x={382} y={176} w={24} h={28} awning={false} />
      </G>

      {/* ── the tree stand: mid tone over the dark mass, then highlights ── */}
      <G>
        <Canopy cx={30} cy={128} rx={58} ry={54} fill={LEAF} />
        <Canopy cx={-10} cy={196} rx={58} ry={52} fill={LEAF} />
        <Canopy cx={74} cy={202} rx={50} ry={44} fill={LEAF} />
        <Canopy cx={132} cy={224} rx={48} ry={38} fill={LEAF_BACK} />
        <Canopy cx={206} cy={238} rx={52} ry={34} fill={LEAF} />
        <Canopy cx={276} cy={234} rx={46} ry={32} fill={LEAF_BACK} />
        <Canopy cx={342} cy={206} rx={50} ry={44} fill={LEAF} />
        <Canopy cx={396} cy={148} rx={54} ry={50} fill={LEAF} />
        <Canopy cx={430} cy={210} rx={54} ry={48} fill={LEAF} />
        {/* one shade, one highlight — the whole mass, not per blob */}
        <Ellipse cx={26} cy={172} rx={56} ry={28} fill={SHADE} />
        <Ellipse cx={220} cy={256} rx={62} ry={24} fill={SHADE} />
        <Ellipse cx={412} cy={192} rx={56} ry={28} fill={SHADE} />
        <Ellipse cx={16} cy={98} rx={24} ry={14} fill={LEAF_LIT} opacity={0.75} />
        <Ellipse cx={62} cy={180} rx={20} ry={12} fill={LEAF_LIT} opacity={0.68} />
        <Ellipse cx={196} cy={222} rx={22} ry={12} fill={LEAF_LIT} opacity={0.68} />
        <Ellipse cx={384} cy={120} rx={24} ry={14} fill={LEAF_LIT} opacity={0.7} />
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

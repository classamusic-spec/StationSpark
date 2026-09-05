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
        <Canopy cx={6} cy={98} rx={56} ry={52} fill={LEAF_BACK} />
        <Canopy cx={58} cy={128} rx={48} ry={44} fill={LEAF_BACK} />
        <Canopy cx={112} cy={168} rx={46} ry={40} fill={LEAF_BACK} />
        <Canopy cx={170} cy={196} rx={48} ry={38} fill={LEAF_BACK} />
        <Canopy cx={230} cy={200} rx={48} ry={38} fill={LEAF_BACK} />
        <Canopy cx={288} cy={176} rx={46} ry={40} fill={LEAF_BACK} />
        <Canopy cx={344} cy={132} rx={48} ry={44} fill={LEAF_BACK} />
        <Canopy cx={402} cy={94} rx={56} ry={52} fill={LEAF_BACK} />
        <Canopy cx={440} cy={140} rx={48} ry={46} fill={LEAF_BACK} />
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
        {/* string course, then the shop front — no wall is ever left blank */}
        <Rect x={-16} y={206} width={88} height={7} rx={3.5} fill={palette.creamDeep} />
        <Rect x={-16} y={210} width={88} height={3} fill={SHADE} />
        <Rect x={-10} y={230} width={74} height={62} rx={5} fill="#EBDCBE" />
        <Rect x={-4} y={240} width={40} height={30} rx={4} fill="#5480B8" />
        <Path d="M -4 264 L 22 240 L 34 240 L 8 268 Z" fill={HIGHLIGHT} />
        <Path d="M 42 292 L 42 254 A 10 10 0 0 1 62 254 L 62 292 Z" fill="#9E6A45" />
        <Path d="M 52 292 L 52 246 A 10 10 0 0 1 62 254 L 62 292 Z" fill={SHADE} />
        <Rect x={-14} y={222} width={82} height={9} rx={4.5} fill={FAR_ROOF} />
        <Rect x={-14} y={228} width={82} height={3.4} fill={SHADE} />
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
        <Rect x={370} y={158} width={60} height={6} rx={3} fill={palette.creamDeep} />
        <Rect x={370} y={161} width={60} height={2.6} fill={SHADE} />
        <Rect x={370} y={218} width={60} height={6} rx={3} fill={palette.creamDeep} />
        <Rect x={370} y={221} width={60} height={2.6} fill={SHADE} />
        <Path d="M 386 292 L 386 254 A 13 13 0 0 1 412 254 L 412 292 Z" fill="#8E5A2C" />
        <Path d="M 400 292 L 400 242 A 13 13 0 0 1 412 254 L 412 292 Z" fill={SHADE} />
      </G>

      {/* ── the tree stand ───────────────────────────────────────────
          Many small lobes rather than a few big ones: the band is rendered
          about 1.8× larger on a tablet, and a handful of giant ellipses reads
          as flat blobs at that size. Trunks anchor the front row. */}
      <G>
        {/* trunks, so the mass is trees and not topiary */}
        {[
          [10, 246],
          [66, 258],
          [206, 272],
          [352, 258],
          [414, 246],
        ].map(([tx, ty]) => (
          <Path key={`t${tx}`} d={`M ${tx! - 5} 296 Q ${tx! - 3} ${ty! + 14} ${tx! - 3.5} ${ty!} L ${tx! + 3.5} ${ty!} Q ${tx! + 3} ${ty! + 14} ${tx! + 5} 296 Z`} fill="#7A5236" />
        ))}

        <Canopy cx={26} cy={132} rx={46} ry={42} fill={LEAF} />
        <Canopy cx={-14} cy={172} rx={42} ry={38} fill={LEAF} />
        <Canopy cx={54} cy={168} rx={34} ry={30} fill={LEAF_BACK} />
        <Canopy cx={4} cy={206} rx={44} ry={36} fill={LEAF} />
        <Canopy cx={62} cy={222} rx={38} ry={32} fill={LEAF} />
        <Canopy cx={104} cy={244} rx={34} ry={26} fill={LEAF_BACK} />
        <Canopy cx={146} cy={236} rx={38} ry={28} fill={LEAF} />
        <Canopy cx={190} cy={252} rx={36} ry={26} fill={LEAF_BACK} />
        <Canopy cx={232} cy={244} rx={38} ry={28} fill={LEAF} />
        <Canopy cx={276} cy={254} rx={34} ry={24} fill={LEAF_BACK} />
        <Canopy cx={318} cy={234} rx={38} ry={30} fill={LEAF} />
        <Canopy cx={358} cy={214} rx={40} ry={34} fill={LEAF} />
        <Canopy cx={400} cy={176} rx={40} ry={36} fill={LEAF_BACK} />
        <Canopy cx={432} cy={140} rx={44} ry={40} fill={LEAF} />
        <Canopy cx={416} cy={214} rx={38} ry={32} fill={LEAF} />
        {/* edge caps: on a tablet the band runs past the screen, and these stop
            the neighbours' walls ending in a bare slab at the frame edge */}
        <Canopy cx={-34} cy={244} rx={44} ry={40} fill={LEAF} />
        <Canopy cx={-46} cy={168} rx={40} ry={38} fill={LEAF_BACK} />
        <Canopy cx={456} cy={238} rx={44} ry={40} fill={LEAF} />
        <Canopy cx={466} cy={166} rx={40} ry={38} fill={LEAF_BACK} />
        {/* one shade, one highlight — read across the whole mass, not per blob */}
        <Ellipse cx={20} cy={176} rx={48} ry={22} fill={SHADE} />
        <Ellipse cx={72} cy={244} rx={40} ry={18} fill={SHADE} />
        <Ellipse cx={214} cy={266} rx={58} ry={18} fill={SHADE} />
        <Ellipse cx={340} cy={248} rx={44} ry={18} fill={SHADE} />
        <Ellipse cx={424} cy={182} rx={46} ry={22} fill={SHADE} />
        <Ellipse cx={14} cy={106} rx={20} ry={12} fill={LEAF_LIT} opacity={0.75} />
        <Ellipse cx={-6} cy={186} rx={16} ry={10} fill={LEAF_LIT} opacity={0.6} />
        <Ellipse cx={52} cy={206} rx={16} ry={10} fill={LEAF_LIT} opacity={0.6} />
        <Ellipse cx={140} cy={222} rx={16} ry={9} fill={LEAF_LIT} opacity={0.6} />
        <Ellipse cx={226} cy={230} rx={16} ry={9} fill={LEAF_LIT} opacity={0.6} />
        <Ellipse cx={350} cy={198} rx={16} ry={10} fill={LEAF_LIT} opacity={0.6} />
        <Ellipse cx={424} cy={114} rx={20} ry={12} fill={LEAF_LIT} opacity={0.72} />
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

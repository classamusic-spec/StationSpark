/**
 * THE ROAD, IN TWO DIMENSIONS.
 *
 * The full game, drawn with `react-native-svg` — not a placeholder. WebGL is
 * missing more often than anyone likes (an old tablet, a blocked driver, a lost
 * context, the QA harness without a GPU), and a child on one of those devices
 * has to be able to finish the same run, with the same truck, the same hazards
 * and the same gates. Same sim, same projection, different paint.
 *
 * Everything here is fed by `RunFrame` and placed by `project()`, so a cone is
 * on exactly the pixel the 3D scene would have put it on.
 */
import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import type { TruckStyle } from '@/state/store';
import { lampColors, truckTones } from '@/three/palette3d';
import type { RunFrame, VisibleItem } from './run';
import { CAMERA, ROAD_HALF, horizonY, project, roadView, type RoadView } from './projection';
import { destinationFor, streetSeed } from './neighbourhood';
import { TownArrival, TownBuildings, TownFurniture, TownJunctions, TownPavements, townFrame } from './TownView2D';

/** How high above the tarmac the gate banner hangs, in road units. */
export const GATE_BANNER_Y = 2.9;
export const GATE_BANNER_BOTTOM = 1.55;
/** Board width in road units — the 3D gate uses the same number. */
export const GATE_BOARD_W = 2.35;
const GATE_POST_X = 1.25;
const STRIPE_LENGTH = 3;
const STRIPE_GAP = 5;

const tarmac = { face: '#6E778F', shade: '#5C6580', light: '#8A93AB' } as const;
/** The pale edge line that tells a child where the driveable road stops. */
const KERB_LINE = '#E8ECF6';

/* ------------------------------------------------------------------ */
/* Props                                                                */
/* ------------------------------------------------------------------ */

/**
 * One prop, drawn in road units around the point where it meets the tarmac, so
 * the projection can simply translate and scale it into place.
 */
const PropArt = memo(function PropArt({ item }: { item: VisibleItem }) {
  const spent = item.spent === true;
  switch (item.kind) {
    case 'pothole':
      return (
        <G opacity={spent ? 0.55 : 1}>
          <Ellipse cx={0} cy={0} rx={1} ry={0.36} fill={tarmac.shade} />
          <Ellipse cx={0} cy={-0.05} rx={0.82} ry={0.27} fill={palette.charcoalDark} />
          <Ellipse cx={-0.2} cy={-0.1} rx={0.3} ry={0.1} fill={palette.charcoal} />
        </G>
      );
    case 'puddle':
      return (
        <G opacity={spent ? 0.5 : 0.9}>
          <Ellipse cx={0} cy={0} rx={1.15} ry={0.42} fill={palette.waterCyanDark} opacity={0.55} />
          <Ellipse cx={0} cy={-0.05} rx={0.95} ry={0.32} fill={palette.waterCyanLight} opacity={0.8} />
          <Ellipse cx={-0.3} cy={-0.12} rx={0.3} ry={0.08} fill={palette.white} opacity={0.7} />
        </G>
      );
    case 'cone':
      return (
        <G opacity={spent ? 0.7 : 1}>
          <Ellipse cx={0} cy={0} rx={0.6} ry={0.2} fill={palette.navy} opacity={0.18} />
          {spent ? (
            <G transform="rotate(64)">
              <Path d="M-0.34 0 L0.34 0 L0.12 -1.25 L-0.12 -1.25 Z" fill={palette.orange} />
            </G>
          ) : (
            <>
              <Rect x={-0.55} y={-0.18} width={1.1} height={0.22} rx={0.1} fill={palette.orangeDark} />
              <Path d="M-0.42 -0.16 L0.42 -0.16 L0.13 -1.32 L-0.13 -1.32 Z" fill={palette.orange} />
              <Path d="M0.02 -0.16 L0.42 -0.16 L0.13 -1.32 L0.02 -1.32 Z" fill={palette.orangeDark} opacity={0.55} />
              <Path d="M-0.3 -0.62 L0.3 -0.62 L0.24 -0.86 L-0.24 -0.86 Z" fill={palette.white} />
            </>
          )}
        </G>
      );
    case 'hose':
      return (
        <G opacity={spent ? 0.6 : 1}>
          <Ellipse cx={0} cy={0} rx={1.05} ry={0.42} fill={palette.safetyYellow} />
          <Ellipse cx={0} cy={-0.04} rx={0.62} ry={0.24} fill={tarmac.face} />
          <Ellipse cx={0} cy={-0.12} rx={1.05} ry={0.4} fill={palette.goldDark} opacity={0.35} />
          <Ellipse cx={0} cy={-0.16} rx={0.62} ry={0.22} fill={tarmac.face} />
        </G>
      );
    case 'car':
      return (
        <G opacity={spent ? 0.75 : 1}>
          <Ellipse cx={0} cy={0} rx={1.05} ry={0.3} fill={palette.navy} opacity={0.18} />
          <Rect x={-0.9} y={-1.5} width={1.8} height={1.45} rx={0.35} fill={palette.waterCyanDark} />
          <Rect x={-0.72} y={-1.34} width={1.44} height={0.62} rx={0.22} fill={palette.navy} />
          <Rect x={-0.66} y={-1.28} width={0.5} height={0.3} rx={0.12} fill={palette.waterCyanLight} opacity={0.6} />
          <Rect x={-0.9} y={-0.42} width={1.8} height={0.28} rx={0.14} fill={palette.slateLight} />
          <Circle cx={-0.66} cy={-0.5} r={0.16} fill={palette.engineRedLight} />
          <Circle cx={0.66} cy={-0.5} r={0.16} fill={palette.engineRedLight} />
        </G>
      );
    case 'ramp':
      return (
        <G opacity={spent ? 0.8 : 1}>
          <Path d="M-1.25 0 L1.25 0 L1.25 -0.2 L-1.25 -1.15 Z" fill={palette.safetyYellow} />
          <Path d="M-1.25 -1.15 L1.25 -0.2 L1.25 -0.34 L-1.25 -1.29 Z" fill={palette.gold} />
          <Rect x={-1.25} y={-0.2} width={2.5} height={0.2} rx={0.08} fill={palette.goldDark} />
          <Path d="M-0.5 -0.62 L0.1 -0.85 L0.1 -0.62 L0.7 -0.85 L0.1 -1.02 L0.1 -0.79 Z" fill={palette.navy} opacity={0.28} />
        </G>
      );
    case 'boost':
      return (
        <G opacity={spent ? 0.6 : 1}>
          <Ellipse cx={0} cy={0} rx={1.25} ry={0.5} fill={palette.waterCyanDark} opacity={0.5} />
          <Ellipse cx={0} cy={-0.04} rx={1.05} ry={0.4} fill={palette.waterCyan} />
          <Path d="M-0.55 -0.34 L0.05 -0.04 L-0.55 0.26 L-0.3 -0.04 Z" fill={palette.white} opacity={0.9} />
          <Path d="M0.05 -0.34 L0.65 -0.04 L0.05 0.26 L0.3 -0.04 Z" fill={palette.white} opacity={0.9} />
        </G>
      );
    default:
      return null;
  }
});

/* ------------------------------------------------------------------ */
/* The truck, from behind                                               */
/* ------------------------------------------------------------------ */

/**
 * The child's own engine, seen from the back — the same paint, decal colours and
 * light bar as the 3D model and the Garage turntable, drawn in road units.
 */
const TruckBack = memo(function TruckBack({ truck, flash }: { truck: TruckStyle; flash: boolean }) {
  const tone = truckTones[truck.color];
  const [lampA, lampB] = lampColors[truck.lights];
  return (
    <G>
      <Ellipse cx={0} cy={0.08} rx={1.25} ry={0.34} fill={palette.navy} opacity={0.22} />
      {/* wheels */}
      <Rect x={-1.02} y={-0.72} width={0.34} height={0.78} rx={0.14} fill={palette.charcoalDark} />
      <Rect x={0.68} y={-0.72} width={0.34} height={0.78} rx={0.14} fill={palette.charcoalDark} />
      {/* body */}
      <Rect x={-0.92} y={-2.16} width={1.84} height={1.7} rx={0.26} fill={tone.face} />
      <Rect x={0.2} y={-2.16} width={0.72} height={1.7} rx={0.26} fill={tone.shade} opacity={0.5} />
      <Rect x={-0.8} y={-2.06} width={1.6} height={0.5} rx={0.18} fill={palette.navy} />
      <Rect x={-0.7} y={-2} width={0.6} height={0.24} rx={0.1} fill={palette.waterCyanLight} opacity={0.5} />
      {/* reflective stripe + bumper */}
      <Rect x={-0.92} y={-1.12} width={1.84} height={0.26} rx={0.1} fill={palette.safetyYellow} />
      <Rect x={-1} y={-0.66} width={2} height={0.28} rx={0.12} fill={palette.slateLight} />
      {/* tail lights */}
      <Rect x={-0.82} y={-1.02} width={0.34} height={0.28} rx={0.12} fill={palette.engineRedLight} />
      <Rect x={0.48} y={-1.02} width={0.34} height={0.28} rx={0.12} fill={palette.engineRedLight} />
      {/* roof ladder + light bar */}
      <Rect x={-0.72} y={-2.3} width={1.44} height={0.14} rx={0.07} fill={palette.slate} />
      <Rect x={-0.62} y={-2.46} width={0.52} height={0.2} rx={0.1} fill={flash ? lampA : palette.slateLight} />
      <Rect x={0.1} y={-2.46} width={0.52} height={0.2} rx={0.1} fill={flash ? palette.slateLight : lampB} />
    </G>
  );
});

/* ------------------------------------------------------------------ */
/* The road                                                             */
/* ------------------------------------------------------------------ */

function laneStripes(vp: RoadView, distance: number, depth: number): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const period = STRIPE_LENGTH + STRIPE_GAP;
  const first = Math.ceil(distance / period) * period;
  for (let d = first; d - distance < depth; d += period) {
    const near = d - distance;
    const far = near + STRIPE_LENGTH;
    if (far < 0) continue;
    for (const edge of [0.5, 1.5]) {
      const a = project(vp, edge, near);
      const b = project(vp, edge, far);
      const wa = 0.16 * a.scale;
      const wb = 0.16 * b.scale;
      out.push(
        <Path
          key={`${d}-${edge}`}
          d={`M${a.x - wa} ${a.y} L${a.x + wa} ${a.y} L${b.x + wb} ${b.y} L${b.x - wb} ${b.y} Z`}
          fill={palette.cream}
          opacity={0.85}
        />,
      );
    }
  }
  return out;
}

/**
 * The rest of Spark City, stepping along the horizon behind the street.
 *
 * Roof-lines, not hills: the drive is through a town now, so what stands at the
 * end of the road has to be more town. It is drawn soft and low so it reads as
 * distance and never competes with a gate.
 */
function skylinePath(w: number, hy: number, h: number, shift = 0): string {
  const steps = 9;
  const parts = [`M0 ${hy}`];
  for (let i = 0; i < steps; i += 1) {
    const x0 = ((i + shift) / steps) * w;
    const x1 = ((i + 1 + shift) / steps) * w;
    const top = hy - h * (0.35 + ((i * 7 + 3) % 5) * 0.19);
    parts.push(`L${x0.toFixed(1)} ${top.toFixed(1)} L${x1.toFixed(1)} ${top.toFixed(1)}`);
  }
  parts.push(`L${w} ${hy} Z`);
  return parts.join(' ');
}

function Gate({ vp, item, assist }: { vp: RoadView; item: VisibleItem; assist: boolean }) {
  const base = project(vp, item.lane, item.ahead);
  const top = project(vp, item.lane, item.ahead, GATE_BANNER_Y);
  const postW = 0.18 * base.scale;
  const left = base.x - GATE_POST_X * base.scale;
  const right = base.x + GATE_POST_X * base.scale;
  const boardH = (GATE_BANNER_Y - GATE_BANNER_BOTTOM) * base.scale;
  const boardW = GATE_BOARD_W * base.scale;
  return (
    <G>
      <Rect x={left - postW / 2} y={top.y} width={postW} height={base.y - top.y} rx={postW / 2} fill={palette.slate} />
      <Rect x={right - postW / 2} y={top.y} width={postW} height={base.y - top.y} rx={postW / 2} fill={palette.slate} />
      {assist ? (
        <Rect
          x={base.x - boardW / 2 - 0.14 * base.scale}
          y={top.y - 0.14 * base.scale}
          width={boardW + 0.28 * base.scale}
          height={boardH + 0.28 * base.scale}
          rx={0.34 * base.scale}
          fill={palette.safetyYellow}
        />
      ) : null}
      <Rect x={base.x - boardW / 2} y={top.y} width={boardW} height={boardH} rx={0.26 * base.scale} fill={palette.white} />
      <Rect
        x={base.x - boardW / 2}
        y={top.y}
        width={boardW}
        height={0.22 * base.scale}
        rx={0.11 * base.scale}
        fill={palette.waterCyanLight}
        opacity={0.7}
      />
    </G>
  );
}

export interface RoadView2DProps {
  frame: RunFrame;
  truck: TruckStyle;
  width: number;
  height: number;
  reduced: boolean;
  /** the run's scene — which corner of Spark City the street is dressed as */
  scene?: string;
}

/**
 * The whole road in one SVG. Gate *labels* are not drawn here — they are real
 * `@/ui` `<Text>` in an overlay above this view (house rule: all text goes
 * through the type scale), placed with the very same projection.
 */
export const RoadView2D = memo(function RoadView2D({ frame, truck, width, height, reduced, scene }: RoadView2DProps) {
  const vp = roadView({ w: width, h: height }, frame.lane);
  const hy = horizonY(vp);
  /* the town beside the road: the same list the 3D street draws, from the same
     distance, through the same camera */
  const seed = useMemo(() => streetSeed(scene), [scene]);
  const destination = useMemo(() => destinationFor(scene), [scene]);
  const street = townFrame(frame.distance, seed, destination, frame.finishAhead);
  const near = project(vp, 1, -CAMERA.back + 1.2);
  const nearHalf = ROAD_HALF * near.scale;
  const nearMid = near.x;
  /* far enough away that the edges have all but met at the vanishing point */
  const far = project(vp, 1, 400);
  const farHalf = ROAD_HALF * far.scale;
  const farMid = far.x;
  const flash = !reduced && Math.floor(frame.distance / 2.2) % 2 === 0;
  const truckAt = project(vp, frame.lane, 0, frame.jump * (reduced ? 0.5 : 1.4));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="truckRunGround" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.grass} />
            <Stop offset="1" stopColor={palette.grassDark} />
          </LinearGradient>
          <LinearGradient id="truckRunHaze" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.skyBottom} stopOpacity={0.62} />
            <Stop offset="1" stopColor={palette.skyBottom} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* the rest of the town, stepping along the horizon behind the street */}
        <Path d={skylinePath(width, hy, Math.max(18, height * 0.055))} fill={palette.navySoft} opacity={0.24} />
        <Path d={skylinePath(width, hy, Math.max(12, height * 0.036), 0.4)} fill={palette.navy} opacity={0.16} />

        {/* the ground the whole neighbourhood stands on */}
        <Rect x={0} y={hy} width={width} height={height - hy} fill="url(#truckRunGround)" />

        {/* Spark City itself, behind the pavements */}
        <TownBuildings vp={vp} street={street} />
        <TownPavements vp={vp} />

        {/* tarmac */}
        <Path
          d={`M${nearMid - nearHalf} ${near.y} L${nearMid + nearHalf} ${near.y} L${farMid + farHalf} ${hy} L${farMid - farHalf} ${hy} Z`}
          fill={tarmac.face}
        />
        {/* kerbs: a pale strip down each edge of the tarmac */}
        {[-1, 1].map((side) => {
          const nx = nearMid + side * nearHalf;
          const fx = farMid + side * farHalf;
          const nw = 0.34 * near.scale;
          const fw = 0.34 * far.scale;
          return (
            <Path
              key={`kerb${side}`}
              d={`M${nx - side * nw} ${near.y} L${nx} ${near.y} L${fx} ${hy} L${fx - side * fw} ${hy} Z`}
              fill={KERB_LINE}
              opacity={0.9}
            />
          );
        })}
        {/* side streets and their crossings, painted on the tarmac */}
        <TownJunctions vp={vp} street={street} />
        {laneStripes(vp, frame.distance, 120)}
        {/* lamps, trees, hydrants and parked cars stand in front of the walls */}
        <TownFurniture vp={vp} street={street} />
        <TownArrival vp={vp} street={street} />
        {/* the haze the distance fades into — the SVG twin of the 3D fog */}
        <Rect x={0} y={hy - height * 0.035} width={width} height={height * 0.09} fill="url(#truckRunHaze)" />

        {/* everything on the road, far things first */}
        {frame.items.map((item) => {
          if (item.kind === 'gate') {
            /* one gate frame per lane; the assist ring only ever shows one */
            return <Gate key={item.id} vp={vp} item={item} assist={frame.assistLane === item.lane} />;
          }
          const p = project(vp, item.lane, item.ahead);
          if (p.y > height + 200) return null;
          return (
            <G key={item.id} transform={`translate(${p.x} ${p.y}) scale(${p.scale})`}>
              <PropArt item={item} />
            </G>
          );
        })}

        {/* speed lines while boosting */}
        {frame.boost > 0.05 && !reduced
          ? [0, 1, 2, 3].map((i) => {
              const side = i % 2 === 0 ? -1 : 1;
              const y = hy + height * (0.18 + i * 0.12);
              const len = width * 0.16 * frame.boost;
              const x = vp.w / 2 + side * width * (0.3 + (i % 3) * 0.08);
              return <Rect key={i} x={x - len / 2} y={y} width={len} height={3} rx={1.5} fill={palette.white} opacity={0.55 * frame.boost} />;
            })
          : null}

        {/* the truck's own shadow stays on the tarmac while it is in the air */}
        {frame.jump > 0.02 ? (
          <Ellipse
            cx={project(vp, frame.lane, 0).x}
            cy={project(vp, frame.lane, 0).y}
            rx={1.2 * truckAt.scale * (1 - frame.jump * 0.35)}
            ry={0.34 * truckAt.scale * (1 - frame.jump * 0.35)}
            fill={palette.navy}
            opacity={0.18}
          />
        ) : null}

        <G transform={`translate(${truckAt.x} ${truckAt.y}) scale(${truckAt.scale})`}>
          <TruckBack truck={truck} flash={flash} />
        </G>
      </Svg>
    </View>
  );
});

/**
 * Where a gate label belongs on screen, and how big it can be.
 *
 * The banner is 2.35 road units wide whatever the distance, so a long label
 * ("30 min", "ladder") has to be set smaller than a short one or it would spill
 * off its own board. This is the one place that decides that, so the 3D road
 * and the 2D road letter their gates identically.
 */
export function gateLabelSpot(
  vp: RoadView,
  lane: number,
  ahead: number,
  label: string,
): { x: number; y: number; size: number } {
  const p = project(vp, lane, ahead, (GATE_BANNER_Y + GATE_BANNER_BOTTOM) / 2);
  const fitsWidth = (GATE_BOARD_W * 0.86 * p.scale) / Math.max(1.6, label.length * 0.62);
  return { x: p.x, y: p.y, size: Math.max(9, Math.min(30, 0.95 * p.scale, fitsWidth)) };
}

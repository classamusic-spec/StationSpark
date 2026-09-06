/**
 * SPARK CITY, IN TWO DIMENSIONS.
 *
 * The same street the 3D road draws — same shops, same corners, same lamps —
 * drawn with `react-native-svg` for every child whose browser or tablet has no
 * WebGL. It is not a backdrop: it is the *same list*, from `streetView()`, put
 * through the *same camera*, `projectX()`. If the two ever disagree, one of
 * them is reading the numbers wrong.
 *
 * The perspective is real, not faked. A wall running away from the truck is a
 * projected quadrilateral, so it recedes; a roof is the slope you would
 * actually see from a cab. Only the small stuff — a window, a shop sign, a
 * wheel — is placed as an upright shape at its projected centre, because at
 * that size the shear is invisible and the saving is not.
 *
 * ### Keeping it cheap
 *
 * Everything past `TOWN_DEPTH_2D` is dropped (the haze has it anyway), and
 * anything past `DETAIL_DEPTH` is drawn as massing only — walls and roof, no
 * windows, no awning, no sign. That LOD is what keeps a whole street inside the
 * node budget the SVG road already lived within.
 */
import React, { memo } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import {
  BUILDINGS,
  BUILD_LINE,
  CROSSING_BARS,
  CROSSING_BAR_W,
  GARDEN_LENGTH,
  SIDE_STREET_LENGTH,
  streetView,
  type BuildingId,
  type BuildingSpec,
  type StreetBuilding,
  type StreetFrame,
  type StreetProp,
} from './neighbourhood';
import { CAMERA, ROAD_HALF, projectX, type Projected, type RoadView } from './projection';

/** How far down the street the SVG town is drawn. */
export const TOWN_DEPTH_2D = 72;
/** Past this, a building is massing only — the haze is eating it anyway. */
const DETAIL_DEPTH = 30;
/**
 * A building whose near end is behind this is level with the cab: `streetView`
 * has already culled everything further back, and the camera sits 13 units
 * behind the truck, so a wall is never closer than a few units and the
 * projection never degenerates.
 */
const NEAR_DETAIL = -6;
/** Furniture this close is level with the cab — off the edge, and enormous. */
const NEAR_PROP = 6;
/** Road units between the bars of a zebra crossing (matches the 3D town). */
const CROSSING_PITCH = 1.7;
/** How close to the camera the pavement is modelled. */
const PAVEMENT_NEAR = -CAMERA.back + 1.2;
const PAVEMENT_FAR = 400;

const GLASS = '#3A5FA8';
const PAVING = '#D6DCE9';
const PAVING_EDGE = '#B9C0D4';

type P = Pick<Projected, 'x' | 'y'>;

const quad = (a: P, b: P, c: P, d: P): string =>
  `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)} L${c.x.toFixed(1)} ${c.y.toFixed(1)} L${d.x.toFixed(1)} ${d.y.toFixed(1)} Z`;

const tri = (a: P, b: P, c: P): string =>
  `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)} L${c.x.toFixed(1)} ${c.y.toFixed(1)} Z`;

/* ------------------------------------------------------------------ */
/* One building                                                         */
/* ------------------------------------------------------------------ */

/** The roof, as the child sees it from the cab: a gable end and one slope. */
function Roof({ vp, spec, s, n, f, xi, xo }: { vp: RoadView; spec: BuildingSpec; s: number; n: number; f: number; xi: number; xo: number }) {
  const H = spec.height;
  const R = spec.roofHeight;
  const mid = (n + f) / 2;
  const face = s < 0 ? spec.roofDark : spec.roofColor;
  const p = (x: number, ahead: number, h: number) => projectX(vp, x, ahead, h);

  if (spec.roof === 'flat') {
    return (
      <G>
        <Path d={quad(p(xi, n, H), p(xi, f, H), p(xi, f, H + R), p(xi, n, H + R))} fill={face} />
        <Path d={quad(p(xi, n, H), p(xo, n, H), p(xo, n, H + R), p(xi, n, H + R))} fill={spec.roofColor} />
      </G>
    );
  }

  /* a hip roof keeps a short ridge; a gable and a pyramid come to a point */
  const inset = spec.roof === 'hip' ? (f - n) * 0.24 : (f - n) / 2;
  const gableEnd =
    inset >= (f - n) / 2 - 0.01
      ? tri(p(xi, n, H), p(xi, f, H), p(xi, mid, H + R))
      : quad(p(xi, n, H), p(xi, f, H), p(xi, f - inset, H + R), p(xi, n + inset, H + R));

  return (
    <G>
      <Path d={gableEnd} fill={face} />
      <Path d={quad(p(xi, n, H), p(xo, n, H), p(xo, n + inset, H + R), p(xi, n + inset, H + R))} fill={spec.roofColor} />
      <Path
        d={quad(p(xi, n, H - 0.28), p(xi, f, H - 0.28), p(xi, f, H + 0.1), p(xi, n, H + 0.1))}
        fill={spec.roofDark}
      />
    </G>
  );
}

/**
 * A shape lying flat on a wall that runs away from the truck.
 *
 * This is the whole trick of drawing a street in SVG. A wall beside the road is
 * seen almost edge-on, so anything painted on it — a window, an awning, a shop
 * sign — is squeezed horizontally to a fraction of its real width, and *how
 * much* depends on how far down the road it is. Projecting both ends of the
 * shape and measuring between them gets that for free; taking the centre and
 * scaling it evenly does not, and leaves windows four times too wide, floating
 * off the front of their own building.
 */
function onWall(vp: RoadView, xi: number, z: number, y: number, w: number, h: number) {
  const a = projectX(vp, xi, z - w / 2, y);
  const b = projectX(vp, xi, z + w / 2, y);
  const scale = (a.scale + b.scale) / 2;
  return {
    cx: (a.x + b.x) / 2,
    cy: (a.y + b.y) / 2,
    rx: Math.max(0.5, Math.abs(b.x - a.x) / 2),
    ry: Math.max(0.5, (h / 2) * scale),
    scale,
  };
}

/**
 * A *solid* standing against the wall — a column, a cupola, a chimney.
 *
 * The counterpart to `onWall`: a round column looks the same width from every
 * angle and a cupola is a box with real depth, so neither is squeezed the way
 * paint on the wall is. Only where it sits along the road is projected.
 */
function standing(vp: RoadView, xi: number, z: number, y: number, w: number, h: number) {
  const at = projectX(vp, xi, z, y);
  return { cx: at.x, cy: at.y, rx: (w / 2) * at.scale, ry: (h / 2) * at.scale, scale: at.scale };
}

/** Windows, awning, door and the one motif that names the shop. */
function Front({ vp, spec, s, n, f, xi }: { vp: RoadView; spec: BuildingSpec; s: number; n: number; f: number; xi: number }) {
  const on = (z: number, y: number, w: number, h: number) => onWall(vp, xi, z, y, w, h);
  const mid = (n + f) / 2;
  const bits: React.ReactElement[] = [];
  const plate = (key: string, z: number, y: number, w: number, h: number, fill: string, round = 0.12) => {
    const b = on(z, y, w, h);
    bits.push(
      <Rect
        key={key}
        x={b.cx - b.rx}
        y={b.cy - b.ry}
        width={b.rx * 2}
        height={b.ry * 2}
        rx={Math.min(b.rx, round * b.scale)}
        fill={fill}
      />,
    );
    return b;
  };
  const disc = (key: string, z: number, y: number, r: number, fill: string) => {
    const b = on(z, y, r * 2, r * 2);
    bits.push(<Ellipse key={key} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={fill} />);
    return b;
  };

  /* mullioned windows up the wall, frame and glass, exactly as on the map */
  const columns = Math.min(3, Math.max(2, Math.round(spec.frontage / 3.6)));
  const rows = Math.min(2, spec.storeys);
  const ground = spec.awning ? 1 : 0;
  const wide = spec.frontage / columns;
  const ww = Math.min(1.5, wide * 0.5);
  const wh = Math.min(1.35, spec.height / (spec.storeys + 1.1));
  for (let row = ground; row < rows; row += 1) {
    const y = spec.height * ((row + 0.62) / (spec.storeys + 0.25));
    for (let col = 0; col < columns; col += 1) {
      const z = mid + (col - (columns - 1) / 2) * wide;
      plate(`f${row}-${col}`, z, y, ww + 0.3, wh + 0.3, palette.creamDeep);
      plate(`w${row}-${col}`, z, y, ww, wh, GLASS);
    }
  }

  if (spec.awning) {
    /* shop window, then the striped canopy over it, as on the town map */
    const shopW = spec.frontage * 0.6;
    const shopZ = mid - spec.frontage * 0.14;
    plate('shopf', shopZ, 1.1, shopW + 0.3, 1.74, palette.creamDeep);
    plate('shop', shopZ, 1.1, shopW, 1.44, GLASS);
    const bands = 4;
    for (let i = 0; i < bands; i += 1) {
      const bw = shopW / bands;
      plate(`a${i}`, shopZ + (i - (bands - 1) / 2) * bw, 2.15, bw, 0.48, i % 2 === 0 ? spec.trim : palette.white, 0);
    }
  }

  plate('door', mid + spec.frontage * 0.3, 1.05, 1.16, 2.1, '#8E5A26', 0.2);

  const signY = spec.height + (spec.roof === 'gable' ? spec.roofHeight * 0.42 : -0.5);
  switch (spec.sign) {
    case 'loaf':
      disc('s1', mid, signY, 0.86, '#F0BC63');
      disc('s2', mid - 0.3, signY - 0.24, 0.3, '#FFF3D6');
      break;
    case 'pizza':
      disc('s1', mid, signY, 0.86, palette.white);
      disc('s2', mid, signY, 0.62, '#F3C463');
      disc('s3', mid + 0.24, signY + 0.16, 0.2, '#E8523F');
      break;
    case 'paw':
      disc('s1', mid, signY, 0.8, palette.white);
      disc('s2', mid, signY + 0.16, 0.32, palette.navy);
      disc('s3', mid - 0.34, signY - 0.28, 0.14, palette.navy);
      disc('s4', mid + 0.34, signY - 0.28, 0.14, palette.navy);
      break;
    case 'clock': {
      disc('s1', mid, spec.height * 0.74, 1.32, '#DCC79F');
      const dial = disc('s2', mid, spec.height * 0.74, 1.12, palette.white);
      bits.push(
        <Path
          key="s3"
          d={`M${dial.cx} ${dial.cy} L${dial.cx} ${dial.cy - dial.ry * 0.66} M${dial.cx} ${dial.cy} L${dial.cx + dial.rx * 0.45} ${dial.cy + dial.ry * 0.22}`}
          stroke={palette.navy}
          strokeWidth={Math.max(1.2, 0.14 * dial.scale)}
          strokeLinecap="round"
        />,
      );
      break;
    }
    case 'books':
      plate('s1', mid, spec.height - 0.9, spec.frontage * 0.5, 0.72, spec.trim, 0.16);
      for (const dz of [-spec.frontage * 0.22, 0, spec.frontage * 0.22]) {
        const col = standing(vp, xi, mid + dz, spec.height / 2, 0.68, spec.height);
        bits.push(
          <Rect key={`c${dz}`} x={col.cx - col.rx} y={col.cy - col.ry} width={col.rx * 2} height={col.ry * 2} fill={palette.cream} />,
        );
      }
      break;
    case 'stall': {
      const bands = 5;
      for (let i = 0; i < bands; i += 1) {
        const bw = (spec.frontage * 0.9) / bands;
        plate(`k${i}`, mid + (i - (bands - 1) / 2) * bw, spec.height + 0.6, bw, 0.6, i % 2 === 0 ? spec.trim : palette.white, 0);
      }
      break;
    }
    case 'bell': {
      /* the belfry is a little box with a roof on it, not paint on a wall */
      const cupY = spec.height + spec.roofHeight + 0.8;
      const cup = standing(vp, xi, mid, cupY, 2, 1.5);
      bits.push(
        <Path
          key="s2"
          d={`M${cup.cx - cup.rx * 1.3} ${cup.cy - cup.ry} L${cup.cx} ${cup.cy - cup.ry - 1.2 * cup.scale} L${cup.cx + cup.rx * 1.3} ${cup.cy - cup.ry} Z`}
          fill={spec.roofDark}
        />,
      );
      bits.push(
        <Rect key="s1" x={cup.cx - cup.rx} y={cup.cy - cup.ry} width={cup.rx * 2} height={cup.ry * 2} fill={palette.creamDeep} />,
      );
      bits.push(<Circle key="s3" cx={cup.cx} cy={cup.cy + cup.ry * 0.2} r={0.5 * cup.scale} fill={palette.safetyYellow} />);
      break;
    }
    case 'helmet':
      plate('s1', mid, spec.height - 0.9, spec.frontage * 0.72, 1.1, palette.cream, 0.2);
      for (const dz of [-spec.frontage * 0.24, spec.frontage * 0.24]) {
        plate(`bay${dz}`, mid + dz, 1.7, spec.frontage * 0.3, 3.4, palette.creamDeep, 0.2);
      }
      break;
    default:
      break;
  }

  return <G>{bits}</G>;
}

const Building = memo(function Building({ vp, item }: { vp: RoadView; item: StreetBuilding }) {
  const spec = BUILDINGS[item.kind];
  const s = item.side;
  const mid = item.ahead + item.length / 2;
  const n = mid - spec.frontage / 2;
  const f = mid + spec.frontage / 2;
  const xi = s * BUILD_LINE;
  const xo = s * (BUILD_LINE + spec.depth);
  const H = spec.height;
  const p = (x: number, ahead: number, h: number) => projectX(vp, x, ahead, h);
  /* light falls from the left, exactly as on the town map: the wall a
     left-hand building shows the road is its shaded one, and the other side's
     is its lit one */
  const inner = s < 0 ? spec.wallShade : spec.wallLight;
  const detail = item.ahead < DETAIL_DEPTH && item.ahead > NEAR_DETAIL;

  return (
    <G>
      {/* the flank running away from the truck, then the end facing it */}
      <Path d={quad(p(xi, n, 0), p(xi, n, H), p(xi, f, H), p(xi, f, 0))} fill={inner} />
      <Path d={quad(p(xi, n, 0), p(xi, n, H), p(xo, n, H), p(xo, n, 0))} fill={spec.wall} />
      <Path d={quad(p(xi, n, 0), p(xi, f, 0), p(xi, f, 0.42), p(xi, n, 0.42))} fill={spec.wallShade} />
      <Roof vp={vp} spec={spec} s={s} n={n} f={f} xi={xi} xo={xo} />
      {detail ? <Front vp={vp} spec={spec} s={s} n={n} f={f} xi={xi} /> : null}
    </G>
  );
});

/* ------------------------------------------------------------------ */
/* Street furniture                                                     */
/* ------------------------------------------------------------------ */

const Furniture = memo(function Furniture({ vp, item }: { vp: RoadView; item: StreetProp }) {
  const p = (h: number, dx = 0) => projectX(vp, item.x + dx, item.ahead, h);
  switch (item.kind) {
    case 'lamp': {
      const base = p(0.14);
      const top = p(4.5);
      const head = p(4.1, -item.side * 1.4);
      return (
        <G>
          <Rect x={base.x - 0.1 * base.scale} y={top.y} width={0.2 * base.scale} height={base.y - top.y} fill={palette.slate} />
          <Rect x={Math.min(head.x, top.x)} y={top.y} width={Math.abs(head.x - top.x)} height={0.18 * top.scale} fill={palette.slate} />
          <Rect
            x={head.x - 0.34 * head.scale}
            y={head.y - 0.2 * head.scale}
            width={0.68 * head.scale}
            height={0.44 * head.scale}
            rx={0.14 * head.scale}
            fill={palette.safetyYellow}
          />
        </G>
      );
    }
    case 'hydrant': {
      const base = p(0.14);
      return (
        <G>
          <Rect x={base.x - 0.27 * base.scale} y={base.y - 1 * base.scale} width={0.54 * base.scale} height={1 * base.scale} rx={0.2 * base.scale} fill={palette.engineRed} />
          <Circle cx={base.x} cy={base.y - 1.05 * base.scale} r={0.3 * base.scale} fill={palette.engineRedLight} />
          <Rect x={base.x - 0.42 * base.scale} y={base.y - 0.72 * base.scale} width={0.84 * base.scale} height={0.24 * base.scale} rx={0.12 * base.scale} fill={palette.engineRedDark} />
        </G>
      );
    }
    case 'tree': {
      const base = p(0.14);
      return (
        <G>
          <Rect x={base.x - 0.22 * base.scale} y={base.y - 1.6 * base.scale} width={0.44 * base.scale} height={1.6 * base.scale} fill={palette.wood} />
          <Circle cx={base.x} cy={base.y - 2.5 * base.scale} r={1.45 * base.scale} fill={palette.leafGreen} />
          <Circle cx={base.x - 0.5 * base.scale} cy={base.y - 3.3 * base.scale} r={1 * base.scale} fill={palette.grassDark} />
        </G>
      );
    }
    case 'car':
    case 'van': {
      const tall = item.kind === 'van';
      const body = tall ? 1.7 : 1.05;
      const near = projectX(vp, item.x, item.ahead - 2.15, 0.32);
      const far = projectX(vp, item.x, item.ahead + 2.15, 0.32);
      const nearTop = projectX(vp, item.x, item.ahead - 2.15, 0.32 + body);
      const farTop = projectX(vp, item.x, item.ahead + 2.15, 0.32 + body);
      const roofNear = projectX(vp, item.x, item.ahead + (tall ? -1.9 : -1.05), 0.32 + body + (tall ? 0.7 : 0.85));
      const roofFar = projectX(vp, item.x, item.ahead + (tall ? 0.9 : 1.05), 0.32 + body + (tall ? 0.7 : 0.85));
      const paint = tall ? palette.cream : '#3E8FE0';
      const dark = tall ? palette.creamDeep : '#25649F';
      const wheel = projectX(vp, item.x, item.ahead, 0.42);
      return (
        <G>
          <Circle cx={near.x + (far.x - near.x) * 0.22} cy={wheel.y} r={0.4 * wheel.scale} fill={palette.charcoalDark} />
          <Circle cx={near.x + (far.x - near.x) * 0.78} cy={wheel.y} r={0.4 * wheel.scale} fill={palette.charcoalDark} />
          <Path d={quad(near, nearTop, farTop, far)} fill={paint} />
          <Path d={quad(nearTop, roofNear, roofFar, farTop)} fill={dark} />
        </G>
      );
    }
    case 'hedge': {
      const body = onWall(vp, item.x, item.ahead, 0.62, GARDEN_LENGTH, 1.25);
      const top = onWall(vp, item.x, item.ahead, 1.2, GARDEN_LENGTH, 0.3);
      return (
        <G>
          <Rect x={body.cx - body.rx} y={body.cy - body.ry} width={body.rx * 2} height={body.ry * 2} fill={palette.leafGreenDark} />
          <Rect x={top.cx - top.rx} y={top.cy - top.ry} width={top.rx * 2} height={top.ry * 2} fill={palette.leafGreen} />
        </G>
      );
    }
    case 'bench': {
      /* a bench runs *along* the road, so its length foreshortens like a wall */
      const seat = onWall(vp, item.x, item.ahead, 0.65, 2.2, 0.22);
      const back = onWall(vp, item.x, item.ahead, 1.2, 2.2, 0.6);
      return (
        <G>
          <Rect x={back.cx - back.rx} y={back.cy - back.ry} width={back.rx * 2} height={back.ry * 2} fill={palette.woodDark} />
          <Rect x={seat.cx - seat.rx} y={seat.cy - seat.ry} width={seat.rx * 2} height={seat.ry * 2} fill={palette.wood} />
        </G>
      );
    }
    case 'planter': {
      const base = p(0.14);
      return (
        <G>
          <Rect x={base.x - 0.5 * base.scale} y={base.y - 0.7 * base.scale} width={1 * base.scale} height={0.7 * base.scale} fill={palette.creamDeep} />
          <Circle cx={base.x} cy={base.y - 1.1 * base.scale} r={0.66 * base.scale} fill={palette.leafGreen} />
        </G>
      );
    }
    default: {
      const base = p(0.14);
      return (
        <G>
          <Rect x={base.x - 0.34 * base.scale} y={base.y - 1.5 * base.scale} width={0.68 * base.scale} height={1.5 * base.scale} rx={0.3 * base.scale} fill={palette.engineRed} />
          <Circle cx={base.x} cy={base.y - 1.5 * base.scale} r={0.36 * base.scale} fill={palette.engineRedDark} />
        </G>
      );
    }
  }
});

/* ------------------------------------------------------------------ */
/* The layers the road stitches together                                */
/* ------------------------------------------------------------------ */

export interface TownLayerProps {
  vp: RoadView;
  street: StreetFrame;
}

/** Everything behind the tarmac: the buildings, far ones first. */
export const TownBuildings = memo(function TownBuildings({ vp, street }: TownLayerProps) {
  return (
    <G>
      {street.buildings.map((item) => (
        <Building key={item.id} vp={vp} item={item} />
      ))}
    </G>
  );
});

/** The pavements, drawn between the buildings and the tarmac. */
export const TownPavements = memo(function TownPavements({ vp }: { vp: RoadView }) {
  return (
    <G>
      {[-1, 1].map((s) => {
        const nearIn = projectX(vp, s * ROAD_HALF, PAVEMENT_NEAR, 0.16);
        const nearOut = projectX(vp, s * BUILD_LINE, PAVEMENT_NEAR, 0.16);
        const farIn = projectX(vp, s * ROAD_HALF, PAVEMENT_FAR, 0.16);
        const farOut = projectX(vp, s * BUILD_LINE, PAVEMENT_FAR, 0.16);
        const kerbLow = projectX(vp, s * ROAD_HALF, PAVEMENT_NEAR, 0);
        const kerbFar = projectX(vp, s * ROAD_HALF, PAVEMENT_FAR, 0);
        return (
          <G key={`pave${s}`}>
            <Path d={quad(nearIn, nearOut, farOut, farIn)} fill={PAVING} />
            <Path d={quad(kerbLow, nearIn, farIn, kerbFar)} fill={PAVING_EDGE} />
          </G>
        );
      })}
    </G>
  );
});

/**
 * The mouth of each side street, cut through the pavement.
 *
 * It stops just past the building line rather than running to the horizon the
 * way the 3D one does: with no depth buffer, a plane stretching twenty units
 * sideways paints a grey rule straight across every building it passes behind.
 * Ending it in line with the houses reads as a road going on between them, and
 * cannot cross anything.
 */
export const TownSideStreets = memo(function TownSideStreets({ vp, street }: TownLayerProps) {
  const reach = Math.min(SIDE_STREET_LENGTH, BUILD_LINE - ROAD_HALF + 4);
  return (
    <G>
      {street.junctions.map((j) => (
        <G key={j.id}>
          {[-1, 1].map((s) => (
            <Path
              key={`m${s}`}
              d={quad(
                projectX(vp, s * ROAD_HALF, j.ahead - j.width / 2, 0.17),
                projectX(vp, s * (ROAD_HALF + reach), j.ahead - j.width / 2, 0.17),
                projectX(vp, s * (ROAD_HALF + reach), j.ahead + j.width / 2, 0.17),
                projectX(vp, s * ROAD_HALF, j.ahead + j.width / 2, 0.17),
              )}
              fill="#6E778F"
            />
          ))}
        </G>
      ))}
    </G>
  );
});

/** The zebra crossing painted on the main road at every crossroads. */
export const TownCrossings = memo(function TownCrossings({ vp, street }: TownLayerProps) {
  return (
    <G>
      {street.junctions.map((j) => (
        <G key={j.id}>
          {Array.from({ length: CROSSING_BARS }, (_, i) => {
            const at = j.ahead + (i - (CROSSING_BARS - 1) / 2) * CROSSING_PITCH;
            const half = ROAD_HALF - 0.45;
            return (
              <Path
                key={`z${i}`}
                d={quad(
                  projectX(vp, -half, at - CROSSING_BAR_W / 2, 0.02),
                  projectX(vp, half, at - CROSSING_BAR_W / 2, 0.02),
                  projectX(vp, half, at + CROSSING_BAR_W / 2, 0.02),
                  projectX(vp, -half, at + CROSSING_BAR_W / 2, 0.02),
                )}
                fill={palette.cream}
                opacity={0.9}
              />
            );
          })}
        </G>
      ))}
    </G>
  );
});

/** Lamps, trees, hydrants and parked cars: in front of the walls, beside the road. */
export const TownFurniture = memo(function TownFurniture({ vp, street }: TownLayerProps) {
  return (
    <G>
      {street.furniture
        .filter((item) => item.ahead > NEAR_PROP)
        .map((item) => (
          <Furniture key={item.id} vp={vp} item={item} />
        ))}
    </G>
  );
});

/** The banner the drive finishes under, once the last gate is open. */
export const TownArrival = memo(function TownArrival({ vp, street }: TownLayerProps) {
  const arrival = street.arrival;
  if (!arrival) return null;
  const span = ROAD_HALF + 0.8;
  const foot = projectX(vp, -span, arrival.ahead, 0);
  const top = projectX(vp, -span, arrival.ahead, 6);
  const right = projectX(vp, span, arrival.ahead, 0);
  const board = projectX(vp, 0, arrival.ahead, 5.4);
  const postW = 0.24 * foot.scale;
  return (
    <G>
      <Rect x={foot.x - postW / 2} y={top.y} width={postW} height={foot.y - top.y} fill={palette.slate} />
      <Rect x={right.x - postW / 2} y={top.y} width={postW} height={right.y - top.y} fill={palette.slate} />
      <Rect
        x={board.x - span * board.scale}
        y={board.y - 0.75 * board.scale}
        width={span * 2 * board.scale}
        height={1.5 * board.scale}
        rx={0.2 * board.scale}
        fill={palette.engineRed}
      />
      <Rect
        x={board.x - span * board.scale}
        y={board.y + 0.65 * board.scale}
        width={span * 2 * board.scale}
        height={0.3 * board.scale}
        fill={palette.safetyYellow}
      />
      {[-2, -1, 0, 1, 2].map((i) => (
        <Rect
          key={i}
          x={board.x + i * 2.3 * board.scale - 0.4 * board.scale}
          y={board.y - 0.4 * board.scale}
          width={0.8 * board.scale}
          height={0.8 * board.scale}
          fill={palette.white}
          transform={`rotate(45 ${board.x + i * 2.3 * board.scale} ${board.y})`}
        />
      ))}
    </G>
  );
});

/** The street this frame, ready for the road to draw in layers. */
export const townFrame = (
  distance: number,
  seed: number,
  destination: BuildingId | undefined,
  finishAhead: number | null,
): StreetFrame => streetView(distance, TOWN_DEPTH_2D, { seed, destination, finishAhead });

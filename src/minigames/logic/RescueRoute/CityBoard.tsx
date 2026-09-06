/**
 * CITY BOARD — the street plan the truck is programmed across.
 *
 * The roads ARE the cells the truck moves through. Tarmac runs edge to edge,
 * so a junction joins and a corner turns; the pavement slabs that carry the
 * buildings sit *between* those streets and are what the truck may not enter.
 * The call is on a building, and the goal is the marked bay on the road
 * outside its door — "pull up here", never "park on the roof".
 *
 * One `<Svg>` draws the whole town so nothing can drift out of register; the
 * only overlays are text (street names and the address plaque), which must go
 * through `@/ui` `<Text>`.
 */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { GridPos, Heading, RescueRouteChallenge } from '@/learning/types';
import { palette, radii, roles } from '@/theme';
import { Text } from '@/ui';
import { sceneLabel } from '../shared/labels';
import type { BlockPlot, CityPlan } from './cityPlan';
import { Building, CallFlame, Park, PlotSlab, ROAD, Tree } from './TownArt';

const STEP: Record<Heading, { x: number; y: number; deg: number }> = {
  N: { x: 0, y: -1, deg: 0 },
  E: { x: 1, y: 0, deg: 90 },
  S: { x: 0, y: 1, deg: 180 },
  W: { x: -1, y: 0, deg: 270 },
};

export interface CityBoardProps {
  challenge: RescueRouteChallenge;
  plan: CityPlan;
  cell: number;
  /** the pavement frame around the whole town */
  margin: number;
  /** the cells the current programme drives through (start first) */
  path: GridPos[];
  /** the road cell a Forward would enter next, when there is one */
  ahead: GridPos | null;
  aheadHeading: Heading;
  arrived: boolean;
  /** name every landmark, not just the address (room permitting) */
  labelAll: boolean;
}

/** A chevron pointing `heading`, centred on (x, y). */
function Chevron({ x, y, size, heading, color, opacity }: { x: number; y: number; size: number; heading: Heading; color: string; opacity: number }) {
  const s = size / 2;
  return (
    <Path
      d={`M${x - s} ${y + s * 0.55} L${x} ${y - s * 0.55} L${x + s} ${y + s * 0.55}`}
      stroke={color}
      strokeWidth={Math.max(2, size * 0.22)}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={opacity}
      transform={`rotate(${STEP[heading].deg} ${x} ${y})`}
    />
  );
}

export const CityBoard = memo(function CityBoard({
  challenge,
  plan,
  cell,
  margin,
  path,
  ahead,
  aheadHeading,
  arrived,
  labelAll,
}: CityBoardProps) {
  const { rows, cols } = plan;
  const width = cols * cell + margin * 2;
  const height = rows * cell + margin * 2;

  const px = (col: number) => margin + col * cell;
  const py = (row: number) => margin + row * cell;
  const cx = (col: number) => px(col) + cell / 2;
  const cy = (row: number) => py(row) + cell / 2;

  /* how far a plot swells into its cells, which is what narrows the tarmac
     into a street with a kerb either side */
  const swell = cell * 0.14;
  const plotRadius = Math.min(cell * 0.3, 26);
  const tarmac = { left: margin, top: margin, right: margin + cols * cell, bottom: margin + rows * cell };

  /* ---- centre lines: painted along a street, never through a junction ---- */
  const markings: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pos = { row: r, col: c };
      if (!plan.isRoad(pos)) continue;
      const exits = plan.exits(pos);
      if (exits.length === 0 || exits.length > 2) continue;
      const mid = (h: Heading) => `${cx(c) + STEP[h].x * cell * 0.5} ${cy(r) + STEP[h].y * cell * 0.5}`;
      const centre = `${cx(c)} ${cy(r)}`;
      const [a, b] = exits;
      if (!a) continue;
      if (!b) {
        markings.push(`M${mid(a)} L${centre}`);
      } else if (STEP[a].x === -STEP[b].x && STEP[a].y === -STEP[b].y) {
        markings.push(`M${mid(a)} L${mid(b)}`);
      } else {
        markings.push(`M${mid(a)} Q${centre} ${mid(b)}`);
      }
    }
  }

  /* ---- the plots, kept inside the tarmac so the kerb frame stays whole ---- */
  const plotBox = (plot: BlockPlot) => {
    const left = Math.max(tarmac.left, px(plot.col) - swell);
    const top = Math.max(tarmac.top, py(plot.row) - swell);
    const right = Math.min(tarmac.right, px(plot.col + plot.cols) + swell);
    const bottom = Math.min(tarmac.bottom, py(plot.row + plot.rows) + swell);
    return { x: left, y: top, w: right - left, h: bottom - top };
  };

  const trace = path.length > 1 ? path.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(p.col)} ${cy(p.row)}`).join(' ') : null;
  const last = path[path.length - 1];

  /* a bay has to fit BETWEEN the kerbs, or it reads as a clipped box */
  const bayInset = swell + Math.max(1.5, cell * 0.02);
  const doorSide = plan.goalSide;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* the town's pavement frame, then the tarmac inside it */}
        <Rect x={0} y={0} width={width} height={height} rx={radii.card} fill={ROAD.frame} />
        <Rect
          x={margin * 0.5}
          y={margin * 0.5}
          width={width - margin}
          height={height - margin}
          rx={radii.card * 0.8}
          fill={ROAD.kerbLip}
        />
        <Rect x={margin} y={margin} width={cols * cell} height={rows * cell} rx={cell * 0.13} fill={ROAD.tarmac} />
        <Rect x={margin} y={margin} width={cols * cell} height={cell * 0.1} rx={cell * 0.05} fill="rgba(255,255,255,0.06)" />

        {/* lane markings */}
        {markings.map((d, i) => (
          <Path
            key={i}
            d={d}
            stroke={ROAD.paint}
            strokeWidth={Math.max(2, cell * 0.045)}
            strokeLinecap="round"
            strokeDasharray={`${cell * 0.15} ${cell * 0.13}`}
            fill="none"
          />
        ))}

        {/* the station apron the truck rolls out of */}
        <Rect
          x={px(challenge.start.col) + bayInset}
          y={py(challenge.start.row) + bayInset}
          width={cell - bayInset * 2}
          height={cell - bayInset * 2}
          rx={cell * 0.16}
          fill="rgba(255,255,255,0.10)"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth={Math.max(1.5, cell * 0.028)}
          strokeDasharray={`${cell * 0.11} ${cell * 0.09}`}
        />

        {/* the bay outside the call: this is where the truck stops */}
        <Rect
          x={px(challenge.goal.col) + bayInset}
          y={py(challenge.goal.row) + bayInset}
          width={cell - bayInset * 2}
          height={cell - bayInset * 2}
          rx={cell * 0.18}
          fill={arrived ? 'rgba(185,239,193,0.30)' : 'rgba(255,199,44,0.16)'}
          stroke={arrived ? palette.leafGreen : palette.safetyYellow}
          strokeWidth={Math.max(2, cell * 0.038)}
          strokeDasharray={`${cell * 0.15} ${cell * 0.1}`}
        />
        {doorSide ? (
          <Chevron
            x={cx(challenge.goal.col) + STEP[doorSide].x * cell * 0.22}
            y={cy(challenge.goal.row) + STEP[doorSide].y * cell * 0.22}
            size={cell * 0.26}
            heading={doorSide}
            color={arrived ? palette.leafGreen : palette.safetyYellow}
            opacity={0.95}
          />
        ) : null}

        {/* the blocks between the roads */}
        {plan.plots.map((plot, i) => {
          const box = plotBox(plot);
          const pad = Math.min(box.w, box.h) * 0.1;
          const labelled = plot.destination || labelAll;
          const labelH = labelled ? Math.min(box.h * 0.24, cell * 0.3) : 0;
          const inner = {
            x: box.x + pad,
            y: box.y + pad,
            w: box.w - pad * 2,
            h: box.h - pad * 2 - labelH,
          };
          const houses = plot.destination ? 1 : Math.max(1, Math.min(3, Math.round(inner.w / Math.max(1, inner.h * 0.85))));
          const gap = houses > 1 ? inner.w * 0.04 : 0;
          const houseW = (inner.w - gap * (houses - 1)) / houses;
          /* a building is never taller than it is wide by much: on a deep plot
             it stands at the street and the garden goes behind it */
          const houseH = Math.min(inner.h, houseW * 1.35);
          const yard = inner.h - houseH;
          return (
            <G key={`plot-${i}`}>
              <PlotSlab
                x={box.x}
                y={box.y}
                w={box.w}
                h={box.h}
                radius={plotRadius}
                green={plot.scene === 'park'}
                lit={plot.destination && !arrived}
              />
              {plot.scene === 'park' ? (
                <Park x={inner.x} y={inner.y} w={inner.w} h={inner.h} />
              ) : (
                <G>
                  {yard > houseH * 0.3 ? (
                    <Tree cx={inner.x + inner.w * 0.5} cy={inner.y + yard * 0.45} r={Math.min(yard * 0.42, inner.w * 0.24)} />
                  ) : null}
                  {Array.from({ length: houses }, (_, h) => {
                    const shrink = houses > 1 && h % 2 === 1 ? 0.86 : 1;
                    const hh = houseH * shrink;
                    return (
                      <Building
                        key={h}
                        x={inner.x + h * (houseW + gap)}
                        y={inner.y + inner.h - hh}
                        w={houseW}
                        h={hh}
                        scene={plot.scene}
                        /* one shopfront leads the terrace; its neighbours are houses */
                        plain={!plot.destination && h !== 0}
                      />
                    );
                  })}
                </G>
              )}
              {plot.destination ? (
                <CallFlame
                  cx={inner.x + inner.w * 0.86}
                  cy={inner.y + inner.h - houseH * 0.86}
                  size={Math.min(inner.w, houseH) * 0.42}
                  out={arrived}
                />
              ) : null}
            </G>
          );
        })}

        {/* the programme, previewed on the road before Go */}
        {trace ? (
          <G>
            <Path
              d={trace}
              stroke="rgba(31,42,90,0.18)"
              strokeWidth={Math.max(4, cell * 0.13)}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d={trace}
              stroke={palette.safetyYellow}
              strokeWidth={Math.max(3, cell * 0.09)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${cell * 0.2} ${cell * 0.16}`}
              fill="none"
            />
            {last ? <Circle cx={cx(last.col)} cy={cy(last.row)} r={cell * 0.07} fill={palette.safetyYellow} /> : null}
          </G>
        ) : null}

        {/* where a Forward would go from here */}
        {ahead ? (
          <Chevron
            x={cx(ahead.col)}
            y={cy(ahead.row)}
            size={cell * 0.3}
            heading={aheadHeading}
            color={palette.white}
            opacity={0.42}
          />
        ) : null}
      </Svg>

      {/*
        Street names are painted between the kerb and the centre line, and stop
        at the first block on the row — a name that runs under a building is
        not a street sign, it is litter.
      */}
      {challenge.streetNames?.map((street) => {
        let run = 0;
        while (run < cols && plan.isRoad({ row: street.row, col: run })) run += 1;
        if (run < 2 || cell < 44) return null;
        const size = Math.max(8, Math.min(cell * 0.15, 15));
        const runsTo = run * cell - swell;
        return (
          <Text
            key={street.row}
            variant="tiny"
            numberOfLines={1}
            color="rgba(255,255,255,0.5)"
            style={[
              styles.street,
              {
                top: py(street.row) + cell * 0.23,
                left: margin + cell * 0.14,
                width: Math.max(cell * 0.5, runsTo - cell * 0.14),
                fontSize: size,
                lineHeight: size * 1.2,
              },
            ]}
          >
            {street.name.toUpperCase()}
          </Text>
        );
      })}

      {/* the address, and the neighbours when there is room to name them */}
      {plan.plots.map((plot, i) => {
        if (!plot.destination && !labelAll) return null;
        const box = plotBox(plot);
        const size = Math.max(8, Math.min(cell * 0.17, 13));
        const plaqueW = Math.min(box.w * 0.9, cell * 1.15);
        return (
          <View
            key={`name-${i}`}
            pointerEvents="none"
            style={[
              styles.plaque,
              plot.destination && styles.plaqueCall,
              {
                left: box.x + (box.w - plaqueW) / 2,
                width: plaqueW,
                bottom: height - (box.y + box.h) + box.h * 0.055,
              },
            ]}
          >
            <Text
              variant="tiny"
              center
              numberOfLines={1}
              color={plot.destination ? roles.ink.primary : roles.ink.secondary}
              style={{ fontSize: size, lineHeight: size * 1.25, letterSpacing: 0 }}
            >
              {sceneLabel[plot.scene].en}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  street: { position: 'absolute', letterSpacing: 1.4 },
  plaque: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radii.tag,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  plaqueCall: { backgroundColor: palette.safetyYellow },
});

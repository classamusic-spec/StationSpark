/**
 * A BUILDING TO LEAN A LADDER ON.
 *
 * Ladder Builder and Number Ladder both used to put their ladder against a flat
 * tan rectangle with a hard bottom edge, floating in a screen half full of sky.
 * This draws the elevation those games needed all along, in one place so the
 * two games are unmistakably the same street:
 *
 *   roof slab → cornice → shaded return wall → front plane with brick coursing
 *   → windows with lintels, sills, glazing bars and (optionally) awnings and
 *   window boxes → a shopfront at the bottom → a plinth that sits on the ground
 *   → a drainpipe down the shaded side.
 *
 * The light falls from the upper left (see `tones.ts`), so the return wall on
 * the right carries the shade and the left edge of every solid carries the
 * highlight.
 *
 * The painted "gauge" band is the one piece of the drawing that is not
 * decoration: it is the measuring strip the ladder climbs, drawn from the same
 * `unitPx` the game uses, so a rung and a tick can never disagree.
 */
import React, { memo } from 'react';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { CONTACT, HILITE, HILITE_SOFT, SHADE, SHADE_DEEP, SHADE_SOFT } from './tones';

export type FacadeTone = 'brick' | 'cream' | 'stone';

const tones: Record<FacadeTone, { wallA: string; wallB: string; trim: string; roof: string; course: string }> = {
  brick: { wallA: '#E9B48F', wallB: '#CE9068', trim: palette.creamDeep, roof: palette.engineRed, course: 'rgba(158,106,54,0.22)' },
  cream: { wallA: '#FFF3DC', wallB: '#EBD4AA', trim: palette.white, roof: palette.engineRed, course: 'rgba(158,106,54,0.14)' },
  stone: { wallA: '#E4E8F3', wallB: '#C6CDE0', trim: palette.white, roof: '#5C6789', course: 'rgba(31,42,90,0.10)' },
};

export interface FacadeGauge {
  /** left edge of the painted band, in px from the building's left */
  x: number;
  w: number;
  /** px per unit — the same number the ladder is drawn from */
  unitPx: number;
  units: number;
  /** y of unit zero inside the facade box; the caller owns it so a tick and a
   *  printed number can never end up a few pixels apart */
  baseY: number;
  /** the unit to paint green (the goal) */
  markAt?: number;
}

export interface TownFacadeProps {
  width: number;
  /** from the top of the roof slab down to the ground line */
  height: number;
  tone?: FacadeTone;
  /** window rows/cols drawn to the right of the gauge band */
  rows?: number;
  cols?: number;
  awning?: boolean;
  gauge?: FacadeGauge;
  /** x from which the wall LEFT of the gauge band is free to carry windows
   *  (a game whose ladder stacks there passes the far side of the ladder) */
  leftGutter?: number;
  /** shifts the dressing so two buildings on one street are not twins */
  seed?: number;
}

export const TownFacade = memo(function TownFacade({
  width,
  height,
  tone = 'brick',
  rows = 4,
  cols = 2,
  awning = true,
  gauge,
  leftGutter,
  seed = 0,
}: TownFacadeProps) {
  const t = tones[tone];
  const s = Math.max(0.7, Math.min(1.7, width / 300));
  const side = Math.max(12, Math.min(width * 0.11, 52));
  const front = Math.max(20, width - side);
  const roofH = Math.max(14, Math.min(height * 0.05, 30 * s));
  const corniceH = Math.max(7, roofH * 0.5);
  const plinthH = Math.max(10, 16 * s);
  const shopH = Math.max(34, Math.min(height * 0.15, 86 * s));
  const bodyTop = roofH + corniceH;
  const bodyBottom = height - plinthH;
  const shopTop = bodyBottom - shopH;

  /* the windows live to the right of the painted gauge band */
  const gridLeft = (gauge ? gauge.x + gauge.w : 0) + 14 * s;
  const gridRight = front - 12 * s;
  const gridW = Math.max(0, gridRight - gridLeft);
  const colW = cols > 0 ? gridW / cols : 0;
  const winW = Math.max(0, colW - 12 * s);
  const gridTop = bodyTop + 20 * s;
  const gridH = Math.max(0, shopTop - gridTop - 12 * s);
  const rowH = rows > 0 ? gridH / rows : 0;
  const winH = Math.max(0, Math.min(rowH - 16 * s, 46 * s));

  /* the wall on the far side of the gauge band, if the game left any of it free */
  const gutter = leftGutter ?? 0;
  const leftW = gauge && leftGutter !== undefined ? gauge.x - 12 - gutter : 0;
  const leftWinW = Math.max(0, Math.min(leftW - 16 * s, winW));

  const windows: React.ReactElement[] = [];
  /**
   * WHAT IS BEHIND THE GLASS.
   *
   * Every pane used to be the same navy rectangle, so five storeys read as
   * wallpaper rather than as a building somebody lives in. `dressing` picks one
   * of four things per window off a hash of its own position — a blind pulled
   * half down, a pair of curtains, a cat on the sill, or clear glass — so the
   * grid never repeats, and it costs at most three nodes on the windows that
   * get one.
   */
  const dressing = (x: number, y: number, wW: number, pick: number) => {
    if (pick === 0) return null;
    if (pick === 1) {
      /* a roller blind, down as far as this flat wants it */
      const drop = winH * (0.3 + ((pick * 7 + Math.round(x)) % 3) * 0.12);
      return (
        <G>
          <Rect x={x} y={y} width={wW} height={drop} rx={3 * s} fill={palette.creamDeep} />
          <Rect x={x} y={y + drop - 3 * s} width={wW} height={3 * s} rx={1.5 * s} fill={SHADE} />
          <Rect x={x} y={y} width={wW * 0.34} height={drop} fill={palette.white} opacity={0.35} />
        </G>
      );
    }
    if (pick === 2) {
      /* curtains, drawn back to the reveals */
      return (
        <G>
          <Path d={`M ${x} ${y} h ${wW * 0.26} q ${-wW * 0.1} ${winH * 0.5} 0 ${winH} h ${-wW * 0.26} z`} fill={palette.white} opacity={0.8} />
          <Path d={`M ${x + wW} ${y} h ${-wW * 0.26} q ${wW * 0.1} ${winH * 0.5} 0 ${winH} h ${wW * 0.26} z`} fill={palette.white} opacity={0.62} />
        </G>
      );
    }
    /* somebody's cat, watching the street from the sill */
    const cx = x + wW * 0.68;
    const cy = y + winH - 2 * s;
    const r = Math.min(wW * 0.16, winH * 0.22);
    return (
      <G>
        <Path
          d={`M ${cx - r} ${cy} v ${-r * 0.9} a ${r} ${r} 0 0 1 ${r * 2} 0 v ${r * 0.9} z`}
          fill={palette.orange}
        />
        <Path d={`M ${cx - r * 0.9} ${cy - r * 0.8} l ${r * 0.34} ${-r * 0.7} l ${r * 0.34} ${r * 0.5} z`} fill={palette.orange} />
        <Path d={`M ${cx + r * 0.9} ${cy - r * 0.8} l ${-r * 0.34} ${-r * 0.7} l ${-r * 0.34} ${r * 0.5} z`} fill={palette.orange} />
        <Path
          d={`M ${cx - r * 0.42} ${cy - r * 0.6} a ${r * 0.17} ${r * 0.2} 0 1 0 ${r * 0.01} 0 M ${cx + r * 0.42} ${cy - r * 0.6} a ${r * 0.17} ${r * 0.2} 0 1 0 ${r * 0.01} 0`}
          fill={palette.navy}
        />
      </G>
    );
  };

  const cell = (x: number, y: number, wW: number, striped: boolean, key: string, pick = 0) => (
    <G key={key}>
            {/* lintel */}
            <Rect x={x - 4 * s} y={y - 7 * s} width={wW + 8 * s} height={6 * s} rx={3 * s} fill={t.trim} />
            {/* reveal + glass */}
            <Rect x={x - 2 * s} y={y - 2 * s} width={wW + 4 * s} height={winH + 4 * s} rx={6 * s} fill={HILITE_SOFT} />
            <Rect x={x} y={y} width={wW} height={winH} rx={5 * s} fill="#33477A" />
            <Rect x={x} y={y} width={wW} height={winH * 0.4} rx={5 * s} fill="#3C5288" />
            {/* the room behind the glass */}
            {dressing(x, y, wW, pick)}
            {/* glazing bars */}
            <Rect x={x + wW / 2 - 1.4 * s} y={y} width={2.8 * s} height={winH} fill={t.trim} opacity={0.55} />
            <Rect x={x} y={y + winH * 0.46} width={wW} height={2.6 * s} fill={t.trim} opacity={0.45} />
            {/* the diagonal sheen every pane in this world carries */}
            <Path
              d={`M ${x + 3 * s} ${y + winH - 3 * s} L ${x + wW * 0.44} ${y + 3 * s} L ${x + wW * 0.66} ${y + 3 * s} L ${x + wW * 0.2} ${y + winH - 3 * s} Z`}
              fill={palette.white}
              opacity={0.2}
            />
            {/* the reveal's own shadow down the shaded side of the opening */}
            <Rect x={x + wW - 3 * s} y={y} width={3 * s} height={winH} fill={SHADE_DEEP} opacity={0.35} />
            <Rect x={x} y={y} width={wW} height={2.6 * s} fill={SHADE_DEEP} opacity={0.4} />
            {/* sill */}
            <Rect x={x - 5 * s} y={y + winH} width={wW + 10 * s} height={5 * s} rx={2.5 * s} fill={t.trim} />
            <Rect x={x - 5 * s} y={y + winH + 5 * s} width={wW + 10 * s} height={3.4 * s} rx={1.7 * s} fill={SHADE} />
            {awning && striped ? (
              <G>
                <Path
                  d={`M ${x - 6 * s} ${y - 7 * s} h ${wW + 12 * s} l ${-3 * s} ${10 * s} h ${-(wW + 6 * s)} z`}
                  fill={palette.engineRed}
                />
                <Rect x={x + wW * 0.24} y={y - 7 * s} width={wW * 0.2} height={10 * s} fill={palette.white} opacity={0.85} />
                <Path d={`M ${x - 6 * s} ${y - 7 * s} h ${wW + 12 * s} l ${-1.2 * s} ${3.4 * s} h ${-(wW + 9.6 * s)} z`} fill={HILITE} />
                {/* a scalloped hem, so an awning is cloth and not a red slab */}
                {[0, 1, 2].map((k) => (
                  <Ellipse
                    key={k}
                    cx={x - 3 * s + ((wW + 6 * s) / 3) * (k + 0.5)}
                    cy={y + 3 * s}
                    rx={(wW + 6 * s) / 6.4}
                    ry={2.4 * s}
                    fill={palette.engineRed}
                  />
                ))}
                {/* what the awning throws on the wall below it */}
                <Rect x={x - 6 * s} y={y + 4 * s} width={wW + 12 * s} height={6 * s} fill={SHADE_DEEP} opacity={0.28} />
              </G>
            ) : null}
            {!awning && striped ? (
              <G>
                {/* a window box, so the wall is somebody's home */}
                <Rect x={x - 3 * s} y={y + winH + 6 * s} width={wW + 6 * s} height={9 * s} rx={3 * s} fill={palette.wood} />
                <Rect x={x - 3 * s} y={y + winH + 6 * s} width={wW + 6 * s} height={3 * s} rx={1.5 * s} fill={HILITE} />
                <Path
                  d={`M ${x + wW * 0.2} ${y + winH + 6 * s} q ${4 * s} ${-9 * s} ${10 * s} ${-1 * s} q ${5 * s} ${-8 * s} ${10 * s} ${1 * s} z`}
                  fill={palette.leafGreen}
                />
              </G>
            ) : null}
    </G>
  );

  /* which room each window shows — a hash, so the grid is stable frame to
     frame and never falls into a stripe the way `(r + c) % n` does */
  const room = (r: number, c: number): number =>
    Math.floor((Math.abs(Math.sin((r + 1) * 12.9898 + (c + 1) * 78.233 + seed) * 43758.5453) % 1) * 4);

  if (winW > 10 && winH > 10) {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = gridLeft + c * colW + (colW - winW) / 2;
        const y = gridTop + r * rowH;
        windows.push(cell(x, y, winW, (r + c + seed) % 2 === 0, `w${r}-${c}`, room(r, c)));
      }
      if (leftWinW > 26 && winH > 10) {
        windows.push(cell(gutter + (leftW - leftWinW) / 2, gridTop + r * rowH, leftWinW, (r + seed + 1) % 2 === 0, `l${r}`, room(r, 9)));
      }
    }
  }

  /* brick coursing: horizontal beds plus staggered head joints, so even a
     stretch of blank wall has a texture to read */
  const courses: React.ReactElement[] = [];
  const courseGap = Math.max(12, 18 * s);
  const brickW = Math.max(26, 40 * s);
  let row = 0;
  for (let y = bodyTop + courseGap; y < shopTop; y += courseGap, row += 1) {
    courses.push(<Rect key={`c${y}`} x={0} y={y} width={front} height={1.8 * s} fill={t.course} />);
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let x = offset; x < front; x += brickW) {
      courses.push(<Rect key={`j${y}-${x}`} x={x} y={y} width={1.8 * s} height={courseGap} fill={t.course} opacity={0.7} />);
    }
  }

  const ticks: React.ReactElement[] = [];
  if (gauge && gauge.unitPx > 2) {
    for (let i = 0; i <= gauge.units; i += 1) {
      const y = gauge.baseY - i * gauge.unitPx;
      if (y < bodyTop || y > height) continue;
      const major = i % 5 === 0;
      const marked = gauge.markAt !== undefined && i === gauge.markAt;
      ticks.push(
        <Rect
          key={`t${i}`}
          x={gauge.x + (major ? 3 : gauge.w * 0.34)}
          y={y - 1.6 * s}
          width={major ? gauge.w - 6 : gauge.w * 0.42}
          height={Math.max(2.4, 3.2 * s)}
          rx={1.6 * s}
          fill={marked ? palette.leafGreen : major ? palette.navySoft : SHADE}
          opacity={marked ? 1 : major ? 0.55 : 1}
        />,
      );
    }
  }

  return (
    <Svg width={width} height={height + plinthH}>
      <Defs>
        <LinearGradient id="ss-facade-wall" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={t.wallA} />
          <Stop offset="1" stopColor={t.wallB} />
        </LinearGradient>
        <LinearGradient id="ss-facade-shop" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A4C7E" />
          <Stop offset="1" stopColor="#2C3B66" />
        </LinearGradient>
        {/* the sky's bounce down the wall: bright where it faces open air,
            falling away into the shade the street floor sits in. A wall lit
            only left-to-right is a colour swatch; this is what makes it a
            plane standing in daylight. */}
        <LinearGradient id="ss-facade-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <Stop offset="0.42" stopColor="#FFFFFF" stopOpacity={0.02} />
          <Stop offset="0.82" stopColor="#1F2A5A" stopOpacity={0.05} />
          <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0.14} />
        </LinearGradient>
      </Defs>

      {/* the building's own shadow on the pavement */}
      <Rect x={0} y={height - 2} width={width} height={Math.max(6, 9 * s)} rx={4 * s} fill={palette.navy} opacity={CONTACT} />

      {/* shaded return wall on the right */}
      <Path d={`M ${front} ${bodyTop - 6 * s} L ${width} ${bodyTop + 4 * s} L ${width} ${height} L ${front} ${height} Z`} fill={t.wallB} />
      <Path d={`M ${front} ${bodyTop - 6 * s} L ${width} ${bodyTop + 4 * s} L ${width} ${height} L ${front} ${height} Z`} fill={SHADE} />

      {/* front plane */}
      <Rect x={0} y={bodyTop - 6 * s} width={front} height={height - bodyTop + 6 * s} fill="url(#ss-facade-wall)" />
      <Rect x={0} y={bodyTop - 6 * s} width={front * 0.13} height={height - bodyTop + 6 * s} fill={HILITE_SOFT} />
      {courses}
      {/* the daylight wash over the coursing, so brick and mortar are lit together */}
      <Rect x={0} y={bodyTop - 6 * s} width={front} height={height - bodyTop + 6 * s} fill="url(#ss-facade-sky)" />
      {/* soffit shadow under the cornice */}
      <Rect x={0} y={bodyTop - 6 * s} width={front} height={7 * s} fill={SHADE_SOFT} />

      {windows}

      {/* the shopfront: fascia, glazing, door */}
      <G>
        <Rect x={4 * s} y={shopTop} width={front - 8 * s} height={shopH} rx={6 * s} fill="url(#ss-facade-shop)" />
        <Rect x={4 * s} y={shopTop} width={front - 8 * s} height={Math.max(14, 20 * s)} rx={6 * s} fill={t.roof} />
        <Rect x={8 * s} y={shopTop + 4 * s} width={(front - 16 * s) * 0.46} height={Math.max(4, 5 * s)} rx={2.5 * s} fill={HILITE} />
        <Rect
          x={front * 0.5 - 22 * s}
          y={shopTop + Math.max(16, 24 * s)}
          width={44 * s}
          height={shopH - Math.max(16, 24 * s)}
          rx={5 * s}
          fill={palette.engineRedDark}
        />
        <Rect
          x={front * 0.5 - 18 * s}
          y={shopTop + Math.max(20, 30 * s)}
          width={36 * s}
          height={Math.max(10, shopH - Math.max(30, 44 * s))}
          rx={4 * s}
          fill={palette.waterCyanLight}
          opacity={0.85}
        />
        <Rect x={front * 0.5 - 2 * s} y={shopTop + Math.max(20, 30 * s)} width={4 * s} height={Math.max(10, shopH - Math.max(30, 44 * s))} fill={palette.white} opacity={0.6} />
        {/* the window each side of the door */}
        {[-1, 1].map((dir) => (
          <Rect
            key={dir}
            x={front * 0.5 + dir * (front * 0.22) - 20 * s}
            y={shopTop + Math.max(16, 24 * s)}
            width={40 * s}
            height={Math.max(12, shopH - Math.max(28, 40 * s))}
            rx={5 * s}
            fill={palette.waterCyanLight}
            opacity={0.55}
          />
        ))}
      </G>

      {/* the painted gauge band the ladder climbs — drawn over the shopfront so
          the measuring strip runs unbroken from the roof to the pavement */}
      {gauge ? (
        <G>
          <Rect x={gauge.x} y={bodyTop} width={gauge.w} height={height - bodyTop} rx={4 * s} fill={palette.cream} opacity={0.92} />
          <Rect x={gauge.x} y={bodyTop} width={gauge.w * 0.3} height={height - bodyTop} fill={HILITE} />
          <Rect x={gauge.x} y={bodyTop} width={gauge.w} height={3 * s} rx={1.5 * s} fill={SHADE} />
          <Rect x={gauge.x + gauge.w - 3 * s} y={bodyTop} width={3 * s} height={height - bodyTop} fill={SHADE} opacity={0.6} />
          {ticks}
        </G>
      ) : null}

      {/* A wall lamp on the blank stretch of wall the ladder climbs. Both
          ladder games leave that side free for the stack, so the brick has
          nothing on it until a child starts building; one piece of real
          architecture stops it reading as wallpaper. */}
      {gutter > 24 ? (
        (() => {
          /* a gooseneck street lamp on the bracket: arm out of the wall, a
             curve, a wide shade and the warm pool of light under it */
          const lx = gutter * 0.34;
          const ly = bodyTop + (height - bodyTop) * 0.28;
          const arm = Math.max(14, 22 * s);
          const shade = Math.max(16, 26 * s);
          return (
            <G>
              <Ellipse cx={lx + arm} cy={ly + shade * 0.8} rx={shade * 1.5} ry={shade * 1.1} fill={palette.safetyYellow} opacity={0.12} />
              <Rect x={lx - 3 * s} y={ly - 6 * s} width={7 * s} height={22 * s} rx={3 * s} fill={palette.charcoal} />
              <Rect x={lx - 1.4 * s} y={ly - 6 * s} width={2.4 * s} height={22 * s} fill={HILITE} />
              <Path
                d={`M ${lx + 2 * s} ${ly} h ${arm * 0.6} a ${arm * 0.4} ${arm * 0.4} 0 0 1 ${arm * 0.4} ${arm * 0.4}`}
                stroke={palette.charcoal}
                strokeWidth={Math.max(2.4, 4 * s)}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={`M ${lx + arm - shade * 0.5} ${ly + arm * 0.4} h ${shade} l ${-shade * 0.22} ${shade * 0.46} h ${-shade * 0.56} z`}
                fill={palette.charcoalDark}
              />
              <Path
                d={`M ${lx + arm - shade * 0.5} ${ly + arm * 0.4} h ${shade * 0.3} l ${-shade * 0.07} ${shade * 0.46} h ${-shade * 0.17} z`}
                fill={HILITE}
              />
              <Ellipse cx={lx + arm} cy={ly + arm * 0.4 + shade * 0.46} rx={shade * 0.29} ry={shade * 0.1} fill="#FFE9A8" />
            </G>
          );
        })()
      ) : null}

      {/* plinth: the building meets the pavement on something */}
      <Rect x={-2} y={bodyBottom} width={front + 4} height={plinthH} rx={3 * s} fill={t.wallB} />
      <Rect x={-2} y={bodyBottom} width={front + 4} height={Math.max(3, 4 * s)} fill={SHADE} />
      <Rect x={-2} y={bodyBottom + plinthH - Math.max(3, 4 * s)} width={front + 4} height={Math.max(3, 4 * s)} fill={SHADE_DEEP} opacity={0.5} />

      {/* drainpipe down the shaded edge */}
      <Rect x={front - 12 * s} y={bodyTop} width={6 * s} height={height - bodyTop} rx={3 * s} fill={t.wallB} />
      <Rect x={front - 12 * s} y={bodyTop} width={2.4 * s} height={height - bodyTop} fill={HILITE} />
      {[0.3, 0.62].map((f) => (
        <Rect key={f} x={front - 14 * s} y={bodyTop + (height - bodyTop) * f} width={10 * s} height={5 * s} rx={2.5 * s} fill={t.wallB} />
      ))}

      {/* roof slab + cornice */}
      <Rect x={-6 * s} y={roofH} width={width + 12 * s} height={corniceH} rx={corniceH / 2} fill={t.roof} />
      <Rect x={-6 * s} y={roofH + corniceH * 0.55} width={width + 12 * s} height={corniceH * 0.45} rx={corniceH * 0.22} fill={SHADE} />
      <Rect x={-4 * s} y={0} width={width + 8 * s} height={roofH} rx={roofH * 0.4} fill={t.roof} />
      <Rect x={-2 * s} y={2 * s} width={(width + 8 * s) * 0.44} height={Math.max(3, 4 * s)} rx={2 * s} fill={HILITE} />
    </Svg>
  );
});

/**
 * THE GROUND A GAME STANDS ON.
 *
 * `Stage` (src/world) paints the far and mid bands behind the whole screen;
 * this is the *near* plane, drawn inside the play area itself so that whatever
 * the game measures — a tree, a tank, a ladder — has a floor at a y the game
 * chose, rather than one that happens to fall wherever the screen ends.
 *
 * Rules it exists to keep:
 *   - a ground plane has a soft top edge and a lighter lip, never a hard
 *     rectangle (the "green card pasted on the sky" defect);
 *   - it is dressed at the edges and calm in the middle, so the play area
 *     stays readable;
 *   - everything standing on it gets a contact ellipse — `foot()` below is the
 *     one every game calls.
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { CONTACT, HILITE, HILITE_SOFT, SHADE, SHADE_DEEP, SHADE_SOFT, leaf } from './tones';

export type GroundVariant = 'grass' | 'pavement' | 'apron';

const grounds: Record<GroundVariant, { near: string; lip: string; far: string }> = {
  grass: { near: palette.grassDark, lip: palette.grass, far: '#7FC55F' },
  pavement: { near: '#C4CCDE', lip: '#DDE3F0', far: '#AFB9CF' },
  apron: { near: '#C7CFE1', lip: '#DEE4F1', far: '#B3BCD2' },
};

/**
 * The navy contact ellipse every grounded object gets. Call it from inside a
 * game's own `<Svg>` so the shadow shares the object's coordinate space.
 */
export function foot(cx: number, cy: number, rx: number, opacity = CONTACT) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={Math.max(2.6, rx * 0.24)} fill={palette.navy} opacity={opacity} />;
}

/** A five-blade grass tuft, lit blades on the left, with a clover head. */
function tuft(x: number, y: number, s: number, flower: boolean, key: string) {
  const k = s * 1.7;
  return (
    <G key={key}>
      <Ellipse cx={x + 2 * k} cy={y + 1.5 * k} rx={11 * k} ry={2.6 * k} fill={palette.navy} opacity={0.07} />
      <Path d={`M ${x} ${y} q ${-5 * k} ${-11 * k} ${-1 * k} ${-17 * k} q ${5 * k} ${6 * k} ${1 * k} ${17 * k} z`} fill={leaf.deep} />
      <Path d={`M ${x + 6 * k} ${y} q ${-4 * k} ${-9 * k} ${1 * k} ${-14 * k} q ${4 * k} ${5 * k} ${-1 * k} ${14 * k} z`} fill={palette.grass} />
      <Path d={`M ${x - 6 * k} ${y} q ${-3 * k} ${-7 * k} ${-3 * k} ${-11 * k} q ${5 * k} ${4 * k} ${3 * k} ${11 * k} z`} fill={leaf.lit} />
      <Path d={`M ${x + 11 * k} ${y} q ${-2 * k} ${-6 * k} ${3 * k} ${-9 * k} q ${1 * k} ${5 * k} ${-3 * k} ${9 * k} z`} fill={leaf.deep} />
      <Path d={`M ${x - 11 * k} ${y} q ${-4 * k} ${-5 * k} ${-2 * k} ${-8 * k} q ${5 * k} ${3 * k} ${2 * k} ${8 * k} z`} fill={palette.grass} />
      {flower ? (
        <G>
          <Path d={`M ${x + 3 * k} ${y} q ${1 * k} ${-8 * k} ${1 * k} ${-12 * k}`} stroke={leaf.deep} strokeWidth={1.4 * k} fill="none" strokeLinecap="round" />
          <Circle cx={x + 4 * k} cy={y - 13 * k} r={3 * k} fill={palette.white} />
          <Circle cx={x + 4 * k} cy={y - 13 * k} r={1.3 * k} fill={palette.safetyYellow} />
        </G>
      ) : null}
    </G>
  );
}

/** A fallen leaf lying flat on the ground — a tiny bit of "somebody lives here". */
function fallenLeaf(x: number, y: number, s: number, tint: string, key: string) {
  return (
    <G key={key}>
      <Ellipse cx={x + 1.5 * s} cy={y + 1.5 * s} rx={7 * s} ry={3 * s} fill={palette.navy} opacity={0.07} />
      <Path d={`M ${x - 7 * s} ${y} q ${7 * s} ${-6 * s} ${14 * s} 0 q ${-7 * s} ${6 * s} ${-14 * s} 0 z`} fill={tint} />
      <Path d={`M ${x - 6 * s} ${y} h ${12 * s}`} stroke={HILITE} strokeWidth={Math.max(0.8, s)} fill="none" />
    </G>
  );
}

function pebble(x: number, y: number, s: number, key: string) {
  return (
    <G key={key}>
      <Ellipse cx={x} cy={y} rx={5 * s} ry={3.4 * s} fill="#9AA4C0" />
      <Path d={`M ${x - 3.4 * s} ${y - 1.2 * s} q ${3 * s} ${-2.4 * s} ${6 * s} ${-0.4 * s} q ${-3 * s} ${0.8 * s} ${-6 * s} ${0.4 * s} z`} fill={HILITE} />
    </G>
  );
}

export interface PlayGroundProps {
  width: number;
  height: number;
  /** y of the ground line inside the play area */
  top: number;
  variant?: GroundVariant;
  /** dress the near plane with tufts, leaves and pebbles (off for busy scenes) */
  dressed?: boolean;
  /** a kerb strip + a drain, for street scenes */
  kerb?: boolean;
  /** shifts the dressing so two games on one stage do not repeat */
  seed?: number;
}

/**
 * The near ground plane. Absolutely fills the play area and paints from `top`
 * down, so a game can place it wherever its subject's feet are.
 */
export const PlayGround = memo(function PlayGround({
  width,
  height,
  top,
  variant = 'grass',
  dressed = true,
  kerb = false,
  seed = 0,
}: PlayGroundProps) {
  const g = grounds[variant];
  const s = Math.max(0.75, Math.min(1.5, width / 390));
  const gy = Math.max(0, Math.min(top, height - 6));
  const bow = Math.max(6, width * 0.02);
  /* one soft-topped edge, reused for the plane, the lip and the far band */
  const edge = (y: number) => `M -20 ${y + bow} Q ${width / 2} ${y - bow} ${width + 20} ${y + bow}`;

  const dressing: React.ReactElement[] = [];
  if (dressed) {
    const spots = [0.06, 0.19, 0.33, 0.5, 0.67, 0.82, 0.94];
    spots.forEach((f, i) => {
      const jitter = ((i * 37 + seed * 13) % 17) - 8;
      const x = width * f + jitter;
      const y = gy + 16 + ((i * 23 + seed * 7) % 5) * (height - gy > 90 ? 11 : 5);
      if (y > height - 4) return;
      if (variant === 'grass') {
        if (i % 3 === 1) dressing.push(fallenLeaf(x, y + 6, s * 1.1, i % 2 ? '#E0A64B' : '#D98F3C', `lf${i}`));
        else dressing.push(tuft(x, y + 12, s * (i % 2 ? 0.85 : 1.05), i % 4 === 0, `tf${i}`));
      } else if (i % 2 === 0) {
        dressing.push(pebble(x, y + 10, s * 0.9, `pb${i}`));
      }
    });
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* a paler band just past the ground line reads as distance */}
      <Path d={`${edge(gy)} L ${width + 20} ${height + 40} L -20 ${height + 40} Z`} fill={g.far} />
      <Path d={`${edge(gy + Math.max(14, (height - gy) * 0.22))} L ${width + 20} ${height + 40} L -20 ${height + 40} Z`} fill={g.near} />
      {/* the lit lip along the crest */}
      <Path
        d={`${edge(gy)} L ${width + 20} ${gy + bow + Math.max(7, 9 * s)} Q ${width / 2} ${gy - bow + Math.max(7, 9 * s)} -20 ${gy + bow + Math.max(7, 9 * s)} Z`}
        fill={g.lip}
      />
      {kerb ? (
        <G>
          <Path
            d={`${edge(gy + Math.max(20, 26 * s))} L ${width + 20} ${gy + Math.max(20, 26 * s) + 11 * s} Q ${width / 2} ${gy + Math.max(20, 26 * s) - bow + 11 * s} -20 ${gy + Math.max(20, 26 * s) + 11 * s} Z`}
            fill="#E8ECF6"
          />
          <Path
            d={`${edge(gy + Math.max(20, 26 * s) + 11 * s)} L ${width + 20} ${gy + Math.max(20, 26 * s) + 15 * s} Q ${width / 2} ${gy + Math.max(20, 26 * s) - bow + 15 * s} -20 ${gy + Math.max(20, 26 * s) + 15 * s} Z`}
            fill={SHADE}
          />
          {/* a drain, because a street has one */}
          <G>
            <Rect x={width * 0.72} y={gy + 44 * s} width={26 * s} height={13 * s} rx={4 * s} fill="#9AA4C0" />
            {[0, 1, 2].map((i) => (
              <Rect key={i} x={width * 0.72 + 4 * s + i * 7 * s} y={gy + 46.5 * s} width={3.4 * s} height={8 * s} rx={1.7 * s} fill={SHADE_DEEP} />
            ))}
          </G>
        </G>
      ) : null}
      {/* the crest catches the sun */}
      <Path d={`${edge(gy)}`} stroke={HILITE_SOFT} strokeWidth={Math.max(2, 3 * s)} fill="none" />
      {dressing}
      <Path d={`${edge(gy + Math.max(14, (height - gy) * 0.22))}`} stroke={SHADE_SOFT} strokeWidth={Math.max(1.4, 2 * s)} fill="none" />
    </Svg>
  );
});

import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { palette } from '@/theme';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from './tone';

export type TreeTone = 'light' | 'mid' | 'dark';

/**
 * Each tone is a *pair*: the canopy colour and the darker mass that sits behind
 * it. The back layer is what turns "three circles on a stick" into a tree.
 */
const tones: Record<TreeTone, { leaf: string; back: string; trunk: string }> = {
  light: { leaf: '#8FD16B', back: '#66B454', trunk: palette.wood },
  mid: { leaf: '#5DBB63', back: '#3F944E', trunk: palette.wood },
  dark: { leaf: '#3E8E4A', back: '#2C6B3B', trunk: palette.woodDark },
};

/** 0 | 1 | 2 — three silhouettes per family so a row never visibly repeats. */
export type TreeVariant = 0 | 1 | 2;

const pickVariant = (v: number | undefined, fallback: number): TreeVariant =>
  (((v ?? fallback) % 3) + 3) % 3 as TreeVariant;

/* ── broadleaf tree ───────────────────────────────────────────────── */

/** back mass, main canopy, shade lobe, highlight lobe — per silhouette. */
const TREE_SHAPES: {
  back: [number, number, number, number][];
  leaf: [number, number, number, number][];
  shade: [number, number, number, number][];
  lit: [number, number, number, number][];
  trunk: { x: number; w: number; top: number };
}[] = [
  {
    // broad and round
    back: [
      [42, 30, 26, 24],
      [30, 22, 20, 17],
    ],
    leaf: [
      [33, 33, 25, 22],
      [17, 42, 15, 13],
      [49, 42, 14, 12],
      [33, 19, 17, 13],
    ],
    shade: [
      [48, 46, 13, 9],
      [40, 52, 12, 7],
    ],
    lit: [[24, 22, 11, 8]],
    trunk: { x: 31, w: 10, top: 44 },
  },
  {
    // tall egg
    back: [
      [40, 26, 21, 26],
      [34, 14, 14, 12],
    ],
    leaf: [
      [33, 29, 21, 25],
      [21, 45, 13, 11],
      [45, 43, 12, 10],
      [33, 13, 13, 10],
    ],
    shade: [
      [43, 36, 11, 15],
      [37, 51, 11, 6],
    ],
    lit: [[26, 17, 9, 8]],
    trunk: { x: 32, w: 9, top: 46 },
  },
  {
    // wide twin-lobe
    back: [
      [44, 34, 27, 19],
      [24, 24, 18, 15],
    ],
    leaf: [
      [23, 31, 19, 17],
      [46, 34, 20, 17],
      [34, 21, 16, 13],
      [34, 41, 17, 12],
    ],
    shade: [
      [52, 41, 13, 9],
      [38, 48, 14, 7],
    ],
    lit: [[19, 23, 10, 7]],
    trunk: { x: 31, w: 10, top: 43 },
  },
];

export interface TreeProps {
  size?: number;
  tone?: TreeTone;
  /** 0–2; anything else wraps. Omit and the tree picks the broad silhouette. */
  variant?: number;
}

/**
 * A layered broadleaf: darker back mass → canopy lobes → one shade → one
 * highlight, on a tapered trunk with a contact ellipse. Three silhouettes.
 */
export const Tree = memo(function Tree({ size = 74, tone = 'mid', variant }: TreeProps) {
  const t = tones[tone];
  const s = TREE_SHAPES[pickVariant(variant, 0)]!;
  return (
    <Svg width={size} height={size * 1.16} viewBox="0 0 72 84" pointerEvents="none">
      <Ellipse cx={36} cy={79} rx={19} ry={shadowRy(19)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      {/* trunk: flares into roots, one shade down its right side */}
      <Path
        d={`M ${s.trunk.x} 80 Q ${s.trunk.x - 4} 80 ${s.trunk.x - 5} 79 Q ${s.trunk.x + 1} 72 ${s.trunk.x + 1} ${s.trunk.top}
            L ${s.trunk.x + s.trunk.w - 1} ${s.trunk.top} Q ${s.trunk.x + s.trunk.w - 1} 72 ${s.trunk.x + s.trunk.w + 5} 79
            Q ${s.trunk.x + s.trunk.w + 4} 80 ${s.trunk.x + s.trunk.w} 80 Z`}
        fill={t.trunk}
      />
      <Path
        d={`M ${s.trunk.x + s.trunk.w * 0.52} 80 Q ${s.trunk.x + s.trunk.w * 0.5} 70 ${s.trunk.x + s.trunk.w * 0.55} ${s.trunk.top}
            L ${s.trunk.x + s.trunk.w - 1} ${s.trunk.top} Q ${s.trunk.x + s.trunk.w - 1} 72 ${s.trunk.x + s.trunk.w + 5} 79
            Q ${s.trunk.x + s.trunk.w + 4} 80 ${s.trunk.x + s.trunk.w} 80 Z`}
        fill={SHADE}
      />
      {s.back.map((e, i) => (
        <Ellipse key={`b${i}`} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} fill={t.back} />
      ))}
      {s.leaf.map((e, i) => (
        <Ellipse key={`l${i}`} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} fill={t.leaf} />
      ))}
      {s.shade.map((e, i) => (
        <Ellipse key={`s${i}`} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} fill={SHADE} />
      ))}
      {s.lit.map((e, i) => (
        <Ellipse key={`h${i}`} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} fill={HIGHLIGHT} />
      ))}
    </Svg>
  );
});

/* ── bush ─────────────────────────────────────────────────────────── */

const BUSH_SHAPES: {
  back: [number, number, number, number][];
  leaf: [number, number, number, number][];
  shade: [number, number, number, number][];
  lit: [number, number, number, number][];
}[] = [
  {
    back: [[40, 21, 27, 16]],
    leaf: [
      [21, 26, 16, 13],
      [47, 26, 17, 13],
      [34, 18, 16, 14],
    ],
    shade: [[51, 31, 13, 8]],
    lit: [[24, 13, 9, 6]],
  },
  {
    back: [[38, 24, 23, 14]],
    leaf: [
      [27, 25, 18, 15],
      [48, 28, 14, 11],
      [36, 15, 12, 10],
    ],
    shade: [[49, 33, 12, 7]],
    lit: [[28, 14, 8, 6]],
  },
  {
    back: [[36, 25, 29, 13]],
    leaf: [
      [17, 29, 14, 10],
      [36, 24, 17, 14],
      [55, 29, 13, 10],
    ],
    shade: [
      [56, 33, 11, 6],
      [36, 36, 16, 5],
    ],
    lit: [[33, 15, 9, 6]],
  },
];

export interface BushProps {
  size?: number;
  tone?: TreeTone;
  variant?: number;
}

/** A low layered bush — hedges, flower boxes, the foreground edge of a scene. */
export const Bush = memo(function Bush({ size = 56, tone = 'mid', variant }: BushProps) {
  const t = tones[tone];
  const s = BUSH_SHAPES[pickVariant(variant, 0)]!;
  return (
    <Svg width={size} height={size * 0.61} viewBox="0 0 72 44" pointerEvents="none">
      <Ellipse cx={36} cy={40} rx={24} ry={shadowRy(24)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      {s.back.map((e, i) => (
        <Ellipse key={`b${i}`} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} fill={t.back} />
      ))}
      {s.leaf.map((e, i) => (
        <Ellipse key={`l${i}`} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} fill={t.leaf} />
      ))}
      {s.shade.map((e, i) => (
        <Ellipse key={`s${i}`} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} fill={SHADE} />
      ))}
      {s.lit.map((e, i) => (
        <Ellipse key={`h${i}`} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} fill={HIGHLIGHT} />
      ))}
    </Svg>
  );
});

/* ── pine ─────────────────────────────────────────────────────────── */

/** one skirt of a pine: a soft triangle whose hem sags like real needles */
const skirt = (cy: number, half: number, rise: number) =>
  `M 28 ${cy - rise} Q ${28 + half * 0.62} ${cy - rise * 0.32} ${28 + half} ${cy}
   Q ${28 + half * 0.5} ${cy + 4.5} 28 ${cy + 3}
   Q ${28 - half * 0.5} ${cy + 4.5} ${28 - half} ${cy}
   Q ${28 - half * 0.62} ${cy - rise * 0.32} 28 ${cy - rise} Z`;

const PINE_SHAPES: { skirts: [number, number, number][]; trunkTop: number }[] = [
  { skirts: [[36, 24, 30], [52, 20, 26], [66, 15, 22]], trunkTop: 60 },
  { skirts: [[32, 19, 26], [45, 17, 22], [58, 14, 19], [69, 11, 16]], trunkTop: 64 },
  { skirts: [[42, 27, 36], [66, 21, 30]], trunkTop: 62 },
];

export interface PineProps {
  size?: number;
  tone?: TreeTone;
  variant?: number;
}

/** A pine: stacked soft skirts, a darker mass behind, one shade, one highlight. */
export const Pine = memo(function Pine({ size = 66, tone = 'dark', variant }: PineProps) {
  const t = tones[tone];
  const s = PINE_SHAPES[pickVariant(variant, 0)]!;
  return (
    <Svg width={size * 0.68} height={size} viewBox="0 0 56 82" pointerEvents="none">
      <Ellipse cx={28} cy={78} rx={16} ry={shadowRy(16)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Path d={`M 24 79 Q 23 70 24.6 ${s.trunkTop} L 31.4 ${s.trunkTop} Q 33 70 32 79 Z`} fill={t.trunk} />
      <Path d={`M 28.4 79 Q 28 70 28.6 ${s.trunkTop} L 31.4 ${s.trunkTop} Q 33 70 32 79 Z`} fill={SHADE} />
      {/* darker mass, nudged right so the silhouette has depth */}
      {s.skirts.map((k, i) => (
        <Path key={`b${i}`} d={skirt(k[0] + 1.5, k[1] + 1, k[2])} fill={t.back} transform="translate(3 -2)" />
      ))}
      {s.skirts.map((k, i) => (
        <Path key={`f${i}`} d={skirt(k[0], k[1], k[2])} fill={t.leaf} />
      ))}
      {s.skirts.map((k, i) => (
        <Path
          key={`s${i}`}
          d={`M 28 ${k[0] - k[2] * 0.7} Q ${28 + k[1] * 0.62} ${k[0] - k[2] * 0.28} ${28 + k[1]} ${k[0]} Q ${28 + k[1] * 0.5} ${k[0] + 4.5} 28 ${k[0] + 3} Z`}
          fill={SHADE}
        />
      ))}
      <Path
        d={`M 28 ${s.skirts[0]![0] - s.skirts[0]![2] * 0.86} Q ${28 - s.skirts[0]![1] * 0.5} ${s.skirts[0]![0] - s.skirts[0]![2] * 0.24} ${28 - s.skirts[0]![1] * 0.62} ${s.skirts[0]![0] - 1} Q ${28 - s.skirts[0]![1] * 0.2} ${s.skirts[0]![0] - 6} 28 ${s.skirts[0]![0] - s.skirts[0]![2] * 0.86} Z`}
        fill={HIGHLIGHT}
      />
    </Svg>
  );
});

/* ── the row ──────────────────────────────────────────────────────── */

export interface TreeLineProps {
  /** how many trees across */
  count?: number;
  height?: number;
  bottom?: number;
  tone?: TreeTone;
}

/** deterministic 0..1 jitter so a row looks scattered but never re-shuffles */
const jitter = (i: number, salt: number) => ((Math.sin((i + 1) * 12.9898 + salt) * 43758.5453) % 1 + 1) % 1;

/**
 * A treeline: a darker, smaller back row offset half a step, then the front
 * row — silhouette, size and species all varying so nothing visibly repeats.
 */
export const TreeLine = memo(function TreeLine({ count = 7, height = 92, bottom = 120, tone = 'mid' }: TreeLineProps) {
  const back = Array.from({ length: Math.max(1, count) }, (_, i) => i);
  const front = Array.from({ length: Math.max(1, count) }, (_, i) => i);
  const backTone: TreeTone = tone === 'light' ? 'mid' : 'dark';

  return (
    <View style={[styles.band, { bottom, height: height * 1.25 }]} pointerEvents="none">
      <View style={[styles.row, styles.backRow]}>
        {back.map((i) => {
          const j = jitter(i, 3.1);
          return (
            <View key={`b${i}`} style={{ marginBottom: j * 10 }}>
              {j > 0.72 ? (
                <Pine size={height * (0.6 + j * 0.16)} tone={backTone} variant={i} />
              ) : (
                <Tree size={height * (0.56 + j * 0.2)} tone={backTone} variant={i + 1} />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.row}>
        {front.map((i) => {
          const j = jitter(i, 8.7);
          return (
            <View key={`f${i}`} style={{ marginBottom: j * 7 }}>
              {j > 0.78 ? (
                <Pine size={height * (0.84 + j * 0.14)} tone={tone} variant={i + 2} />
              ) : j < 0.16 ? (
                <Bush size={height * 0.86} tone={tone} variant={i} />
              ) : (
                <Tree size={height * (0.74 + j * 0.26)} tone={j > 0.5 ? tone : 'light'} variant={i} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  band: { position: 'absolute', left: -12, right: -12 },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  backRow: { left: -22, right: 14, opacity: 0.92 },
});

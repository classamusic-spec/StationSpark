/**
 * SceneHero — the illustrated "you are here" panel on the Mission Brief, the
 * dispatch-slip thumbnail, and the backdrop behind every dialogue beat.
 *
 * **There is no fixed viewBox any more.** The old art was drawn into
 * `0 0 320 200` and scaled with `preserveAspectRatio="slice"`, which is what
 * made the full-screen backdrop read as a wall: on a 390 × 694 phone box that
 * crops to the middle 92 of its 320 units and magnifies them 4.2 ×, so a child
 * saw three enormous flat shapes and nothing at any other scale. The panel now
 * measures itself and composes for the aspect it actually has, the way
 * `src/world/Stage.tsx` does — so it fills a portrait phone and a landscape
 * tablet with no empty sky band and no cropped roof.
 *
 * Four depth planes, with no gaps between them (the rule at the top of
 * `Stage.tsx`): sky furniture → far hills and the distant town → the mid
 * terrace → the near ground plane with its soft lip and its dressing. Each
 * plane is one value step darker and crisper than the one behind it and only
 * the near plane carries a saturated hue. The place itself is drawn in
 * `scene/` at three scales — mass, features, dressing — so there is something
 * to look at whether the art is 98 px wide on a dispatch slip or 1024 px wide
 * behind a line of dialogue.
 *
 * `<SceneThumb/>` is the same art at card size with the fine dressing and the
 * distant town dropped, so a slip and its mission always look like one place.
 */
import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { SceneId } from '@/learning/types';
import { palette, radii, shadows } from '@/theme';
import {
  FarSkyline,
  GroundPlane,
  Haze,
  Hills,
  MidTerrace,
  NearStreet,
  SceneLife,
  SkyFurniture,
  StaticSway,
  darker,
  lighter,
  mix,
  sceneDefs,
  sceneFrame,
} from './scene';

export interface SceneStyleDef {
  /** kid-facing name of the place */
  name: string;
  /** drawn icon id for tiny surfaces (recap chips, lists) — never an emoji */
  icon: string;
  sky: readonly [string, string];
  ground: string;
  groundShade: string;
  /** the tint a dispatch-slip thumbnail washes over the art */
  tint: readonly [string, string];
  /** the lighter lip along the top of the near ground plane */
  lip?: string;
  /** the distant town's two tones — palest, flattest layer in the frame */
  far?: readonly [string, string];
}

export const sceneStyles: Record<SceneId, SceneStyleDef> = {
  bakery: {
    name: 'Bakery',
    icon: 'bakery',
    sky: ['#8FD3FB', '#D6F0FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#FFE3B8', '#FFF6E5'],
    lip: '#E2E8F4',
    far: ['#93BADF', '#ABCCE9'],
  },
  pizza: {
    name: 'Pizza Shop',
    icon: 'pizza',
    sky: ['#8FD3FB', '#DCF2FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#FFD3C2', '#FFF1E6'],
    lip: '#E2E8F4',
    far: ['#95B9DA', '#ADCBE6'],
  },
  school: {
    name: 'School',
    icon: 'school',
    sky: ['#7FCCFA', '#D2EEFF'],
    ground: '#C6D0DE',
    groundShade: '#AFBACD',
    tint: ['#FFE7B8', '#FFF8E8'],
    lip: '#E1E7F1',
    far: ['#8FB6DC', '#A8C8E7'],
  },
  park: {
    name: 'Park',
    icon: 'park',
    sky: ['#7FCCFA', '#D8F3FF'],
    ground: '#8CCB6B',
    groundShade: '#6FB255',
    tint: ['#C9F0B4', '#EFFBE6'],
    lip: '#A6DC84',
    far: ['#93C2C4', '#AFD6D0'],
  },
  'clock-tower': {
    name: 'Clock Tower',
    icon: 'museum',
    sky: ['#6FC3F8', '#CDEBFF'],
    ground: '#C6CEE0',
    groundShade: '#B0B9CE',
    tint: ['#CFE0FF', '#EEF4FF'],
    lip: '#DFE5F1',
    far: ['#8FB4DC', '#A9C7E8'],
  },
  apartments: {
    name: 'Apartments',
    icon: 'house',
    sky: ['#84CFFA', '#D9F1FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#D5DCF2', '#F1F4FF'],
    lip: '#E2E8F4',
    far: ['#93B7DD', '#ADC9E8'],
  },
  'pet-shop': {
    name: 'Pet Shop',
    icon: 'pet-shop',
    sky: ['#8FD3FB', '#DFF4FF'],
    ground: '#C7D4DE',
    groundShade: '#B0BFCB',
    tint: ['#C7F0E4', '#EDFBF6'],
    lip: '#E0EAF1',
    far: ['#90BDCE', '#AAD2DE'],
  },
  library: {
    name: 'Library',
    icon: 'library',
    sky: ['#7FCCFA', '#D6F0FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#D3E4FF', '#EFF6FF'],
    lip: '#E2E8F4',
    far: ['#8EB3DB', '#A8C6E7'],
  },
  market: {
    name: 'Market',
    icon: 'market',
    sky: ['#8FD3FB', '#DFF4FF'],
    ground: '#C9D2E4',
    groundShade: '#B3BDD3',
    tint: ['#FFE0D0', '#FFF4EA'],
    lip: '#E2E8F4',
    far: ['#96B9D9', '#AFCBE6'],
  },
  'station-yard': {
    name: 'Station Yard',
    icon: 'truck',
    sky: ['#6FC3F8', '#CFEBFF'],
    ground: '#C4CBDE',
    groundShade: '#ADB5CB',
    tint: ['#FFD3CE', '#FFF0EE'],
    lip: '#DEE4F1',
    far: ['#8FB4DC', '#A9C7E8'],
  },
};

export const sceneName = (scene: SceneId): string => sceneStyles[scene].name;
/** rule #5: the world layer never uses emoji — this is a `VocabIcon` id. */
export const sceneIcon = (scene: SceneId): string => sceneStyles[scene].icon;

/* ------------------------------------------------------------------ */
/* The drawing                                                          */
/* ------------------------------------------------------------------ */

/** Everything that never moves. Memoized: it redraws only when the box does. */
const SceneArt = memo(function SceneArt({ scene, w, h, compact, bleed }: { scene: SceneId; w: number; h: number; compact: boolean; bleed: boolean }) {
  const s = sceneStyles[scene] ?? sceneStyles.bakery;
  const def = sceneDefs[scene] ?? sceneDefs.bakery;
  const f = sceneFrame(w, h, def.height, !compact, bleed, def.spill);
  const far = s.far ?? ['#93BADF', '#ABCCE9'];
  const lip = s.lip ?? lighter(s.ground, 0.34);
  const hillTint = mix(far[0], s.sky[1], 0.42);
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={`ssky-${scene}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={s.sky[0]} />
          <Stop offset="1" stopColor={s.sky[1]} />
        </LinearGradient>
        <LinearGradient id={`shaze-${scene}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={s.sky[1]} stopOpacity={0} />
          <Stop offset="1" stopColor={s.sky[1]} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>

      {/* sky, all the way down to the ground line — never a gap */}
      <Rect x={0} y={0} width={w} height={f.gy + 4} fill={`url(#ssky-${scene})`} />
      <SkyFurniture f={f} seed={def.height} />

      {/* far distance */}
      <Hills f={f} y={Math.max(4, f.gy - 150 * f.s)} amp={58 * f.s} tint={hillTint} seed={def.height % 7} opacity={0.8} />
      {compact ? null : <FarSkyline f={f} baseY={f.gy + 2} tint={far[0]} light={far[1]} seed={2} opacity={0.5} />}
      <Haze f={f} gradientId={`shaze-${scene}`} />

      {/* middle distance */}
      <MidTerrace f={f} seed={4} opacity={0.88} />

      {/* near ground, then the place itself */}
      <GroundPlane f={f} near={s.ground} lip={lip} kind={def.ground} />
      <G x={f.ox} y={f.oy} scale={f.k}>
        {def.art(f.detail)}
      </G>
      <NearStreet f={f} kind={def.ground} />
      {compact ? <StaticSway f={f} def={def} /> : null}
      {/* the near plane's own shadow, so the ground reads as being in front */}
      <Rect x={0} y={h - 3} width={w} height={3} fill={darker(s.ground, 0.16)} />
    </Svg>
  );
});

/* ------------------------------------------------------------------ */
/* Public components                                                    */
/* ------------------------------------------------------------------ */

export interface SceneHeroProps {
  scene: SceneId;
  /** drop the sky detail and the fine dressing — used by the small thumbnails */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  /** rounded corners on the panel (default: card radius) */
  radius?: number;
  /**
   * Full-bleed hero. The composition is aspect-driven now, so this only nudges
   * the horizon down a touch for a panel that runs to the screen edge.
   */
  bleed?: boolean;
}

/** The big illustrated storefront panel. Fills whatever box it is given. */
export function SceneHero({ scene, compact = false, style, radius = radii.card, bleed = false }: SceneHeroProps) {
  const s = sceneStyles[scene] ?? sceneStyles.bakery;
  const def = sceneDefs[scene] ?? sceneDefs.bakery;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((p) => (Math.abs(p.w - width) < 1 && Math.abs(p.h - height) < 1 ? p : { w: width, h: height }));
  }, []);
  const ready = box.w > 4 && box.h > 4;
  const f = useMemo(
    () => (ready ? sceneFrame(box.w, box.h, def.height, !compact, bleed, def.spill) : null),
    [bleed, box.h, box.w, compact, def.height, def.spill, ready],
  );

  return (
    <View
      style={[styles.hero, { borderRadius: radius, backgroundColor: s.sky[1] }, style]}
      onLayout={onLayout}
      pointerEvents="none"
    >
      {ready ? <SceneArt scene={scene} w={box.w} h={box.h} compact={compact} bleed={bleed} /> : null}
      {ready && !compact && f ? <SceneLife f={f} def={def} /> : null}
    </View>
  );
}

export interface SceneThumbProps {
  scene: SceneId;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Dispatch-slip thumbnail: the same place, card-sized. */
export function SceneThumb({ scene, width = 108, height = 88, style }: SceneThumbProps) {
  const s = sceneStyles[scene] ?? sceneStyles.bakery;
  return (
    <View style={[styles.thumb, { width, height, borderRadius: radii.tile, backgroundColor: s.tint[1] }, style]}>
      <SceneHero scene={scene} compact radius={radii.tile} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden', backgroundColor: palette.skyBottom },
  thumb: { overflow: 'hidden', ...shadows.soft },
});

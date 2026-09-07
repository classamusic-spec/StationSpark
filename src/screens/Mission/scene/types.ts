import type React from 'react';
import type { GroundKind } from './layers';

/** What sways in a scene — one per scene (consistency rule #9). */
export type SwayKind = 'sign' | 'slice' | 'cage' | 'banner' | 'scale' | 'flag' | 'lantern' | 'laundry' | 'bell' | 'kite';

/**
 * One place, authored in its own design box: `SCENE_W` wide, `height` tall,
 * ground line at `y = height`. Dressing may sit below the ground line (nearer
 * the viewer) and a little outside the box either side.
 */
export interface SceneDef {
  height: number;
  /** the surface the near ground plane is made of */
  ground: GroundKind;
  /** `detail` is false on dispatch-slip thumbnails, where fine dressing is mud */
  art: (detail: boolean) => React.JSX.Element;
  /** where the swaying element hangs, in design units */
  sway: { x: number; y: number; kind: SwayKind };
  /**
   * How much wider than the frame this scene's design box may run. > 1 lets a
   * tall subject (the clock tower) reach full height by cropping the low walls
   * either side of it instead of being capped by the box's width.
   */
  spill?: number;
  /**
   * What fills the middle distance. A terrace of shops for anywhere in town;
   * a tree line for the park, where a row of shopfronts behind the gate said
   * the wrong thing about where the child was standing.
   */
  mid?: 'terrace' | 'trees';
  /** override the mid-terrace's wall and roof tints (before the haze wash) */
  terrace?: { walls?: readonly string[]; roofs?: readonly string[] };
}

/**
 * The shape of the authored art after `tools/art/build-characters.mjs` has
 * split it into rig parts. Nothing in here describes *drawing* — the `d`
 * strings are the artwork exactly as authored — only which shapes move
 * together and what may be re-tinted.
 */

/** Fills the avatar customiser is allowed to swap. Everything else is fixed. */
export type ToneRole =
  | 'skin'
  | 'skinShade'
  | 'skinShade2'
  | 'skinDeep'
  | 'skinLine'
  | 'hair'
  | 'hairDark'
  | 'helmet'
  | 'helmetLight'
  | 'helmetDark';

export type ToneMap = Partial<Record<ToneRole, string>>;

export interface ArtShape {
  /** path data, verbatim from the authored art */
  d?: string;
  /** an authored <circle>, kept as one so its antialiased edge is unchanged */
  circle?: { cx: number; cy: number; r: number };
  fill: string;
  /** when set, `fill` may be replaced by the matching entry in a ToneMap */
  tone?: ToneRole;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
}

export interface ArtPart<N extends string = string> {
  name: N;
  shapes: readonly ArtShape[];
}

export interface Anchor {
  x: number;
  y: number;
}

/**
 * The animation channels a rig exposes. A layer bound to a channel is moved by
 * that channel's transform; `static` layers never move on their own (they still
 * inherit the motion of any layer they sit inside).
 */
export type RigChannel =
  | 'static'
  | 'torso'
  | 'armL'
  | 'armR'
  | 'head'
  | 'hat'
  | 'eyeL'
  | 'eyeR'
  | 'mouth'
  | 'browL'
  | 'browR';

export interface RigLayer<N extends string = string> {
  channel: RigChannel;
  parts: readonly N[];
  /** layers drawn inside this one, inheriting its transform (the head stack) */
  children?: readonly RigLayer<N>[];
}

export interface RigSpec<N extends string = string> {
  viewBox: { readonly w: number; readonly h: number };
  parts: readonly ArtPart<N>[];
  layers: readonly RigLayer<N>[];
  /** pivots in viewBox units, one per rotating channel */
  pivots: Readonly<Record<Exclude<RigChannel, 'static'>, Anchor>>;
  /** where the character stands, for shadows and hops */
  feet: Anchor;
}

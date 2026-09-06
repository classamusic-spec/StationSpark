/**
 * The badge emblems the 3D kit carries — the list only, free of `three`.
 *
 * `shapes.ts` needs `three` to draw them, but a caller that only wants to *name*
 * an emblem (the dev bench cycling through the set, a screen validating a badge
 * id before it lazily loads the medal) must not drag ~600 KB of renderer in to
 * read twelve strings. `shapes.ts` re-exports both of these, so nothing inside
 * the 3D layer has to know they moved.
 */
export type Badge3DIcon =
  | 'flame'
  | 'star'
  | 'chef-hat'
  | 'ladder'
  | 'hose'
  | 'book'
  | 'map'
  | 'heart'
  | 'cat'
  | 'pizza'
  | 'clock'
  | 'numbers';

export const badge3DIcons: readonly Badge3DIcon[] = [
  'flame',
  'star',
  'chef-hat',
  'ladder',
  'hose',
  'book',
  'map',
  'heart',
  'cat',
  'pizza',
  'clock',
  'numbers',
];

/** Narrow a `BadgeDef.icon` to something the 3D kit can actually extrude. */
export function toBadge3DIcon(icon: string | undefined): Badge3DIcon {
  return (badge3DIcons as readonly string[]).includes(icon ?? '') ? (icon as Badge3DIcon) : 'star';
}

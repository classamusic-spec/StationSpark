import type { LocationId } from '@/content/types';
import { MAP_PLACES, MAP_VB, type MapPlace } from '@/world';

/* ------------------------------------------------------------------ *
 * The map is a PLACE, not a diagram.
 *
 * Spark City used to be squeezed until the whole plan fitted the window,
 * which on a phone made it a small distant picture. Instead the town is
 * drawn once at a generous working size (`CONTENT_W × CONTENT_H`) and the
 * screen moves a camera over it: `scale` says how close we are, `tx`/`ty`
 * where we are looking. Everything in this file is the pure arithmetic of
 * that camera, kept out of the screen so it can be reasoned about (and
 * tested) on its own.
 *
 * All map coordinates are the plan's own units (`MAP_VB`, 360 × 600); one
 * unit is `MAP_UNIT` pixels in the drawn layer, and `scale` multiplies that
 * again on screen.
 * ------------------------------------------------------------------ */

/** Pixels per plan unit in the drawn layer. */
export const MAP_UNIT = 2.4;
export const CONTENT_W = MAP_VB.w * MAP_UNIT;
export const CONTENT_H = MAP_VB.h * MAP_UNIT;

/** The widest block in the plan (the fire station's), in plan units. */
const BLOCK_UNITS = 85;
/** How wide that block must read before a building stops looking like a building. */
const BLOCK_TARGET_PX = 168;
const READABLE = BLOCK_TARGET_PX / (BLOCK_UNITS * MAP_UNIT);

/** Even a very large window does not get a cartoonishly magnified town. */
const HOME_MAX = 1.9;
/** Pinching in past this only buys blur. */
const ZOOM_CEILING = 2.6;
/** Below `home × this` the name pills give way to plain markers. */
export const LABEL_RATIO = 0.8;

/** Where the map opens: the fire station, up and to the left. */
export const HOME_FOCUS = { x: 52, y: 118, ax: 0.36, ay: 0.34 } as const;

export const clampTo = (v: number, lo: number, hi: number): number => {
  'worklet';
  return Math.max(lo, Math.min(hi, v));
};

export interface MapScales {
  /** the whole town in the frame — the furthest out we ever go */
  min: number;
  /** the working scale the map opens at */
  home: number;
  /** the closest a pinch may take us */
  max: number;
  /** name pills below this scale would collide, so they become markers */
  label: number;
}

/**
 * The four scales the camera lives between.
 *
 * `min` frames the whole town (so a child can always see where they are),
 * `home` is close enough that a building reads as a building *and* the town
 * covers the viewport rather than floating in it, and `max` is a couple of
 * steps closer for small hands that want to be sure of a pin.
 */
export function mapScales(vpW: number, vpH: number): MapScales {
  if (vpW <= 0 || vpH <= 0) return { min: 1, home: 1, max: 1, label: LABEL_RATIO };
  const fit = Math.min(vpW / CONTENT_W, vpH / CONTENT_H);
  const cover = Math.max(vpW / CONTENT_W, vpH / CONTENT_H);
  const home = Math.max(fit, Math.min(Math.max(cover, READABLE), HOME_MAX));
  const max = Math.max(home, Math.min(ZOOM_CEILING, Math.max(home * 2, fit * 3)));
  return { min: fit, home, max, label: home * LABEL_RATIO };
}

/**
 * How far the camera may travel before the town would leave the frame.
 * Zero on an axis the town does not fill — there it stays centred, so the
 * map can never be flung off into empty sky.
 */
export function panBounds(scale: number, vpW: number, vpH: number): { x: number; y: number } {
  'worklet';
  return {
    x: Math.max(0, (CONTENT_W * scale - vpW) / 2),
    y: Math.max(0, (CONTENT_H * scale - vpH) / 2),
  };
}

/**
 * Where to stand so that the plan point (`ux`, `uy`) lands `ax`/`ay` of the
 * way across the viewport — clamped, so framing a place near an edge shows
 * the edge rather than the void beyond it.
 */
export function frameOn(
  ux: number,
  uy: number,
  scale: number,
  vpW: number,
  vpH: number,
  ax = 0.5,
  ay = 0.45,
): { tx: number; ty: number } {
  'worklet';
  const b = panBounds(scale, vpW, vpH);
  const wantX = ax * vpW - vpW / 2 - (ux * MAP_UNIT - CONTENT_W / 2) * scale;
  const wantY = ay * vpH - vpH / 2 - (uy * MAP_UNIT - CONTENT_H / 2) * scale;
  return { tx: clampTo(wantX, -b.x, b.x), ty: clampTo(wantY, -b.y, b.y) };
}

/** Screen position of a plan point under the current camera. */
export function screenX(ux: number, scale: number, tx: number, vpW: number): number {
  'worklet';
  return vpW / 2 + (ux * MAP_UNIT - CONTENT_W / 2) * scale + tx;
}

export function screenY(uy: number, scale: number, ty: number, vpH: number): number {
  'worklet';
  return vpH / 2 + (uy * MAP_UNIT - CONTENT_H / 2) * scale + ty;
}

/* ------------------------------------------------------------------ *
 * Pin labels
 * ------------------------------------------------------------------ */

/** The marker chip, and the shortest a name pill ever gets (the compact one). */
export const MARKER_PX = 40;
const SHORTEST_PILL = 34;
/**
 * How far a pin's tap target reaches past its label. `hitSlop` is not honoured
 * on the web build, so `MapPin` draws this as a real (invisible) view — which
 * means neighbours must be at least twice this far apart or one pin's target
 * would sit over the next pin's name.
 */
export const LABEL_HALO = Math.ceil((56 - SHORTEST_PILL) / 2);

export interface PinBox {
  place: MapPlace;
  /** screen-px offset of the label's top-left corner from its place's anchor */
  dx: number;
  dy: number;
  /** the width the layout reserved for it */
  width: number;
  compact: boolean;
  /** locked places, and every place at whole-town range, get the small chip */
  variant: 'pill' | 'marker';
}

/**
 * Places the labels in each block's grass strip.
 *
 * Labels no longer scale with the map — they are drawn at a constant size so
 * a five-year-old can read them however far out the camera is, which means
 * this layout works in *screen* pixels and returns an offset from each
 * place's anchor rather than an absolute position.
 *
 * Two rules do the work. Only a place you can actually visit gets a name
 * pill — everything else is a small chip on its own building, which is what
 * stops eleven white pills covering the town. And a pill is nudged along its
 * row rather than allowed to sit on a neighbour or run off the board, because
 * the strip it sits in is grass on purpose: no label ever lands on tarmac.
 *
 * `unitPx` is deliberately the *tightest* spacing the labels will ever be
 * asked to survive (the scale at which pills appear at all). Closer in the
 * anchors only spread further apart, so a row that packs here packs anywhere.
 */
export function layoutPins(
  unitPx: number,
  compact: boolean,
  isOpen: (id: LocationId) => boolean,
  labels: boolean,
): PinBox[] {
  const charW = compact ? 8.4 : 10.2;
  const chrome = compact ? 64 : 70;
  const cap = compact ? 180 : 210;
  const townW = MAP_VB.w * unitPx;
  const named = (p: MapPlace) => labels && isOpen(p.id);
  const widthOf = (p: MapPlace) => (named(p) ? Math.min(cap, chrome + p.name.length * charW) : MARKER_PX);

  /* group by label band — every place in a band shares one strip of grass */
  const rows = new Map<number, MapPlace[]>();
  for (const place of MAP_PLACES) {
    const band = Math.round(place.y / 40);
    const row = rows.get(band) ?? [];
    row.push(place);
    rows.set(band, row);
  }

  const boxes = new Map<string, { dx: number; width: number }>();
  for (const row of rows.values()) {
    const sorted = [...row].sort((a, b) => a.x - b.x);
    let cursor = 4;
    for (const place of sorted) {
      const w = widthOf(place);
      const anchor = place.x * unitPx;
      /* centred on the place, then pushed right of whatever came before it */
      const wanted = anchor - w / 2;
      const left = Math.min(Math.max(wanted, cursor), Math.max(4, townW - w - 4));
      boxes.set(place.id, { dx: left - anchor, width: w });
      cursor = left + w + 2 * LABEL_HALO;
    }
  }

  return MAP_PLACES.map((place) => {
    const box = boxes.get(place.id) ?? { dx: -MARKER_PX / 2, width: MARKER_PX };
    return { place, dx: box.dx, dy: 0, width: box.width, compact, variant: named(place) ? 'pill' : 'marker' };
  });
}

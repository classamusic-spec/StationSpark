import { captainAnchors, captainParts, captainViewBox, type CaptainPartName } from './captainArt';
import { rookieAnchors, rookieParts, rookieViewBox, type RookiePartName } from './rookieArt';
import type { RigLayer, RigSpec } from './types';

/**
 * Which authored parts move together, and in what order they are painted.
 *
 * The order below is the authored paint order. It only differs from the SVG
 * where two parts cannot overlap (the chest badge, the boots), so the drawing
 * is identical either way — see `tools/art/build-characters.mjs`, which fails
 * the build if a shape is dropped or claimed twice.
 */

/* Captain Bea. Her jacket is one authored shape including both sleeves, so the
 * arms do not swing from the shoulder — the hands turn at the cuff instead. */
const captainLayers: readonly RigLayer<CaptainPartName>[] = [
  { channel: 'static', parts: ['bootR', 'bootL', 'legL', 'legR'] },
  { channel: 'armL', parts: ['handL'] },
  { channel: 'armR', parts: ['handR'] },
  { channel: 'torso', parts: ['torso', 'cuffL', 'cuffR', 'neck'] },
  {
    channel: 'head',
    parts: [],
    children: [
      { channel: 'static', parts: ['face', 'hair'] },
      { channel: 'browL', parts: ['browL'] },
      { channel: 'browR', parts: ['browR'] },
      { channel: 'hat', parts: ['hat'] },
      { channel: 'static', parts: ['earL', 'earR', 'cheekL', 'cheekR'] },
      { channel: 'eyeL', parts: ['eyeL'] },
      { channel: 'eyeR', parts: ['eyeR'] },
      { channel: 'mouth', parts: ['mouth'] },
    ],
  },
];

export const captainRig: RigSpec<CaptainPartName> = {
  viewBox: captainViewBox,
  parts: captainParts,
  layers: captainLayers,
  pivots: {
    torso: captainAnchors.torso,
    head: captainAnchors.head,
    hat: captainAnchors.hat,
    armL: captainAnchors.armL,
    armR: captainAnchors.armR,
    eyeL: captainAnchors.eyeL,
    eyeR: captainAnchors.eyeR,
    mouth: captainAnchors.mouth,
    browL: captainAnchors.browL,
    browR: captainAnchors.browR,
  },
  feet: captainAnchors.feet,
};

/* Rookie. Both sleeves are authored as their own shapes that share the
 * shoulder vertex with the coat, so the arms really do swing — no gap opens
 * at the joint however far they go. */
const rookieLayers: readonly RigLayer<RookiePartName>[] = [
  { channel: 'armL', parts: ['handL'] },
  { channel: 'armR', parts: ['handR'] },
  { channel: 'static', parts: ['bootL', 'bootR', 'legL', 'legR'] },
  { channel: 'torso', parts: ['torso'] },
  { channel: 'armL', parts: ['armL'] },
  { channel: 'armR', parts: ['armR'] },
  { channel: 'static', parts: ['neck', 'collar', 'badge'] },
  {
    channel: 'head',
    parts: [],
    children: [
      { channel: 'hat', parts: ['hat'] },
      { channel: 'static', parts: ['hair', 'face', 'earL', 'earR'] },
      { channel: 'eyeL', parts: ['eyeL'] },
      { channel: 'eyeR', parts: ['eyeR'] },
      { channel: 'static', parts: ['cheekL', 'cheekR'] },
      { channel: 'mouth', parts: ['mouth'] },
      { channel: 'browL', parts: ['browL'] },
      { channel: 'browR', parts: ['browR'] },
      { channel: 'static', parts: ['nose'] },
    ],
  },
];

export const rookieRig: RigSpec<RookiePartName> = {
  viewBox: rookieViewBox,
  parts: rookieParts,
  layers: rookieLayers,
  pivots: {
    torso: rookieAnchors.torso,
    head: rookieAnchors.head,
    hat: rookieAnchors.hat,
    armL: rookieAnchors.armL,
    armR: rookieAnchors.armR,
    eyeL: rookieAnchors.eyeL,
    eyeR: rookieAnchors.eyeR,
    mouth: rookieAnchors.mouth,
    browL: rookieAnchors.browL,
    browR: rookieAnchors.browR,
  },
  feet: rookieAnchors.feet,
};

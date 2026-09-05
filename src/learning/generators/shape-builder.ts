import type { AgeBand, ChallengeGenerator, ChallengeOf, ShapePiece, ShapePieceKind } from '../types';
import { rotatableShapes } from '../types';

type Blueprint = ChallengeOf<'shape-builder'>['blueprint'];
type PieceSpec = Omit<ShapePiece, 'id'>;

/**
 * Brand colours as literals — `src/learning` stays free of UI imports.
 * (engineRed, engineRedDark, safetyYellow, gold, waterCyan, waterCyanDark,
 *  tan, wood, cream, charcoal, orange — see src/theme/colors.ts.)
 */
const C = {
  red: '#E63B2E',
  redDark: '#B9261C',
  yellow: '#FFC72C',
  gold: '#F5A800',
  cyan: '#4FC3F7',
  cyanDark: '#1FA5E8',
  tan: '#F5D9A6',
  wood: '#C58B4E',
  cream: '#FFF6E5',
  charcoal: '#3B4460',
  orange: '#FF8A3D',
} as const;

interface BlueprintDef {
  id: Blueprint;
  pieces: PieceSpec[];
}

/* ------------------------------------------------------------------ */
/* The blueprint shelf. Every piece box lives inside 0–100 and no two   */
/* boxes overlap, so each dashed outline is one unambiguous slot.       */
/* ------------------------------------------------------------------ */

const HOUSE: BlueprintDef = {
  id: 'house',
  pieces: [
    { shape: 'triangle', x: 10, y: 10, w: 80, h: 30, rotation: 0, color: C.red },
    { shape: 'square', x: 14, y: 42, w: 34, h: 34, rotation: 0, color: C.tan },
    { shape: 'square', x: 52, y: 42, w: 34, h: 34, rotation: 0, color: C.tan },
    { shape: 'rect', x: 10, y: 78, w: 80, h: 12, rotation: 0, color: C.gold },
  ],
};

const rails: PieceSpec[] = [
  { shape: 'rect', x: 24, y: 8, w: 12, h: 84, rotation: 0, color: C.gold },
  { shape: 'rect', x: 64, y: 8, w: 12, h: 84, rotation: 0, color: C.gold },
];
const rung = (y: number): PieceSpec => ({ shape: 'rect', x: 36, y, w: 28, h: 12, rotation: 0, color: C.yellow });

const LADDER_SMALL: BlueprintDef = { id: 'ladder', pieces: [...rails, rung(26), rung(56)] };
const LADDER: BlueprintDef = { id: 'ladder', pieces: [...rails, rung(22), rung(44), rung(66)] };

const truckBase: PieceSpec[] = [
  { shape: 'rect', x: 8, y: 40, w: 54, h: 26, rotation: 0, color: C.red },
  { shape: 'square', x: 64, y: 36, w: 28, h: 28, rotation: 0, color: C.redDark },
  { shape: 'circle', x: 14, y: 66, w: 24, h: 24, rotation: 0, color: C.charcoal },
  { shape: 'circle', x: 58, y: 66, w: 24, h: 24, rotation: 0, color: C.charcoal },
];
const TRUCK_SMALL: BlueprintDef = { id: 'truck', pieces: truckBase };
const TRUCK: BlueprintDef = {
  id: 'truck',
  pieces: [...truckBase, { shape: 'rect', x: 12, y: 28, w: 46, h: 10, rotation: 0, color: C.yellow }],
};

const rocketBase: PieceSpec[] = [
  { shape: 'triangle', x: 36, y: 6, w: 28, h: 24, rotation: 0, color: C.red },
  { shape: 'rect', x: 36, y: 30, w: 28, h: 42, rotation: 0, color: C.cream },
  { shape: 'triangle', x: 14, y: 46, w: 22, h: 26, rotation: 270, color: C.cyan },
  { shape: 'triangle', x: 64, y: 46, w: 22, h: 26, rotation: 90, color: C.cyan },
];
const ROCKET_SMALL: BlueprintDef = { id: 'rocket', pieces: rocketBase };
const ROCKET: BlueprintDef = {
  id: 'rocket',
  pieces: [...rocketBase, { shape: 'semicircle', x: 36, y: 72, w: 28, h: 18, rotation: 180, color: C.orange }],
};

const HYDRANT: BlueprintDef = {
  id: 'hydrant',
  pieces: [
    { shape: 'semicircle', x: 36, y: 6, w: 28, h: 14, rotation: 0, color: C.redDark },
    { shape: 'rect', x: 34, y: 20, w: 32, h: 10, rotation: 0, color: C.red },
    { shape: 'rect', x: 32, y: 30, w: 36, h: 44, rotation: 0, color: C.red },
    { shape: 'square', x: 14, y: 40, w: 16, h: 16, rotation: 0, color: C.redDark },
    { shape: 'square', x: 70, y: 40, w: 16, h: 16, rotation: 0, color: C.redDark },
    { shape: 'rect', x: 24, y: 74, w: 52, h: 14, rotation: 0, color: C.redDark },
  ],
};

const TOWER: BlueprintDef = {
  id: 'tower',
  pieces: [
    { shape: 'triangle', x: 18, y: 4, w: 64, h: 22, rotation: 0, color: C.redDark },
    { shape: 'rect', x: 28, y: 26, w: 44, h: 14, rotation: 0, color: C.cream },
    { shape: 'circle', x: 38, y: 40, w: 24, h: 24, rotation: 0, color: C.yellow },
    { shape: 'square', x: 30, y: 64, w: 18, h: 18, rotation: 0, color: C.tan },
    { shape: 'square', x: 52, y: 64, w: 18, h: 18, rotation: 0, color: C.tan },
    { shape: 'rect', x: 22, y: 82, w: 56, h: 10, rotation: 0, color: C.gold },
  ],
};

const boatBase: PieceSpec[] = [
  { shape: 'semicircle', x: 8, y: 62, w: 84, h: 26, rotation: 180, color: C.red },
  { shape: 'rect', x: 12, y: 54, w: 76, h: 8, rotation: 0, color: C.gold },
  { shape: 'rect', x: 46, y: 14, w: 8, h: 40, rotation: 0, color: C.wood },
  { shape: 'triangle', x: 54, y: 18, w: 28, h: 34, rotation: 90, color: C.cream },
  { shape: 'rect', x: 20, y: 38, w: 22, h: 16, rotation: 0, color: C.cyan },
];
const BOAT_SMALL: BlueprintDef = { id: 'boat', pieces: boatBase };
const BOAT: BlueprintDef = {
  id: 'boat',
  pieces: [...boatBase, { shape: 'triangle', x: 22, y: 16, w: 22, h: 20, rotation: 270, color: C.cyanDark }],
};

/** 3–4 pieces for the little ones, 4–5 mid, 5–7 for band C. */
const shelf: Record<AgeBand, BlueprintDef[]> = {
  A: [HOUSE, LADDER_SMALL, TRUCK_SMALL, ROCKET_SMALL],
  B: [HOUSE, LADDER, TRUCK, ROCKET, BOAT_SMALL],
  C: [LADDER, TRUCK, ROCKET, HYDRANT, TOWER, BOAT],
};

const canTurn = (shape: ShapePieceKind): boolean => rotatableShapes.includes(shape);

/**
 * SHAPE BUILDER — the Station Spark Builders workshop.
 *
 * A dashed blueprint silhouette waits on the workbench; the child drags each
 * shape into its outline. From band B the pieces arrive turned the wrong way
 * (only triangles, semicircles and quarter-circles look different when turned,
 * so `needsRotation` is only ever true for blueprints that contain one), and
 * band C is asked to count a shape at the end.
 */
export const generateShapeBuilder: ChallengeGenerator<'shape-builder'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const def = rng.pick(shelf[ageBand]);

  const pieces: ShapePiece[] = def.pieces.map((piece, i) => ({ id: `${def.id}-${i}`, ...piece }));
  const turnable = pieces.some((p) => canTurn(p.shape));
  const needsRotation = ageBand !== 'A' && turnable;

  let askCount: { shape: ShapePieceKind; count: number } | undefined;
  if (ageBand === 'C') {
    const counts = new Map<ShapePieceKind, number>();
    for (const piece of pieces) counts.set(piece.shape, (counts.get(piece.shape) ?? 0) + 1);
    const best = Math.max(...counts.values());
    const shapes = [...counts.entries()].filter(([, n]) => n === best).map(([shape]) => shape);
    const shape = rng.pick(shapes);
    askCount = { shape, count: counts.get(shape) ?? 1 };
  }

  return {
    kind: 'shape-builder',
    blueprint: def.id,
    pieces: rng.shuffle(pieces),
    needsRotation,
    ...(askCount ? { askCount } : {}),
  };
};

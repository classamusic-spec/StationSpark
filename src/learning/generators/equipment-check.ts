import type { ChallengeGenerator, EquipmentId } from '../types';
import { masteryAdjustment } from '../adaptive';
import { clampInt } from './shared';

const kit: EquipmentId[] = ['hose', 'cone', 'first-aid', 'flashlight', 'ladder', 'bucket', 'helmet', 'radio', 'boots', 'rope', 'extinguisher', 'axe'];

/**
 * EQUIPMENT CHECK — pack the truck. Count out what the list asks for and leave
 * the decoys on the shelf. B and C start with some gear already packed, so the
 * child works out how many are still missing.
 */
export const generateEquipmentCheck: ChallengeGenerator<'equipment-check'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'counting', 'subtraction');

  const itemCount = ageBand === 'A' ? 2 : ageBand === 'B' ? 3 : rng.int(3, 4);
  const decoyCount = ageBand === 'C' ? 3 : 2;
  const shuffled = rng.shuffle(kit);
  const chosen = shuffled.slice(0, itemCount);
  const decoys = shuffled.slice(itemCount, itemCount + decoyCount);

  const items = chosen.map((id) => {
    let need: number;
    if (ageBand === 'A') need = clampInt(rng.int(1, 3) + adj, 1, 4);
    else if (ageBand === 'B') need = clampInt(rng.int(2, 5) + adj, 1, 6);
    else need = clampInt(rng.int(3, 8) + adj, 2, 9);
    const maxPacked = ageBand === 'A' ? 0 : Math.min(ageBand === 'B' ? 2 : 3, need - 1);
    const alreadyPacked = maxPacked > 0 ? rng.int(0, maxPacked) : 0;
    return { id, need, alreadyPacked };
  });

  return { kind: 'equipment-check', items, decoys };
};

import type { ChallengeGenerator, ChallengeOf, EquipmentId } from '../types';

type GearSort = ChallengeOf<'gear-sort'>;
type Bin = GearSort['bins'][number];
type Item = GearSort['items'][number];

/**
 * The colour each EquipmentIcon is actually drawn in. Sort-by-colour bins
 * items by THIS, never round-robin, so a yellow hose is never "Blue".
 */
const drawnColor: Record<EquipmentId, 'red' | 'yellow' | 'orange' | 'navy' | 'brown'> = {
  hose: 'yellow',
  cone: 'orange',
  'first-aid': 'red',
  flashlight: 'yellow',
  ladder: 'red',
  axe: 'brown',
  bucket: 'red',
  helmet: 'red',
  radio: 'navy',
  boots: 'yellow',
  extinguisher: 'red',
  rope: 'brown',
};

const colorBins: Bin[] = [
  { id: 'red', label: 'Red', labelEs: 'Rojo', color: '#E63B2E' },
  { id: 'yellow', label: 'Yellow', labelEs: 'Amarillo', color: '#FFC72C' },
  { id: 'orange', label: 'Orange', labelEs: 'Naranja', color: '#FF8A3D' },
];

const sizeBins: Bin[] = [
  { id: 'S', label: 'Small', labelEs: 'Pequeño' },
  { id: 'M', label: 'Medium', labelEs: 'Mediano' },
  { id: 'L', label: 'Large', labelEs: 'Grande' },
];

const categoryBins: Bin[] = [
  { id: 'water', label: 'Water gear', labelEs: 'Cosas de agua', color: '#4FC3F7' },
  { id: 'wear', label: 'Wear it', labelEs: 'Para ponerse', color: '#FFC72C' },
  { id: 'tools', label: 'Tools', labelEs: 'Herramientas', color: '#8FD16B' },
];

const categoryOf: Record<EquipmentId, 'water' | 'wear' | 'tools'> = {
  hose: 'water',
  bucket: 'water',
  extinguisher: 'water',
  helmet: 'wear',
  boots: 'wear',
  cone: 'tools',
  'first-aid': 'tools',
  flashlight: 'tools',
  ladder: 'tools',
  radio: 'tools',
  rope: 'tools',
  axe: 'tools',
};

const equipmentPool = Object.keys(categoryOf) as EquipmentId[];

/**
 * GEAR SORT — drop every piece of gear into the right bin.
 * A sorts by colour or size, B adds "what is it for?", C sorts by category.
 * Every bin always gets at least one item so no bin sits empty.
 */
export const generateGearSort: ChallengeGenerator<'gear-sort'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const by: GearSort['by'] =
    ageBand === 'A' ? rng.pick(['color', 'size'] as const) : ageBand === 'B' ? rng.pick(['color', 'size', 'category'] as const) : rng.pick(['category', 'size'] as const);

  const itemCount = ageBand === 'A' ? 4 : ageBand === 'B' ? 6 : 8;
  const bins = by === 'color' ? colorBins : by === 'size' ? sizeBins : categoryBins;
  const items: Item[] = [];

  if (by === 'category') {
    // Guarantee coverage: one item per bin first, then fill.
    const perBin = categoryBins.map((bin) => rng.shuffle(equipmentPool.filter((e) => categoryOf[e] === bin.id)));
    const picked: EquipmentId[] = [];
    perBin.forEach((list) => {
      const first = list[0];
      if (first) picked.push(first);
    });
    const rest = rng.shuffle(equipmentPool.filter((e) => !picked.includes(e)));
    for (const e of rest) {
      if (picked.length >= itemCount) break;
      picked.push(e);
    }
    rng.shuffle(picked).forEach((equipment, i) => {
      items.push({ id: `g${i}`, bin: categoryOf[equipment], equipment });
    });
  } else if (by === 'color') {
    // Bin by the icon's drawn colour; guarantee every bin gets at least one item.
    const perBin = bins.map((bin) => rng.shuffle(equipmentPool.filter((e) => drawnColor[e] === bin.id)));
    const picked: EquipmentId[] = [];
    perBin.forEach((list) => {
      const first = list[0];
      if (first) picked.push(first);
    });
    const rest = rng.shuffle(equipmentPool.filter((e) => !picked.includes(e) && bins.some((b) => b.id === drawnColor[e])));
    for (const e of rest) {
      if (picked.length >= itemCount) break;
      picked.push(e);
    }
    rng.shuffle(picked).forEach((equipment, i) => {
      const bin = bins.find((b) => b.id === drawnColor[equipment]);
      if (bin) items.push({ id: `g${i}`, bin: bin.id, equipment, color: bin.color });
    });
  } else {
    const pool = rng.shuffle(equipmentPool);
    for (let i = 0; i < itemCount; i++) {
      const bin = bins[i % bins.length];
      const equipment = pool[i % pool.length];
      if (!bin || !equipment) continue;
      items.push({ id: `g${i}`, bin: bin.id, equipment, size: bin.id as 'S' | 'M' | 'L' });
    }
  }

  return { kind: 'gear-sort', by, bins, items: rng.shuffle(items) };
};

/** Themed sort (recycling day, market day…) built from labelled bins. */
export function gearSortWithBins(
  bins: Bin[],
  items: Item[],
): GearSort {
  return { kind: 'gear-sort', by: 'category', bins, items };
}

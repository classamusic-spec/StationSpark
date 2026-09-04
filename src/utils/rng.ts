/** Small seeded PRNG (mulberry32) so challenge generation is reproducible in tests. */
export type Rng = {
  next: () => number; // [0,1)
  int: (min: number, max: number) => number; // inclusive
  pick: <T>(arr: readonly T[]) => T;
  shuffle: <T>(arr: readonly T[]) => T[];
  chance: (p: number) => boolean;
};

export function createRng(seed: number = Date.now()): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  const pick = <T>(arr: readonly T[]): T => {
    if (arr.length === 0) throw new Error('pick() from empty array');
    return arr[int(0, arr.length - 1)] as T;
  };
  const shuffle = <T>(arr: readonly T[]): T[] => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  };
  const chance = (p: number) => next() < p;
  return { next, int, pick, shuffle, chance };
}

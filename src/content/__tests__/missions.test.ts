/**
 * Missions are data plus generator thunks. These tests run every thunk for
 * every age band and check the result is a real, playable challenge — so a
 * child can never walk into a mission beat that cannot be finished.
 */
import { createRng } from '@/utils/rng';
import type { AgeBand, ChallengeKind, GeneratorContext } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import { validateChallenge } from '@/learning/validate';
import { beatsForBand } from '@/machines/missionMachine';
import { missionById, missions, unlockedMissions } from '@/content/missions';
import { recipes } from '@/content/recipes';
import type { DialogueLine, MissionBeat, MissionDef } from '@/content/types';

const BANDS: AgeBand[] = ['A', 'B', 'C'];
const SEEDS = [1, 7, 23, 99, 512];
const KINDS = new Set(Object.keys(challengeSkills) as ChallengeKind[]);

const linesOf = (beat: MissionBeat): DialogueLine[] => {
  if (beat.type === 'dialogue') return beat.lines;
  if (beat.type === 'scene') return beat.lines ?? [];
  if (beat.type === 'kitchen') return beat.intro ?? [];
  if (beat.type === 'minigame') return [...(beat.intro ?? []), ...(beat.outro ?? [])];
  return [];
};

const allLines = (mission: MissionDef): DialogueLine[] => mission.beats.flatMap(linesOf);

describe('mission set', () => {
  it('ships the MVP six with unique ids', () => {
    expect(missions).toHaveLength(6);
    expect(new Set(missions.map((m) => m.id)).size).toBe(6);
    expect(missions.map((m) => m.id).sort()).toEqual(
      ['bakery-bell', 'clock-tower-cat', 'community-cleanup', 'park-picnic', 'pizza-shop-panic', 'school-fair'].sort(),
    );
  });

  it('looks missions up by id', () => {
    expect(missionById('pizza-shop-panic')?.title).toBe('Pizza Shop Panic');
    expect(missionById('nope')).toBeUndefined();
  });

  it('opens two missions on day one and unlocks the rest progressively', () => {
    const open = unlockedMissions([]);
    expect(open.map((m) => m.id).sort()).toEqual(['bakery-bell', 'clock-tower-cat']);
    expect(unlockedMissions(['clock-tower-cat', 'bakery-bell']).length).toBeGreaterThan(2);
    expect(unlockedMissions(missions.map((m) => m.id))).toHaveLength(6);
  });

  it('only requires missions that exist, and never itself', () => {
    for (const mission of missions) {
      for (const required of mission.requires ?? []) {
        expect(missionById(required)).toBeDefined();
        expect(required).not.toBe(mission.id);
      }
    }
  });

  it('has no unreachable mission (the requires chain always resolves)', () => {
    let done: string[] = [];
    for (let pass = 0; pass < missions.length; pass++) {
      done = unlockedMissions(done).map((m) => m.id);
    }
    expect(done).toHaveLength(missions.length);
  });
});

describe.each(missions)('$id', (mission: MissionDef) => {
  it('has the story furniture the dispatch slip needs', () => {
    expect(mission.title.trim().length).toBeGreaterThan(0);
    expect(mission.titleEs?.trim().length).toBeGreaterThan(0);
    expect(mission.tagline.trim().length).toBeGreaterThan(0);
    expect(mission.brief.trim().length).toBeGreaterThan(0);
    expect(mission.address.trim().length).toBeGreaterThan(0);
    expect(mission.xp).toBeGreaterThan(0);
    expect(mission.sparks).toBeGreaterThan(0);
    expect(mission.minutes).toBeGreaterThan(0);
  });

  it('touches at least three subjects', () => {
    expect(new Set(mission.subjects).size).toBeGreaterThanOrEqual(3);
  });

  it.each(BANDS)('band %s plays 8–14 beats', (band) => {
    const beats = beatsForBand(mission, band);
    expect(beats.length).toBeGreaterThanOrEqual(8);
    expect(beats.length).toBeLessThanOrEqual(14);
  });

  it('mixes dialogue, travel, a mini-game and a recap', () => {
    const types = new Set(mission.beats.map((b) => b.type));
    expect(types.has('dialogue')).toBe(true);
    expect(types.has('minigame')).toBe(true);
    expect(types.has('recap')).toBe(true);
    expect(types.has('travel') || types.has('scene')).toBe(true);
    expect(mission.beats.filter((b) => b.type === 'minigame').length).toBeGreaterThanOrEqual(4);
  });

  it('ends on the recap', () => {
    expect(mission.beats[mission.beats.length - 1]?.type).toBe('recap');
  });

  it('only uses mini-games that exist in the Challenge union', () => {
    for (const beat of mission.beats) {
      if (beat.type === 'minigame') expect(KINDS.has(beat.game)).toBe(true);
    }
  });

  it('only cooks recipes that exist', () => {
    for (const beat of mission.beats) {
      if (beat.type === 'kitchen') expect(recipes.some((r) => r.id === beat.recipe)).toBe(true);
    }
  });

  it.each(BANDS)('band %s: every challenge thunk runs and returns the declared kind', (band) => {
    for (const seed of SEEDS) {
      const ctx: GeneratorContext = { ageBand: band, rng: createRng(seed), scene: mission.scene };
      for (const beat of beatsForBand(mission, band)) {
        if (beat.type !== 'minigame') continue;
        const challenge = beat.challenge(ctx);
        expect(challenge.kind).toBe(beat.game);
        expect(validateChallenge(challenge)).toEqual([]);
      }
    }
  });

  it('gives every mini-game beat an intro and an outro', () => {
    for (const beat of mission.beats) {
      if (beat.type !== 'minigame') continue;
      expect((beat.intro ?? []).length + (beat.outro ?? []).length).toBeGreaterThan(0);
    }
  });

  it('keeps Captain Bea to twelve words or fewer', () => {
    for (const line of allLines(mission)) {
      if (line.speaker !== 'bea') continue;
      expect(line.text.trim().split(/\s+/).length).toBeLessThanOrEqual(12);
    }
  });

  it('never leaves a line empty and always names the NPC', () => {
    for (const line of allLines(mission)) {
      expect(line.text.trim().length).toBeGreaterThan(0);
      if (line.speaker === 'npc') expect(line.npcName?.trim().length).toBeGreaterThan(0);
    }
  });

  it('lets Pepper be a dog', () => {
    const barks = allLines(mission).filter((l) => l.speaker === 'pepper');
    expect(barks.length).toBeGreaterThan(0);
    expect(barks.every((l) => /woof/i.test(l.text))).toBe(true);
  });

  it('gives the NPC Spanish to say', () => {
    const npcLines = allLines(mission).filter((l) => l.speaker === 'npc');
    expect(npcLines.length).toBeGreaterThan(0);
    expect(npcLines.filter((l) => (l.es ?? '').trim().length > 0).length).toBeGreaterThanOrEqual(3);
  });

  it('says thank you at least once', () => {
    expect(allLines(mission).some((l) => /gracias/i.test(`${l.text} ${l.es ?? ''}`))).toBe(true);
  });

  it('band-restricted beats only name real bands', () => {
    for (const beat of mission.beats) {
      if (beat.type === 'minigame' && beat.bands) {
        expect(beat.bands.length).toBeGreaterThan(0);
        for (const band of beat.bands) expect(BANDS).toContain(band);
      }
    }
  });
});

describe('story details from the design doc', () => {
  const pizza = missionById('pizza-shop-panic');

  it('dispatches the crew to 24 Market Street with 14 / 24 / 42 on the radio', () => {
    const beat = pizza?.beats.find((b) => b.type === 'minigame' && b.game === 'dispatch-decoder');
    expect(beat).toBeDefined();
    if (beat?.type !== 'minigame') throw new Error('expected a minigame beat');
    const challenge = beat.challenge({ ageBand: 'B', rng: createRng(5) });
    if (challenge.kind !== 'dispatch-decoder') throw new Error('expected a dispatch-decoder');
    expect(challenge.correct).toBe('24');
    expect([...challenge.options].sort()).toEqual(['14', '24', '42']);
    expect(challenge.message).toContain('24 Market Street');
    expect(challenge.messageEs).toContain('24');
  });

  it('packs two hoses, three cones and one first-aid kit', () => {
    const beat = pizza?.beats.find((b) => b.type === 'minigame' && b.game === 'equipment-check');
    if (beat?.type !== 'minigame') throw new Error('expected a minigame beat');
    const challenge = beat.challenge({ ageBand: 'A', rng: createRng(2) });
    if (challenge.kind !== 'equipment-check') throw new Error('expected an equipment-check');
    expect(challenge.items).toEqual([
      { id: 'hose', need: 2, alreadyPacked: 0 },
      { id: 'cone', need: 3, alreadyPacked: 0 },
      { id: 'first-aid', need: 1, alreadyPacked: 0 },
    ]);
  });

  it('fills the tank to three quarters and puts out six flames', () => {
    const tank = pizza?.beats.find((b) => b.type === 'minigame' && b.game === 'water-tank');
    const hose = pizza?.beats.find((b) => b.type === 'minigame' && b.game === 'hose-hero');
    if (tank?.type !== 'minigame' || hose?.type !== 'minigame') throw new Error('expected minigame beats');
    for (const band of BANDS) {
      const water = tank.challenge({ ageBand: band, rng: createRng(3) });
      if (water.kind !== 'water-tank') throw new Error('expected a water-tank');
      expect(water.target).toEqual({ num: 3, den: 4 });
      expect(water.pumpStep).toEqual({ num: 1, den: 4 });

      const flames = hose.challenge({ ageBand: band, rng: createRng(3) });
      if (flames.kind !== 'hose-hero') throw new Error('expected a hose-hero');
      expect(flames.totalFlames).toBe(6);
      expect(flames.scene).toBe('pizza');
    }
  });

  it('has Gino say ¡Gracias! and Beacon translate it', () => {
    const lines = pizza ? allLines(pizza) : [];
    const gino = lines.find((l) => l.speaker === 'npc' && /gracias/i.test(l.text));
    expect(gino).toBeDefined();
    expect(lines.some((l) => l.speaker === 'beacon' && /thank you/i.test(l.text))).toBe(true);
  });

  it('sends the clock-tower crew after a kitten and the clean-up crew after a duckling', () => {
    const cat = missionById('clock-tower-cat')?.beats.find((b) => b.type === 'minigame' && b.game === 'rescue-pets');
    const duck = missionById('community-cleanup')?.beats.find((b) => b.type === 'minigame' && b.game === 'rescue-pets');
    if (cat?.type !== 'minigame' || duck?.type !== 'minigame') throw new Error('expected minigame beats');
    const kitten = cat.challenge({ ageBand: 'B', rng: createRng(1) });
    const duckling = duck.challenge({ ageBand: 'B', rng: createRng(1) });
    if (kitten.kind !== 'rescue-pets' || duckling.kind !== 'rescue-pets') throw new Error('expected rescue-pets');
    expect(kitten.animal).toBe('kitten');
    expect(duckling.animal).toBe('duckling');
    expect(duckling.scene).toBe('park');
  });

  it('swaps the game per band where it matters', () => {
    const picnic = missionById('park-picnic');
    const bandsFor = (game: ChallengeKind) => {
      const beat = picnic?.beats.find((b) => b.type === 'minigame' && b.game === game);
      return beat?.type === 'minigame' ? beat.bands : undefined;
    };
    expect(bandsFor('listen-count')).toEqual(['B', 'C']);
    expect(bandsFor('vocab-tap')).toEqual(['A']);
  });

  it('sorts recycling into paper, plastic and cans on clean-up day', () => {
    const beat = missionById('community-cleanup')?.beats.find((b) => b.type === 'minigame' && b.game === 'gear-sort');
    if (beat?.type !== 'minigame') throw new Error('expected a minigame beat');
    const challenge = beat.challenge({ ageBand: 'B', rng: createRng(8) });
    if (challenge.kind !== 'gear-sort') throw new Error('expected a gear-sort');
    expect(challenge.bins.map((b) => b.id)).toEqual(['paper', 'plastic', 'cans']);
    expect(challenge.bins.every((b) => (b.labelEs ?? '').length > 0)).toBe(true);
    expect(challenge.items.every((i) => (i.label ?? '').length > 0)).toBe(true);
  });
});

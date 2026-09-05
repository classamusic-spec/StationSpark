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
const SEEDS = [1, 7, 23, 99, 512, 1024, 4097, 31337];
const KINDS = new Set(Object.keys(challengeSkills) as ChallengeKind[]);

const linesOf = (beat: MissionBeat): DialogueLine[] => {
  if (beat.type === 'dialogue') return beat.lines;
  if (beat.type === 'scene') return beat.lines ?? [];
  if (beat.type === 'kitchen') return beat.intro ?? [];
  if (beat.type === 'minigame') return [...(beat.intro ?? []), ...(beat.outro ?? [])];
  return [];
};

const allLines = (mission: MissionDef): DialogueLine[] => mission.beats.flatMap(linesOf);

const ALL_MISSION_IDS = [
  'bakery-bell',
  'clock-tower-cat',
  'community-cleanup',
  'festival-exchange',
  'library-lights',
  'market-morning',
  'museum-mystery',
  'park-picnic',
  'pet-shop-parade',
  'pizza-shop-panic',
  'school-fair',
  'train-timetable',
];

describe('mission set', () => {
  it('ships the twelve calls of Spark City with unique ids', () => {
    expect(missions).toHaveLength(12);
    expect(new Set(missions.map((m) => m.id)).size).toBe(12);
    expect(missions.map((m) => m.id).sort()).toEqual([...ALL_MISSION_IDS].sort());
  });

  it('looks missions up by id', () => {
    expect(missionById('pizza-shop-panic')?.title).toBe('Pizza Shop Panic');
    expect(missionById('festival-exchange')?.title).toBe('Festival Rescue Exchange');
    expect(missionById('nope')).toBeUndefined();
  });

  it('opens two missions on day one and unlocks the rest progressively', () => {
    const open = unlockedMissions([]);
    expect(open.map((m) => m.id).sort()).toEqual(['bakery-bell', 'clock-tower-cat']);
    expect(unlockedMissions(['clock-tower-cat', 'bakery-bell']).length).toBeGreaterThan(4);
    expect(unlockedMissions(missions.map((m) => m.id))).toHaveLength(missions.length);
  });

  it('only requires missions that exist, and never itself', () => {
    for (const mission of missions) {
      for (const required of mission.requires ?? []) {
        expect(missionById(required)).toBeDefined();
        expect(required).not.toBe(mission.id);
      }
    }
  });

  it('never asks for more than two missions first', () => {
    for (const mission of missions) {
      expect((mission.requires ?? []).length).toBeLessThanOrEqual(2);
      expect(new Set(mission.requires ?? []).size).toBe((mission.requires ?? []).length);
    }
  });

  it('has no unreachable mission (the requires chain always resolves)', () => {
    let done: string[] = [];
    for (let pass = 0; pass < missions.length; pass++) {
      done = unlockedMissions(done).map((m) => m.id);
    }
    expect(done).toHaveLength(missions.length);
  });

  it('fans out instead of queueing: twelve missions open in five rounds', () => {
    const rounds: number[] = [];
    let done: string[] = [];
    for (let pass = 0; pass < 10 && done.length < missions.length; pass++) {
      done = unlockedMissions(done).map((m) => m.id);
      rounds.push(done.length);
    }
    expect(done).toHaveLength(missions.length);
    expect(rounds.length).toBeLessThanOrEqual(5);
    // Day one opens two, and the second round already offers a real choice.
    expect(rounds[0]).toBe(2);
    expect(rounds[1]).toBeGreaterThanOrEqual(6);
  });

  it('gives every mission its own badge and a sensible reward', () => {
    expect(new Set(missions.map((m) => m.badge)).size).toBe(missions.length);
    for (const mission of missions) {
      expect(mission.xp).toBeGreaterThanOrEqual(40);
      expect(mission.xp).toBeLessThanOrEqual(50);
      expect(mission.sparks).toBeGreaterThanOrEqual(10);
      expect(mission.sparks).toBeLessThanOrEqual(20);
    }
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

  it.each(BANDS)('band %s plays 10–14 beats', (band) => {
    const beats = beatsForBand(mission, band);
    expect(beats.length).toBeGreaterThanOrEqual(10);
    expect(beats.length).toBeLessThanOrEqual(14);
  });

  it.each(BANDS)('band %s gets at least four mini-games', (band) => {
    const games = beatsForBand(mission, band).filter((b) => b.type === 'minigame');
    expect(games.length).toBeGreaterThanOrEqual(4);
  });

  it('arrives somewhere and finishes the rescue', () => {
    const scenes = mission.beats.filter((b) => b.type === 'scene').map((b) => (b.type === 'scene' ? b.scene : ''));
    expect(scenes).toContain('arrive');
    expect(scenes).toContain('rescue-complete');
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

/* ------------------------------------------------------------------ */
/* The six calls that grew the town                                     */
/* ------------------------------------------------------------------ */

const beatFor = (missionId: string, game: ChallengeKind, index = 0) => {
  const found = (missionById(missionId)?.beats ?? []).filter((b) => b.type === 'minigame' && b.game === game);
  const beat = found[index];
  if (beat?.type !== 'minigame') throw new Error(`expected a ${game} beat in ${missionId}`);
  return beat;
};

describe('the twelve-mission town', () => {
  it('never puts two missions in the same room of the town, except the pet shop', () => {
    const byLocation = new Map<string, string[]>();
    for (const mission of missions) {
      byLocation.set(mission.location, [...(byLocation.get(mission.location) ?? []), mission.id]);
    }
    for (const [location, ids] of byLocation) {
      if (location === 'pet-shop') expect(ids.sort()).toEqual(['community-cleanup', 'pet-shop-parade']);
      else expect(ids).toHaveLength(1);
    }
  });

  it('covers every corner of Spark City', () => {
    const locations = new Set(missions.map((m) => m.location));
    for (const place of ['library', 'pet-shop', 'market', 'museum', 'train-station', 'festival']) {
      expect(locations.has(place as (typeof missions)[number]['location'])).toBe(true);
    }
  });

  it('reads a sentence, climbs a shelf and lights the library lamp', () => {
    const decoder = beatFor('library-lights', 'dispatch-decoder').challenge({ ageBand: 'C', rng: createRng(3) });
    if (decoder.kind !== 'dispatch-decoder') throw new Error('expected a dispatch-decoder');
    expect(decoder.mode).toBe('sentence');
    const vocab = beatFor('library-lights', 'vocab-tap').challenge({ ageBand: 'A', rng: createRng(3) });
    if (vocab.kind !== 'vocab-tap') throw new Error('expected a vocab-tap');
    expect(vocab.word.id).toBe('library');
    expect(vocab.options.map((o) => o.id)).toContain('library');
  });

  it('sends the pet parade after a puppy, a bunny and a turtle by band', () => {
    const beat = beatFor('pet-shop-parade', 'rescue-pets');
    const animals = BANDS.map((band) => {
      const challenge = beat.challenge({ ageBand: band, rng: createRng(5) });
      if (challenge.kind !== 'rescue-pets') throw new Error('expected rescue-pets');
      return challenge.animal;
    });
    expect(animals).toEqual(['puppy', 'bunny', 'turtle']);
  });

  it('sorts the parade baskets into three pens with Spanish labels', () => {
    const challenge = beatFor('pet-shop-parade', 'gear-sort').challenge({ ageBand: 'A', rng: createRng(2) });
    if (challenge.kind !== 'gear-sort') throw new Error('expected a gear-sort');
    expect(challenge.bins.map((b) => b.id)).toEqual(['dogs', 'bunnies', 'turtles']);
    expect(challenge.bins.every((b) => (b.labelEs ?? '').length > 0)).toBe(true);
    for (const bin of challenge.bins) expect(challenge.items.some((i) => i.bin === bin.id)).toBe(true);
  });

  it('counts the market crates in Spanish and cooks the salsa', () => {
    const counted = beatFor('market-morning', 'count-ingredients').challenge({ ageBand: 'C', rng: createRng(4) });
    if (counted.kind !== 'count-ingredients') throw new Error('expected count-ingredients');
    expect(counted.spokenEs).toBe(true);
    expect(counted.needs.map((n) => n.item.es)).toEqual(['tomate', 'cebolla', 'limón']);
    const kitchen = missionById('market-morning')?.beats.find((b) => b.type === 'kitchen');
    expect(kitchen?.type === 'kitchen' && kitchen.recipe).toBe('garden-salsa');
  });

  it('finishes the museum mosaic with a rule a child can see', () => {
    const beat = beatFor('museum-mystery', 'spray-pattern');
    for (const band of BANDS) {
      const challenge = beat.challenge({ ageBand: band, rng: createRng(11) });
      if (challenge.kind !== 'spray-pattern') throw new Error('expected a spray-pattern');
      expect(challenge.sequence[challenge.sequence.length - 1]).toBe(challenge.answer);
      expect(challenge.sequence).toContain('star');
      expect(challenge.sequence).toContain('cone');
    }
  });

  it('names the streets and compares two roads to the platform', () => {
    const beat = beatFor('train-timetable', 'rescue-route');
    for (const band of BANDS) {
      const challenge = beat.challenge({ ageBand: band, rng: createRng(13) });
      if (challenge.kind !== 'rescue-route') throw new Error('expected a rescue-route');
      expect(challenge.streetNames?.length).toBe(challenge.grid.rows);
      expect(challenge.compareRoutes?.shorter).toBe('a');
    }
  });

  it('runs the exchange call Spanish-first, with Beacon translating', () => {
    const decoder = beatFor('festival-exchange', 'dispatch-decoder').challenge({ ageBand: 'B', rng: createRng(6) });
    if (decoder.kind !== 'dispatch-decoder') throw new Error('expected a dispatch-decoder');
    expect(decoder.messageEs).toContain('quince');
    expect(decoder.correct).toBe('15');
    expect([...decoder.options].sort()).toEqual(['15', '5', '51']);
    const vocab = beatFor('festival-exchange', 'vocab-tap').challenge({ ageBand: 'B', rng: createRng(6) });
    if (vocab.kind !== 'vocab-tap') throw new Error('expected a vocab-tap');
    expect(vocab.promptLang).toBe('es');
    expect(vocab.word.es).toBe('quesadilla');
  });

  it('keeps the festival grill small and contained for every band', () => {
    const beat = beatFor('festival-exchange', 'hose-hero');
    const flames = BANDS.map((band) => {
      const challenge = beat.challenge({ ageBand: band, rng: createRng(9) });
      if (challenge.kind !== 'hose-hero') throw new Error('expected a hose-hero');
      return challenge.totalFlames;
    });
    expect(flames).toEqual([4, 6, 8]);
  });

  it('teases the world map in the exchange send-off', () => {
    const mission = missionById('festival-exchange');
    const text = (mission ? allLines(mission) : []).map((l) => `${l.text} ${l.es ?? ''}`).join(' ');
    expect(text.toLowerCase()).toContain('world map');
    const kitchen = mission?.beats.find((b) => b.type === 'kitchen');
    expect(kitchen?.type === 'kitchen' && kitchen.recipe).toBe('quesadillas');
  });

  it('gives every new mission a band-restricted swap', () => {
    for (const id of ['library-lights', 'pet-shop-parade', 'market-morning', 'museum-mystery', 'train-timetable', 'festival-exchange']) {
      const swaps = (missionById(id)?.beats ?? []).filter((b) => b.type === 'minigame' && b.bands);
      expect(swaps.length).toBeGreaterThanOrEqual(1);
      const covered = new Set(swaps.flatMap((b) => (b.type === 'minigame' ? (b.bands ?? []) : [])));
      expect([...covered].sort()).toEqual(['A', 'B', 'C']);
    }
  });
});

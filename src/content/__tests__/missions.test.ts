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
import { pantryList } from '@/kitchen/shareMath';
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
  'apartment-alarm-check',
  'bakery-bell',
  'bakery-birthday',
  'beach-day',
  'clock-tower-cat',
  'community-cleanup',
  'festival-exchange',
  'festival-lantern-parade',
  'freight-yard-count',
  'garden-grow-day',
  'garden-harvest',
  'harbour-boat-rescue',
  'library-book-sale',
  'library-lights',
  'market-delivery-run',
  'market-morning',
  'moving-day',
  'museum-mystery',
  'park-bandstand',
  'park-picnic',
  'pet-shop-parade',
  'pizza-shop-panic',
  'pizzeria-blackout',
  'playground-build',
  'school-fair',
  'school-sports-day',
  'snow-day-shift',
  'station-open-day',
  'train-timetable',
];

/** The five newest calls — see `content.test.ts` for why they borrow a badge. */
const NEW_CALLS = ['moving-day', 'garden-grow-day', 'station-open-day', 'playground-build', 'beach-day'];

/**
 * THE SECOND CALLS.
 *
 * Twelve places on the map now hold two stories instead of one. They are
 * listed here paired with the call they stand beside, because the thing worth
 * testing about them is not that they exist — it is that a second call at the
 * bakery is not the first call at the bakery with different numbers.
 */
const SECOND_CALLS: { id: string; beside: string }[] = [
  { id: 'snow-day-shift', beside: 'station-open-day' },
  { id: 'bakery-birthday', beside: 'bakery-bell' },
  { id: 'pizzeria-blackout', beside: 'pizza-shop-panic' },
  { id: 'park-bandstand', beside: 'park-picnic' },
  { id: 'library-book-sale', beside: 'library-lights' },
  { id: 'market-delivery-run', beside: 'market-morning' },
  { id: 'garden-harvest', beside: 'garden-grow-day' },
  { id: 'apartment-alarm-check', beside: 'moving-day' },
  { id: 'school-sports-day', beside: 'school-fair' },
  { id: 'freight-yard-count', beside: 'train-timetable' },
  { id: 'harbour-boat-rescue', beside: 'beach-day' },
  { id: 'festival-lantern-parade', beside: 'festival-exchange' },
];

const gamesOf = (mission: MissionDef): Set<ChallengeKind> =>
  new Set(mission.beats.flatMap((b) => (b.type === 'minigame' ? [b.game] : [])));

describe('mission set', () => {
  it('ships the twenty-nine calls of Spark City with unique ids', () => {
    expect(missions).toHaveLength(29);
    expect(new Set(missions.map((m) => m.id)).size).toBe(29);
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

  it('fans out instead of queueing: twenty-nine missions open in five rounds', () => {
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

  it('keeps every reward in the same band, so no call is the one to grind', () => {
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

  it('only casts the three characters the game has', () => {
    const speakers = new Set(allLines(mission).map((l) => l.speaker));
    for (const s of speakers) expect(['bea', 'rookie', 'npc']).toContain(s);
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

  it('has Gino say ¡Gracias! and Captain Bea translate it', () => {
    const lines = pizza ? allLines(pizza) : [];
    const gino = lines.find((l) => l.speaker === 'npc' && /gracias/i.test(l.text));
    expect(gino).toBeDefined();
    expect(lines.some((l) => l.speaker === 'bea' && /thank you/i.test(l.text))).toBe(true);
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
  /*
   * The town used to hold one call per building. It now holds two at most of
   * them, which is only an improvement if the second one is a DIFFERENT STORY —
   * "the bakery again with bigger numbers" would be worse than no mission at
   * all. So the rule this test keeps is no longer "one per room"; it is:
   *
   *   · at most two calls stand at any one place,
   *   · every place on the map has at least one,
   *   · and two calls at the same place never share a badge, a tagline, or the
   *     same set of mini-games.
   *
   * That last clause is the one that bites: it is exactly what a padded mission
   * would fail.
   */
  it('puts at most two calls at any one place, and never the same call twice', () => {
    const byLocation = new Map<string, MissionDef[]>();
    for (const mission of missions) {
      byLocation.set(mission.location, [...(byLocation.get(mission.location) ?? []), mission]);
    }
    expect(byLocation.size).toBe(16);
    for (const [location, list] of byLocation) {
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.length).toBeLessThanOrEqual(2);
      if (list.length !== 2) continue;
      const [first, second] = list as [MissionDef, MissionDef];
      expect(first.badge).not.toBe(second.badge);
      expect(first.tagline).not.toBe(second.tagline);
      const a = gamesOf(first);
      const b = gamesOf(second);
      const shared = [...a].filter((k) => b.has(k));
      if (shared.length === a.size && shared.length === b.size) {
        throw new Error(`both calls at the ${location} play exactly the same games`);
      }
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

  it('runs the exchange call Spanish-first, with Captain Bea translating', () => {
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

  /**
   * The Count Ingredients shelf holds fourteen things. Every ingredient a
   * mission's shopping list asks for has to fit on it, or the child is asked
   * for something that is not there and the beat cannot be finished.
   */
  it('never asks a mission beat for an ingredient the shelf cannot hold', () => {
    for (const mission of missions) {
      for (const band of BANDS) {
        for (const beat of beatsForBand(mission, band)) {
          if (beat.type !== 'minigame' || beat.game !== 'count-ingredients') continue;
          for (const seed of SEEDS) {
            const challenge = beat.challenge({ ageBand: band, rng: createRng(seed) });
            if (challenge.kind !== 'count-ingredients') throw new Error('expected count-ingredients');
            const spare = [...challenge.needs.map((n) => n.item), ...challenge.extras];
            const shelf = pantryList(challenge.needs, spare, 14);
            for (const need of challenge.needs) {
              const onShelf = shelf.filter((w) => w.id === need.item.id).length;
              if (onShelf < need.count) {
                throw new Error(
                  `${mission.id} (band ${band}) asks for ${need.count} ${need.item.id} but the shelf holds ${onShelf}`,
                );
              }
            }
          }
        }
      }
    }
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

/* ------------------------------------------------------------------ */
/* The five calls that filled in the rest of the town                   */
/* ------------------------------------------------------------------ */

describe('the five newest calls', () => {
  it('puts one in each corner of the map that had no story of its own', () => {
    const places = NEW_CALLS.map((id) => missionById(id)?.location);
    expect(places).toEqual(['apartments', 'garden', 'station', 'construction', 'beach']);
    // …and every LocationId the town draws now has at least one call
    const covered = new Set(missions.map((m) => m.location));
    for (const place of ['apartments', 'garden', 'station', 'construction', 'beach']) {
      expect(covered.has(place as MissionDef['location'])).toBe(true);
    }
  });

  it('gives every one of them a band-restricted swap covering all three bands', () => {
    for (const id of NEW_CALLS) {
      const swaps = (missionById(id)?.beats ?? []).filter((b) => b.type === 'minigame' && b.bands);
      expect(swaps.length).toBeGreaterThanOrEqual(1);
      const covered = new Set(swaps.flatMap((b) => (b.type === 'minigame' ? (b.bands ?? []) : [])));
      expect([...covered].sort()).toEqual(['A', 'B', 'C']);
    }
  });

  it('opens them all inside five rounds without lengthening the queue', () => {
    const requires = NEW_CALLS.map((id) => missionById(id)?.requires ?? []);
    for (const list of requires) expect(list.length).toBeLessThanOrEqual(2);
    // none of them gates another new call, so they never stack up behind each other
    for (const list of requires) for (const need of list) expect(NEW_CALLS).not.toContain(need);
  });

  it('carries the boxes up to apartment 3B, sorted by room', () => {
    const sort = beatFor('moving-day', 'gear-sort').challenge({ ageBand: 'B', rng: createRng(3) });
    if (sort.kind !== 'gear-sort') throw new Error('expected a gear-sort');
    expect(sort.bins.map((b) => b.id)).toEqual(['kitchen', 'bedroom', 'books']);
    expect(sort.bins.every((b) => (b.labelEs ?? '').length > 0)).toBe(true);
    for (const bin of sort.bins) expect(sort.items.some((i) => i.bin === bin.id)).toBe(true);
    // every box shows a different picture, so no two are the same puzzle
    const icons = sort.items.map((i) => i.icon ?? i.equipment);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('waters the garden, reads a planting pattern and cooks what it picks', () => {
    const garden = missionById('garden-grow-day');
    const kitchen = garden?.beats.find((b) => b.type === 'kitchen');
    expect(kitchen?.type === 'kitchen' && kitchen.recipe).toBe('garden-pizza');
    for (const band of BANDS) {
      const pattern = beatFor('garden-grow-day', 'spray-pattern').challenge({ ageBand: band, rng: createRng(17) });
      if (pattern.kind !== 'spray-pattern') throw new Error('expected a spray-pattern');
      expect(pattern.sequence[pattern.sequence.length - 1]).toBe(pattern.answer);
      const bunny = beatFor('garden-grow-day', 'rescue-pets').challenge({ ageBand: band, rng: createRng(17) });
      if (bunny.kind !== 'rescue-pets') throw new Error('expected rescue-pets');
      expect(bunny.animal).toBe('bunny');
    }
  });

  it('counts the carrots in Spanish, in a sentence that says the same number', () => {
    for (const band of ['B', 'C'] as const) {
      const counted = beatFor('garden-grow-day', 'listen-count').challenge({ ageBand: band, rng: createRng(21) });
      if (counted.kind !== 'listen-count') throw new Error('expected listen-count');
      expect(counted.item.id).toBe('carrot');
      expect(counted.phraseEs).toContain(counted.count === 1 ? 'una zanahoria' : 'zanahorias');
      expect(counted.phraseEs).not.toContain('undefined');
    }
  });

  it('rings off the wet concrete before it raises the tower', () => {
    const beats = (missionById('playground-build')?.beats ?? []).filter((b) => b.type === 'minigame');
    const order = beats.map((b) => (b.type === 'minigame' ? b.game : ''));
    expect(order.indexOf('build-barrier')).toBeLessThan(order.indexOf('shape-builder'));
    for (const band of BANDS) {
      const ring = beatFor('playground-build', 'build-barrier').challenge({ ageBand: band, rng: createRng(23) });
      if (ring.kind !== 'build-barrier') throw new Error('expected build-barrier');
      expect(ring.solutions.length).toBeGreaterThan(0);
      for (const solution of ring.solutions) {
        expect(solution.reduce((a, b) => a + b, 0)).toBe(ring.target);
      }
    }
  });

  it('reads the tide off the clock before it clears the bay', () => {
    for (const band of BANDS) {
      const tide = beatFor('beach-day', 'clock-watch').challenge({ ageBand: band, rng: createRng(29) });
      if (tide.kind !== 'clock-watch') throw new Error('expected clock-watch');
      expect(tide.event).toContain('tide');
      const delta = (tide.target.h * 60 + tide.target.m) - (tide.start.h * 60 + tide.start.m);
      expect(delta).toBeGreaterThan(0);
      expect(delta % tide.step).toBe(0);
    }
    const turtle = beatFor('beach-day', 'rescue-pets').challenge({ ageBand: 'A', rng: createRng(29) });
    if (turtle.kind !== 'rescue-pets') throw new Error('expected rescue-pets');
    expect(turtle.animal).toBe('turtle');
    const kitchen = missionById('beach-day')?.beats.find((b) => b.type === 'kitchen');
    expect(kitchen?.type === 'kitchen' && kitchen.recipe).toBe('paletas');
  });

  it('labels the open-day kit with words the icon sheet really draws', () => {
    const expected: Record<AgeBand, { id: string; lang: 'en' | 'es'; letters: string }> = {
      A: { id: 'hose', lang: 'en', letters: 'HOSE' },
      B: { id: 'ladder', lang: 'en', letters: 'LADDER' },
      C: { id: 'helmet', lang: 'es', letters: 'CASCO' },
    };
    for (const band of BANDS) {
      const spelled = beatFor('station-open-day', 'word-builder').challenge({ ageBand: band, rng: createRng(31) });
      if (spelled.kind !== 'word-builder') throw new Error('expected word-builder');
      const want = expected[band];
      expect(spelled.word.id).toBe(want.id);
      expect(spelled.lang).toBe(want.lang);
      expect(spelled.letters.join('')).toBe(want.letters);
      for (const letter of spelled.letters.slice(spelled.prefilled)) expect(spelled.tiles).toContain(letter);
    }
  });

  it('walks the class to the station and back, never leaving them anywhere', () => {
    const travels = (missionById('station-open-day')?.beats ?? []).filter((b) => b.type === 'travel');
    expect(travels.map((b) => (b.type === 'travel' ? `${b.from}→${b.to}` : ''))).toEqual([
      'station→school',
      'school→station',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* The twelve second calls that doubled the town                        */
/* ------------------------------------------------------------------ */

describe('the second calls', () => {
  it('all exist, and each stands beside a call that was already there', () => {
    for (const { id, beside } of SECOND_CALLS) {
      const mission = missionById(id);
      const older = missionById(beside);
      expect(mission).toBeDefined();
      expect(older).toBeDefined();
      expect(mission?.location).toBe(older?.location);
    }
  });

  it('is a different story, not the same one renumbered', () => {
    for (const { id, beside } of SECOND_CALLS) {
      const mission = missionById(id) as MissionDef;
      const older = missionById(beside) as MissionDef;
      expect(mission.tagline).not.toBe(older.tagline);
      expect(mission.brief).not.toBe(older.brief);
      expect(mission.badge).not.toBe(older.badge);
      /* at least one mini-game the older call never plays */
      const fresh = [...gamesOf(mission)].filter((k) => !gamesOf(older).has(k));
      expect(fresh.length).toBeGreaterThan(0);
    }
  });

  it('gives every one of them a band-restricted swap covering all three bands', () => {
    for (const { id } of SECOND_CALLS) {
      const swaps = (missionById(id)?.beats ?? []).filter((b) => b.type === 'minigame' && b.bands);
      expect(swaps.length).toBeGreaterThanOrEqual(1);
      const covered = new Set(swaps.flatMap((b) => (b.type === 'minigame' ? (b.bands ?? []) : [])));
      expect([...covered].sort()).toEqual(['A', 'B', 'C']);
    }
  });

  it('never gates another second call, so the town still opens in five rounds', () => {
    const ids = new Set(SECOND_CALLS.map((c) => c.id));
    for (const { id } of SECOND_CALLS) {
      const requires = missionById(id)?.requires ?? [];
      expect(requires.length).toBeGreaterThan(0); // never open on day one
      expect(requires.length).toBeLessThanOrEqual(2);
      for (const need of requires) expect(ids.has(need)).toBe(false);
    }
  });

  /*
   * THE HOLE THE TOWN USED TO HAVE.
   *
   * Before these twelve calls, `divide-share`, `recipe-scale` and
   * `pizza-fractions` were Kitchen-only: a child could play every mission in
   * Spark City and never once be asked to share something out equally or to
   * grow a recipe. Division and equivalent fractions were the only two skills
   * in `challengeSkills` that no mission beat reached, at any band.
   */
  it('brings division, scaling and fractions out of the Kitchen and into the town', () => {
    const played = new Map<ChallengeKind, string[]>();
    for (const mission of missions) {
      for (const beat of mission.beats) {
        if (beat.type === 'minigame') played.set(beat.game, [...(played.get(beat.game) ?? []), mission.id]);
      }
    }
    expect((played.get('divide-share') ?? []).length).toBeGreaterThanOrEqual(3);
    expect((played.get('recipe-scale') ?? []).length).toBeGreaterThanOrEqual(1);
    expect((played.get('pizza-fractions') ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it('reaches every skill the games can teach, for every band', () => {
    const everySkill = new Set(Object.values(challengeSkills).flat());
    for (const band of BANDS) {
      const reached = new Set<string>();
      for (const mission of missions) {
        for (const beat of beatsForBand(mission, band)) {
          if (beat.type !== 'minigame') continue;
          for (const skill of challengeSkills[beat.game]) reached.add(skill);
        }
      }
      /* `estimation` has no game at all yet — see docs/CURRICULUM.md §2. */
      const missing = [...everySkill].filter((s) => s !== 'estimation' && !reached.has(s));
      expect(missing).toEqual([]);
    }
  });

  it('shares out an amount that really divides, in every band of every sharing beat', () => {
    for (const mission of missions) {
      for (const band of BANDS) {
        for (const beat of beatsForBand(mission, band)) {
          if (beat.type !== 'minigame' || beat.game !== 'divide-share') continue;
          const challenge = beat.challenge({ ageBand: band, rng: createRng(77), scene: mission.scene });
          if (challenge.kind !== 'divide-share') throw new Error('expected divide-share');
          expect(challenge.total).toBe(challenge.among * challenge.each);
          expect(challenge.among).toBeGreaterThanOrEqual(2);
          expect(Number.isInteger(challenge.each)).toBe(true);
        }
      }
    }
  });

  it('counts the storm shelter blankets out in whole families', () => {
    const beat = beatFor('snow-day-shift', 'divide-share');
    const expected: Record<AgeBand, [number, number, number]> = { A: [8, 2, 4], B: [12, 4, 3], C: [24, 6, 4] };
    for (const band of BANDS) {
      const share = beat.challenge({ ageBand: band, rng: createRng(3) });
      if (share.kind !== 'divide-share') throw new Error('expected divide-share');
      expect([share.total, share.among, share.each]).toEqual(expected[band]);
      expect(share.item.id).toBe('blanket');
    }
    /* the shelter never leaves the station, so it has no travel beat at all */
    expect(missionById('snow-day-shift')?.beats.some((b) => b.type === 'travel')).toBe(false);
  });

  it('grows the birthday recipe for every band, and always by whole amounts', () => {
    const beat = beatFor('bakery-birthday', 'recipe-scale');
    for (const band of BANDS) {
      const grown = beat.challenge({ ageBand: band, rng: createRng(5) });
      if (grown.kind !== 'recipe-scale') throw new Error('expected recipe-scale');
      expect(grown.eating).toBeGreaterThan(grown.serves);
      for (const line of grown.lines) {
        expect(Number.isInteger(line.scaled)).toBe(true);
        expect(line.scaled * grown.serves).toBe(line.amount * grown.eating);
      }
    }
  });

  it('cuts the blackout pizzas into eighths for the oldest crew only', () => {
    const beat = beatFor('pizzeria-blackout', 'pizza-fractions');
    const dens = BANDS.map((band) => {
      const pie = beat.challenge({ ageBand: band, rng: createRng(9) });
      if (pie.kind !== 'pizza-fractions') throw new Error('expected pizza-fractions');
      /* every topping lands on whole slices and the pie is exactly covered */
      for (const topping of pie.toppings) {
        expect(Number.isInteger((topping.fraction.num * pie.cutInto) / topping.fraction.den)).toBe(true);
      }
      expect(pie.each).toBe(pie.cutInto / pie.shareAmong);
      return Math.max(...pie.toppings.map((t) => t.fraction.den));
    });
    expect(dens).toEqual([2, 4, 8]);
  });

  it('reads the alarm round as a times table a child can walk along', () => {
    const beat = beatFor('apartment-alarm-check', 'hydrant-match');
    const answers = BANDS.map((band) => {
      const tag = beat.challenge({ ageBand: band, rng: createRng(13) });
      if (tag.kind !== 'hydrant-match') throw new Error('expected hydrant-match');
      expect(tag.options.filter((o) => o === tag.correct)).toHaveLength(1);
      return tag.correct;
    });
    expect(answers).toEqual([6, 24, 72]);
  });

  it('names the harbour lanes and Carmen’s streets, one per row', () => {
    for (const id of ['harbour-boat-rescue', 'market-delivery-run']) {
      const beat = beatFor(id, 'rescue-route');
      for (const band of BANDS) {
        const route = beat.challenge({ ageBand: band, rng: createRng(17) });
        if (route.kind !== 'rescue-route') throw new Error('expected rescue-route');
        expect(route.streetNames?.length).toBe(route.grid.rows);
        for (const street of route.streetNames ?? []) expect(street.name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('runs the lantern parade in Spanish for the youngest crew', () => {
    const beat = beatFor('festival-lantern-parade', 'vocab-tap');
    const tap = beat.challenge({ ageBand: 'A', rng: createRng(19) });
    if (tap.kind !== 'vocab-tap') throw new Error('expected vocab-tap');
    expect(tap.promptLang).toBe('es');
    expect(tap.options.filter((o) => o.id === tap.word.id)).toHaveLength(1);
  });

  it('pulls every word-tap board off one shelf, so no two pictures repeat', () => {
    for (const { id } of SECOND_CALLS) {
      const mission = missionById(id) as MissionDef;
      const beats = mission.beats.filter((b) => b.type === 'minigame' && b.game === 'vocab-tap');
      for (const beat of beats) {
        if (beat.type !== 'minigame') continue;
        for (const band of BANDS) {
          for (const seed of SEEDS) {
            const tap = beat.challenge({ ageBand: band, rng: createRng(seed), scene: mission.scene });
            if (tap.kind !== 'vocab-tap') throw new Error('expected vocab-tap');
            const icons = tap.options.map((o) => o.icon);
            expect(new Set(icons).size).toBe(icons.length);
          }
        }
      }
    }
  });
});

import { createActor } from 'xstate';
import { beatsForBand, currentBeat, currentLines, missionMachine, missionStars } from '../missionMachine';
import type { MissionDef } from '@/content/types';
import type { MiniGameResult } from '@/minigames/types';

const result = (stars: 1 | 2 | 3): MiniGameResult => ({
  kind: 'hose-hero',
  success: true,
  attempts: 1,
  hintsUsed: 0,
  durationMs: 1000,
  stars,
  skills: ['counting'],
});

const mission: MissionDef = {
  id: 'test',
  title: 'Test Mission',
  tagline: 't',
  brief: 'b',
  location: 'bakery',
  scene: 'bakery',
  address: '1 Test St',
  subjects: ['math'],
  minutes: 3,
  badge: 'first-shift',
  xp: 40,
  sparks: 10,
  beats: [
    { type: 'dialogue', lines: [{ speaker: 'bea', text: 'Hi' }, { speaker: 'beacon', text: 'Beep' }] },
    { type: 'travel', from: 'station', to: 'bakery' },
    {
      type: 'minigame',
      game: 'hose-hero',
      challenge: () => ({ kind: 'hose-hero', scene: 'bakery', totalFlames: 6, alreadyOut: 0, grid: { rows: 2, cols: 3 }, flameSlots: [0, 1, 2, 3, 4, 5] }),
      intro: [{ speaker: 'beacon', text: 'Spray!' }],
      outro: [{ speaker: 'npc', npcName: 'Rosa', text: '¡Gracias!', es: '¡Gracias!' }],
    },
    {
      type: 'minigame',
      game: 'water-tank',
      bands: ['C'],
      challenge: () => ({ kind: 'water-tank', target: { num: 3, den: 4 }, ticks: 4, pumpStep: { num: 1, den: 4 }, allowOverflow: false }),
    },
    { type: 'recap' },
  ],
};

describe('missionMachine', () => {
  it('walks brief → dialogue → travel → minigame(intro/play/outro) → recap → complete → reward → done', () => {
    const actor = createActor(missionMachine, { input: { mission, ageBand: 'B' } }).start();
    expect(actor.getSnapshot().value).toBe('idle');
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('brief');
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('dialogue');
    expect(currentLines(actor.getSnapshot().context)).toHaveLength(2);
    actor.send({ type: 'NEXT' }); // second line
    expect(actor.getSnapshot().context.lineIndex).toBe(1);
    actor.send({ type: 'NEXT' }); // → travel
    expect(actor.getSnapshot().value).toBe('travel');
    actor.send({ type: 'NEXT' }); // → minigame intro
    expect(actor.getSnapshot().value).toBe('minigameIntro');
    expect(currentLines(actor.getSnapshot().context)[0]?.text).toBe('Spray!');
    actor.send({ type: 'NEXT' }); // → play
    expect(actor.getSnapshot().value).toBe('minigame');
    expect(currentBeat(actor.getSnapshot().context)?.type).toBe('minigame');
    actor.send({ type: 'MINIGAME_DONE', result: result(3) });
    expect(actor.getSnapshot().value).toBe('minigameOutro');
    actor.send({ type: 'NEXT' }); // band B skips the band-C water tank → recap
    expect(actor.getSnapshot().value).toBe('recap');
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('complete');
    expect(actor.getSnapshot().context.finishedAt).not.toBeNull();
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('reward');
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().status).toBe('done');
    expect(actor.getSnapshot().context.results).toHaveLength(1);
  });

  it('includes band-gated beats for the right band', () => {
    expect(beatsForBand(mission, 'B')).toHaveLength(4);
    expect(beatsForBand(mission, 'C')).toHaveLength(5);
  });

  it('QUIT is always available', () => {
    const actor = createActor(missionMachine, { input: { mission, ageBand: 'A' } }).start();
    actor.send({ type: 'START' });
    actor.send({ type: 'QUIT' });
    expect(actor.getSnapshot().value).toBe('quit');
  });

  it('missionStars averages and never drops below 1', () => {
    expect(missionStars([])).toBe(3);
    expect(missionStars([result(3), result(3)])).toBe(3);
    expect(missionStars([result(3), result(1)])).toBe(2);
    expect(missionStars([result(1)])).toBe(1);
  });
});

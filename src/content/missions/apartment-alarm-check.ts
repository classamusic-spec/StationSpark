import type { AgeBand } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  generateEquipmentCheck,
  generateHoseHero,
  generateNumberLadder,
  hoseHeroWithFlames,
  hydrantMatchFor,
  listenCountFor,
  vocabTapOnShelf,
} from '@/learning/generators';
import { bea, inScene, npc, radio, rookie } from './parts';

const DELGADO = 'Sr. Delgado';

/**
 * The building as a times table. Six floors, four flats on each — the array a
 * child can literally see out of the truck window, which is the friendliest
 * multiplication there is.
 */
const building: Record<AgeBand, { label: string; correct: number }> = {
  A: { label: '3 + 3', correct: 6 },
  B: { label: '6 × 4', correct: 24 },
  C: { label: '6 × 12', correct: 72 },
};

/**
 * ALARM CHECK ON MAPLE COURT — the annual, unglamorous one.
 *
 * `moving-day` is a removal van and a lift that will not close. This is the
 * job the crew does every autumn whether anything is wrong or not: knock on
 * every door in the block, press every alarm button, change every flat battery.
 *
 * The mission is a multiplication built out of a building. Six floors with four
 * flats on each is 24 doors, and the child meets that number as an *array*
 * before it is ever written down — then climbs it a floor at a time on the
 * number ladder. One flat has a pan smoking on the hob, which is the only
 * excitement of the afternoon and stays firmly in the pan.
 */
export const apartmentAlarmCheck: MissionDef = {
  id: 'apartment-alarm-check',
  title: 'Alarm Check on Maple Court',
  titleEs: 'Revisión de alarmas en Maple Court',
  tagline: 'Six floors, four flats on each. Every button gets pressed.',
  brief:
    'It is the autumn alarm check at Maple Court. Work out how many doors that is, climb floor by floor, change the flat batteries — and deal with one very smoky pan on the third floor.',
  location: 'apartments',
  scene: 'apartments',
  address: 'Maple Court, 6 Maple Street',
  npcName: DELGADO,
  subjects: ['math', 'logic', 'reading', 'spanish'],
  minutes: 13,
  badge: 'ladder-legend',
  xp: 44,
  sparks: 13,
  requires: ['moving-day'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Autumn alarm check today. Maple Court, top to bottom.'),
        rookie('Every single flat?', 'surprised'),
        bea('Every single one. Work out how many first.'),
      ],
    },
    {
      /* The building as an array: floors across, flats down. */
      type: 'minigame',
      game: 'hydrant-match',
      challenge: (ctx) => hydrantMatchFor(building[ctx.ageBand], ctx),
      intro: [bea('Six floors. Four doors on each. How many?')],
      outro: [rookie('That is a lot of buttons. Let us go.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => ({
        ...generateEquipmentCheck(ctx),
        items: [
          { id: 'flashlight' as const, need: ctx.ageBand === 'A' ? 2 : 3, alreadyPacked: ctx.ageBand === 'A' ? 0 : 1 },
          { id: 'ladder' as const, need: 2, alreadyPacked: 1 },
          { id: 'first-aid' as const, need: ctx.ageBand === 'C' ? 4 : 2, alreadyPacked: 1 },
        ],
        decoys: ['axe' as const, 'rope' as const],
      }),
      intro: [bea('Torches, step ladders, spare batteries. Pack them.')],
      outro: [bea('Nothing heavy. We are climbing six floors.')],
    },
    { type: 'travel', from: 'station', to: 'apartments' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'apartments',
      lines: [
        npc(DELGADO, 'Buenos días. I am the caretaker. The lift is slow.', 'Buenos días. Soy el conserje. El elevador va lento.', 'calm'),
        bea('Then we walk. Floor by floor, nobody skipped.'),
        radio('Conserje means caretaker. He knows every door.', 'Conserje.'),
      ],
    },
    {
      type: 'minigame',
      game: 'number-ladder',
      challenge: (ctx) => generateNumberLadder(ctx),
      intro: [bea('Climb to the floor on the clipboard. Hop up.')],
      outro: [rookie('Right floor, right door. Ticked off.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('station-kit', ctx),
      intro: [npc(DELGADO, 'Tap the tool I ask for. In Spanish!', 'Toca la herramienta que pido. ¡En español!', 'happy')],
      outro: [radio('Kit words saved to your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('flashlight', ctx),
      intro: [npc(DELGADO, 'Cuenta conmigo. How many linternas do we still need?', 'Cuenta conmigo. ¿Cuántas linternas faltan?', 'happy')],
      outro: [bea('Counted in Spanish, on the fourth landing.', 'proud')],
    },
    {
      /*
       * Third floor, one pan. Small, contained, and out in a moment — the whole
       * point is that the alarm the crew just tested is what caught it.
       */
      type: 'minigame',
      game: 'hose-hero',
      challenge: (ctx) => {
        const base = generateHoseHero(inScene(ctx, 'apartments'));
        const flames = ctx.ageBand === 'A' ? 3 : ctx.ageBand === 'B' ? 5 : 6;
        return hoseHeroWithFlames(base, flames, { rows: 2, cols: 3 });
      },
      intro: [npc(DELGADO, '¡El sartén! Third floor. Her alarm worked!', '¡El sartén! Tercer piso. ¡Su alarma sí funcionó!', 'worried')],
      outro: [bea('Out in seconds, because the alarm did its job.', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'apartments',
      lines: [
        radio('Every flat checked, every battery new, one pan out.'),
        bea('Boring is the goal, Rookie. Today was almost boring.', 'happy'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(DELGADO, 'Gracias. Nobody ever checks the top floor. You did.', 'Gracias. Nadie revisa el último piso. Ustedes sí.', 'proud'),
        bea('Gracias means thank you. Every floor counts.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};

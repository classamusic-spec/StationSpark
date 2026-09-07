import type { ChallengeOf, EquipmentId } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  gearSortWithBins,
  generateRescueRoute,
  listenCountFor,
  truckRunFor,
  vocabTapOnShelf,
} from '@/learning/generators';
import { bea, inScene, npc, radio, rookie } from './parts';

const CARMEN = 'Abuela Carmen';

type GearSort = ChallengeOf<'gear-sort'>;

/** The three streets on Carmen's round, and what is going to each. */
const rounds: GearSort['bins'] = [
  { id: 'maple', label: 'Maple Street', labelEs: 'Calle Maple', color: '#8FD16B' },
  { id: 'quill', label: 'Quill Street', labelEs: 'Calle Quill', color: '#7C6BE8' },
  { id: 'harbour', label: 'Harbour Road', labelEs: 'Camino del Puerto', color: '#4FA3F7' },
];

/**
 * Every crate is drawn by its `equipment` id, so no two crates on this board
 * share one — that is what makes "which crate did she mean?" a fair question.
 */
const crates: GearSort['items'] = [
  { id: 'c1', bin: 'maple', equipment: 'bucket' as EquipmentId, label: 'Crate of tomatoes', labelEs: 'Caja de tomates', icon: 'tomato' },
  { id: 'c2', bin: 'maple', equipment: 'rope' as EquipmentId, label: 'Sack of onions', labelEs: 'Costal de cebollas', icon: 'onion' },
  { id: 'c3', bin: 'quill', equipment: 'first-aid' as EquipmentId, label: 'Box of eggs', labelEs: 'Caja de huevos', icon: 'egg' },
  { id: 'c4', bin: 'quill', equipment: 'helmet' as EquipmentId, label: 'Basket of limes', labelEs: 'Canasta de limones', icon: 'lemon' },
  { id: 'c5', bin: 'harbour', equipment: 'extinguisher' as EquipmentId, label: 'Jug of juice', labelEs: 'Jarra de jugo', icon: 'juice' },
  { id: 'c6', bin: 'harbour', equipment: 'flashlight' as EquipmentId, label: 'Bag of corn', labelEs: 'Bolsa de elotes', icon: 'corn' },
];

/** The streets the crew drives past on the round. */
const roundStreets = ['Market Row', 'Maple Street', 'Quill Street', 'Harbour Road', 'Ember Street', 'Willow Lane'];

/**
 * CARMEN'S VAN — the round that has to be planned before it is driven.
 *
 * `market-morning` is about what is *on* the stall. This is about getting it
 * off the stall and across town: Carmen's little van has died with a full load
 * and three streets waiting, so the engine does her round instead.
 *
 * It is the only mission in Spark City whose subject is the JOURNEY. Everything
 * else drives to one address and works there; here the route itself is the
 * puzzle — sort the load by street, choose between two roads, and then actually
 * drive it, reading a gate at speed.
 */
export const marketDeliveryRun: MissionDef = {
  id: 'market-delivery-run',
  title: "Carmen's Van",
  titleEs: 'La camioneta de Carmen',
  tagline: 'A full load, three streets, and a van that will not start.',
  brief:
    "Abuela Carmen's van has given up with the whole morning's orders still inside. Split the load by street, pick the shorter road, and drive her round before the tomatoes go soft.",
  location: 'market',
  scene: 'market',
  address: 'Stall 6, Market Row',
  npcName: CARMEN,
  subjects: ['math', 'reading', 'logic', 'spanish'],
  minutes: 13,
  badge: 'map-master',
  xp: 46,
  sparks: 15,
  requires: ['market-morning'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        radio('Carmen on the radio. Her van will not start.'),
        rookie('Is anyone hurt?', 'worried'),
        bea('Only the tomatoes. Take the engine, we deliver.', 'happy'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('address', ctx),
      intro: [radio('She gave a number. Which stall is hers?')],
      outro: [bea('Stall six. The one under the green awning.')],
    },
    { type: 'travel', from: 'station', to: 'market' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'market',
      lines: [
        npc(CARMEN, '¡Mi camioneta! Full of boxes and it will not move.', '¡Mi camioneta! Llena de cajas y no arranca.', 'worried'),
        bea('Then the boxes ride with us. Load them by street.', 'calm'),
        radio('Camioneta means little truck.', 'Camioneta.'),
      ],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: () => gearSortWithBins(rounds, crates),
      intro: [bea('Read each label. Which street is it going to?')],
      outro: [npc(CARMEN, '¡Qué orden! Better than I ever load it.', '¡Qué orden! Mejor de lo que yo la cargo.', 'excited')],
    },
    {
      /*
       * Two roads to the same door and a child choosing between them. The
       * street names matter: this is the only place in the town where reading
       * a direction and reading a *word* are the same move.
       */
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => {
        const route = generateRescueRoute(inScene(ctx, 'market'));
        const shortLen = Math.max(2, route.maxCommands - 2);
        return {
          ...route,
          streetNames: Array.from({ length: route.grid.rows }, (_, row) => ({
            row,
            name: roundStreets[row % roundStreets.length] ?? 'Market Row',
          })),
          compareRoutes: { a: shortLen, b: shortLen + 2, shorter: 'a' as const },
        };
      },
      intro: [radio('Two roads to Maple Street. Which is shorter?')],
      outro: [bea('Shorter road, softer tomatoes. Well chosen.')],
    },
    {
      type: 'minigame',
      game: 'truck-run',
      challenge: (ctx) => truckRunFor(['count-on', 'sight-word', 'times-divide'], inScene(ctx, 'market')),
      intro: [radio('Now drive it. Read every gate on the way!')],
      outro: [rookie('Three streets, no stops. The engine loved it.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('market-stall', ctx),
      intro: [npc(CARMEN, 'Tap what I ask for. Say it in Spanish!', 'Toca lo que pido. ¡Dilo en español!', 'happy')],
      outro: [radio('Market words saved to your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('tomato', ctx),
      intro: [npc(CARMEN, 'Cuenta conmigo. How many tomates for Maple Street?', 'Cuenta conmigo. ¿Cuántos tomates van a Maple?', 'happy')],
      outro: [bea('Counted in Spanish, from the back of a truck.', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'market',
      lines: [
        radio('Three streets delivered. Nothing bruised, nothing late.'),
        bea('A round is just a plan you drive. Nicely done.', 'proud'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(CARMEN, '¡Gracias, mi equipo! Take a melon for the station.', '¡Gracias, mi equipo! Llévense un melón para la estación.', 'excited'),
        bea('Gracias means thank you. Take the melon, Rookie.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};

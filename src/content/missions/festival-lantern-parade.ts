import type { AgeBand } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  generateShapeBuilder,
  generateSprayPattern,
  generateWaterTank,
  hydrantMatchFor,
  listenCountFor,
  vocabTapOnShelf,
} from '@/learning/generators';
import { bea, npc, radio, rookie } from './parts';

const SOFIA = 'Capitana Sofía';

/** How many lanterns hang on the floats, read off the parade sheet. */
const lanterns: Record<AgeBand, { label: string; correct: number }> = {
  A: { label: '5 + 5', correct: 10 },
  B: { label: '7 × 5', correct: 35 },
  C: { label: '84 ÷ 7', correct: 12 },
};

/**
 * THE LANTERN PARADE — the festival's evening, and the town's Spanish-first
 * call after `festival-exchange`.
 *
 * The exchange is a daytime radio drill with a visiting crew. The parade is
 * what happens that night: seven floats, a river of paper lanterns, and a fire
 * crew walking the route because paper and candles need watching.
 *
 * It is a SHAPES mission dressed as a party. A float lantern is a blueprint of
 * squares and triangles, papel picado is a repeating unit strung across a
 * street, and the fountain the parade ends at has to be filled to a line. Sofía
 * speaks Spanish first throughout and Captain Bea translates one word a scene,
 * exactly the way the Exchange taught the station to work.
 */
export const festivalLanternParade: MissionDef = {
  id: 'festival-lantern-parade',
  title: 'The Lantern Parade',
  titleEs: 'El desfile de faroles',
  tagline: 'Seven floats, a street of paper lanterns, and one long walk.',
  brief:
    'The festival ends with a lantern parade after dark. Build a float lantern, string the papel picado, fill the plaza fountain and walk the whole route with the crowd — paper and candles need a fire crew nearby.',
  location: 'festival',
  scene: 'market',
  address: 'Plaza de las Luces, Festival Row',
  npcName: SOFIA,
  subjects: ['spanish', 'math', 'logic', 'teamwork'],
  minutes: 13,
  badge: 'shape-shaper',
  xp: 46,
  sparks: 15,
  requires: ['market-morning'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        radio('Sofía llama del festival. ¡Hoy es el desfile!', '¡Hoy es el desfile de faroles!'),
        bea('Desfile means parade. Tonight, after dark.', 'happy'),
        rookie('Paper lanterns and candles? We should be there.', 'think'),
      ],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      challenge: (ctx) => hydrantMatchFor(lanterns[ctx.ageBand], ctx),
      intro: [radio('Seven floats on the sheet. How many lanterns?')],
      outro: [bea('That is a lot of paper. Water tank, full.')],
    },
    { type: 'travel', from: 'station', to: 'festival' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'festival',
      lines: [
        npc(SOFIA, '¡Bienvenidos! Un farol se rompió. Can you build it?', '¡Bienvenidos! Se rompió un farol. ¿Lo pueden armar?', 'worried'),
        bea('Farol means lantern. And yes, we can.', 'calm'),
        rookie('Squares and triangles. I have done this!', 'excited'),
      ],
    },
    {
      /* A lantern is a blueprint: the shapes have to meet, or the light leaks. */
      type: 'minigame',
      game: 'shape-builder',
      challenge: (ctx) => generateShapeBuilder(ctx),
      intro: [npc(SOFIA, 'Cada pieza en su lugar. Every piece in its place.', 'Cada pieza en su lugar.', 'happy')],
      outro: [npc(SOFIA, '¡Quedó perfecto! It looks better than the others.', '¡Quedó perfecto! Se ve mejor que los demás.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'spray-pattern',
      challenge: (ctx) => generateSprayPattern(ctx),
      intro: [radio('El papel picado repite. Which flag comes next?', 'El papel picado se repite.')],
      outro: [bea('The pattern told you. Strung right across the street.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'water-tank',
      challenge: (ctx) => generateWaterTank(ctx),
      intro: [bea('Fill the plaza fountain to the line. Exactly.')],
      outro: [rookie('Full, and not a drop over the edge.', 'happy')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('music-and-parade', ctx, { promptLang: 'es' }),
      intro: [npc(SOFIA, 'Solo español ahora. Toca lo que digo.', 'Solo español ahora. Toca lo que digo.', 'happy')],
      outro: [bea('All in Spanish, first time. Well listened.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('candle', ctx),
      intro: [npc(SOFIA, 'Cuenta conmigo. ¿Cuántas velas lleva este farol?', 'Cuenta conmigo. ¿Cuántas velas lleva este farol?', 'happy')],
      outro: [bea('Vela means candle. Counted, in Spanish.', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'festival',
      lines: [
        radio('Seven floats, the whole route, nothing scorched.'),
        bea('Look at the street, Rookie. You lit that.', 'proud'),
      ],
    },
    {
      type: 'kitchen',
      recipe: 'arepas',
      intro: [bea('Sofía’s crew brought arepas. Aprons on.')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(SOFIA, '¡Muchas gracias! Next year our station hosts it.', '¡Muchas gracias! El próximo año lo hacemos en nuestra estación.', 'excited'),
        bea('Gracias means thank you. We will bring the truck.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};

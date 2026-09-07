import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateNumberLadder,
  listenCountFor,
  marketMoneyFor,
  vocabTapOnShelf,
  wordBuilderFor,
} from '@/learning/generators';
import { bea, npc, radio, rookie } from './parts';

const MAYA = 'Maya';

/**
 * BOOK SALE ON THE STEPS — the library's second call, and the town's second
 * money mission.
 *
 * `library-lights` is dark and quiet: a fuse has gone and the lamp needs
 * relighting. This is the opposite — the library is outside, loud, and selling
 * five hundred donated books to pay for a new roof. The crew is there because
 * Maya cannot run a cash box and a queue at the same time.
 *
 * Money was the thinnest thread in the whole town (two missions used
 * `market-money`, both of them food stalls). Here a child handles coins for
 * something that is not lunch, which is what makes the skill transfer.
 */
export const libraryBookSale: MissionDef = {
  id: 'library-book-sale',
  title: 'Book Sale on the Steps',
  titleEs: 'Venta de libros en la escalinata',
  tagline: 'Five hundred books, one cash box and a queue down the street.',
  brief:
    'The library is selling its donated books to pay for a new roof. Watch the money jar climb, spell the signs, work the cash box and keep the queue moving — Maya cannot do all four at once.',
  location: 'library',
  scene: 'library',
  address: '12 Quill Street',
  npcName: MAYA,
  subjects: ['reading', 'math', 'english', 'teamwork'],
  minutes: 13,
  badge: 'word-watcher',
  xp: 45,
  sparks: 14,
  requires: ['library-lights'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        radio('Maya is on the radio. The library roof leaks.'),
        rookie('Can we fix a roof?', 'think'),
        bea('No. But we can help her sell five hundred books.', 'happy'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('sentence', ctx),
      intro: [radio('Read her note. What is the money for?')],
      outro: [bea('The roof, not the books. Careful reading.')],
    },
    { type: 'travel', from: 'station', to: 'library' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'library',
      lines: [
        npc(MAYA, '¡Qué alivio! I have five hundred books and one jar.', '¡Qué alivio! Tengo quinientos libros y un frasco.', 'worried'),
        bea('Then we count. Every coin gets us closer.', 'calm'),
        radio('Alivio means relief. She looks it.', 'Alivio.'),
      ],
    },
    {
      /*
       * The roof fund on a ladder. A jar of coins climbing toward a target is
       * the friendliest picture of "how much further?" a child ever gets, and
       * it is the same addition the number ladder always taught — just with a
       * reason attached.
       */
      type: 'minigame',
      game: 'number-ladder',
      challenge: (ctx) => generateNumberLadder(ctx),
      intro: [bea('The jar is here. The roof costs that. Climb!')],
      outro: [npc(MAYA, '¡Ya casi! Almost there. Keep selling.', '¡Ya casi! Falta poquito. Sigan vendiendo.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'word-builder',
      challenge: (ctx) =>
        ctx.ageBand === 'A'
          ? wordBuilderFor('book', 'en', ctx, { prefilled: 1 })
          : ctx.ageBand === 'B'
            ? wordBuilderFor('book', 'es', ctx)
            : wordBuilderFor('library', 'en', ctx),
      intro: [bea('Every crate needs a sign. Spell it out.')],
      outro: [rookie('Big letters, so people can read it from the road.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'market-money',
      challenge: (ctx) => marketMoneyFor('book', ctx),
      intro: [npc(MAYA, 'First customer! Take her coins carefully.', '¡Primera clienta! Cobra con cuidado.', 'happy')],
      outro: [bea('Right to the last coin. The roof fund grows.')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('reading-corner', ctx),
      intro: [npc(MAYA, 'Tap the one I say. Library words!', 'Toca el que digo. ¡Palabras de biblioteca!', 'happy')],
      outro: [radio('Book, story, quiet. All in your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('book', ctx),
      intro: [npc(MAYA, 'Cuenta conmigo. How many libros in that pile?', 'Cuenta conmigo. ¿Cuántos libros hay en esa pila?', 'happy')],
      outro: [bea('Counted in Spanish, with a queue watching.', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'library',
      lines: [
        radio('Every crate sold. The roof fund is full.'),
        bea('A library that stays dry. Worth an afternoon.', 'proud'),
      ],
    },
    {
      type: 'kitchen',
      recipe: 'onigiri',
      intro: [bea('Lunch for the volunteers. Rice balls, one each.')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(MAYA, '¡Gracias! Your library card is free for a year.', '¡Gracias! Tu credencial es gratis por un año.', 'excited'),
        bea('Gracias means thank you. Take the card, Rookie.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};

import type { MissionDef } from '../types';
import type { ChallengeOf, EquipmentId } from '@/learning/types';
import {
  gearSortWithBins,
  generateCountIngredients,
  generateEquipmentCheck,
  generateListenCount,
  generateRescuePets,
  generateSprayPattern,
  generateVocabTap,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { bea, radio, inScene, npc } from './parts';

const ANA = 'Ana';
const LUIS = 'Luis';

type GearSort = ChallengeOf<'gear-sort'>;

/** Parade day: every animal's basket has to go back to the right pen. */
const paradeBins: GearSort['bins'] = [
  { id: 'dogs', label: 'Puppies', labelEs: 'Perritos', color: '#FFC72C' },
  { id: 'bunnies', label: 'Bunnies', labelEs: 'Conejos', color: '#FF7EB3' },
  { id: 'turtles', label: 'Turtles', labelEs: 'Tortugas', color: '#8FD16B' },
];

/**
 * `label` / `labelEs` / `icon` are the display truth; `equipment` is only the
 * fallback drawing, so every basket looks different on the shelf.
 */
const paradeItems: GearSort['items'] = [
  { id: 'q1', bin: 'dogs', equipment: 'rope' as EquipmentId, label: 'Puppy leash', labelEs: 'Correa', icon: 'rope' },
  { id: 'q2', bin: 'dogs', equipment: 'bucket' as EquipmentId, label: 'Milk bowl', labelEs: 'Plato de leche', icon: 'milk' },
  { id: 'q3', bin: 'bunnies', equipment: 'cone' as EquipmentId, label: 'Carrot', labelEs: 'Zanahoria', icon: 'pepper' },
  { id: 'q4', bin: 'bunnies', equipment: 'first-aid' as EquipmentId, label: 'Lettuce leaf', labelEs: 'Hoja de lechuga', icon: 'basil' },
  { id: 'q5', bin: 'turtles', equipment: 'extinguisher' as EquipmentId, label: 'Water dish', labelEs: 'Plato de agua', icon: 'water' },
  { id: 'q6', bin: 'turtles', equipment: 'flashlight' as EquipmentId, label: 'Apple slice', labelEs: 'Rebanada de manzana', icon: 'apple' },
];

/**
 * PET SHOP PARADE — counting, sorting and animal words with Ana and Luis.
 * The twins are marching the shop pets down Maple Street, but a gate swung
 * open and the baskets are muddled. Nobody is hurt; everybody is wriggly.
 */
export const petShopParade: MissionDef = {
  id: 'pet-shop-parade',
  title: 'Pet Shop Parade',
  titleEs: 'Desfile en la tienda de mascotas',
  tagline: 'The parade starts and the gate swung open!',
  brief:
    'Ana and Luis are marching the shop pets down Maple Street. A gate swung open, the baskets are muddled and six small friends want to lead. Count, sort and round everybody up.',
  location: 'pet-shop',
  scene: 'pet-shop',
  address: '6 Maple Street',
  npcName: `${ANA} & ${LUIS}`,
  subjects: ['math', 'logic', 'english', 'spanish'],
  minutes: 11,
  badge: 'pet-parade',
  xp: 45,
  sparks: 15,
  requires: ['bakery-bell'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Parade day! The twins need extra hands.', 'happy'),
        radio('One gate open, six pets loose. Pet Shop Row.'),
      ],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => ({
        ...generateEquipmentCheck(ctx),
        items:
          ctx.ageBand === 'A'
            ? [
                { id: 'rope' as EquipmentId, need: 3, alreadyPacked: 0 },
                { id: 'bucket' as EquipmentId, need: 2, alreadyPacked: 0 },
              ]
            : [
                { id: 'rope' as EquipmentId, need: 4, alreadyPacked: 1 },
                { id: 'bucket' as EquipmentId, need: 3, alreadyPacked: 0 },
                { id: 'boots' as EquipmentId, need: 2, alreadyPacked: 0 },
              ],
        decoys: ['axe', 'extinguisher'] as EquipmentId[],
      }),
      intro: [bea('Leashes and bowls. Count them out loud.')],
      outro: [radio('Every leash accounted for. Well counted.')],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: () => gearSortWithBins(paradeBins, paradeItems),
      intro: [bea('Three pens. Puppies, bunnies, turtles.')],
      outro: [radio('Sorted! Nobody eats the wrong lunch.')],
    },
    { type: 'travel', from: 'station', to: 'pet-shop' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'pet-shop',
      lines: [
        npc(ANA, '¡Rápido! The puppies think this is a game.', '¡Rápido! Los perritos creen que es un juego.', 'worried'),
        radio('Rápido means quick!', 'Rápido.'),
        bea('Slow hands, quick eyes. Go.'),
      ],
    },
    {
      type: 'minigame',
      game: 'rescue-pets',
      challenge: (ctx) => ({
        ...generateRescuePets(inScene(ctx, 'pet-shop')),
        animal: ctx.ageBand === 'A' ? ('puppy' as const) : ctx.ageBand === 'B' ? ('bunny' as const) : ('turtle' as const),
        scene: 'pet-shop' as const,
      }),
      intro: [npc(LUIS, 'Carry them gently, please. They are tiny.', 'Cárguenlos con cuidado, por favor. Son chiquitos.', 'calm')],
      outro: [bea('Everybody back in the parade line.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      challenge: (ctx) => generateListenCount(ctx),
      intro: [npc(ANA, 'Listen: how many for the front row?', 'Escucha: ¿cuántos van adelante?', 'happy')],
      outro: [radio('Counted in Spanish. ¡Muy bien!', '¡Muy bien!')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => {
        const base = generateVocabTap(ctx);
        const word = wordById('puppy');
        const pool = [wordById('bunny'), wordById('turtle'), wordById('duck')];
        return { ...base, word, options: ctx.rng.shuffle([word, ...pool.slice(0, 2)]) };
      },
      intro: [radio('Tap the animal I say. Ready?')],
      outro: [],
    },
    {
      type: 'minigame',
      game: 'count-ingredients',
      bands: ['B', 'C'],
      challenge: (ctx) => ({
        ...generateCountIngredients(ctx),
        needs:
          ctx.ageBand === 'B'
            ? [
                { item: wordById('carrot'), count: 4 },
                { item: wordById('apple'), count: 3 },
              ]
            : [
                { item: wordById('carrot'), count: 5 },
                { item: wordById('apple'), count: 4 },
                { item: wordById('lettuce'), count: 2 },
              ],
        extras: [wordById('taco'), wordById('pizza'), wordById('cake')],
        spokenEs: true,
      }),
      intro: [npc(LUIS, 'Snack baskets now. ¡En español, por favor!', 'Ahora las canastas. ¡En español, por favor!', 'happy')],
      outro: [radio('Zanahorias and manzanas, counted!', 'Zanahorias y manzanas.')],
    },
    {
      type: 'minigame',
      game: 'spray-pattern',
      challenge: (ctx) => generateSprayPattern(ctx),
      intro: [bea('Parade banner next. What comes after this?')],
      outro: [npc(ANA, '¡Perfecto! The banner looks beautiful.', '¡Perfecto! El cartel se ve hermoso.', 'excited')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'pet-shop',
      lines: [radio('Six pets, one line, zero escapes!')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(LUIS, '¡Gracias, bomberos! Mango the parrot leads the parade.', '¡Gracias, bomberos! Mango el loro va al frente.', 'proud'),
        radio('Gracias means thank you. Every tail is wagging!', 'Gracias.'),
        bea('March slowly. Mango gets excited.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};

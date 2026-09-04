import type { MissionDef } from '../types';
import type { ChallengeOf, EquipmentId } from '@/learning/types';
import {
  gearSortWithBins,
  generateCountIngredients,
  generateEquipmentCheck,
  generateListenCount,
  generateRescuePets,
  generateSignals,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { bea, beacon, inScene, npc, pepper } from './parts';

const ANA = 'Ana';
const LUIS = 'Luis';

type GearSort = ChallengeOf<'gear-sort'>;

const recycleBins: GearSort['bins'] = [
  { id: 'paper', label: 'Paper', labelEs: 'Papel', color: '#4FA3F7' },
  { id: 'plastic', label: 'Plastic', labelEs: 'Plástico', color: '#FFC72C' },
  { id: 'cans', label: 'Cans', labelEs: 'Latas', color: '#8FD16B' },
];

/**
 * Clean-up day finds. `label` / `labelEs` / `icon` are the display truth here;
 * `equipment` is only the fallback drawing, so every one of them is different.
 */
const recycleItems: GearSort['items'] = [
  { id: 'r1', bin: 'paper', equipment: 'radio' as EquipmentId, label: 'Newspaper', labelEs: 'Periódico', icon: 'library' },
  { id: 'r2', bin: 'paper', equipment: 'bucket' as EquipmentId, label: 'Milk carton', labelEs: 'Cartón de leche', icon: 'milk' },
  { id: 'r3', bin: 'plastic', equipment: 'extinguisher' as EquipmentId, label: 'Water bottle', labelEs: 'Botella de agua', icon: 'water' },
  { id: 'r4', bin: 'plastic', equipment: 'first-aid' as EquipmentId, label: 'Bread bag', labelEs: 'Bolsa de pan', icon: 'bread' },
  { id: 'r5', bin: 'cans', equipment: 'cone' as EquipmentId, label: 'Soup can', labelEs: 'Lata de sopa', icon: 'soup' },
  { id: 'r6', bin: 'cans', equipment: 'flashlight' as EquipmentId, label: 'Tomato can', labelEs: 'Lata de tomate', icon: 'tomato' },
];

const supplies = ['bucket', 'rope', 'cone'];

/**
 * COMMUNITY CLEAN-UP — problem solving and Español with the pet shop twins.
 * Band A counts supplies with the equipment list; bands B and C count them
 * in Spanish. Everyone rescues the duckling.
 */
export const communityCleanup: MissionDef = {
  id: 'community-cleanup',
  title: 'Community Clean-Up',
  titleEs: 'Limpieza en el barrio',
  tagline: "Let's make the pond sparkle!",
  brief: 'Clean-up day at the pond behind the pet shop. Ana and Luis need sorting, counting and one small feathery rescue.',
  location: 'pet-shop',
  scene: 'pet-shop',
  address: '6 Maple Street',
  npcName: `${ANA} & ${LUIS}`,
  subjects: ['logic', 'spanish', 'cooking', 'teamwork'],
  minutes: 12,
  badge: 'clean-up-crew',
  xp: 50,
  sparks: 18,
  requires: ['park-picnic', 'school-fair'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Clean-up day! The twins asked for us.', 'happy'),
        beacon('Beep! Recycling bins are all mixed up.'),
        pepper(),
      ],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: () => gearSortWithBins(recycleBins, recycleItems),
      intro: [bea('Three bins. Paper, plastic, cans.')],
      outro: [beacon('Sorted! The pond says thank you.')],
    },
    { type: 'travel', from: 'station', to: 'pet-shop' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'pet-shop',
      lines: [
        npc(ANA, "Hi! We're Ana and Luis. ¡Bienvenidos!", '¡Hola! Somos Ana y Luis. ¡Bienvenidos!', 'excited'),
        beacon('Twins! Double the helpers.'),
        bea('Supplies first. Count them out.'),
      ],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      bands: ['A'],
      challenge: (ctx) => ({
        ...generateEquipmentCheck(ctx),
        items: [
          { id: 'bucket' as EquipmentId, need: 3, alreadyPacked: 0 },
          { id: 'rope' as EquipmentId, need: 2, alreadyPacked: 0 },
        ],
        decoys: ['axe', 'extinguisher'] as EquipmentId[],
      }),
      intro: [npc(LUIS, 'Count the supplies with us, please.', 'Cuenten los materiales con nosotros, por favor.', 'happy')],
      outro: [beacon('All counted. Gloves on!')],
    },
    {
      type: 'minigame',
      game: 'count-ingredients',
      bands: ['B', 'C'],
      challenge: (ctx) => {
        const base = generateCountIngredients(ctx);
        return {
          ...base,
          needs: supplies.slice(0, ctx.ageBand === 'B' ? 2 : 3).map((id, i) => ({ item: wordById(id), count: 3 + i })),
          extras: [wordById('helmet'), wordById('radio'), wordById('boots')],
          spokenEs: true,
        };
      },
      intro: [npc(LUIS, 'Count the supplies with us. ¡En español!', 'Cuenten los materiales. ¡En español!', 'happy')],
      outro: [beacon('Counted in two languages. Beep!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      challenge: (ctx) => generateListenCount(ctx),
      intro: [npc(ANA, 'Listen: how many do we need?', 'Escucha: ¿cuántos necesitamos?', 'calm')],
      outro: [beacon('You heard every number!')],
    },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => generateSignals(ctx),
      intro: [bea('Clean-up steps. Put them in order.')],
      outro: [pepper('Woof!')],
    },
    {
      type: 'minigame',
      game: 'rescue-pets',
      challenge: (ctx) => ({ ...generateRescuePets(inScene(ctx, 'park')), animal: 'duckling' as const, scene: 'park' as const }),
      intro: [
        npc(ANA, '¡Un patito! He lost his family by the pond.', '¡Un patito! Perdió a su familia junto al estanque.', 'worried'),
        beacon('Patito means duckling!', 'Patito.'),
      ],
      outro: [npc(LUIS, '¡Gracias! Look — mamá duck is coming.', '¡Gracias! Miren, ya viene mamá pata.', 'excited')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'pet-shop',
      lines: [beacon('Pond clean. Duckling home. Beep beep!'), pepper('Woof woof!')],
    },
    {
      type: 'kitchen',
      recipe: 'tacos',
      intro: [
        npc(ANA, 'Hungry work! Tacos for everybody.', '¡Qué trabajo! Tacos para todos.', 'happy'),
        bea('The crew uses the pan and knife. Ask a grown-up at home.'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(LUIS, 'Twelve tacos, four firefighters. ¡Tres cada uno!', 'Doce tacos, cuatro bomberos. ¡Tres cada uno!', 'proud'),
        beacon('Tres means three!', 'Tres.'),
        bea('Clean pond, full crew. Perfect shift.', 'proud'),
      ],
    },
    { type: 'recap' },
  ],
};

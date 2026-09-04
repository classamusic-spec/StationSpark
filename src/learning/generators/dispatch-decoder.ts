import type { ChallengeGenerator, ChallengeOf, GeneratorContext, SceneId } from '../types';
import { numberDistractors, optionsWith } from './shared';

type Decoder = ChallengeOf<'dispatch-decoder'>;
type Mode = Decoder['mode'];

const streets = [
  { en: 'Market Street', es: 'la calle Market' },
  { en: 'Bell Avenue', es: 'la avenida Bell' },
  { en: 'Maple Street', es: 'la calle Maple' },
  { en: 'Ladder Lane', es: 'el callejón Ladder' },
  { en: 'Spark Street', es: 'la calle Spark' },
  { en: 'Garden Road', es: 'el camino Garden' },
];

const places: { label: string; labelEs: string; scene: SceneId }[] = [
  { label: 'Bakery', labelEs: 'la panadería', scene: 'bakery' },
  { label: 'Pizza Shop', labelEs: 'la pizzería', scene: 'pizza' },
  { label: 'School', labelEs: 'la escuela', scene: 'school' },
  { label: 'Library', labelEs: 'la biblioteca', scene: 'library' },
  { label: 'Park', labelEs: 'el parque', scene: 'park' },
  { label: 'Market', labelEs: 'el mercado', scene: 'market' },
  { label: 'Pet Shop', labelEs: 'la tienda de mascotas', scene: 'pet-shop' },
  { label: 'Clock Tower', labelEs: 'la torre del reloj', scene: 'clock-tower' },
];

interface SentencePuzzle {
  text: string;
  textEs: string;
  question: string;
  questionEs: string;
  correct: string;
  distractors: string[];
}

const sentences: Record<'A' | 'B' | 'C', SentencePuzzle[]> = {
  A: [
    {
      text: 'The cat is in the tree.',
      textEs: 'El gato está en el árbol.',
      question: 'Where is the cat?',
      questionEs: '¿Dónde está el gato?',
      correct: 'In the tree',
      distractors: ['In the truck', 'In the pond', 'On the bed'],
    },
    {
      text: 'The bell is on the roof.',
      textEs: 'La campana está en el techo.',
      question: 'Where is the bell?',
      questionEs: '¿Dónde está la campana?',
      correct: 'On the roof',
      distractors: ['On the truck', 'Under the step', 'In the box'],
    },
    {
      text: 'Rosa needs two buckets.',
      textEs: 'Rosa necesita dos cubetas.',
      question: 'How many buckets?',
      questionEs: '¿Cuántas cubetas?',
      correct: 'Two',
      distractors: ['One', 'Three', 'Ten'],
    },
  ],
  B: [
    {
      text: 'A kitten is stuck on the top step of the clock tower.',
      textEs: 'Un gatito está atorado en el escalón más alto de la torre del reloj.',
      question: 'Where is the kitten?',
      questionEs: '¿Dónde está el gatito?',
      correct: 'On the top step',
      distractors: ['Under the bench', 'Behind the bakery', 'Inside the truck'],
    },
    {
      text: 'The school fair starts after lunch and needs six cones.',
      textEs: 'La feria de la escuela empieza después del almuerzo y necesita seis conos.',
      question: 'What does the fair need?',
      questionEs: '¿Qué necesita la feria?',
      correct: 'Six cones',
      distractors: ['Six ladders', 'Two cones', 'Six buckets'],
    },
    {
      text: 'Gino says the oven is hot and the pizzas are late.',
      textEs: 'Gino dice que el horno está caliente y las pizzas van tarde.',
      question: 'What is the problem?',
      questionEs: '¿Cuál es el problema?',
      correct: 'The pizzas are late',
      distractors: ['The oven is cold', 'The door is stuck', 'The lights are off'],
    },
  ],
  C: [
    {
      text: 'The library roof drips whenever it rains, so Maya moved the books to the second shelf.',
      textEs: 'El techo de la biblioteca gotea cuando llueve, así que Maya movió los libros al segundo estante.',
      question: 'Why did Maya move the books?',
      questionEs: '¿Por qué movió Maya los libros?',
      correct: 'Because the roof drips',
      distractors: ['Because the shelf broke', 'Because the library closed', 'Because the books were new'],
    },
    {
      text: 'Ms. Lee needs the crew at the school gym before the fair opens at four o’clock.',
      textEs: 'La maestra Lee necesita al equipo en el gimnasio antes de que la feria abra a las cuatro.',
      question: 'When must the crew arrive?',
      questionEs: '¿Cuándo debe llegar el equipo?',
      correct: 'Before four o’clock',
      distractors: ['After the fair ends', 'At six o’clock', 'Before breakfast'],
    },
    {
      text: 'The park keeper found three ducklings by the pond and one more under the picnic table.',
      textEs: 'El guardaparques encontró tres patitos junto al estanque y uno más debajo de la mesa.',
      question: 'How many ducklings in all?',
      questionEs: '¿Cuántos patitos hay en total?',
      correct: 'Four',
      distractors: ['Three', 'Five', 'Two'],
    },
  ],
};

function addressChallenge(ctx: GeneratorContext): Decoder {
  const { rng, ageBand } = ctx;
  const street = rng.pick(streets);
  const number = ageBand === 'A' ? rng.int(2, 20) : rng.int(12, 89);
  const options = optionsWith(rng, number, numberDistractors(rng, number, 5), ageBand === 'A' ? 3 : 4, String);
  return {
    kind: 'dispatch-decoder',
    mode: 'address',
    message: `Help needed at ${number} ${street.en}. Repeat: ${number} ${street.en}.`,
    messageEs: `Necesitamos ayuda en ${street.es} ${number}. Repito: ${number}.`,
    correct: String(number),
    options: options.map(String),
  };
}

function locationChallenge(ctx: GeneratorContext): Decoder {
  const { rng, ageBand } = ctx;
  const target = ctx.scene ? (places.find((p) => p.scene === ctx.scene) ?? rng.pick(places)) : rng.pick(places);
  const options = optionsWith(rng, target, places, ageBand === 'A' ? 3 : 4, (p) => p.label);
  return {
    kind: 'dispatch-decoder',
    mode: 'location',
    message: `${target.label} calling! Which building needs the crew?`,
    messageEs: `¡${target.labelEs.charAt(0).toUpperCase()}${target.labelEs.slice(1)} llama! ¿Cuál edificio necesita ayuda?`,
    correct: target.label,
    options: options.map((p) => p.label),
    scene: target.scene,
  };
}

function sentenceChallenge(ctx: GeneratorContext): Decoder {
  const { rng, ageBand } = ctx;
  const puzzle = rng.pick(sentences[ageBand]);
  const options = optionsWith(rng, puzzle.correct, puzzle.distractors, ageBand === 'A' ? 3 : 4, (s) => s);
  return {
    kind: 'dispatch-decoder',
    mode: 'sentence',
    message: `${puzzle.text} ${puzzle.question}`,
    messageEs: `${puzzle.textEs} ${puzzle.questionEs}`,
    correct: puzzle.correct,
    options,
  };
}

/** Build a decoder in a specific mode — missions use this to pin the story. */
export function dispatchDecoderFor(mode: Mode, ctx: GeneratorContext): Decoder {
  if (mode === 'address') return addressChallenge(ctx);
  if (mode === 'location') return locationChallenge(ctx);
  return sentenceChallenge(ctx);
}

/**
 * DISPATCH DECODER — read the radio call and tap what it says.
 * A hears house numbers and single words, B and C also read sentences.
 */
export const generateDispatchDecoder: ChallengeGenerator<'dispatch-decoder'> = (ctx) => {
  const modes: Mode[] = ctx.ageBand === 'A' ? ['address', 'location'] : ['address', 'location', 'sentence'];
  return dispatchDecoderFor(ctx.rng.pick(modes), ctx);
};

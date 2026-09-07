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
  { en: 'Harbour Road', es: 'el camino Harbour' },
  { en: 'Willow Way', es: 'la vereda Willow' },
  { en: 'Station Square', es: 'la plaza Station' },
  { en: 'Baker Row', es: 'la calle Baker' },
  { en: 'Pine Street', es: 'la calle Pine' },
  { en: 'River Walk', es: 'el paseo River' },
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
  { label: 'Apartments', labelEs: 'los apartamentos', scene: 'apartments' },
  { label: 'Station Yard', labelEs: 'el patio de la estación', scene: 'station-yard' },
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
    {
      text: 'The puppy is under the bench.',
      textEs: 'El perrito está debajo de la banca.',
      question: 'Where is the puppy?',
      questionEs: '¿Dónde está el perrito?',
      correct: 'Under the bench',
      distractors: ['On the roof', 'In the pond', 'In the oven'],
    },
    {
      text: 'The garden needs three watering cans.',
      textEs: 'El jardín necesita tres regaderas.',
      question: 'What does the garden need?',
      questionEs: '¿Qué necesita el jardín?',
      correct: 'Watering cans',
      distractors: ['Ladders', 'Helmets', 'Buckets'],
    },
    {
      text: 'The boxes go up to the top floor.',
      textEs: 'Las cajas suben al piso de arriba.',
      question: 'Where do the boxes go?',
      questionEs: '¿A dónde van las cajas?',
      correct: 'Up',
      distractors: ['Down', 'Outside', 'Under'],
    },
    {
      text: 'The open day starts at the station.',
      textEs: 'El día de puertas abiertas empieza en la estación.',
      question: 'Where does it start?',
      questionEs: '¿Dónde empieza?',
      correct: 'At the station',
      distractors: ['At the beach', 'At the school', 'At the market'],
    },
    {
      text: 'Four ducklings are on the sand.',
      textEs: 'Cuatro patitos están en la arena.',
      question: 'How many ducklings?',
      questionEs: '¿Cuántos patitos?',
      correct: 'Four',
      distractors: ['Two', 'Five', 'Nine'],
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
    {
      text: 'The lift on Maple Street is broken, so the boxes go up the stairs.',
      textEs: 'El elevador de la calle Maple no sirve, así que las cajas suben por las escaleras.',
      question: 'How do the boxes get up?',
      questionEs: '¿Cómo suben las cajas?',
      correct: 'Up the stairs',
      distractors: ['In the lift', 'On the roof', 'Through the window'],
    },
    {
      text: 'The building site needs eight cones before the diggers start.',
      textEs: 'La obra necesita ocho conos antes de que empiecen las excavadoras.',
      question: 'How many cones?',
      questionEs: '¿Cuántos conos?',
      correct: 'Eight',
      distractors: ['Three', 'Eighteen', 'Eleven'],
    },
    {
      text: 'Don Nico waters the garden every morning before the sun gets high.',
      textEs: 'Don Nico riega el jardín cada mañana antes de que el sol suba.',
      question: 'When does he water?',
      questionEs: '¿Cuándo riega?',
      correct: 'In the morning',
      distractors: ['At night', 'On Sunday', 'After dinner'],
    },
    {
      text: 'A beach umbrella blew onto the pier and the seagulls will not leave it alone.',
      textEs: 'Una sombrilla voló al muelle y las gaviotas no la dejan en paz.',
      question: 'What blew onto the pier?',
      questionEs: '¿Qué voló al muelle?',
      correct: 'An umbrella',
      distractors: ['A ladder', 'A basket', 'A towel'],
    },
    {
      text: 'The open day starts after the crew washes the truck.',
      textEs: 'El día de puertas abiertas empieza después de que el equipo lava el camión.',
      question: 'What happens first?',
      questionEs: '¿Qué pasa primero?',
      correct: 'Washing the truck',
      distractors: ['The open day', 'The parade', 'Story time'],
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
    {
      text: 'The Ramírez family cannot use the lift, so every box has to be carried up four flights of stairs.',
      textEs: 'La familia Ramírez no puede usar el elevador, así que cada caja sube cuatro pisos por las escaleras.',
      question: 'Why are the boxes carried?',
      questionEs: '¿Por qué se cargan las cajas?',
      correct: 'Because the lift is out',
      distractors: ['Because the boxes are light', 'Because the stairs are new', 'Because the van is late'],
    },
    {
      text: 'Ingeniera Paz will not open the playground until the safety ring around the wet concrete is finished.',
      textEs: 'La ingeniera Paz no abrirá el parque de juegos hasta terminar el cerco de seguridad alrededor del concreto fresco.',
      question: 'What has to happen first?',
      questionEs: '¿Qué tiene que pasar primero?',
      correct: 'Finish the safety ring',
      distractors: ['Open the playground', 'Paint the slide', 'Move the diggers'],
    },
    {
      text: 'Don Nico plants the tomatoes in the sunny bed and the lettuce in the shady one, because lettuce wilts in the heat.',
      textEs: 'Don Nico siembra los tomates en la cama soleada y la lechuga en la sombreada, porque la lechuga se marchita con el calor.',
      question: 'Why is the lettuce in the shade?',
      questionEs: '¿Por qué la lechuga va en la sombra?',
      correct: 'Because heat wilts it',
      distractors: ['Because it grows taller', 'Because the bed is empty', 'Because it needs more sun'],
    },
    {
      text: 'The tide covers the low path at the bay by half past four, so the beach clean-up has to end before then.',
      textEs: 'La marea cubre el camino bajo de la bahía a las cuatro y media, así que la limpieza debe terminar antes.',
      question: 'Why must the clean-up end early?',
      questionEs: '¿Por qué debe terminar temprano la limpieza?',
      correct: 'The tide covers the path',
      distractors: ['The bus leaves at four', 'The gate is locked', 'The crew is hungry'],
    },
    {
      text: 'Every neighbour who visits the open day signs the book, and the crew counts the names at the end of the day.',
      textEs: 'Cada vecino que visita el día de puertas abiertas firma el libro, y el equipo cuenta los nombres al final.',
      question: 'What does the book count?',
      questionEs: '¿Qué cuenta el libro?',
      correct: 'The visitors',
      distractors: ['The trucks', 'The badges', 'The sandwiches'],
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

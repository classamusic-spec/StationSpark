/**
 * LOGIC & READING MINI-GAMES — merged into `@/minigames/registry`.
 *
 * These are the drag-and-drop / tap games of the Training Yard: pack the truck,
 * sort the gear, decode the radio call, code the route, connect the hose,
 * finish the pattern, set the clock, lay the hose line, order the signals and
 * the two bilingual word games. All of them live at `meta.yard: 'training'`.
 * Icon ids match the glyphs in `@/ui/kit/VocabIcon`.
 *
 * Shared drag system + pure helpers live in `./shared`.
 */
import type { Registry } from '../registry';
import { EquipmentCheck } from './EquipmentCheck/EquipmentCheck';
import { GearSort } from './GearSort/GearSort';
import { DispatchDecoder } from './DispatchDecoder/DispatchDecoder';
import { RescueRoute } from './RescueRoute/RescueRoute';
import { HydrantMatch } from './HydrantMatch/HydrantMatch';
import { SprayPattern } from './SprayPattern/SprayPattern';
import { ClockWatch } from './ClockWatch/ClockWatch';
import { HosePath } from './HosePath/HosePath';
import { Signals } from './Signals/Signals';
import { VocabTap } from './VocabTap/VocabTap';
import { ListenCount } from './ListenCount/ListenCount';

export const logicGames: Registry = {
  'equipment-check': {
    component: EquipmentCheck,
    meta: {
      kind: 'equipment-check',
      title: 'Equipment Check',
      titleEs: 'Revisa el Equipo',
      blurb: 'Drag the right gear onto the truck shelves — and work out how many more you need.',
      subjects: ['math', 'logic'],
      yard: 'training',
      seconds: 120,
      icon: 'truck',
    },
  },
  'gear-sort': {
    component: GearSort,
    meta: {
      kind: 'gear-sort',
      title: 'Gear Sort',
      titleEs: 'Ordena el Equipo',
      blurb: 'Sort the workbench by colour, shape, size or kind until every bin is right.',
      subjects: ['logic', 'math'],
      yard: 'training',
      seconds: 100,
      icon: 'bucket',
    },
  },
  'dispatch-decoder': {
    component: DispatchDecoder,
    meta: {
      kind: 'dispatch-decoder',
      title: 'Dispatch Decoder',
      titleEs: 'Descifra la Llamada',
      blurb: 'Listen to the radio call, then tap the address, the place or the missing word.',
      subjects: ['reading', 'math'],
      yard: 'training',
      seconds: 100,
      icon: 'radio',
    },
  },
  'rescue-route': {
    component: RescueRoute,
    meta: {
      kind: 'rescue-route',
      title: 'Code the Route',
      titleEs: 'Programa la Ruta',
      blurb: 'Program the truck step by step — forward, left, right — and drive it to the call.',
      subjects: ['logic', 'reading'],
      yard: 'training',
      seconds: 150,
      icon: 'right',
    },
  },
  'hydrant-match': {
    component: HydrantMatch,
    meta: {
      kind: 'hydrant-match',
      title: 'Hydrant Match',
      titleEs: 'Conecta el Hidrante',
      blurb: 'Drag the hose to the hydrant whose number matches the call.',
      subjects: ['math'],
      yard: 'training',
      seconds: 80,
      icon: 'hydrant',
    },
  },
  'spray-pattern': {
    component: SprayPattern,
    meta: {
      kind: 'spray-pattern',
      title: 'Spray Patterns',
      titleEs: 'Patrones de Agua',
      blurb: 'Read the pattern out loud and spray the target that comes next.',
      subjects: ['math', 'logic'],
      yard: 'training',
      seconds: 80,
      icon: 'water',
    },
  },
  'clock-watch': {
    component: ClockWatch,
    meta: {
      kind: 'clock-watch',
      title: 'Clock Watch',
      titleEs: 'Mira el Reloj',
      blurb: 'Turn the big hand around the station clock until it shows the right time.',
      subjects: ['math'],
      yard: 'training',
      seconds: 110,
      icon: 'sun',
    },
  },
  'hose-path': {
    component: HosePath,
    meta: {
      kind: 'hose-path',
      title: 'Hose Path',
      titleEs: 'Traza la Manguera',
      blurb: 'Lay hose pieces and turn them until the water runs from hydrant to flame.',
      subjects: ['logic', 'math'],
      yard: 'training',
      seconds: 150,
      icon: 'hose',
    },
  },
  signals: {
    component: Signals,
    meta: {
      kind: 'signals',
      title: 'Firefighter Signals',
      titleEs: 'Señales de Bomberos',
      blurb: 'Put the steps of a call in order, then watch the whole drill play out.',
      subjects: ['logic', 'teamwork'],
      yard: 'training',
      seconds: 110,
      icon: 'help',
    },
  },
  'vocab-tap': {
    component: VocabTap,
    meta: {
      kind: 'vocab-tap',
      title: 'Word Tap',
      titleEs: 'Toca la Palabra',
      blurb: 'Beacon says a word in English or Spanish — tap the picture that matches.',
      subjects: ['english', 'spanish'],
      yard: 'training',
      seconds: 70,
      icon: 'apple',
    },
  },
  'listen-count': {
    component: ListenCount,
    meta: {
      kind: 'listen-count',
      title: 'Listen & Count',
      titleEs: 'Escucha y Cuenta',
      blurb: 'Beacon asks in Spanish — count the right number of things into the crate.',
      subjects: ['spanish', 'math'],
      yard: 'training',
      seconds: 100,
      icon: 'three',
    },
  },
};

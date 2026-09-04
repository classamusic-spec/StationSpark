/**
 * TACTILE MINI-GAMES — merged into `@/minigames/registry`.
 *
 * These are the physical, Skia/gesture-driven games of the Training Yard:
 * spray a hose, pump a tank, stack a ladder, hop a number line, carry animals
 * to safety and fence off a campfire. All of them live at `meta.yard: 'training'`.
 * Icon ids match the glyphs in `@/ui/kit/VocabIcon`.
 */
import type { Registry } from '../registry';
import { HoseHero } from './HoseHero/HoseHero';
import { WaterTank } from './WaterTank/WaterTank';
import { LadderBuilder } from './LadderBuilder/LadderBuilder';
import { NumberLadder } from './NumberLadder/NumberLadder';
import { RescuePets } from './RescuePets/RescuePets';
import { BuildBarrier } from './BuildBarrier/BuildBarrier';

export const tactileGames: Registry = {
  'hose-hero': {
    component: HoseHero,
    meta: {
      kind: 'hose-hero',
      title: 'Hose Hero',
      titleEs: 'Héroe de la Manguera',
      blurb: 'Aim the hose, hold to spray, and count the flames down to zero.',
      subjects: ['math', 'teamwork'],
      yard: 'training',
      seconds: 120,
      icon: 'hose',
    },
  },
  'water-tank': {
    component: WaterTank,
    meta: {
      kind: 'water-tank',
      title: 'Water Tank',
      titleEs: 'Tanque de Agua',
      blurb: 'Pump the lever and stop the water on exactly the right line.',
      subjects: ['math'],
      yard: 'training',
      seconds: 90,
      icon: 'water',
    },
  },
  'ladder-builder': {
    component: LadderBuilder,
    meta: {
      kind: 'ladder-builder',
      title: 'Ladder Builder',
      titleEs: 'Arma la Escalera',
      blurb: 'Stack ladder pieces that add up exactly — then climb to the rescue.',
      subjects: ['math', 'logic'],
      yard: 'training',
      seconds: 110,
      icon: 'ladder',
    },
  },
  'number-ladder': {
    component: NumberLadder,
    meta: {
      kind: 'number-ladder',
      title: 'Number Ladder',
      titleEs: 'Escalera de Números',
      blurb: 'Hop up and down the number line and land right on the flag.',
      subjects: ['math'],
      yard: 'training',
      seconds: 90,
      icon: 'ladder',
    },
  },
  'rescue-pets': {
    component: RescuePets,
    meta: {
      kind: 'rescue-pets',
      title: 'Rescue Pets',
      titleEs: 'Rescata las Mascotas',
      blurb: 'Work out how many need help, then carry every one to the basket.',
      subjects: ['math', 'teamwork'],
      yard: 'training',
      seconds: 100,
      icon: 'cat',
    },
  },
  'build-barrier': {
    component: BuildBarrier,
    meta: {
      kind: 'build-barrier',
      title: 'Build the Barrier',
      titleEs: 'Construye la Barrera',
      blurb: 'Fit barrier lengths together to close a safety ring around the fire.',
      subjects: ['math', 'logic'],
      yard: 'training',
      seconds: 110,
      icon: 'cone',
    },
  },
};

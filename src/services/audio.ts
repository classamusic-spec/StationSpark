/**
 * SFX service. All game sounds go through here so mute/volume settings apply
 * everywhere and so we can pool players.
 *
 * Sound files are synthesized by `npm run sfx:build` (tools/sfx/build-sfx.mjs)
 * into assets/sfx/*.wav — the names below MUST match that manifest.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

export type SfxName =
  | 'tap' // soft UI tap
  | 'tap-soft'
  | 'pop' // tile/token appears or lands
  | 'whoosh' // screen transition / card slide
  | 'slide'
  | 'correct' // small correct chime
  | 'wrong-soft' // gentle "try again" wobble (never harsh)
  | 'success' // task complete
  | 'fanfare' // mission complete / badge
  | 'level-up'
  | 'sparkle'
  | 'confetti'
  | 'bell' // dispatch "DING DING"
  | 'radio' // radio squelch
  | 'siren' // short playful siren
  | 'horn'
  | 'engine' // loop while travelling
  | 'bump' // pothole / cone on the training road
  | 'boost' // boost pad
  | 'water-spray' // loop while spraying
  | 'splash'
  | 'steam' // flame goes out
  | 'clank' // ladder piece
  | 'drop' // drop into slot
  | 'pour' // measuring cup
  | 'sizzle'
  | 'chop'
  | 'page' // recipe card flip
  | 'stamp' // dispatch slip stamp
  | 'dog-bark'
  | 'meow'
  | 'robot-beep'
  | 'ticktock';

const sources: Record<SfxName, number> = {
  tap: require('../../assets/sfx/tap.wav'),
  'tap-soft': require('../../assets/sfx/tap-soft.wav'),
  pop: require('../../assets/sfx/pop.wav'),
  whoosh: require('../../assets/sfx/whoosh.wav'),
  slide: require('../../assets/sfx/slide.wav'),
  correct: require('../../assets/sfx/correct.wav'),
  'wrong-soft': require('../../assets/sfx/wrong-soft.wav'),
  success: require('../../assets/sfx/success.wav'),
  fanfare: require('../../assets/sfx/fanfare.wav'),
  'level-up': require('../../assets/sfx/level-up.wav'),
  sparkle: require('../../assets/sfx/sparkle.wav'),
  confetti: require('../../assets/sfx/confetti.wav'),
  bell: require('../../assets/sfx/bell.wav'),
  radio: require('../../assets/sfx/radio.wav'),
  siren: require('../../assets/sfx/siren.wav'),
  horn: require('../../assets/sfx/horn.wav'),
  engine: require('../../assets/sfx/engine.wav'),
  bump: require('../../assets/sfx/bump.wav'),
  boost: require('../../assets/sfx/boost.wav'),
  'water-spray': require('../../assets/sfx/water-spray.wav'),
  splash: require('../../assets/sfx/splash.wav'),
  steam: require('../../assets/sfx/steam.wav'),
  clank: require('../../assets/sfx/clank.wav'),
  drop: require('../../assets/sfx/drop.wav'),
  pour: require('../../assets/sfx/pour.wav'),
  sizzle: require('../../assets/sfx/sizzle.wav'),
  chop: require('../../assets/sfx/chop.wav'),
  page: require('../../assets/sfx/page.wav'),
  stamp: require('../../assets/sfx/stamp.wav'),
  'dog-bark': require('../../assets/sfx/dog-bark.wav'),
  meow: require('../../assets/sfx/meow.wav'),
  'robot-beep': require('../../assets/sfx/robot-beep.wav'),
  ticktock: require('../../assets/sfx/ticktock.wav'),
};

const LOOPS: SfxName[] = ['engine', 'water-spray', 'ticktock'];

let enabled = true;
let masterVolume = 1;
let initialized = false;
const players = new Map<SfxName, AudioPlayer>();
const loops = new Map<SfxName, AudioPlayer>();

async function init() {
  if (initialized) return;
  initialized = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
  } catch {
    /* web / tests */
  }
}

function getPlayer(name: SfxName): AudioPlayer | null {
  try {
    let p = players.get(name);
    if (!p) {
      p = createAudioPlayer(sources[name]);
      players.set(name, p);
    }
    return p;
  } catch {
    return null;
  }
}

export const sfx = {
  init,
  setEnabled(v: boolean) {
    enabled = v;
    if (!v) sfx.stopAllLoops();
  },
  isEnabled: () => enabled,
  setVolume(v: number) {
    masterVolume = Math.max(0, Math.min(1, v));
  },
  /** Fire-and-forget one-shot. Safe to call from anywhere. */
  play(name: SfxName, opts: { volume?: number; rate?: number } = {}) {
    if (!enabled) return;
    void init();
    const p = getPlayer(name);
    if (!p) return;
    try {
      p.volume = masterVolume * (opts.volume ?? 1);
      if (opts.rate && Platform.OS !== 'web') p.playbackRate = opts.rate;
      void p.seekTo(0);
      p.play();
    } catch {
      /* ignore */
    }
  },
  /** Start a looping sound (engine, spray). Idempotent. */
  startLoop(name: SfxName, volume = 0.8) {
    if (!enabled || !LOOPS.includes(name)) return;
    void init();
    if (loops.has(name)) return;
    try {
      const p = createAudioPlayer(sources[name]);
      p.loop = true;
      p.volume = masterVolume * volume;
      p.play();
      loops.set(name, p);
    } catch {
      /* ignore */
    }
  },
  stopLoop(name: SfxName) {
    const p = loops.get(name);
    if (!p) return;
    try {
      p.pause();
      p.remove();
    } catch {
      /* ignore */
    }
    loops.delete(name);
  },
  stopAllLoops() {
    for (const name of Array.from(loops.keys())) sfx.stopLoop(name);
  },
};

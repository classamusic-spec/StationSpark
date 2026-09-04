#!/usr/bin/env node
/**
 * STATION SPARK — PROCEDURAL SFX SYNTHESISER
 * ==========================================
 * Plain Node (no dependencies). `npm run sfx:build` regenerates every WAV in
 * assets/sfx/ from the recipes at the bottom of this file.
 *
 *   npm run sfx:build            regenerate everything
 *   node tools/sfx/build-sfx.mjs correct bell     regenerate just those
 *
 * House style (docs/ART_DIRECTION.md): BRIGHT, TOY-LIKE, SHORT, major key.
 * Nothing harsh, nothing buzzy, nothing that reads as "you failed". Every name
 * here must match `SfxName` in src/services/audio.ts.
 *
 * Output: 16-bit mono PCM WAV. One-shots at 44.1 kHz; loops and pure-noise beds
 * at 22.05 kHz (half the bytes, and there is nothing above 11 kHz in them worth
 * keeping). Everything is normalised to -1.5 dBFS so the mix never clips.
 *
 * Determinism: all "randomness" comes from a seeded PRNG, so a rebuild produces
 * byte-identical files. Do not hand-edit assets/sfx/*.wav.
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '..', '..', 'assets', 'sfx');

const SR = 44100; // one-shots
const SR_LOOP = 22050; // loops + noise beds
const PEAK_DBFS = -1.5; // headroom: brief says <= -1 dBFS
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/* Seeded randomness                                                    */
/* ------------------------------------------------------------------ */

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Notes                                                                */
/* ------------------------------------------------------------------ */

/** MIDI note number → Hz. 69 = A4 = 440. */
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const NOTE = {
  C3: mtof(48),
  G3: mtof(55),
  C4: mtof(60),
  D4: mtof(62),
  E4: mtof(64),
  F4: mtof(65),
  G4: mtof(67),
  A4: mtof(69),
  B4: mtof(71),
  C5: mtof(72),
  D5: mtof(74),
  E5: mtof(76),
  F5: mtof(77),
  G5: mtof(79),
  A5: mtof(81),
  B5: mtof(83),
  C6: mtof(84),
  D6: mtof(86),
  E6: mtof(88),
  F6: mtof(89),
  G6: mtof(91),
  A6: mtof(93),
  B6: mtof(95),
  C7: mtof(96),
  E7: mtof(100),
  G7: mtof(103),
};

/* ------------------------------------------------------------------ */
/* Waveshapes                                                           */
/* ------------------------------------------------------------------ */

function wave(type, phase) {
  const p = phase - Math.floor(phase);
  switch (type) {
    case 'sine':
      return Math.sin(TAU * p);
    case 'tri':
      return 1 - 4 * Math.abs(p - 0.5);
    case 'square':
      return p < 0.5 ? 1 : -1;
    case 'pulse':
      return p < 0.3 ? 1 : -1;
    case 'saw':
      return 2 * p - 1;
    default:
      return Math.sin(TAU * p);
  }
}

/* ------------------------------------------------------------------ */
/* Toolkit, bound to a sample rate                                      */
/* ------------------------------------------------------------------ */

function toolkit(sr, seed) {
  const rnd = makeRng(seed);
  const n = (sec) => Math.max(1, Math.round(sec * sr));
  const buf = (sec) => new Float32Array(n(sec));
  const val = (x, u, t) => (typeof x === 'function' ? x(u, t) : x);

  /* ---- oscillator ------------------------------------------------- */
  /**
   * osc({ type, freq, dur, amp, env, vib, vibDepth, phase })
   * `freq`, `amp` and `env` may be numbers or (u, t) => number where u is the
   * normalised position through the sound (0..1) and t is seconds.
   */
  function osc({ type = 'sine', freq = 440, dur = 0.2, amp = 1, env = null, vib = 0, vibDepth = 0, phase = 0 }) {
    const len = n(dur);
    const out = new Float32Array(len);
    let ph = phase;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const u = i / len;
      let f = val(freq, u, t);
      if (vib) f *= 1 + vibDepth * Math.sin(TAU * vib * t);
      ph += f / sr;
      const e = env ? val(env, u, t) : 1;
      out[i] = wave(type, ph) * val(amp, u, t) * e;
    }
    return out;
  }

  /** Additive voice: one call, many partials (ratios relative to `freq`). */
  function partials({ freq, dur, ratios, amps, decays, type = 'sine', amp = 1 }) {
    const len = n(dur);
    const out = new Float32Array(len);
    for (let k = 0; k < ratios.length; k++) {
      const f = freq * ratios[k];
      const a = (amps && amps[k] !== undefined ? amps[k] : 1 / (k + 1)) * amp;
      const tau = decays && decays[k] !== undefined ? decays[k] : dur * 0.35;
      let ph = rnd() * 0.02;
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        // 3 ms attack ramp kills the click, exp decay does the rest
        const e = (1 - Math.exp(-t / 0.0025)) * Math.exp(-t / tau);
        ph += f / sr;
        out[i] += wave(type, ph) * a * e;
      }
    }
    return out;
  }

  /* ---- noise ------------------------------------------------------- */
  function noise(dur, env = null) {
    const len = n(dur);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const e = env ? val(env, i / len, i / sr) : 1;
      out[i] = (rnd() * 2 - 1) * e;
    }
    return out;
  }

  /* ---- envelopes --------------------------------------------------- */
  /** Percussive: fast attack, exponential decay. */
  const perc = (tau, attack = 0.003) => (u, t) => (1 - Math.exp(-t / attack)) * Math.exp(-t / tau);
  /** Half-sine bell — smooth in and out, great for whooshes and swells. */
  const bell = (power = 1) => (u) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), power);
  /** Classic ADSR over the whole duration. */
  const adsr = (a, d, s, r, dur) => (u, t) => {
    if (t < a) return t / a;
    if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
    if (t < dur - r) return s;
    return Math.max(0, s * ((dur - t) / r));
  };
  /** Swell in, hold, swell out. */
  const swell = (inSec, outSec, dur) => (u, t) => {
    const rise = Math.min(1, t / inSec);
    const fall = Math.min(1, Math.max(0, (dur - t) / outSec));
    return rise * fall;
  };

  /* ---- filters (one-pole, cutoff may be a function of u) ----------- */
  function lowpass(x, cutoff) {
    const out = new Float32Array(x.length);
    let y = 0;
    for (let i = 0; i < x.length; i++) {
      const fc = Math.max(20, Math.min(sr * 0.45, val(cutoff, i / x.length, i / sr)));
      const a = Math.exp((-TAU * fc) / sr);
      y = (1 - a) * x[i] + a * y;
      out[i] = y;
    }
    return out;
  }

  function highpass(x, cutoff) {
    const lp = lowpass(x, cutoff);
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) out[i] = x[i] - lp[i];
    return out;
  }

  /** Two one-poles back to back = a gentle band-pass. */
  const bandpass = (x, lo, hi) => highpass(lowpass(x, hi), lo);

  /** Resonant-ish peak: a 2-pole state-variable band-pass, for formants. */
  function formant(x, freq, q = 6) {
    const out = new Float32Array(x.length);
    let low = 0;
    let band = 0;
    for (let i = 0; i < x.length; i++) {
      const f = 2 * Math.sin((Math.PI * Math.min(val(freq, i / x.length, i / sr), sr * 0.4)) / sr);
      const qq = 1 / q;
      const high = x[i] - low - qq * band;
      band += f * high;
      low += f * band;
      out[i] = band;
    }
    return out;
  }

  /* ---- mixing ------------------------------------------------------ */
  function mix(...parts) {
    const len = parts.reduce((m, p) => Math.max(m, p.length), 0);
    const out = new Float32Array(len);
    for (const p of parts) for (let i = 0; i < p.length; i++) out[i] += p[i];
    return out;
  }

  /** Add `src` into `dest` starting at `atSec` (dest grows if needed). */
  function place(dest, src, atSec, gain = 1) {
    const off = Math.round(atSec * sr);
    const need = off + src.length;
    let out = dest;
    if (need > dest.length) {
      out = new Float32Array(need);
      out.set(dest);
    }
    for (let i = 0; i < src.length; i++) out[off + i] += src[i] * gain;
    return out;
  }

  const gain = (x, g) => {
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) out[i] = x[i] * val(g, i / x.length, i / sr);
    return out;
  };

  /* ---- effects ----------------------------------------------------- */
  /** Single tap delay with feedback — cheap "space" for chimes. */
  function delay(x, { timeSec = 0.11, feedback = 0.32, mixAmt = 0.3, tailSec = 0.5 } = {}) {
    const d = Math.max(1, Math.round(timeSec * sr));
    const len = x.length + Math.round(tailSec * sr);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const dry = i < x.length ? x[i] : 0;
      const echo = i >= d ? out[i - d] * feedback : 0;
      out[i] = dry + echo * mixAmt + echo * (1 - mixAmt) * 0.35;
    }
    return out;
  }

  /** Tiny Schroeder-ish tail. Keeps chimes from sounding dead-dry on a phone. */
  function reverb(x, { amount = 0.22, decaySec = 0.4, tailSec = 0.55 } = {}) {
    const len = x.length + Math.round(tailSec * sr);
    const wet = new Float32Array(len);
    const combs = [0.0181, 0.0247, 0.0313, 0.0397];
    for (const dSec of combs) {
      const d = Math.max(1, Math.round(dSec * sr));
      const fb = Math.pow(0.001, d / Math.max(1, decaySec * sr));
      const y = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const dry = i < x.length ? x[i] : 0;
        y[i] = dry + (i >= d ? y[i - d] * fb : 0);
      }
      for (let i = 0; i < len; i++) wet[i] += y[i] * 0.25;
    }
    const damped = lowpass(wet, 5200);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) out[i] = (i < x.length ? x[i] : 0) + damped[i] * amount;
    return out;
  }

  /** Gentle saturation. Rounds off transients so nothing "spikes" in a kid's ear. */
  function softClip(x, drive = 1.3) {
    const out = new Float32Array(x.length);
    const k = Math.tanh(drive);
    for (let i = 0; i < x.length; i++) out[i] = Math.tanh(x[i] * drive) / k;
    return out;
  }

  /** Removes any DC offset the filters introduced. */
  function dcBlock(x) {
    const out = new Float32Array(x.length);
    let x1 = 0;
    let y1 = 0;
    for (let i = 0; i < x.length; i++) {
      const y = x[i] - x1 + 0.995 * y1;
      out[i] = y;
      x1 = x[i];
      y1 = y;
    }
    return out;
  }

  function fade(x, inSec = 0.002, outSec = 0.012) {
    const a = Math.max(1, Math.round(inSec * sr));
    const b = Math.max(1, Math.round(outSec * sr));
    const out = Float32Array.from(x);
    for (let i = 0; i < a && i < out.length; i++) out[i] *= i / a;
    for (let i = 0; i < b && i < out.length; i++) out[out.length - 1 - i] *= i / b;
    return out;
  }

  /** Trim (or pad) to an exact length in seconds. */
  function fit(x, dur) {
    const len = n(dur);
    const out = new Float32Array(len);
    out.set(x.subarray(0, Math.min(len, x.length)));
    return out;
  }

  /**
   * Make a loop seamless: render `dur + xfade` seconds, then crossfade the
   * overhanging tail back over the head. The result loops with no click and no
   * audible "bump" at the seam.
   */
  function seamless(x, dur, xfadeSec = 0.06) {
    const len = n(dur);
    const xf = Math.min(Math.round(xfadeSec * sr), len - 1, Math.max(0, x.length - len));
    const out = new Float32Array(len);
    out.set(x.subarray(0, len));
    for (let i = 0; i < xf; i++) {
      const w = i / xf; // 0 → 1
      out[i] = out[i] * w + x[len + i] * (1 - w);
    }
    return out;
  }

  return {
    sr,
    rnd,
    n,
    buf,
    osc,
    partials,
    noise,
    perc,
    bell,
    adsr,
    swell,
    lowpass,
    highpass,
    bandpass,
    formant,
    mix,
    place,
    gain,
    delay,
    reverb,
    softClip,
    dcBlock,
    fade,
    fit,
    seamless,
  };
}

/* ------------------------------------------------------------------ */
/* Master + WAV writing                                                 */
/* ------------------------------------------------------------------ */

function normalize(x, dbfs = PEAK_DBFS) {
  const target = Math.pow(10, dbfs / 20);
  let peak = 0;
  let bad = 0;
  for (let i = 0; i < x.length; i++) {
    const v = Math.abs(x[i]);
    if (!Number.isFinite(v)) bad++;
    else if (v > peak) peak = v;
  }
  const out = new Float32Array(x.length);
  if (peak < 1e-9) return { out, bad };
  const g = target / peak;
  for (let i = 0; i < x.length; i++) out[i] = Number.isFinite(x[i]) ? x[i] * g : 0;
  return { out, bad };
}

/**
 * How audible is a loop's seam? Comparing sample[0] with sample[n-1] is
 * meaningless for noisy material (adjacent noise samples differ a lot anyway),
 * so we express the wrap-around jump as a multiple of the buffer's own average
 * sample-to-sample motion. ~1x = indistinguishable from any other sample pair.
 */
function seamRatio(x) {
  if (x.length < 3) return 0;
  let sum = 0;
  for (let i = 1; i < x.length; i++) sum += Math.abs(x[i] - x[i - 1]);
  const mean = sum / (x.length - 1);
  if (mean < 1e-9) return 0;
  return Math.abs(x[0] - x[x.length - 1]) / mean;
}

function toWav(float32, sr) {
  const len = float32.length;
  const bytes = Buffer.alloc(44 + len * 2);
  bytes.write('RIFF', 0, 'ascii');
  bytes.writeUInt32LE(36 + len * 2, 4);
  bytes.write('WAVE', 8, 'ascii');
  bytes.write('fmt ', 12, 'ascii');
  bytes.writeUInt32LE(16, 16); // PCM chunk size
  bytes.writeUInt16LE(1, 20); // format = PCM
  bytes.writeUInt16LE(1, 22); // mono
  bytes.writeUInt32LE(sr, 24);
  bytes.writeUInt32LE(sr * 2, 28); // byte rate
  bytes.writeUInt16LE(2, 32); // block align
  bytes.writeUInt16LE(16, 34); // bits per sample
  bytes.write('data', 36, 'ascii');
  bytes.writeUInt32LE(len * 2, 40);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    bytes.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return bytes;
}

const dbfs = (v) => (v <= 0 ? -Infinity : 20 * Math.log10(v));

/* ================================================================== */
/* THE SOUNDS                                                          */
/* ================================================================== */
/*
 * Each entry: { sr?, loop?, make(S) → Float32Array }
 * `S` is the toolkit bound to that sound's sample rate and its own seed.
 */

const SOUNDS = {
  /* ---------------- UI ------------------------------------------- */

  /** Soft wooden-toy tap. Two quick sines, tiny click on top. */
  tap: {
    make: (S) => {
      const body = S.osc({ type: 'sine', freq: (u) => 940 - 180 * u, dur: 0.09, env: S.perc(0.026) });
      const ring = S.osc({ type: 'tri', freq: NOTE.E6, dur: 0.07, amp: 0.28, env: S.perc(0.018) });
      const click = S.gain(S.highpass(S.noise(0.012, S.perc(0.004, 0.0004)), 2200), 0.35);
      return S.fade(S.softClip(S.mix(body, ring, click), 1.2));
    },
  },

  /** Quieter, rounder sibling for secondary taps. */
  'tap-soft': {
    make: (S) => {
      const body = S.osc({ type: 'sine', freq: (u) => 620 - 90 * u, dur: 0.11, env: S.perc(0.034, 0.006) });
      const ring = S.osc({ type: 'sine', freq: NOTE.C6, dur: 0.09, amp: 0.18, env: S.perc(0.026, 0.006) });
      return S.fade(S.lowpass(S.mix(body, ring), 3400), 0.004, 0.02);
    },
  },

  /** Bubble pop: fast upward glide + air. */
  pop: {
    make: (S) => {
      const body = S.osc({
        type: 'sine',
        freq: (u) => 300 + 1500 * Math.pow(u, 0.55),
        dur: 0.085,
        env: S.perc(0.022),
      });
      const air = S.gain(S.bandpass(S.noise(0.05, S.perc(0.01, 0.001)), 1400, 6500), 0.3);
      return S.fade(S.softClip(S.mix(body, air), 1.4));
    },
  },

  /** Card / screen whoosh: band-passed noise sweeping up then down. */
  whoosh: {
    sr: SR_LOOP,
    make: (S) => {
      const nz = S.noise(0.34, S.bell(1.3));
      const swept = S.bandpass(
        nz,
        (u) => 300 + 900 * Math.sin(Math.PI * u),
        (u) => 1400 + 5200 * Math.sin(Math.PI * u),
      );
      const air = S.osc({ type: 'sine', freq: (u) => 260 + 420 * Math.sin(Math.PI * u), dur: 0.34, amp: 0.12, env: S.bell(1.5) });
      return S.fade(S.dcBlock(S.mix(swept, air)), 0.01, 0.06);
    },
  },

  /** Token sliding across a board. */
  slide: {
    sr: SR_LOOP,
    make: (S) => {
      const nz = S.bandpass(S.noise(0.22, S.bell(1.1)), 700, (u) => 2400 + 3600 * u);
      const tone = S.osc({ type: 'tri', freq: (u) => 420 + 320 * u, dur: 0.22, amp: 0.16, env: S.bell(1.4) });
      return S.fade(S.dcBlock(S.mix(nz, tone)), 0.008, 0.05);
    },
  },

  /* ---------------- Feedback ------------------------------------- */

  /** CORRECT — two-note major chime, C6 → E6, glassy and encouraging. */
  correct: {
    make: (S) => {
      const chime = (freq, dur) =>
        S.partials({
          freq,
          dur,
          ratios: [1, 2, 3.01, 4.98],
          amps: [1, 0.42, 0.2, 0.09],
          decays: [dur * 0.42, dur * 0.3, dur * 0.2, dur * 0.14],
        });
      let out = new Float32Array(0);
      out = S.place(out, chime(NOTE.C6, 0.34), 0, 0.9);
      out = S.place(out, chime(NOTE.E6, 0.42), 0.105, 1);
      out = S.place(out, S.osc({ type: 'sine', freq: NOTE.G7, dur: 0.16, amp: 0.1, env: S.perc(0.05) }), 0.11);
      return S.fade(S.reverb(S.softClip(out, 1.1), { amount: 0.2, decaySec: 0.32, tailSec: 0.35 }), 0.002, 0.06);
    },
  },

  /** WRONG-SOFT — a kind descending "boop". Never a buzzer, never harsh. */
  'wrong-soft': {
    make: (S) => {
      const boop = S.osc({
        type: 'tri',
        freq: (u) => 480 * Math.pow(0.68, u),
        dur: 0.3,
        env: S.adsr(0.02, 0.06, 0.72, 0.16, 0.3),
      });
      const under = S.osc({
        type: 'sine',
        freq: (u) => 240 * Math.pow(0.7, u),
        dur: 0.3,
        amp: 0.35,
        env: S.adsr(0.02, 0.06, 0.7, 0.18, 0.3),
      });
      return S.fade(S.lowpass(S.mix(boop, under), 2100), 0.01, 0.07);
    },
  },

  /** SUCCESS — 3-note ascending arpeggio C6-E6-G6 + a shimmer tail. */
  success: {
    make: (S) => {
      const note = (freq, dur) =>
        S.partials({ freq, dur, ratios: [1, 2, 3], amps: [1, 0.35, 0.14], decays: [dur * 0.4, dur * 0.26, dur * 0.16] });
      let out = new Float32Array(0);
      out = S.place(out, note(NOTE.C6, 0.3), 0, 0.85);
      out = S.place(out, note(NOTE.E6, 0.3), 0.1, 0.9);
      out = S.place(out, note(NOTE.G6, 0.5), 0.2, 1);
      // shimmer: little high pings drifting up
      for (let i = 0; i < 6; i++) {
        const f = NOTE.C7 * Math.pow(2, i / 12) * (i > 2 ? 1.5 : 1);
        out = S.place(out, S.osc({ type: 'sine', freq: f, dur: 0.2, amp: 0.075, env: S.perc(0.045) }), 0.26 + i * 0.045);
      }
      return S.fade(S.reverb(S.softClip(out, 1.1), { amount: 0.24, decaySec: 0.4, tailSec: 0.45 }), 0.002, 0.08);
    },
  },

  /** FANFARE — 4-note brass-ish arpeggio C5-E5-G5-C6 + sparkle tail. */
  fanfare: {
    make: (S) => {
      const brass = (freq, dur, amp) => {
        const raw = S.osc({
          type: 'saw',
          freq: (u) => freq * (1 + 0.012 * Math.exp(-u * 18)),
          dur,
          amp,
          env: S.adsr(0.028, 0.08, 0.78, 0.12, dur),
          vib: 5.4,
          vibDepth: 0.004,
        });
        // brass = saw through a moving low-pass; the sweep is the "blat"
        return S.lowpass(raw, (u) => 900 + 2400 * Math.exp(-u * 5));
      };
      let out = new Float32Array(0);
      out = S.place(out, brass(NOTE.C5, 0.22, 0.6), 0);
      out = S.place(out, brass(NOTE.E5, 0.22, 0.6), 0.13);
      out = S.place(out, brass(NOTE.G5, 0.22, 0.62), 0.26);
      out = S.place(out, brass(NOTE.C6, 0.62, 0.7), 0.39);
      out = S.place(out, brass(NOTE.E5, 0.6, 0.3), 0.39); // little harmony under the top note
      // sparkle tail
      for (let i = 0; i < 9; i++) {
        const f = NOTE.C7 * Math.pow(2, (S.rnd() * 14) / 12);
        out = S.place(out, S.osc({ type: 'sine', freq: f, dur: 0.24, amp: 0.075, env: S.perc(0.05) }), 0.44 + i * 0.05);
      }
      return S.fade(S.reverb(S.softClip(out, 1.25), { amount: 0.26, decaySec: 0.5, tailSec: 0.5 }), 0.004, 0.1);
    },
  },

  /** LEVEL-UP — rising C major scale run + sparkle. */
  'level-up': {
    make: (S) => {
      const scale = [NOTE.C5, NOTE.D5, NOTE.E5, NOTE.F5, NOTE.G5, NOTE.A5, NOTE.B5, NOTE.C6];
      let out = new Float32Array(0);
      scale.forEach((f, i) => {
        const dur = i === scale.length - 1 ? 0.5 : 0.14;
        out = S.place(
          out,
          S.partials({ freq: f, dur, ratios: [1, 2, 4], amps: [1, 0.3, 0.1], decays: [dur * 0.5, dur * 0.3, dur * 0.18] }),
          i * 0.072,
          0.55 + i * 0.05,
        );
      });
      for (let i = 0; i < 10; i++) {
        const f = NOTE.C7 * Math.pow(2, (S.rnd() * 16) / 12);
        out = S.place(out, S.osc({ type: 'sine', freq: f, dur: 0.22, amp: 0.07, env: S.perc(0.05) }), 0.5 + i * 0.045);
      }
      return S.fade(S.reverb(S.softClip(out, 1.15), { amount: 0.24, decaySec: 0.45, tailSec: 0.5 }), 0.003, 0.09);
    },
  },

  /** SPARKLE — a glissando of tiny sine pings climbing the scale. */
  sparkle: {
    make: (S) => {
      let out = new Float32Array(0);
      const steps = [0, 2, 4, 7, 9, 12, 16, 19];
      steps.forEach((semi, i) => {
        out = S.place(
          out,
          S.osc({ type: 'sine', freq: NOTE.C6 * Math.pow(2, semi / 12), dur: 0.26, amp: 0.5, env: S.perc(0.055) }),
          i * 0.038,
          1 - i * 0.05,
        );
      });
      return S.fade(S.reverb(out, { amount: 0.3, decaySec: 0.4, tailSec: 0.4 }), 0.002, 0.08);
    },
  },

  /** CONFETTI — a burst of many tiny high pops. */
  confetti: {
    make: (S) => {
      let out = new Float32Array(S.n(0.9));
      for (let i = 0; i < 46; i++) {
        const at = Math.pow(S.rnd(), 0.7) * 0.55;
        const f = 900 + S.rnd() * 2600;
        const pop = S.mix(
          S.osc({ type: 'sine', freq: (u) => f * (0.6 + 0.8 * Math.pow(u, 0.5)), dur: 0.05, env: S.perc(0.012) }),
          S.gain(S.highpass(S.noise(0.02, S.perc(0.004, 0.0006)), 3000), 0.4),
        );
        out = S.place(out, pop, at, 0.35 + S.rnd() * 0.4);
      }
      return S.fade(S.reverb(S.softClip(out, 1.3), { amount: 0.18, decaySec: 0.3, tailSec: 0.3 }), 0.002, 0.1);
    },
  },

  /* ---------------- Station ---------------------------------------- */

  /** BELL — the dispatch "DING DING". Inharmonic partials, two strikes. */
  bell: {
    make: (S) => {
      const strike = (freq, dur) =>
        S.partials({
          freq,
          dur,
          // tubular-bell-ish ratios: bright, metallic, still friendly
          ratios: [1, 2.0, 2.76, 4.07, 5.43, 6.79],
          amps: [1, 0.55, 0.42, 0.25, 0.16, 0.09],
          decays: [dur * 0.5, dur * 0.36, dur * 0.3, dur * 0.2, dur * 0.14, dur * 0.1],
        });
      let out = new Float32Array(0);
      out = S.place(out, strike(NOTE.C6, 0.85), 0, 1);
      out = S.place(out, strike(NOTE.C6 * 1.005, 0.95), 0.24, 0.9);
      // a touch of hammer noise on each strike
      out = S.place(out, S.gain(S.bandpass(S.noise(0.03, S.perc(0.006, 0.0008)), 2000, 8000), 0.25), 0);
      out = S.place(out, S.gain(S.bandpass(S.noise(0.03, S.perc(0.006, 0.0008)), 2000, 8000), 0.22), 0.24);
      return S.fade(S.reverb(S.softClip(out, 1.1), { amount: 0.3, decaySec: 0.7, tailSec: 0.6 }), 0.002, 0.12);
    },
  },

  /** RADIO — squelch click, a band-limited chirp, a squelch tail. */
  radio: {
    sr: SR_LOOP,
    make: (S) => {
      const click = S.gain(S.highpass(S.noise(0.02, S.perc(0.005, 0.0005)), 1800), 0.5);
      const squelch = S.gain(S.bandpass(S.noise(0.16, S.bell(1.6)), 900, 3200), 0.5);
      const chirp = S.gain(
        S.bandpass(S.osc({ type: 'square', freq: (u) => 760 + 260 * u, dur: 0.11, amp: 0.35, env: S.adsr(0.006, 0.03, 0.8, 0.04, 0.11) }), 600, 2600),
        0.9,
      );
      let out = new Float32Array(0);
      out = S.place(out, click, 0);
      out = S.place(out, squelch, 0.01);
      out = S.place(out, chirp, 0.05);
      out = S.place(out, S.gain(S.bandpass(S.noise(0.08, S.perc(0.025, 0.002)), 900, 3400), 0.35), 0.19);
      return S.fade(S.dcBlock(S.softClip(out, 1.2)), 0.003, 0.04);
    },
  },

  /** SIREN — playful two-tone wail, ~0.8 s. Toy-truck, not emergency-scary. */
  siren: {
    make: (S) => {
      const dur = 0.82;
      const lo = NOTE.E6;
      const hi = NOTE.A6;
      // four alternations with a smooth (cosine) glide between the two tones
      const freqAt = (u) => {
        const p = u * 4; // 4 slides
        const k = 0.5 - 0.5 * Math.cos(Math.PI * (p - Math.floor(p)));
        return Math.floor(p) % 2 === 0 ? lo + (hi - lo) * k : hi + (lo - hi) * k;
      };
      const body = S.osc({ type: 'tri', freq: freqAt, dur, amp: 0.8, env: S.swell(0.05, 0.12, dur) });
      const fifth = S.osc({ type: 'sine', freq: (u) => freqAt(u) * 1.5, dur, amp: 0.22, env: S.swell(0.05, 0.12, dur) });
      const sub = S.osc({ type: 'sine', freq: (u) => freqAt(u) * 0.5, dur, amp: 0.3, env: S.swell(0.06, 0.14, dur) });
      return S.fade(S.lowpass(S.softClip(S.mix(body, fifth, sub), 1.2), 6000), 0.02, 0.09);
    },
  },

  /** HORN — friendly two-tone truck horn: blast, breath, longer blast. */
  horn: {
    make: (S) => {
      const blast = (dur) => {
        const a = S.osc({ type: 'saw', freq: NOTE.G4, dur, amp: 0.5, env: S.adsr(0.02, 0.05, 0.85, 0.07, dur) });
        const b = S.osc({ type: 'saw', freq: NOTE.B4, dur, amp: 0.42, env: S.adsr(0.024, 0.05, 0.85, 0.07, dur) });
        const c = S.osc({ type: 'sine', freq: NOTE.G3, dur, amp: 0.3, env: S.adsr(0.02, 0.05, 0.85, 0.08, dur) });
        return S.lowpass(S.mix(a, b, c), (u) => 1500 + 900 * Math.exp(-u * 6));
      };
      let out = new Float32Array(0);
      out = S.place(out, blast(0.2), 0);
      out = S.place(out, blast(0.34), 0.28);
      return S.fade(S.softClip(out, 1.35), 0.008, 0.05);
    },
  },

  /** ENGINE — seamless 1.5 s idle loop. Periodic harmonics + crossfaded air. */
  engine: {
    sr: SR_LOOP,
    loop: true,
    make: (S) => {
      const dur = 1.5;
      const pad = 0.09;
      const gen = dur + pad;
      // f0 must be an exact multiple of 1/dur so the harmonic stack is periodic
      const f0 = 42; // 42 Hz = 63 cycles in 1.5 s
      const wobbleHz = 2 / dur; // 2 cycles per loop → also periodic
      const parts = [1, 2, 3, 4, 5, 6, 8, 10, 12];
      const amps = [1, 0.72, 0.5, 0.34, 0.22, 0.16, 0.1, 0.07, 0.045];
      let body = new Float32Array(S.n(gen));
      parts.forEach((h, i) => {
        const v = S.osc({
          type: h % 3 === 0 ? 'tri' : 'sine',
          freq: f0 * h,
          dur: gen,
          amp: amps[i],
          env: (u, t) => 0.82 + 0.18 * Math.sin(TAU * wobbleHz * t + i),
        });
        body = S.mix(body, v);
      });
      const air = S.gain(
        S.bandpass(S.noise(gen), 220, (u, t) => 1500 + 700 * Math.sin(TAU * wobbleHz * t)),
        (u, t) => 0.26 + 0.08 * Math.sin(TAU * wobbleHz * t + 1.2),
      );
      const raw = S.softClip(S.mix(S.gain(body, 0.5), air), 1.5);
      return S.seamless(S.dcBlock(raw), dur, pad * 0.8);
    },
  },

  /** WATER-SPRAY — seamless 1.2 s hose loop: filtered noise, gentle modulation. */
  'water-spray': {
    sr: SR_LOOP,
    loop: true,
    make: (S) => {
      const dur = 1.2;
      const pad = 0.09;
      const gen = dur + pad;
      const m1 = 2 / dur; // periodic modulators
      const m2 = 3 / dur;
      const nz = S.noise(gen);
      const hiss = S.bandpass(
        nz,
        (u, t) => 700 + 260 * Math.sin(TAU * m1 * t),
        (u, t) => 4200 + 1500 * Math.sin(TAU * m2 * t + 0.7),
      );
      const body = S.bandpass(nz, 180, (u, t) => 900 + 260 * Math.sin(TAU * m1 * t + 2.1));
      const mixed = S.mix(
        S.gain(hiss, (u, t) => 0.85 + 0.15 * Math.sin(TAU * m2 * t)),
        S.gain(body, (u, t) => 0.4 + 0.1 * Math.sin(TAU * m1 * t + 1)),
      );
      return S.seamless(S.dcBlock(S.softClip(mixed, 1.2)), dur, pad * 0.8);
    },
  },

  /** SPLASH — a wet slap, then droplets. */
  splash: {
    sr: SR_LOOP,
    make: (S) => {
      const slap = S.bandpass(S.noise(0.3, S.perc(0.07)), 300, (u) => 6500 * Math.exp(-u * 3.2) + 700);
      const bloop = S.osc({ type: 'sine', freq: (u) => 420 * Math.pow(0.45, u), dur: 0.2, amp: 0.4, env: S.perc(0.06) });
      let out = S.mix(slap, bloop);
      for (let i = 0; i < 5; i++) {
        const f = 900 + S.rnd() * 1400;
        out = S.place(out, S.osc({ type: 'sine', freq: (u) => f * (1 + 0.8 * u), dur: 0.05, amp: 0.16, env: S.perc(0.014) }), 0.12 + S.rnd() * 0.22);
      }
      return S.fade(S.dcBlock(S.softClip(out, 1.25)), 0.002, 0.06);
    },
  },

  /** STEAM — the friendly hiss when a flame goes out. */
  steam: {
    sr: SR_LOOP,
    make: (S) => {
      const dur = 0.62;
      const nz = S.noise(dur, S.swell(0.05, 0.4, dur));
      const hiss = S.bandpass(nz, (u) => 900 + 700 * u, (u) => 6500 - 3000 * u);
      const puff = S.gain(S.lowpass(S.noise(0.12, S.perc(0.04)), 900), 0.25);
      return S.fade(S.dcBlock(S.mix(hiss, puff)), 0.015, 0.12);
    },
  },

  /* ---------------- Objects ---------------------------------------- */

  /** CLANK — a ladder piece landing. Inharmonic metal, short. */
  clank: {
    make: (S) => {
      const metal = S.partials({
        freq: 620,
        dur: 0.3,
        ratios: [1, 1.71, 2.43, 3.19, 4.61],
        amps: [1, 0.6, 0.42, 0.3, 0.18],
        decays: [0.11, 0.08, 0.06, 0.045, 0.03],
      });
      const thump = S.osc({ type: 'sine', freq: (u) => 190 * Math.pow(0.6, u), dur: 0.12, amp: 0.5, env: S.perc(0.03) });
      const click = S.gain(S.highpass(S.noise(0.015, S.perc(0.004, 0.0004)), 2600), 0.4);
      return S.fade(S.softClip(S.mix(metal, thump, click), 1.3), 0.001, 0.05);
    },
  },

  /** DROP — a token settling into a slot. Warm, low, satisfying. */
  drop: {
    make: (S) => {
      const body = S.osc({ type: 'sine', freq: (u) => 200 * Math.pow(0.42, u), dur: 0.18, env: S.perc(0.045) });
      const knock = S.gain(S.lowpass(S.noise(0.03, S.perc(0.008, 0.0006)), 1400), 0.45);
      const ring = S.osc({ type: 'tri', freq: NOTE.C5, dur: 0.1, amp: 0.16, env: S.perc(0.028) });
      return S.fade(S.softClip(S.mix(body, knock, ring), 1.3), 0.002, 0.04);
    },
  },

  /** POUR — band-passed noise swell with a rising pitch and a few glugs. */
  pour: {
    sr: SR_LOOP,
    make: (S) => {
      const dur = 0.75;
      const stream = S.bandpass(
        S.noise(dur, S.swell(0.12, 0.22, dur)),
        (u) => 500 + 500 * u,
        (u) => 2600 + 2600 * u,
      );
      let out = S.gain(stream, 0.9);
      // glugs: little pitched bubbles rising as the vessel fills
      for (let i = 0; i < 7; i++) {
        const at = 0.08 + i * 0.085 + S.rnd() * 0.02;
        const f = 240 + i * 42 + S.rnd() * 30;
        out = S.place(out, S.osc({ type: 'sine', freq: (u) => f * (1 + 0.5 * u), dur: 0.07, amp: 0.22, env: S.perc(0.02) }), at);
      }
      return S.fade(S.dcBlock(S.softClip(out, 1.2)), 0.02, 0.1);
    },
  },

  /** SIZZLE — a hot pan: fine crackle with random little bursts. */
  sizzle: {
    sr: SR_LOOP,
    make: (S) => {
      const dur = 0.85;
      const bed = S.gain(S.highpass(S.noise(dur, S.swell(0.08, 0.3, dur)), 2200), 0.5);
      let out = bed;
      for (let i = 0; i < 34; i++) {
        const at = S.rnd() * (dur - 0.08);
        const crack = S.gain(S.bandpass(S.noise(0.03, S.perc(0.006, 0.0006)), 1800 + S.rnd() * 2000, 9000), 0.35 + S.rnd() * 0.4);
        out = S.place(out, crack, at);
      }
      return S.fade(S.dcBlock(S.softClip(out, 1.2)), 0.02, 0.12);
    },
  },

  /** CHOP — board thump plus the knife click. (Only ever the crew, never the child.) */
  chop: {
    make: (S) => {
      const thump = S.osc({ type: 'sine', freq: (u) => 170 * Math.pow(0.5, u), dur: 0.13, env: S.perc(0.03) });
      const wood = S.gain(S.bandpass(S.noise(0.06, S.perc(0.012, 0.0006)), 500, 3200), 0.55);
      const click = S.gain(S.highpass(S.noise(0.012, S.perc(0.003, 0.0003)), 4000), 0.4);
      return S.fade(S.softClip(S.mix(thump, wood, click), 1.35), 0.001, 0.04);
    },
  },

  /** PAGE — a recipe card turning: a soft paper swish. */
  page: {
    sr: SR_LOOP,
    make: (S) => {
      const dur = 0.3;
      const swish = S.bandpass(
        S.noise(dur, (u) => Math.pow(Math.sin(Math.PI * u), 1.8)),
        (u) => 900 + 1600 * u,
        (u) => 3500 + 4500 * u,
      );
      const flick = S.gain(S.highpass(S.noise(0.03, S.perc(0.009, 0.001)), 3200), 0.3);
      return S.fade(S.dcBlock(S.mix(S.gain(swish, 0.9), flick)), 0.01, 0.06);
    },
  },

  /** STAMP — the dispatch slip getting stamped: wood thump + ink click. */
  stamp: {
    make: (S) => {
      const thump = S.osc({ type: 'sine', freq: (u) => 150 * Math.pow(0.45, u), dur: 0.2, env: S.perc(0.045) });
      const body = S.gain(S.lowpass(S.noise(0.07, S.perc(0.016, 0.0008)), 1300), 0.6);
      const click = S.gain(S.bandpass(S.noise(0.02, S.perc(0.005, 0.0004)), 2200, 9000), 0.45);
      const rattle = S.osc({ type: 'tri', freq: 320, dur: 0.09, amp: 0.14, env: S.perc(0.022) });
      return S.fade(S.softClip(S.mix(thump, body, click, rattle), 1.4), 0.001, 0.05);
    },
  },

  /* ---------------- Creatures -------------------------------------- */

  /** DOG-BARK — Pepper. Two short formant-shaped "wuff"s. */
  'dog-bark': {
    make: (S) => {
      const woof = (dur, base) => {
        const buzz = S.osc({
          type: 'saw',
          freq: (u) => base * (1.35 - 0.55 * Math.pow(u, 0.6)),
          dur,
          env: S.adsr(0.008, 0.03, 0.6, dur * 0.5, dur),
        });
        // vocal-tract-ish formants make it read as a bark, not a buzz
        const f1 = S.gain(S.formant(buzz, (u) => 480 + 180 * u, 5), 1);
        const f2 = S.gain(S.formant(buzz, (u) => 1300 - 300 * u, 7), 0.55);
        const f3 = S.gain(S.formant(buzz, 2500, 9), 0.22);
        const air = S.gain(S.bandpass(S.noise(dur, S.perc(dur * 0.25, 0.004)), 1200, 5000), 0.16);
        return S.lowpass(S.mix(f1, f2, f3, air), 5200);
      };
      let out = new Float32Array(0);
      out = S.place(out, woof(0.13, 250), 0, 1);
      out = S.place(out, woof(0.16, 232), 0.19, 0.9);
      return S.fade(S.dcBlock(S.softClip(out, 1.5)), 0.004, 0.05);
    },
  },

  /** MEOW — the clock-tower kitten. Pitch-bent, vibrato, formant "aw". */
  meow: {
    make: (S) => {
      const dur = 0.55;
      const buzz = S.osc({
        type: 'saw',
        freq: (u) => 480 + 300 * Math.sin(Math.PI * Math.pow(u, 0.75)) - 120 * u,
        dur,
        env: S.adsr(0.05, 0.1, 0.85, 0.2, dur),
        vib: 6.5,
        vibDepth: 0.022,
      });
      const f1 = S.gain(S.formant(buzz, (u) => 720 + 260 * Math.sin(Math.PI * u), 6), 1);
      const f2 = S.gain(S.formant(buzz, (u) => 1700 - 500 * u, 8), 0.5);
      const f3 = S.gain(S.formant(buzz, 2900, 10), 0.18);
      return S.fade(S.dcBlock(S.softClip(S.lowpass(S.mix(f1, f2, f3), 5000), 1.4)), 0.02, 0.08);
    },
  },

  /** ROBOT-BEEP — Beacon. Quick square-wave two-note blip. */
  'robot-beep': {
    make: (S) => {
      const blip = (freq, dur) =>
        S.lowpass(S.osc({ type: 'square', freq, dur, amp: 0.5, env: S.adsr(0.004, 0.012, 0.9, 0.02, dur) }), 4200);
      let out = new Float32Array(0);
      out = S.place(out, blip(NOTE.A5, 0.06), 0);
      out = S.place(out, blip(NOTE.E6, 0.085), 0.075);
      out = S.place(out, S.osc({ type: 'sine', freq: NOTE.E7, dur: 0.09, amp: 0.09, env: S.perc(0.025) }), 0.075);
      return S.fade(S.softClip(out, 1.2), 0.002, 0.03);
    },
  },

  /** TICKTOCK — a 1 s clock loop: tick on the beat, tock on the half. */
  ticktock: {
    sr: SR_LOOP,
    loop: true,
    make: (S) => {
      const dur = 1;
      const pad = 0.06;
      const click = (freq, level) =>
        S.mix(
          S.gain(S.bandpass(S.noise(0.03, S.perc(0.005, 0.0004)), 1500, 8000), 0.5 * level),
          S.osc({ type: 'tri', freq, dur: 0.05, amp: 0.4 * level, env: S.perc(0.012) }),
          S.osc({ type: 'sine', freq: freq * 0.5, dur: 0.06, amp: 0.2 * level, env: S.perc(0.018) }),
        );
      let out = new Float32Array(S.n(dur + pad));
      out = S.place(out, click(1500, 1), 0.005);
      out = S.place(out, click(1150, 0.85), 0.505);
      return S.seamless(S.dcBlock(S.softClip(out, 1.2)), dur, pad * 0.7);
    },
  },
};

/* ------------------------------------------------------------------ */
/* Build                                                                */
/* ------------------------------------------------------------------ */

/** Names the app expects — keep in sync with `SfxName` in src/services/audio.ts. */
export const SFX_NAMES = Object.keys(SOUNDS);

function build(only) {
  mkdirSync(OUT_DIR, { recursive: true });
  const names = only && only.length ? only : SFX_NAMES;
  const unknown = names.filter((nm) => !SOUNDS[nm]);
  if (unknown.length) {
    console.error(`Unknown sfx: ${unknown.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  let total = 0;
  const rows = [];
  names.forEach((name, i) => {
    const def = SOUNDS[name];
    const sr = def.sr ?? SR;
    // seed per sound so each is stable across rebuilds but they don't share noise
    const tk = toolkit(sr, 1337 + i * 7919);
    const raw = def.make(tk);
    const { out: wav, bad } = normalize(raw, PEAK_DBFS);
    if (bad) console.warn(`  !! ${name}: ${bad} non-finite samples were zeroed`);
    let peak = 0;
    let sum = 0;
    for (let k = 0; k < wav.length; k++) {
      const v = Math.abs(wav[k]);
      if (v > peak) peak = v;
      sum += wav[k] * wav[k];
    }
    const rms = Math.sqrt(sum / Math.max(1, wav.length));
    const file = join(OUT_DIR, `${name}.wav`);
    writeFileSync(file, toWav(wav, sr));
    const bytes = statSync(file).size;
    total += bytes;
    let seam = '';
    if (def.loop) {
      const r = seamRatio(wav);
      seam = `  loop seam ${r.toFixed(2)}x`;
      if (r > 4) {
        console.warn(`  !! ${name}: loop seam is ${r.toFixed(1)}x the average sample step — expect a click`);
        process.exitCode = 1;
      }
    }
    rows.push(
      `  ${name.padEnd(13)} ${String(sr).padStart(5)} Hz  ${(wav.length / sr).toFixed(2)}s  ` +
        `peak ${dbfs(peak).toFixed(1)} dBFS  rms ${dbfs(rms).toFixed(1)} dBFS  ${(bytes / 1024).toFixed(1)} KB${seam}`,
    );
  });

  console.log(`Station Spark SFX → ${OUT_DIR}`);
  console.log(rows.join('\n'));
  console.log(`  ${names.length} files, ${(total / 1024 / 1024).toFixed(2)} MB total`);
  if (total > 3 * 1024 * 1024) {
    console.error('!! total exceeds the 3 MB budget');
    process.exitCode = 1;
  }
}

build(process.argv.slice(2));

# Procedural SFX

`build-sfx.mjs` synthesises every sound in `assets/sfx/` from scratch. Plain Node, zero
dependencies, deterministic (seeded PRNG), so a rebuild is byte-identical.

```bash
npm run sfx:build                      # regenerate all 31 wavs
node tools/sfx/build-sfx.mjs correct bell   # regenerate just these
```

**Do not hand-edit `assets/sfx/*.wav`** — they are build output and get overwritten.

## Contract

Every name in `SfxName` (`src/services/audio.ts`) must exist here, and vice-versa. Adding a
sound = add a `SfxName` entry, add a `require()` line in `audio.ts`, add a recipe here, rebuild.

## Output format

| | |
| --- | --- |
| Format | 16-bit mono PCM WAV |
| Rate | 44.1 kHz one-shots, 22.05 kHz loops + noise beds (half the bytes, nothing musical above 11 kHz in them) |
| Peak | normalised to **-1.5 dBFS** — always inside the ≤ -1 dBFS budget |
| Budget | the build fails if the folder exceeds 3 MB (currently ~1.4 MB) |

The build prints per-file rate, duration, peak, RMS and size, and for the three loops
(`engine`, `water-spray`, `ticktock`) a **loop seam** figure: the wrap-around jump expressed
as a multiple of that buffer's own average sample-to-sample motion. `1x` means the seam is
indistinguishable from any other sample pair; the build fails above `4x`.

## Sound design house style

From `docs/ART_DIRECTION.md`: **bright, toy-like, short, major key**.

- `correct` is a two-note major chime (C6 → E6). Nothing else is allowed to sound like "right".
- `wrong-soft` is a kind descending boop — **never** a buzzer, never harsh, never a lost life.
  If it ever starts to sound like a penalty, it is wrong.
- Celebrations climb: `success` (C6-E6-G6), `fanfare` (C5-E5-G5-C6 brass + sparkle),
  `level-up` (a C major scale run + sparkle).
- Everything is soft-clipped, so no transient ever spikes in a child's ear.

## Synth toolkit

`toolkit(sampleRate, seed)` returns the primitives each recipe is written with:

| | |
| --- | --- |
| `osc({type, freq, dur, amp, env, vib, vibDepth})` | sine / tri / square / pulse / saw. `freq`, `amp` and `env` may be `(u, t) => number` — that is how every pitch glide and filter sweep is written (`u` = 0..1 through the sound). |
| `partials({freq, dur, ratios, amps, decays})` | additive voice — how the bells and chimes get their inharmonic shimmer |
| `noise(dur, env)` | seeded white noise |
| `perc(tau)` `bell(p)` `adsr(a,d,s,r,dur)` `swell(in,out,dur)` | envelopes |
| `lowpass` `highpass` `bandpass` | one-pole filters, cutoff may be a function of time |
| `formant(x, freq, q)` | 2-pole band-pass — the vocal-tract peaks that make `dog-bark` and `meow` read as animals rather than buzzes |
| `mix` `place(dest, src, atSec)` `gain` | arrangement |
| `delay` `reverb` `softClip` `dcBlock` `fade` | finishing |
| `seamless(x, dur, xfade)` | render longer than needed, then crossfade the overhang back over the head — this is what makes the loops loop |

## Making a loop actually seamless

Two rules:

1. **Tonal content must be periodic in the loop length.** `engine` uses a 42 Hz fundamental
   because 42 = 63 cycles in exactly 1.5 s, and its LFOs run at `2 / dur` for the same reason.
2. **Noise content gets crossfaded.** Render `dur + pad` seconds and hand it to `seamless()`,
   which fades the overhang back across the start.

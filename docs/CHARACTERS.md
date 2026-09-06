# Characters

The cast is **Captain Bea**, **Rookie**, and the **neighbours** (NPCs).

There is no robot and no dog. Beacon and Pepper were cut: two mascots parked in
the corner of a phone screen ate the play area, and everything they did — the
radio, the hints, reading the Spanish aloud — is work Captain Bea can do while
also being a person the child recognises.

## The art is the artwork

`SVG ART/CAPTAIN.svg` and `SVG ART/FIREFIGHTER.svg` are the authored reference
drawings. They are not a starting point that the app re-interprets — they *are*
the shipped characters, path for path.

```
SVG ART/*.svg  ──▶  tools/art/build-characters.mjs  ──▶  src/characters/art/*Art.ts
```

The tool parses each file, keeps every `d` string verbatim, and splits the flat
shape list into named rig parts so the app has something to animate. It refuses
to emit anything if a shape is dropped, claimed by two parts, or invented.

`npm run art:verify` then proves the split changed nothing: it renders the
original SVG and the regenerated part data side by side and compares them pixel
by pixel. Both characters are **identical, 0 of 360 000 pixels different**. Run
it after any change to the art pipeline.

```
npm run art:build     # regenerate the part data from SVG ART/
npm run art:verify    # prove the result is still the reference art
```

Two rules follow from this, and they are not negotiable:

- **Never hand-edit `src/characters/art/*Art.ts`.** Edit the SVG and rebuild.
- **Never redraw a character in code.** If a pose needs a shape that does not
  exist in the artwork, the artwork gains that shape first.

## The rig

`src/characters/art/CharacterRig.tsx` paints the parts in layers. Each layer is
a full-size `<Svg>` positioned absolutely, moved by a Reanimated *view*
transform — view transforms rather than animated SVG props, because they behave
identically on iOS, Android and web.

Paint order is the authored order. It differs only where two parts provably
cannot overlap (the chest badge, the boots), so the drawing is the same either
way. `src/characters/art/rigs.ts` holds the layer plan and the pivots.

Channels, and what each one is for:

| Channel | Moves | Why it exists |
| --- | --- | --- |
| `torso` | jacket, cuffs, neck | breathing |
| `head` | the whole head stack | bob, tilt, listening |
| `hat` | cap / helmet | lags the head by a beat — the secondary motion that sells weight |
| `eyeL` `eyeR` | eye whites + pupils | blink (scaled to a sliver), glance |
| `mouth` | mouth + tongue | mood shape, and flapping while a line is read |
| `browL` `browR` | brows | the difference between worried and proud |
| `armL` `armR` | sleeve + hand | waving, pointing, cheering |

The two characters are rigged differently because they are *drawn*
differently. Rookie's sleeves are authored as their own shapes that share the
coat's shoulder vertex, so the arms genuinely swing and no gap can open at the
joint. Captain Bea's jacket is one shape including both sleeves, so her arms do
not swing from the shoulder — she gestures with her hands, turning at the cuff,
and with her cap.

### Re-tinting

Fills the avatar customiser may change carry a `tone` role (`skin`, `hair`,
`helmet` and their shades). `src/characters/art/tones.ts` maps a Locker choice
to those roles. The default choice returns **no tone map at all**, so the
character a child meets first is the authored art exactly; only a changed
choice re-tints, and then every shade is derived from the new base by the same
offsets the artist used.

## The state machine

`src/characters/machine/characterMachine.ts` (XState 5) owns behaviour;
`useCharacter` keeps it in step with the props a screen passes down.

```
idle ─┬─ rest ──(2.6 s)──▶ flourish ─┬─▶ glance     ─┐
      │                              ├─▶ shift      ─┼─▶ rest
      │                              └─▶ adjustHat  ─┘
talk   ── SILENCE ─▶ idle
wave   ── 1.75 s ──▶ idle
cheer  ── 1.6 s ───▶ idle (or loops while held)
point  ── holds
think  ── holds
```

Every state is interruptible: a line of dialogue or a celebration cuts straight
into a flourish, because a child's tap is never "later".

The idle flourishes are the point of the machine. A character that only
breathes reads as a sticker, so every few seconds one steps out of `rest` into
a small piece of business and comes straight back. The cycle is
`glance → shift → glance → adjustHat`, so a character never repeats itself
twice running.

Screens stay declarative:

```tsx
<CaptainBea size={180} pose="point" emotion="calm" speaking={isReading} />
<Rookie size={160} pose="cheer" emotion="excited" bobPhase={0.4} />
```

- `pose`: `stand | wave | cheer | point | think | talk`
- `emotion`: `happy | excited | think | calm | worried | proud | surprised`
- `speaking`: true while a line is being read out — flaps the mouth
- `bobPhase` (0–1): offsets the idle clock. **Always vary it** between two
  characters on one screen, or they breathe in lockstep and look like one
  puppet.
- `flat`: one non-animated `<Svg>`, for thumbnails, crowds and map pins.

`animate={false}` and the reduced-motion setting both park the rig in its rest
pose without unmounting anything.

## Where they appear

`GameCrew` / `SceneCrew` put **one** lead in a bottom corner of a mini-game —
`lead="rookie"` where the child is doing the doing, `lead="bea"` where an adult
is instructing or the radio is talking. One figure, not a huddle: that is the
space the robot and the dog gave back.

`CrewFigure` is the one-line swap for a character standing in a scene.
`CharacterPortrait` is for dialogue chrome only — a head in a circle is never
an actor in the world.

## The logo

`SVG ART/LOGOMAIN.svg` goes through the same pipeline and is drawn by
`src/ui/Logo.tsx`. The only liberty the app takes is motion: the flame in the
crest breathes, scaled about its own base, so the plaque, the gold sweeps and
both words never shift by a pixel. `app/dev/icon.tsx` renders it for the app
icon, splash and favicon.

## Benches

- `/dev/cast` — both leads at every pose, mood and size, plus the flat variant.
- `/dev/kit` — the wider design-system gallery.

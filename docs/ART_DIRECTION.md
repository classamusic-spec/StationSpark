# Station Spark — Art Direction Bible

> A living mini fire department where children learn by helping their community.
> Brave · kind · curious · capable · warm · energetic · community-minded. Never aggressive, militarised or frightening.
> **HELPING PEOPLE IS COOL** (not "fire is cool").

Reference frames live in `SPARK STATION REF ART/`. Study them first. Everything below is distilled from them.

## Palette (src/theme/colors.ts)

| Token | Hex | Use |
| --- | --- | --- |
| engineRed / Dark | #E63B2E / #B9261C | Brand energy: logo, primary CTA face/edge, truck, awnings. **Never "error".** |
| safetyYellow / gold | #FFC72C / #F5A800 | Stars, rays, math pills, helmets, reflective stripes |
| skyTop → skyBottom | #4FB3F6 → #BDE7FF | Every outdoor screen is a vertical sky gradient |
| waterCyan | #4FC3F7 | Water, hose spray, teamwork |
| navy | #1F2A5A | ALL text, outlines of the logo, dark accents. Never black. |
| cream / panel / tan | #FFF6E5 / #FFF9EF / #F5D9A6 | Cards, station façade, boards |
| leafGreen / grass | #4CAF50 / #8FD16B | Go/done buttons, hills, "Problem Solving" |
| purple | #9B7BFF | Español |
| pink | #FF7EB3 | English / reading accents |
| orange | #FF8A3D | Cones, cooking |
| charcoal | #3B4460 | Truck interior, grids |
| flameOuter/Mid/Core | #FF7A1A / #FFB324 / #FFF1A8 | Friendly stylised flames — rounded teardrops with a smiling-hot core; never realistic |

Subject pills: Math = yellow, Reading = blue, English = pink, Español = purple, Problem Solving = green, Teamwork = cyan, Cooking = orange.

## Shape language

- **Everything is rounded.** Cards 24, panels 28, tiles 20, pills 999. No sharp corners anywhere — even grids, gauges and flames.
- **3D pressables**: face colour on a darker edge (4–7 px). Press → face sinks onto edge + 2 % squash. Big red pill CTAs carry a white chevron.
- **Chunky white cards float over the sky** with a soft navy-tinted shadow (`shadows.card`). Cream/tan surfaces are for the station itself (boards, walls).
- **Stickers, not lines**: vector shapes use flat fills + one darker shade tone (navy at ~14 %) + one highlight (white at ~30 %). No black outlines. Objects sit on a soft navy ellipse shadow.
- **Inner-border sheen** (2 px white at 35 %) on button faces and tiles — it reads "toy".
- Glass panels (`tone="glass"`, white 82 %) for HUD pieces over busy scenes.

## Typography

Fredoka Bold for display, headings, buttons, numerals. Nunito Bold/ExtraBold for body. Navy on cream/white; white with navy text-shadow when on the sky. Kid scale: body 18, small 15, h2 25, h1 30, hero 44, big numerals 64.

## UI motifs (objects from the world, not generic widgets)

| Concept | Motif |
| --- | --- |
| Mission cards | **Dispatch slips** — white cards with a scene thumbnail, title, tagline, subject pills, green round chevron |
| Progress | **Station board** — cork/cream board with pinned tiles |
| Achievements | **Badges** — shield shapes with colour rim + icon; locked = grey with lock |
| Recipes | **Recipe cards** — cream index cards with a red header tab |
| Language | **Radio cards** — dark navy radio panel with green glow text, EN ↔ ES |
| World | **Map board** — the Spark City illustration with pin labels |
| Daily goals | **Shift board** — clipboard |
| Collection | **Locker** |
| Customisation | **Gear closet / Garage** |

## Characters (src/characters)

The two leads are **authored artwork, not code drawings**. `SVG ART/CAPTAIN.svg`
and `SVG ART/FIREFIGHTER.svg` are the characters; a build tool splits them into
rig parts without changing a pixel, and `npm run art:verify` proves it. Never
redraw them — see **docs/CHARACTERS.md** for the pipeline and the rig.

- **Rookie** — the child the player is. Red helmet with a gold flame shield, navy
  turnout coat with cream-edged yellow reflective bands, a flame badge on the
  chest, black boots. Skin, hair and helmet colour are customisable in the
  Locker; the default is the authored art exactly.
- **Captain Bea** — the warm station leader. Navy dress uniform, gold cuff
  stripes, three gold buttons, a chest shield, and a white-crown cap with a gold
  star badge. Short instructions only, never hurried. She is also the station's
  radio and its Spanish voice.
- NPCs — Rosa (baker, apron, flour cheek), Gino (pizzaiolo, moustache), Ms. Lee (teacher, cardigan), Mr. Okafor (park keeper), the Pet Shop twins. Bilingual, cheerful. These still use the shared `Person` rig.

There is no robot and no dog. Beacon and Pepper were cut: two mascots in the
corner of a phone screen ate the play area, and Captain Bea does their jobs
better. A mini-game shows **one** lead, never a huddle.

Each lead idles by breathing, blinking and bobbing, and every few seconds plays
a small piece of business — a glance, a weight shift, a tug on the hat. The hat
lags the head by a beat. `bobPhase` must differ between two characters on one
screen or they move like one puppet.

## Motion principles

1. **Alive at rest** — nothing is static. Clouds drift (42 s), flag waves, bell sways, chimney puffs, and every character breathes, blinks and shifts its weight.
2. **Anticipation + follow-through** — buttons squash; tokens overshoot into slots (`springs.snap`); cards enter with `FadeInDown.springify()` staggered 60–90 ms.
3. **Physical feedback triad** — every meaningful touch = motion + sound + haptic.
4. **Correct** = pop scale 1→1.15→1, `correct` chime, sparkle burst, character reaction (the crew lead bounces). **Mission complete** = confetti (Skia particles), `fanfare`, characters jump, badge flips in.
5. **Wrong** = wobble ±6 px ×3 (220 ms), `wrong-soft`, `haptics.nudge()`, Captain Bea offers a hint bubble. Never a red X, never a buzzer, never a lost life.
6. **Transitions** — screens crossfade; entering a room in the firehouse zooms slightly into that room (scale 1→1.06 then cut). Missions travel with the truck across the map (2–3 s cinematic, `engine` loop + `siren` blip).
7. **Reduced motion** — decorative loops stop; feedback animations shorten to 120 ms.

## Sound

Bright, toy-like, short. Bell "DING DING" for dispatch. Water = filtered noise loop. Correct = two-note major chime. Wrong = soft descending "boop". Fanfare = 4-note arpeggio + shimmer. Characters speak via TTS with distinct pitches; Spanish lines are spoken with `es-MX`.

## Safety direction (hard rules)

- Flames are small, contained, cartoon, and always inside a window/oven/grill — never on people or animals; no smoke-filled rooms.
- Nobody is ever in danger. Animals are "stuck", not hurt. No entering buildings.
- Never teach real suppression procedure. The only real-world messages (Grown-Ups screen + onboarding card): *Get away from danger. Tell a grown-up. Follow emergency instructions. Call your local emergency number. Never hide from firefighters.*
- Kitchen: anything hot or sharp shows the "Ask a grown-up 👋" chip, and the child never uses the knife/oven — the crew does.
- No timers that punish; no lives; no ads; no manipulative currency (Sparks buy station decorations only and are always earnable).

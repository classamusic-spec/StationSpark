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
| waterCyan | #4FC3F7 | Water, hose spray, Beacon's face, teamwork |
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

All rigs are SVG built from simple shapes; big eyes (navy with white highlight), rosy cheek dots, thick soft limbs. Each rig exposes `emotion` and idles: **bob** (3 px, 2.2 s), **blink** (2.6–5.2 s random), **breathe** (2 % scale). Emotion swaps eye/mouth shapes only.

- **Rookie** — the child. Customisable skin (peach/tan/brown/deep), hair (dark/brown/blonde/red/black-curly), helmet colour (red/yellow/blue/pink). Red helmet with gold flame shield, navy jacket with two yellow reflective stripes, red accents, big wave pose.
- **Beacon** — small floating rescue robot. White rounded capsule body, cyan visor face (two happy arc eyes, small smile), blue shoulder accents, antenna with a blinking cyan light. Hovers (bob 5 px) with a soft cyan glow beneath. Beacon scans numbers, translates (RadioCard), points at hints. Voice: high, quick.
- **Pepper** — Dalmatian puppy. White with navy spots, red collar with gold tag, one floppy ear, tongue out. Tail wags when something goes right; comic relief.
- **Captain Bea** — warm station leader. Navy uniform, white captain cap with gold badge, brown skin, kind smile, short instructions only.
- NPCs — Rosa (baker, apron, flour cheek), Gino (pizzaiolo, moustache), Ms. Lee (teacher, cardigan), Mr. Okafor (park keeper), the Pet Shop twins. Bilingual, cheerful.

## Motion principles

1. **Alive at rest** — nothing is static. Clouds drift (42 s), flag waves, bell sways, chimney puffs, Beacon hovers, Pepper's tail.
2. **Anticipation + follow-through** — buttons squash; tokens overshoot into slots (`springs.snap`); cards enter with `FadeInDown.springify()` staggered 60–90 ms.
3. **Physical feedback triad** — every meaningful touch = motion + sound + haptic.
4. **Correct** = pop scale 1→1.15→1, `correct` chime, sparkle burst, character reaction (Beacon spins, Pepper wags). **Mission complete** = confetti (Skia particles), `fanfare`, characters jump, badge flips in.
5. **Wrong** = wobble ±6 px ×3 (220 ms), `wrong-soft`, `haptics.nudge()`, Beacon offers a hint bubble. Never a red X, never a buzzer, never a lost life.
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

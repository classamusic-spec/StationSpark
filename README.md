# 🚒 Station Spark

**A living mini fire department where children (5–10) learn by helping their community.**
*Learn. Help. Rescue. Grow.*

Station Spark is a premium React Native learning adventure. The player is the newest junior member of a tiny neighbourhood fire station in colourful Spark City. There are no worksheets: math runs the equipment, reading decodes the dispatch calls, English and Spanish let you talk to neighbours, and cooking with the crew teaches fractions and measurement. **Learning runs the station.**

## Play

| Room | What happens |
| --- | --- |
| **Dispatch** | Pick a mission from the dispatch slips. DING DING! |
| **Map Room** | Spark City: bakery, school, library, park, pet shop, pizza piazza, construction yard… |
| **Training Yard** | 30–90 second skill stations you can replay: Hose Hero, Ladder Builder, Code the Route, Clock Watch… |
| **Kitchen** | Calm, warm cooking with the crew: Pizza Night, Taco Night, Smoothie Shift, Soup, Pancakes, Rosa's Bread |
| **Garage** | Customise the truck: colour, decals, lights, horn (and wash it) |
| **Badge Wall** | Ranks from Cadet to Community Hero, badges, station upgrades bought with Sparks |
| **Locker** | Your Rookie: skin, hair, helmet, name, age band |
| **For Grown-Ups** | Parent gate, settings, learning report, safety card |

A shift = arrive → choose a job → read the dispatch → pack the truck → drive → help → celebrate → return → eat together.

### Missions (MVP)

1. **Cat in the Clock Tower** — counting, addition, number ladder
2. **Bakery Bell** — reading, measurement, water fractions, Rosa's bread
3. **Pizza Shop Panic** — fractions, Spanish, pizza night
4. **Park Picnic Problem** — patterns, sorting, vocabulary, community help
5. **School Fair Rescue** — time, maps, multiplication, reading
6. **Community Clean-Up** — sorting, Spanish listening, taco night

Every mission generates its challenges for the child's age band (5–6, 7–8, 9–10), so the same story scales.

## Run it

```bash
npm install
npm start            # Expo dev server (press i / a / w)
npm run web          # in the browser
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # jest: generators, machines, content integrity
npm run export:web   # static bundle in dist/
npm run sfx:build    # regenerate the procedural sound library
```

Requires Node 22+. iOS/Android use Expo SDK 57 (Expo Go or a development build).

## Stack

Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (strict) · Reanimated 4 · Gesture Handler · react-native-svg · Skia · XState 5 · Zustand · expo-router · expo-audio · expo-speech · expo-haptics.

Art is 100 % vector (SVG + Skia) drawn in code — no bitmap sprites — so it is crisp on every screen. Sounds are synthesised procedurally by `tools/sfx/build-sfx.mjs`. Voices use on-device text-to-speech in English and Spanish.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — folder map, the three contracts (challenges, mini-games, missions), rules
- [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md) — palette, shapes, characters, motion, sound, safety direction
- `SPARK STATION REF ART/` — reference frames

## Safety

Station Spark is a stylised learning fantasy. Flames are small, contained and cartoon; nobody is ever in danger; nothing teaches real fire suppression. The only real-world messages, shown to grown-ups: *Get away from danger. Tell a grown-up. Follow emergency instructions. Call your local emergency number. Never hide from firefighters.* Kitchen heat and knives are always handled by the crew, with an "Ask a grown-up" reminder.

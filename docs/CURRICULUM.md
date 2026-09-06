# Station Spark — Curriculum Map

> What a child actually practises, in what order, and where it lives in the code.
> Source of truth: `src/learning/types.ts` (skills + challenge kinds), `src/content/missions/`,
> `src/content/recipes.ts`, `src/learning/vocabulary.ts`. This file is the map, not the territory —
> when they disagree, the code wins and this file gets fixed.

Design rule behind everything below: **learning runs the station.** A child never does a "maths
exercise"; they pack a truck, read a radio call, or share out twelve quesadillas. And a child can
always finish: after two mistakes Beacon hints, after three the answer is highlighted.

---

## 1. The three bands

| Band | Ages | Numbers | Fractions | Time | Reading | Español |
| --- | --- | --- | --- | --- | --- | --- |
| **A** | 5–6 | to 20, counting, number words | halves | o'clock & half past (30-min steps) | single words, 3 options | full support: both languages on screen |
| **B** | 7–8 | + and − to 100 | quarters | 5- and 15-minute steps | short sentences, 4 options | some support: English fades |
| **C** | 9–10 | × and ÷, scaling | eighths, equivalence | 5-minute steps, up to 3 hours | longer sentences, inference | minimal support: Spanish leads |

Bands are set once in the profile and **never taken away**. Difficulty moves *inside* a band via
`src/learning/adaptive.ts`: `masteryFor()` reads attempts/correct per skill, pulls thin evidence
toward 0.5 ("we don't know yet"), and `masteryAdjustment()` nudges a generator's number range by
−1 / 0 / +1. A wobbly day never demotes a child.

Bands also swap whole beats. Every mission carries at least one band-restricted mini-game
(`MissionBeat.bands`), so band A plays the picture version of a beat where band C plays the
sentence version — the story is identical, the demand is not.

---

## 2. Skills → games

`challengeSkills` in `src/learning/types.ts` is the machine-readable version of this table; the
recap screen and the Grown-Ups screen both read from it.

| Skill | Subject | Games that exercise it |
| --- | --- | --- |
| counting | math | hose-hero, equipment-check, rescue-pets, listen-count, count-ingredients, market-money, soup-pot |
| number-recognition | math | number-ladder, dispatch-decoder, hydrant-match |
| addition | math | ladder-builder, number-ladder, build-barrier, market-money, soup-pot (band C adds the pot up) |
| subtraction | math | hose-hero, equipment-check, rescue-pets, number-ladder, market-money |
| multiplication | math | hydrant-match, recipe-scale |
| division | math | divide-share, pizza-fractions |
| fraction-half / -quarter | math | water-tank, hose-hero, measure-pour, pizza-fractions |
| fraction-equivalent | math | recipe-scale |
| measurement | math | water-tank, measure-pour |
| money | math | market-money |
| time | math | clock-watch |
| comparison | math | gear-sort, rescue-route |
| estimation | math | (reserved — no game yet) |
| geometry | math | hose-path, build-barrier, pizza-fractions, shape-builder |
| patterns | logic | spray-pattern |
| sorting | logic | gear-sort |
| spatial | logic | hose-path, rescue-route, shape-builder |
| sequencing | logic | signals, rescue-route, **soup-pot** |
| reading-words | reading | dispatch-decoder, word-builder |
| reading-sentences | reading | dispatch-decoder |
| reading-directions | reading | rescue-route |
| spelling | reading | word-builder |
| vocabulary-en | english | vocab-tap, word-builder |
| vocabulary-es | spanish | vocab-tap, count-ingredients, word-builder, soup-pot |
| listening-es | spanish | listen-count |
| teamwork | teamwork | every mission (the crew beats and the recap) |

---

## 3. The unlock graph

Twelve missions. Two are open on day one; nothing ever needs more than **two** prerequisites, so
the town fans out instead of forming a queue. Every mission is reachable in five rounds of play.

```
round 1   clock-tower-cat                       bakery-bell
             │                                     │
round 2   ├─ park-picnic                        ├─ pizza-shop-panic
          └─ library-lights                     ├─ pet-shop-parade
                                                └─ (market-morning waits for park-picnic)
round 3   ├─ museum-mystery  ← library-lights   ├─ school-fair       ← pizza-shop-panic
          └─ market-morning  ← bakery-bell + park-picnic
round 4   ├─ community-cleanup ← park-picnic + school-fair
          └─ train-timetable   ← school-fair + museum-mystery
round 5   └─ festival-exchange ← market-morning + community-cleanup
```

### Mission table

Beats are counted per band (band-restricted mini-games swap in and out). "ES words" is the number
of distinct Spanish words the child *hears or reads* in that mission's scripted dialogue — the
generated beats add more on top.

| # | Mission | Location / NPC | Requires | Beats A/B/C | Games | Subjects | ES words | Badge |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Cat in the Clock Tower | clock-tower · Maya | — | 11/12/12 | 6 | math, reading, logic, teamwork | 19 | `clock-tower-cat` |
| 2 | Bakery Bell | bakery · Rosa | — | 13/13/13 | 6 | reading, math, spanish, cooking | 20 | `bakery-bell` |
| 3 | Pizza Shop Panic | pizza · Gino | bakery-bell | 12/12/12 | 5 | math, spanish, cooking, teamwork | 21 | `pizza-rescue` |
| 4 | Park Picnic Problem | park · Mr. Okafor | clock-tower-cat | 12/12/12 | 6 | logic, english, spanish, teamwork | 32 | `park-picnic` |
| 5 | **Library Lights-Out** | library · Maya | clock-tower-cat | 12/12/12 | 7 | reading, math, logic, teamwork | 19 | `library-lights` |
| 6 | **Pet Shop Parade** | pet-shop · Ana & Luis | bakery-bell | 12/12/12 | 7 | math, logic, english, spanish | 30 | `pet-parade` |
| 7 | School Fair Rescue | school · Ms. Lee | pizza-shop-panic | 12/12/12 | 6 | math, reading, logic, teamwork | 17 | `school-fair` |
| 8 | **Farmers Market Morning** | market · Abuela Carmen | bakery-bell + park-picnic | 13/13/13 | 7 | math, spanish, cooking, reading | 38 | `market-helper` |
| 9 | Community Clean-Up | pet-shop · Ana & Luis | park-picnic + school-fair | 12/12/12 | 6 | logic, spanish, cooking, teamwork | 34 | `clean-up-crew` |
| 10 | **Museum Mystery** | museum · Dr. Patel | library-lights | 13/13/13 | 8 | logic, math, reading, teamwork | 24 | `museum-detective` |
| 11 | **Train Station Timetable** | train-station · Conductor Lou | school-fair + museum-mystery | 12/12/12 | 7 | math, reading, logic, teamwork | 22 | `timetable-pro` |
| 12 | **Festival Rescue Exchange** | festival · Capitana Sofía & Rosa | market-morning + community-cleanup | 13/13/13 | 7 | spanish, teamwork, cooking, math | 49 | `rescue-exchange` |

**bold** = added in the twelve-mission expansion. Rewards sit in the same range across the town:
40–50 XP and 12–20 Sparks, so no mission is ever the "efficient" one to grind.

### What each new mission teaches

| Mission | Core skills | Band swap (A ↔ B/C) |
| --- | --- | --- |
| Library Lights-Out | reading sentences, sequencing, counting, spatial | `hydrant-match` (shelf numbers, A) ↔ `number-ladder` (climb to the fuse box, B/C) |
| Pet Shop Parade | counting, sorting, animal vocabulary, listening-es | `vocab-tap` (tap the animal, A) ↔ `count-ingredients` in Spanish (B/C); the rescue animal is a puppy (A), a bunny (B), a turtle (C) |
| Farmers Market Morning | measurement, money, counting, Spanish food words | `vocab-tap` (A) ↔ `listen-count` (B/C); `market-money` counts up for A and demands exact change for B/C |
| Museum Mystery | patterns, geometry, spatial, reading sentences | `signals` (opening steps, A) ↔ `hydrant-match` (case numbers, B/C); the mosaic rule is AB (A), ABC (B), AABB (C) |
| Train Station Timetable | time, reading directions, sequencing, comparison | `hydrant-match` (platform numbers, A) ↔ `number-ladder` (count the carriages, B/C) |
| Festival Rescue Exchange | listening-es, vocabulary-es, fractions, teamwork | `equipment-check` (count the buckets, A) ↔ `count-ingredients` in Spanish (B/C); the grill is 4 / 6 / 8 flames |

---

## 4. Order of exposure, band by band

### Band A (5–6)

1. **Counting and number words** — clock-tower-cat (`equipment-check`, `rescue-pets`),
   library-lights (`hydrant-match` reads number *words*), pet-shop-parade.
2. **Halves** — bakery-bell (`water-tank` at ½), pizza recipe cut into 4 shared by 2.
3. **Patterns and sorting** — park-picnic (`spray-pattern` AB), pet-shop-parade (`gear-sort`),
   museum-mystery (star–cone mosaic).
4. **Single words, three pictures** — every `vocab-tap`, always with full bilingual support.
5. **Time to the half hour** — school-fair, museum-mystery, train-timetable (`clock-watch`, 30-min steps).
6. **Money by counting up** — market-morning (`market-money`, pennies and nickels, paying over is fine).
7. **Shapes** — museum-mystery (`shape-builder`, no rotation for band A), `hose-path` on a 3×3 grid.

### Band B (7–8)

1. **+ and − to 100** — `number-ladder` in 1/5/10 jumps (library-lights, train-timetable),
   `build-barrier`, `hydrant-match` sums.
2. **Quarters** — `water-tank` and `measure-pour` at ¼ (bakery-bell, market-morning, recipes).
3. **Short sentences** — `dispatch-decoder` in sentence mode (school-fair, library-lights, museum-mystery).
4. **Maps and directions** — `rescue-route` with named streets and a two-route comparison
   (train-timetable pins this explicitly).
5. **Listening in Spanish** — `listen-count` with fading English support (park-picnic,
   pet-shop-parade, market-morning, festival-exchange).
6. **Exact money** — market-money must match the price exactly.
7. **Turning shapes** — `shape-builder` arrives rotated.

### Band C (9–10)

1. **× and ÷** — `hydrant-match` times tables, `divide-share`, `pizza-fractions`.
2. **Equivalent fractions and scaling** — `recipe-scale` (soup 4→6, quesadillas 4→6, lemonade 4→6).
3. **Eighths** — `water-tank` at ⅜, ⅝, ⅞.
4. **Inference reading** — `dispatch-decoder` band-C sentences ask *why*, not *what*.
5. **Change from a note** — market-money's `askChange` (25 / 50 / 100).
6. **Spanish leads** — festival-exchange runs the radio call in Spanish first and Beacon translates;
   `vocab-tap` prompts in `es` with same-category distractors.
7. **Counting shapes** — `shape-builder`'s `askCount` follow-up ("how many triangles?").

---

## 5. The kitchen

Thirteen recipes. Every one that touches heat or a knife carries `grownUp: true` and opens with
Captain Bea's line — *"The crew handles the … At home, ask a grown-up!"* The child never uses the
knife or the oven.

| Recipe | Steps (game) | Band notes | Spanish |
| --- | --- | --- | --- |
| `pancakes` | measure-pour → count-ingredients → clock-watch | A pours halves, B/C quarters | — |
| `pizza` | count-ingredients → pizza-fractions | A: ½ + ½ cut into 4; B/C: ½ + ¼ + ¼ cut into 8 | — |
| `tacos` | count-ingredients → divide-share | 12 ÷ 4 = 3 for every band | tomate, pimiento, aceituna |
| `smoothie` | count-ingredients → measure-pour | ½ cup of milk | tres fresas, dos plátanos |
| `soup` | count-ingredients → measure-pour (A/B) → recipe-scale (C) | C scales 4 → 6 | — |
| `bread` | measure-pour → measure-pour → count-ingredients | A halves, B/C quarters | harina, huevos, aceitunas |
| **`quesadillas`** | count-ingredients → divide-share → recipe-scale (C) | A shares 8 ÷ 2; B/C 12 ÷ 4; C scales 4 → 6 | tortilla, queso, cebolla, quesadilla |
| **`fruit-salad`** | count-ingredients → measure-pour → divide-share | A counts 2 fruits, B/C count 3; A shares 8 ÷ 2 | fresas, uvas, naranjas |
| **`lemonade`** | count-ingredients → measure-pour → measure-pour → recipe-scale (C) | the ratio: 1 cup water to ¼ spoon honey; C scales 4 → 6 | limones, fresas |
| **`garden-salsa`** | count-ingredients → measure-pour → measure-pour (B/C) | A counts 2 ingredients, B 3, C 3 with bigger numbers | tomate, cebolla, cilantro, limón |
| **`veggie-caldo`** | measure-pour → **soup-pot** → clock-watch | the pot is 3 / 4 / 5 ingredients long; C adds it up | caldo, cebolla, zanahoria, papa, tomate, limón |
| **`agua-fresca`** | count-ingredients → measure-pour → word-builder | A spells *agua*, B *lemon*, C *fresa* | sandía, limón, fresa, agua |
| **`esquites`** | market-money → count-ingredients → measure-pour → divide-share | A shares 8 ÷ 2, B/C 12 ÷ 4 | elote, limón, cebolla, mantequilla |

Cooked from missions: `bread` (bakery-bell), `pizza` (pizza-shop-panic), `smoothie` (park-picnic),
`tacos` (community-cleanup), `garden-salsa` (market-morning), `quesadillas` (festival-exchange).
The rest are free-play in the Kitchen.

### The three dishes that fill a gap

The first ten recipes leaned on the same five kitchen games (plus the pancake clock), so the room
could measure, count, share and scale — and little else. These three each reach further:

| Dish | Reaches | How |
| --- | --- | --- |
| **Veggie Caldo** | **sequencing**, elapsed time, addition | the pot is an *order*, not a set (`soup-pot`); the simmer is a real `clock-watch` beat, so "twenty minutes later" is something the child sets |
| **Watermelon Agua Fresca** | **spelling & reading-words** | the jug needs a label, so the recipe ends in `word-builder` — the only recipe that asks a child to write |
| **Carmen's Corn Cups** | **money**, addition | the shopping happens before the cooking: `market-money` at Carmen's stall, then count, season and share |

`soup-pot` is the one new game kind. `count-ingredients` checks a *bowl* — the right things in any
order, judged at the end. A pot is a sequence: the onions soften before the potatoes go in, two of
them before you move on, and putting the lime in first is "not yet", never "wrong". Band C is asked
how many pieces went in altogether, which is the kitchen's first piece of plain addition.

---

## 6. Español

**191 words** in `src/learning/vocabulary.ts`, every one bilingual (en / es-MX) with an icon.

| Category | Words | Includes |
| --- | --- | --- |
| equipment | 23 | the truck kit + gloves, whistle, siren, uniform, bandage, stretcher, toolbox, flag |
| food | 36 | market and kitchen: limón, cebolla, cilantro, maíz, arroz, frijoles, tortilla, quesadilla… |
| colors | 11 | + negro, rosa, morado |
| numbers | 13 | cero – doce |
| places & weather | 32 | + museo, estación de tren, hospital, jardín, festival, granja, playa, río, nieve, viento, tormenta |
| actions, directions & feelings | 38 | + norte/sur/este/oeste, alto, cerca, lejos, espera, cuidado, feliz, triste, orgulloso, valiente |
| people & community helpers | 20 | + enfermera, policía, cartero, granjero, cocinero, veterinaria, maquinista, científica |
| animals | 18 | + pájaro, pez, caballo, vaca, oveja, cerdo, ratón, rana, loro, lagartija |

**The kitchen's own bank.** `src/kitchen/food.ts` holds the words the room *cooks* with, and it now
covers the pot and the stall too: cebolla, zanahoria, papa, elote, arroz, limón, uva, sandía,
cilantro, sal, miel, jugo, tortilla. One entry deliberately disagrees with the main bank — the
kitchen counts **elotes** (cobs), never *maíces* (grains), because "tres maíces" is not something a
cook says. The id stays `corn`, so the drawn icon and the word bank still line up.

**The scaffolding ladder.** `vocab-tap.support` and `listen-count.support` step down by band:
`full` (both languages, 3 pictures) → `some` (English fades, 4 pictures) → `min` (Spanish only,
same-category distractors). Grammar is generated, not hard-coded: `countPhraseEs()` agrees in
gender ("una manguera", "un casco") and pluralises correctly, including the awkward ones
(limón → limones, ratón → ratones, pez → peces, maíz → maíces).

**How Spanish arrives in the story.** Every NPC is bilingual and Beacon translates one word per
scene, out loud, in the same beat the child just heard it — *"Gracias means thank you!"* Nobody is
ever quizzed on a word they have not met. The Global Rescue Exchange (mission 12) inverts the
default: the radio speaks Spanish and English is the translation.

---

## 7. Badges as a practice map

Mission badges are one per call. Skill badges are the visible version of the practice ledger:

| Badge | Earned by | Reads as |
| --- | --- | --- |
| `first-shift` | 1 mission | you showed up |
| `number-navigator` | 5 number games | number-ladder, hydrant-match, ladder-builder, build-barrier, equipment-check |
| `fraction-firefighter` | 3 fraction games | water-tank, pizza-fractions, measure-pour |
| `ladder-legend` | 3 ladder games | ladder-builder, number-ladder |
| `shape-shaper` | 3 shape games | hose-path, build-barrier, pizza-fractions |
| `hose-hero` / `map-master` / `pattern-pro` | 3 of that game | hose-hero / rescue-route / spray-pattern |
| `time-keeper` → `time-traveler` | 3 → 5 clock games | clock-watch |
| `word-watcher` | 20 words | any words |
| `spanish-speaker` → `bilingual-buddy` | 10 → 30 Spanish words | every word in the bank is bilingual |
| `recipe-rescuer` → `kitchen-pro` → `chef-de-station` | 3 → 5 → all 13 recipes | the kitchen book |
| `team-player` | 3 different shift days | coming back |
| `community-helper` | all 12 missions | the whole town |

Sparks (12–20 per mission) only ever buy station decorations — sixteen of them, 20–120 Sparks,
including the **World Map** the Festival Rescue Exchange teases. Nothing gates learning, nothing
expires, and every upgrade stays reachable by playing.

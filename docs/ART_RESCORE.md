# Station Spark — Art Direction Re-score

**Reviewer:** Art Director · **Date:** 2026-09-06 · **Build reviewed:** working tree at `703fec3` (+ the uncommitted meta-screen edits), web export, phone 390×844 and tablet 820×1180, every route in the brief, plus scrolled captures of Progress / Kitchen / Training / Garage / Locker, play-state captures of the three question-gated games, and the recipe runner.
**Status:** CRITIQUE ONLY. No source was changed. This re-scores `docs/ART_CRITIQUE.md` (build `dc1c9c0`) after the seven-engineer pass.

Read this with the original critique open. The reference frames in `SPARK STATION REF ART/` are still the spec.

---

## Where we are now vs the reference

The original verdict was "a diagram of a place." That is no longer true. Every one of the 22 mini-games now stands on a `<Stage>` with a horizon, a ground plane and perimeter dressing; the map is a full-bleed town with eleven individually drawn buildings, a car, a boat, birds, a fountain and chimney smoke; the Firehouse has an apron with a hydrant, coiled hose, bollards, door numerals and a noticeboard, a façade with a side plane, a soffit and door reveals, and an evening palette with a moon; Rookie has a jacket, trousers, boots and visible hair; heads-in-circles no longer act inside games; the emoji are gone (118 → 0 in the world layer, 55 drawn glyphs and ~150 vocabulary icons in their place); the logo seats its ray-arc on an organic plaque; the Garage has a room and a low-poly truck you can spin. Three of the four blocking defects (Clock Watch numerals, Divide & Share overlap, Signals placeholders) are fixed. This is a different product from the one I scored five days ago.

What remains is a second tier of problems that only became visible once the first tier was cleared, plus a handful of things the pass broke. In order of how much they cost us: **the art has exposed two learning-content bugs** (Gear Sort tells a child a yellow hose is "blue"; Vocab Tap shows a `?` tile for 39 words); **two tactile games show sky *below* the ground** because the Stage's ground plane sits behind the tray; **the Kitchen hub is a see-through collage** (locked cards at 70 % alpha over a dressed wall); **the tablet Dispatch board is still half empty** (now cream instead of sky); **Beacon appears twice** whenever a hint bubble is up beside the crew; **the question scrim still greys the prompt banner and the world**; and **truncation moved** rather than died (`Extinguis…`, `Capitana Sofía's Ques…`, the dispatch-slip tagline, the training-tile blurb). None of these is more than a day's work. Most are hours.

| Axis | Was | Now | One-sentence justification |
| --- | ---: | ---: | --- |
| **Composition** | 4 | **7** | Every screen now has a floor and a horizon and the dead sky is gone, but the tray hides the Stage ground in Ladder Builder and Build the Barrier (sky reads *under* the field), the tablet Dispatch board is ~50 % empty cream, the Mission Brief hero carries ~100 px of blank pavement, and the kitchen crew stands at toy scale on a tablecloth. |
| **Shape language** | 6 | **7** | Layered tree/bush/pine families, 2.5D buildings, a real fire pit, a clipboard, a blueprint board and a drawn radio console replace the primitives, though the map trees are still ball-on-stick, Hose Hero's awning is one continuous red beam per floor, and its A-frame chalkboard reads as a sad face. |
| **Colour** | 7 | **8** | The evening palette, tinted locked badges, navy-tinted disabled states and a warmer 0.18 scrim are all right; what holds it back is that the scrim still desaturates the prompt banner to grey on six games and the Dispatch tablet board is a large flat cream void. |
| **Character appeal** | 5 | **8** | The rebuilt Person rig (waist break, shoulder caps, cuffs, boots, hair under the brim) is genuinely appealing at every size and the crew now acts inside games, but the kitchen games shrink the crew to ~45 px figures on a tablecloth, a second Beacon portrait appears beside the crew Beacon whenever a hint is up, and Gino's raised arm merges with his head. |
| **World richness / detail** | 3 | **7** | The map, the Firehouse and the street/yard/counter stages are now at 70–80 % of reference density; Code the Route is still three identical houses on flat green cells against the reference's dense city, Spray Patterns and Hose Path float their play objects between two buildings, and Dispatch Decoder's four addresses are still one house glyph in four roof colours. |
| **Motion / life** | 5 | **8** | Every stage drifts and sways, the map has a looping car, a boat, birds, a fountain and smoke, birds cross the home sky, the crew reacts with moods, the badge flips in 3D and the truck spins; the remaining gap is that reactions are generic (no per-game payoff beat) and the kitchen crew's idle is invisible at its current size. |
| **UI craft** | 6 | **7** | The station board, rank ladder, clipboard sockets, drawn subject pills and the 3D truck customiser are premium, but truncation has moved to new places, dispatch slips stack their pills vertically and clip the tagline, Code the Route's programme strip overflows the left edge at 9 slots, the Mission Brief subject tiles sit under the CTA on first paint, and the Decal picker wraps to a ragged second row. |
| **Consistency** | 4 | **7** | One tone file (`src/world/tone.ts`), one shadow ellipse, one hint motif and zero emoji make it read as one hand; the leaks are 13 of 25 training tiles showing the fallback star, 39 vocabulary words rendering a `?`, two Beacons on one screen, the 3D truck's "flame" decal rendering as a roundel and the 3D badge's flame as a lozenge. |
| **Overall** | 5 | **7** | A real place, drawn at ~75 % of the reference's density and finish, with a short list of specific, cheap defects standing between it and an 8. |

---

## Top 25 — status

**Done 19 · Partly 6 · Not done 0.**

| # | Item | Status | Note |
| ---: | --- | :---: | --- |
| 1 | Reusable three-layer `<Stage>` | **Done** | `src/world/Stage.tsx`, 11 variants, 24 consumers. One structural flaw: `GameShell`/`GameFrame` draw the backdrop behind the tray, so the ground plane hides under it and a haze band shows between field and tray (Ladder Builder, Build the Barrier). |
| 2 | Logo lock-up redraw | **Done** | Ray-arc seats on the plaque, organic bowed sticker, flame nested. The arc is one continuous band rather than the reference's two rays — acceptable. |
| 3 | Dress the station apron | **Done** | Hydrant, coiled hose, wall reel, two bollards, cone, ENGINE 1/2, "No. 1" plate, noticeboard. No tyre marks, but the apron reads. |
| 4 | Façade depth | **Done** | Side return, soffit gradient, 4-unit door reveals with cast shadow, bay band. |
| 5 | Close the empty sky on home | **Done** | Gap chip→roof is ~50 px on phone; neighbour rooftops and a readable skyline behind. |
| 6 | Tree/bush/pine family | **Done** | Three silhouettes each, darker back layer, `TreeLine` never repeats visibly. The *map's* trees are still a two-tone ball on a stick (`TownMap.tsx` `Trees`). |
| 7 | Unify room-tile icons | **Done** | Six icons, one contact ellipse, one shade, one highlight; the Map is now a survey board with a hopping pin. |
| 8 | Ambient sky life | **Done** | `Birds.tsx` arcs one bird every ~20 s, `Sun.tsx` bloom, evening moon + stars. |
| 9 | Give the Garage a room | **Partly** | Lockers, extinguisher, pegboard, reel, tyre stack, workbench and lamp are all there and the 3D truck is a delight — but the truck casts no contact shadow, its flame decal renders as a white roundel, a red toolbox still peeks from behind the bumper as a "mystery red blob", Pepper stands in a cyan puddle that reads as Beacon's glow, and the Decal picker wraps to a second row. |
| 10 | Dispatch band crop + desk strip | **Partly** | Crop fixed, bell house in frame, console/radio/mic/mug/"REAL PEOPLE" screen built, Bea seated (head-and-shoulders, as in the reference). Tablet still ends in ~600 px of empty cream board; slips stack pills vertically and truncate the tagline. |
| 11 | Dress every mini-game stage | **Done** | 22/22 on a Stage with crew. Caveats: Spray Patterns' chips and Hose Path's board still float between two buildings; the kitchen variant's pot rack is cropped by the prompt banner on four games. |
| 12 | Full-bleed Mission Brief hero | **Partly** | Full-bleed, card overlaps, logo dropped, NPC outside the shop. But the subject tiles render under the floating CTA on first paint (clipped, exactly as before), and the hero band is ~100 px of flat pavement under a thin elevation. |
| 13 | Eleven individual map buildings | **Done** | Eleven named building functions, each with its own architecture, awning, plate and chimney. The station's roof emblem reads as a drop, not a flame. |
| 14 | Full-bleed the map | **Done** | Haze top and bottom, asphalt roads, no rectangle. The CTA now covers the SPARK CITY sign and the Market pin on phone and the Pizza Piazza pin on tablet. |
| 15 | Life on the map | **Done** | Looping car, boat, two birds, fountain, chimney smoke, flag, river shimmer — 11 loops. |
| 16 | Travel cinematic rebuild | **Done** | Verified in source: drawn `FireTruck`, three parallax layers (far/mid/props/road), road dashes, siren wash, "We're here!" sticker; skippable. Not captured as a still. |
| 17 | Awnings/sills for the station scene, façade cornice/side/planters/chalkboard | **Done** | Striped awnings on, sills, planters, cornice, A-board, lamp post. See Hose Hero note: the awning is one continuous band per floor and the A-board reads as a face. |
| 18 | Redraw the pizza | **Partly** | Puffy scalloped crust, sauce, shredded cheese, peel, cutter, counter, tiled wall. But the shredded cheese is on *every* pizza from the start, so "¼ cheese" has nothing to add; the chalkboard is 80 % hidden behind the banner; the crew is toy-scale on the cloth. |
| 19 | Water Tank on the truck, Hydrant Match on a street | **Done** | Both are scenes now. Water Tank: Pepper stands inside the front wheel's dark circle — move her a few px. |
| 20 | Re-anchor kitchen backdrops | **Partly** | The runner (`KitchenBackdrop.tsx`) is letterboxed to a 390×700 design box and the sign has lost its tail — good. The hub is still broken: locked recipe cards are `opacity: 0.7` so the truck, lamps and chalkboard render *through* the cards; a lampshade sits on Bea's portrait like a hat; titles and blurbs truncate. |
| 21 | Purge emoji | **Done** | Zero emoji in `src/` outside one code comment. 55 `GlyphIcon`s, drawn subject pills, drawn counters, drawn wave hand, drawn travel truck. |
| 22 | Rebuild the Person rig body | **Done** | `rig/Person.tsx`: hem at y=129, shoulder caps, cuff bands, boot block, headwear lift so hair shows. Reads at 40 px and at 400 px. |
| 23 | No heads-in-circles as actors | **Done** | `world/scenes/CrewFigure.tsx`; Rescue Pets, Ladder Builder, Divide & Share and Recipe Scale all use rigs. Portraits remain only in dialogue/hint/ask surfaces — see the "two Beacons" note. |
| 24 | Fix the modal scrim | **Partly** | 0.42 navy → 0.18 warm grey in `Modal.tsx`, `ModalCard.tsx` and both `AskQuestion`s. But the scrim still covers the `PromptBanner`, which turns it flat grey, and the world still reads dimmed on Rescue Pets, Equipment Check and Code the Route. |
| 25 | Resident character + FX in every game | **Done** | `GameCrew` in all 22 games with `idle/think/happy/cheer`, cyan glow, tail wag; sparkle/confetti/dust FX wired. |

### Original blocking defects

| Defect | Status |
| --- | :---: |
| Clock Watch numerals doubled | **Fixed** |
| Divide & Share plates overlap / orphan "4" | **Fixed** |
| Signals `step 1…4` placeholders | **Fixed** (numbered sockets on a clipboard) |
| Hint bubble covers the answer row | **Partly** — lifted clear of the tray everywhere, but it now covers the *drop sockets* in Word Builder and the Escuchar button + RadioCard in Dispatch Decoder |
| Truncation (`Fla…`, `Bell pep…`, `mushr…`, `Check the…`, kitchen blurb) | **Partly** — all five named cases fixed; new: `Extinguis…` (Equipment Check tray), `Capitana Sofía's Ques…` and 3-line `…` blurbs (Kitchen hub), dispatch-slip tagline `…`, training-tile blurb `…` |
| `azúcar` white-on-white | **Fixed** (the tile is pale blue — though it is a blank square with no drawn container, see Measure & Pour) |
| Kitchen backdrop crops lampshades and sign | **Partly** — runner letterboxed; hub lamps still collide with the portrait |

### New defects found in this build (fix before the next pass)

1. **Gear Sort "Sort by Color" is wrong as a lesson.** `src/learning/generators/gear-sort.ts` assigns `bin = bins[i % 3]` round-robin regardless of what the gear looks like, so a *yellow* hose lands in "Blue" and a *navy* radio in "Red"; `GearSort.tsx:160–161` then paints the answer onto the tile border. A child sorting honestly by colour is told they are wrong. Sort by the icon's actual drawn colour (add a `color` to each `EquipmentId`) and drop the border tint.
2. **Vocab Tap renders a `?` tile for 39 words.** `VocabTap.tsx:130` passes `option.id` to `<VocabIcon>`; the vocabulary maps many ids to a shared icon (`librarian→library`, `firefighter→helmet`, `four…twelve→ladder`, `hello/thank-you/goodbye/yes→happy`, `kitten→cat`, `puppy→dog`, `near→open`…). Pass `option.icon`.
3. **Code the Route programme strip overflows.** With a 9-command programme the slot row runs off the left edge (slot 1 is not visible) — `RescueRoute.tsx:385–388`. The "wrap onto a second row" intent isn't happening.
4. **Sky under the ground** in Ladder Builder and Build the Barrier — `GameShell.tsx` renders `backdrop` behind the tray with a fixed `groundHeight`.
5. **Kitchen hub locked cards are translucent** — `RecipeCard.tsx:132` `locked: { opacity: 0.7 }` over a fully dressed wall.
6. **Two Beacons on screen** whenever a `HintBubble`/`BeaconHint` (portrait) is up beside `GameCrew` (rig): Listen & Count, Spray Patterns, Signals, Hose Path, Hydrant Match, Word Builder, Dispatch Decoder, Market Money, Shape Builder.
7. **Count Ingredients:** Rosa's rig stands on top of the last ingredient tile in the lower shelf row — a character over an interactive tile.
8. **13 of 25 training tiles show the fallback star** (`TrainingStationTile.tsx` `ICON_GLYPHS` lacks `bucket, right, sun, help, apple, three, house, library, cat, milk, strawberry, taco, soup`).

---

## Per-screen notes (only where still off-model or newly broken)

### `/` Firehouse home
Now our best screen by a distance and very close to the reference. Two nits. **The greeting bubble covers the left bay door, ENGINE 1 and Rookie's helmet** — anchor it above the roofline or to the right of the sign. **Between midnight and 06:00 the sky is evening but the copy says "Good morning"** (`FirehouseScreen.tsx:85–92` use two different hour rules) — share one clock. Tablet: the chip→roof gap is ~95 px; fine.

### `/dispatch`
**Tablet: the cream station board runs ~600 px empty below two slips** (`DispatchScreen.tsx:183` "two-up so the board never ends in dead space" — it does). Either run the slips three-up on tablet, or make the desk strip and the window scene taller so the board is a third of the height, not two thirds. **Phone slips stack their subject pills in a column** (Math / Reading / Problem Solving under each other) because the text column is squeezed between the thumbnail and the chevron, and the tagline truncates with `…` (`DispatchSlip.tsx:84` allows two lines but the column is too narrow). Fix: pills in a wrapping row under the full card width, thumbnail narrower on phone.

### `/map`
**The "Choose a Mission" CTA sits on the art**: it hides the second line of the SPARK CITY sign and half the Market pin on phone and the whole Pizza Piazza pin on tablet (`MapScreen.tsx:284–333`). Move the CTA into the bottom-bar lane or shift the sign and the two southern pins up. **The station's roof emblem reads as a drop** (`TownMap.tsx` `FireStation`) — use the logo flame. **The map trees are still two-tone balls on sticks** while the home screen trees are layered — reuse `Trees.tsx` silhouettes at map scale.

### `/training` Training Yard
The yard is real now (tower, bunting, rope wall, barrel, chalk line, Pepper). **13 of 25 tiles show a generic star** (see new defect 8) — Clock Watch, Shape Builder, Word Builder, Rescue Pets, Gear Sort, Signals, Vocab Tap, Listen & Count, Measure & Pour, Count Ingredients, Divide & Share, Recipe Scale, Code the Route. **Blurbs truncate at three lines** ("…then work out the …"). The bullseye sign at the top-right collides with the star counter.

### `/kitchen` hub
**Newly broken.** Locked cards at 70 % alpha let the window-with-truck, the lamps, the pot rack and the chalkboard render *inside* the cards; the effect is a collage, not a room. Make locked cards opaque and mute them by tint (cream + `lockedGrey` chevron), blur/darken the backdrop behind the list, and re-anchor the backdrop so it doesn't scroll into the cards. **A red lampshade sits on Captain Bea's portrait** like a hat. **`Capitana Sofía's Ques…`** (`RecipeCardFrame.tsx:35` `numberOfLines={1}`) and two blurbs truncate — let the title wrap. The recipe glyphs are now proper drawn stickers — good.

### `/kitchen/[recipe]` runner
Letterboxed and whole — a real fix. Still: **the upper-left ~190×300 px is bare plaster** (the sign, shelf and stove all sit below y≈330). Add the crew at the counter or a hanging utensil rail there. The pot-rack pots are dark half-discs; give them a lit rim so they read as pans.

### `/garage`
The room and the 3D truck are the reward the brief asked for. **The truck floats: no contact shadow under the tyres** — add a blob shadow plane under the model. **The "Flame" decal renders as a white disc with a red dot** (a roundel) — bake the logo flame into the decal texture. **A red toolbox still peeks from behind the bumper as an unexplained red blob** — move it fully into view or remove it. **Pepper stands in a cyan puddle that reads as Beacon's glow** — make the puddle floor-grey with a truck reflection, and put Beacon in the room. **Decal picker wraps** ("Paw / Bolt" on a ragged second row) — five segments need two rows of equal width or icon chips.

### `/mission/[id]` brief
**The subject tiles are still clipped under the CTA on first paint** (`MissionBrief.tsx:151,201` absolute `ctaWrap`; the ScrollView's `paddingBottom` doesn't protect the last row at the initial offset). Put the tiles above the fold or add the CTA height to the padding. **The hero band is a thin elevation over ~100 px of empty pavement** — lower the shop onto the kerb and put a bench, a bin and a bike rack on the pavement. Gino's raised hand merges with his head (the `wave` pose at this scale) — use `point` or `stand`.

### Mini-games — shared
- **Ground plane behind the tray** (`GameShell.tsx`, `GameFrame.tsx`): the Stage's `groundHeight` is fixed, the tray covers it, and Ladder Builder / Build the Barrier show a haze band with ghost pillars *below* the field. Pass `trayH` (+ footer) into `<Stage>` so the ground rises above the tray.
- **Two Beacons.** The hint bubble's `CharacterPortrait` and the `GameCrew` rig coexist. Either point the bubble's tail at the crew Beacon and drop the portrait, or hide the crew Beacon while `hint.visible`.
- **Scrim over the banner.** Both `AskQuestion`s scrim the whole frame at 0.18, so the white `PromptBanner` goes grey and the world dims (Rescue Pets, Equipment Check, Code the Route). Scrim only the play area, or float the card with `shadows.card` and no scrim.
- **Counter variant collides with the banner**: the pot rack's pans peek out under the prompt banner as three dark blobs on Pizza Fractions, Measure & Pour, Divide & Share and Recipe Scale. Drop the rack 60 px or hide it behind the HUD.
- **Crew at toy scale** in every kitchen game (~45 px figures standing *on* the tablecloth next to a 300 px pizza). Stand them behind the counter at counter height, or drop them to a single Pepper peeking over the edge.
- **Hint bubble covers drop targets** in Word Builder (the letter sockets) and the Escuchar/RadioCard row in Dispatch Decoder — the bubble is clear of the *tray* but not of interactive content in the play area's bottom 120 px.

### Hose Hero
Closest to the reference of any game now. **The awning is one continuous red band per floor** — the reference scallops one awning per window; split it. **The A-frame chalkboard reads as a sad face / tombstone** (two white strokes and a tan oval on a dark board) — write a drawn word or a pizza on it. The truck at the bottom-left is cropped and overlaps the counter strip.

### Water Tank
Done — the tank is on the truck, the truck is on the yard. **Pepper is drawn inside the front wheel's dark circle** so she reads as sitting in a tyre; nudge her forward of the wheel. The training tower at the right is cropped by the "0 pumps" HUD.

### Ladder Builder / Build the Barrier
See "ground plane behind the tray" — both show sky below the field. Barrier's field is otherwise excellent (rounded field, dirt path, four cones, a real fire pit).

### Number Ladder
The ladder leans on a real building now — good. **The child starts at 33 but the ladder's scale stops at 24 under the banner**, so the start position is off-screen (the original "numbers clipped at the top" in a new form). Clamp the visible window to include start and target, or scroll the scale.

### Rescue Pets
Full rigs now, and the basket works. **The animals perch in the tree regardless of species — six turtles in a canopy** (`RescuePets.tsx:201–220` spreads every species across `geo.tree`). Give turtles/ducklings a pond perch and kittens/bunnies the tree. **Copy says "at the Fire Station" on a park stage.** The stranded animals are still six identical sprites — vary tint and ear/head angle.

### Equipment Check
**The compartment silhouettes are ≈20 px tall** and the compartment is a dark navy box — the reference fills the frame with a bright compartment and hand-sized silhouettes. Scale the shelves to the tray-tile size (≈64 px) and light the interior. `Extinguis…` truncates in the tray. The cab is cropped at the left edge.

### Gear Sort
The wall (pegboard, lockers, shelf) is right. **The colour lesson is wrong** — new defect 1. Also the tile border paints the answer.

### Dispatch Decoder
The radio room is on-brief. **All four address answers are the same house with a different roof colour** — unchanged from the original critique; use four `TownMap` silhouettes. The hint bubble covers the Escuchar button and the RadioCard.

### Code the Route
**Street names are still white text struck through by the road dashes** (`RescueRoute.tsx:588–600, 628` `streetName` overlay at 9 px). Put them on drawn sign posts at the row ends. **The programme strip overflows at 9 slots** (new defect 3). The grid is still thin against the reference — three identical houses, two barriers, two trees on flat green — add the pond, the excavator, a second house type and a kerb per block.

### Spray Patterns / Hose Path
Both games' play objects float between the station wall and the training tower with no rail or board. Spray: draw the sequence on a hose-rail ribbon. Hose Path: hang the board on the wall with brackets and remove the mystery tan tint on tree cells.

### Vocab Tap
**`?` placeholder in an answer tile** (new defect 2). The pink eraser and cyan fragment at the top corners are cropped shapes under the banner.

### Listen & Count
Store room is good. **Two Beacons** (portrait left, rig right). Copy says "in the truck" while the buckets sit on a store-room shelf. Ten identical buckets — the brief asked for variation.

### Market Money
The stall is charming; **there is no ground or horizon behind it** — the stall floats on raw sky above a counter panel. Put it on the `stall` Stage's ground plane.

### Word Builder
The hint bubble covers the letter sockets (the drop targets). The pale-blue "haze columns" on the classroom's upper wall read as ghost pillars.

### Pizza Fractions
See #18. Start the base pizza without cheese; move the crew; drop the pot rack; put the target on the chalkboard. On tablet the bowl column has ~350 px of empty tan under three bowls.

### Measure & Pour
**The `agua` tile is a blank pale-blue square** — draw a jug. The measuring cup's handle is drawn behind the cup and reads as a rim. ~125 px of bare tiled wall between the banner and the cup.

### Count Ingredients
Rosa overlaps the last tile (new defect 7). Otherwise done: varied tokens, shelf brackets, drawn wave hand.

### Divide & Share / Recipe Scale
Both defects fixed and both use rigs. A paper-towel roll stands between Beacon and Pepper on both screens and reads as Pepper holding a roll — move it to the wall shelf. Recipe Scale's "Serves 2 → 4 eating" strip collides with the chalkboard and pot rack.

### `/dev/three`
The 3D badge's flame is a gold lozenge, not the `BadgeArt` flame — bake the 2D icon as the face texture so the flip lands on the same badge the child sees on the board.

---

## The next 10

Ranked by impact. **S** ≈ half a day, **M** ≈ 1–2 days.

| # | What | Where | Effort |
| ---: | --- | --- | ---: |
| **1** | **Fix the two lessons the art exposed.** Sort-by-colour must sort by each icon's *drawn* colour (add a `color` per `EquipmentId`, stop assigning bins round-robin) and the tile border must stop painting the answer; Vocab Tap must look icons up by the word's `icon`, not its `id`, so no answer tile ever shows `?`. | `src/learning/generators/gear-sort.ts`, `src/minigames/logic/GearSort/GearSort.tsx`, `src/minigames/logic/VocabTap/VocabTap.tsx` | **S** |
| **2** | **Raise the Stage ground above the tray.** Pass the measured tray (+ footer) height into `<Stage groundHeight>` (or position the backdrop with `bottom: trayH`) so no game shows sky under its field. | `src/minigames/tactile/shared/GameShell.tsx`, `src/minigames/logic/shared/GameFrame.tsx`, `src/world/Stage.tsx` | **S** |
| **3** | **Un-collage the Kitchen hub.** Opaque locked cards (tint, not alpha), a blurred/darkened backdrop behind the list, the lamp off Bea's portrait, titles and blurbs that wrap instead of `…`. | `src/ui/kit/RecipeCard.tsx`, `src/kitchen/parts/RecipeCardFrame.tsx`, `src/kitchen/KitchenScreen.tsx` | **S–M** |
| **4** | **Dispatch slips + tablet board.** Pills in a wrapping row under the full card width, a two-line tagline that never truncates, three-up slips on tablet (or a taller desk/window scene) so the board is never half empty. | `src/ui/kit/DispatchSlip.tsx`, `src/screens/Dispatch/DispatchScreen.tsx`, `src/screens/Dispatch/DispatchBackdrop.tsx` | **M** |
| **5** | **Code the Route at reference density.** Wrap the programme strip so slot 1 is always visible; street names on drawn sign posts at the row ends instead of white text over the dashes; add the pond, the excavator, a second house type and kerbs. | `src/minigames/logic/RescueRoute/RescueRoute.tsx`, `src/minigames/logic/shared/art/*` | **M** |
| **6** | **One Beacon per screen.** Drop the hint portrait and point the bubble's tail at the crew Beacon (or hide the crew Beacon while a hint is visible); keep the bubble clear of drop sockets and the Escuchar row, not just the tray. | `src/ui/kit/HintBubble.tsx`, `src/minigames/tactile/shared/BeaconHint.tsx`, `src/characters/GameCrew.tsx` | **S–M** |
| **7** | **Scrim only the play area.** Float `AskQuestion` with `shadows.card` and no full-frame scrim (or exempt the `PromptBanner`), so the banner never turns grey and the world never dims. | `src/minigames/tactile/shared/AskQuestion.tsx`, `src/minigames/logic/shared/AskQuestion.tsx` | **S** |
| **8** | **No fallback stars, no truncated blurbs on the yard.** Add the 13 missing ids to `ICON_GLYPHS` (or route them through `VocabIcon`), and let the tile blurb wrap. | `src/screens/Training/TrainingStationTile.tsx` | **S** |
| **9** | **Kitchen stage collisions.** Pot rack below the banner line, crew at counter height behind the counter (not on the cloth), a drawn jug for `agua`, the target fraction chalked on the board, the base pizza without cheese so "¼ cheese" adds something. | `src/world/Stage.tsx` (counter), `src/kitchen/games/PizzaFractions/*`, `src/kitchen/games/MeasurePour/*`, `src/characters/GameCrew.tsx` | **M** |
| **10** | **Nothing under the CTA.** Mission Brief subject tiles above the fold (or CTA height added to the scroll padding); the map's CTA moved into the bottom-bar lane so the SPARK CITY sign and the Market/Pizza pins are never covered; the Garage truck given a contact shadow and a real flame decal. | `src/screens/Mission/MissionBrief.tsx`, `src/screens/Map/MapScreen.tsx`, `src/screens/Garage/GarageBay.tsx`, `src/three/*` | **S** |

---

## Verdict

**It is a place now.** Five days ago a child looked at a glass rectangle in a blue void and was asked to fill it; today she fills a tank bolted to a fire engine parked on the station yard, with a training tower behind it and Pepper at the wheel. The map is a town you could give directions in, the Firehouse is somewhere you would want to come back to, and the crew are people rather than heads. **Would a child gasp?** At the map, at the Firehouse at dusk, at spinning the truck — yes. At most mini-games she would settle in happily, which is the right reaction for a learning screen; nothing yet makes her gasp *inside* a game, because the reaction beats are generic and the two most cinematic moments (the badge flip, the travel) are short. **Would a parent trust it?** Mostly. The finish reads as intentional and safe, the type is clean, nothing is red-for-wrong. What would make a parent hesitate is exactly the short list above: a `?` where a picture should be, a yellow hose in the "Blue" bin, a truncated `Extinguis…`, a recipe card with a truck showing through it. Those read as *unfinished* rather than *unsafe*, and they are all hours, not days.

**The single change that would most raise the score** is the pair of content fixes at the top of the list — Gear Sort's colour bins and Vocab Tap's `?` tiles — because they are the only places where the art now contradicts the lesson, and a learning app is judged first on whether it is right. After that, raising the Stage ground above the tray closes the last "floating" read in the tactile games and takes Composition to an 8 on its own.

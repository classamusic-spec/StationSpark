# Station Spark — Art Direction Critique

**Reviewer:** Art Director · **Date:** 2026-09-05 · **Build reviewed:** `dc1c9c0`, web export, phone 390×844 and tablet 820×1180, every route.
**Status:** CRITIQUE ONLY. No source was changed. This document is the brief for the three art engineers (W1, W2, C).

Read this with `docs/ART_DIRECTION.md` open. Everything below is measured against `SPARK STATION REF ART/` — nine frames that are, frankly, the best thing in this repository. **The reference is the spec. We are not close to it.**

---

## Where we are vs the reference

The reference frames are a *place*: a warm, deep, densely-dressed little town where light falls on things, buildings have awnings and lamp posts and chalkboards, characters stand on ground, and every square inch has a reason to be looked at. What we shipped is a *diagram of that place*. The palette is right, the corner radii are right, the buttons are genuinely nice, and a handful of components (`SceneHero`'s bakery, `EquipmentIcon`, `BadgeArt`'s shield, the Garage truck) prove the team can draw. But the game reads flat and empty because three things are systematically missing: **ground** (objects float in raw sky with no plane, no cast shadow, no horizon), **dressing** (a mini-game is one object on a gradient — no props, no signage, no plants, no wires, no birds, no vehicles, no people), and **life** (outside the Firehouse home screen, essentially nothing idles). On top of that sits a consistency problem that a child will not name but will feel: emoji sit next to hand-drawn SVG in the same row, half the props have a shadow ellipse and half don't, the same building template is reused eleven times on the map, and four different sign/plaque treatments compete on four adjacent screens. There are also outright defects shipping today — the Clock Watch dial renders its numerals doubled and overlapping, Divide & Share's plate cards overlap each other with their numbers outside the cards, Signals shows literal `step 1 / step 2` placeholder strings, and the modal scrim drops a 42 % navy sheet over the entire world so Rescue Pets and Equipment Check look like they've been left out in the rain. The bones are good. The finish is a prototype.

| Axis | Score | One-line verdict |
| --- | ---: | --- |
| **Composition** | **4 / 10** | Enormous dead sky in almost every mini-game (300–500 px of nothing); objects float unanchored; the tablet layout of `/dispatch` is >50 % empty. |
| **Shape language** | **6 / 10** | Radii and the "sticker" rule are followed, but the vocabulary is primitive — trees are three circles on a stick, houses are box + triangle + two squares. |
| **Colour** | **7 / 10** | The palette is disciplined and on-brand. Let down by washed-out backdrops, an over-used raw sky gradient, and a scrim that desaturates whole screens. |
| **Character appeal** | **5 / 10** | Faces are charming. Bodies are not: Rookie is a navy blob with detached oval arms, and `CharacterPortrait` heads-in-circles are used as *actors* inside games (a head in a basket, a head on a ladder). |
| **World richness / detail** | **3 / 10** | **The single biggest gap.** The reference has ~40 designed elements per frame. We have 3–6. No lamp posts, no wires, no birds, no parked cars, no shop signage, no crowd, no hydrants outside one game. |
| **Motion / life** | **5 / 10** | The primitives are excellent (`useIdleBob`, `useBlinkState`, `usePulse`, clouds/flag/bell/smoke/truck-lights all loop). They are used on exactly one screen. 20 of 22 mini-games have zero ambient motion. |
| **UI craft** | **6 / 10** | Buttons, pills, panels and the XP bar are premium. Undone by truncation (`Fla…`, `Bell pep…`, `champiñ…`, `Raise lad…`), overlapping cards, and the hint bubble covering the answer row on six games. |
| **Consistency** | **4 / 10** | Emoji vs SVG in the same component; shadow ellipse present on ~half the props; awnings on some façades and not others; four plaque treatments. |
| **Overall** | **5 / 10** | A strong system, drawn at 40 % of the density the reference demands. |

---

## Per-screen notes

### `/` Firehouse home — *the front door, and it is our best screen*

**Works.** The composition is legible; the 3×2 room grid recessed into the façade is a genuinely good idea and reads as a building, not a menu. Clouds drift, the flag waves, the bell sways, the chimney puffs, pigeons sit on the roof, Rookie/Beacon/Pepper are all present and idling. `StationDetails.tsx` and `Flag.tsx` are doing real work.

**Flat / wrong.**
- **~120 px of empty sky** between the shift chip row and the roof ridge on phone, and ~180 px on tablet. The building is too small in frame and floats.
- **The façade has no depth.** `StationFacade.tsx` is a pure elevation: no side wall, no roof soffit shadow, no reveal on the bay doors, no apron under the driveway. The driveway is a 14-unit grey `Rect` at the bottom edge.
- **No station dressing at all.** Missing: hydrant, hose reel on the wall, coiled hose, bollards, a ladder on brackets, "ENGINE 1" door numbers, an address plate, bunting, a noticeboard, a bench, a bin, a bicycle, a puddle, tyre marks on the apron.
- **The distant skyline is invisible** — `TownSkyline` renders at `opacity 0.5` in pale blue against a pale blue sky. It contributes nothing.
- **Trees are two circles and a stick** (`Trees.tsx` `Tree`), repeated identically along `TreeLine`. In the reference the treeline is a layered mass with silhouette variation and a darker back layer.
- **Room-tile icon language is mixed.** The Cone and TruckMini have a ground shadow ellipse; the Radio, Map, Chef Hat and Shield do not. The Map icon is a flat green polygon that reads exactly like the 🗺️ emoji.
- **Rookie's silhouette is a blob.** Navy torso, navy legs, navy shoes, no waist break — read as one dark mass at thumbnail size. The reference Rookie has a clear jacket/trouser/boot separation with two yellow bands doing the reading.
- **Beacon overlaps the right bay door** and has no cyan glow pool on the ground beneath it (the doc calls for one).
- **Pepper is cropped by the Start Shift button** on phone.

**Make it premium.** Push the building up ~15 % in frame and dress the apron: hydrant + coiled hose + two bollards + a cone + door numbers + a wall-mounted hose reel. Add a mid-ground layer of two or three neighbour rooftops behind the station so the skyline reads. Give the roof a soffit shadow and the bay doors a 4 px inset reveal. Give every room-tile icon the same shadow ellipse. Add one bird flying a slow arc across the sky every ~20 s.

---

### `/onboarding` — *floating in a void*

**Works.** Captain Bea's rig is appealing; the copy card is clean; the 3-dot pager is correct.

**Flat / wrong.** ~300 px of pure sky gradient with a character floating in the middle of it and a 6 px shadow ellipse that anchors nothing. The bottom "ground" band is a hard-edged striped rectangle with tree trunks visible *through* the CTA — there is a visible horizontal seam where the backdrop meets the sky. The sun is a hard yellow disc with straight spokes, top-right, colliding with the "For Grown-Ups" chip on the home screen and reading as clip-art here.

**Make it premium.** Set Bea on the station apron (reuse the Firehouse ground plane), not in mid-air. Put a soft vignette on the sky. Kill the seam. Replace the spoke-sun with a soft radial bloom.

---

### `/dispatch` — *the header band is broken, the tablet layout is half empty*

**Works.** The dispatch slips are the closest thing in the app to the reference: white card, scene thumbnail, title, tagline, subject pills, green round chevron. The `SceneThumb` art (clock tower with Luna, bakery with OPEN sign) is charming.

**Flat / wrong.**
- **The hero band is badly cropped.** Trees are sliced at the top edge, the bell house is half off the right edge, and a green hill band bleeds *behind* the title card producing a stripe of grass floating in the sky. On tablet the whole band is a green rectangle behind a cream card with the logo hovering over the seam.
- **Subject pills use emoji** — 📖 Reading, 💡 Problem Solving, 💬 Español, 🤝 Teamwork, 🍳 Cooking — while Math uses a typographic `＋`. Six pills, two different drawing languages, side by side. (`src/ui/SubjectPill.tsx`)
- **Tablet: >50 % of the screen is empty sky** below "See all missions". Two cards on an 1180 px canvas.
- Captain Bea in the dialogue bar is a head-in-a-circle portrait, not a rig.
- No dispatch-room dressing: the reference frame has a radio, a monitor with a community message, a desk edge and Rookie seated at the console. We have none of it.

**Make it premium.** Build a proper dispatch-desk foreground strip along the bottom (console edge, radio, mic, mug, a screen showing "REAL PEOPLE · BRIGHTER COMMUNITIES") and let Bea sit at it. Fix the band crop so the bell house is fully in frame. Draw the six subject glyphs as SVG.

---

### `/map` Spark City — *eleven copies of the same house*

**Works.** The river path, the two bridges, the pin-label system with per-place colours, and the parked fire truck are all right ideas.

**Flat / wrong.**
- **The map is a hard-edged green rectangle floating on the sky**, with no frame, no board motif, no paper edge, no vignette. The reference is edge-to-edge and *is* the screen.
- **Every building is the same template**: tan box + coloured triangle roof + two blue squares + a brown door, differentiated only by roof colour and one glyph (a dog face for Pet Shop, a pizza triangle for Pizza, two circles for Market). The reference gives each building its own architecture, awning, signage and chimney.
- The lighthouse is a candy-stripe pole. The south bridge is a red arc that reads as a croissant. The construction site is an excavator with no operator, no fencing detail, no dust.
- Roads are pale grey-lavender (`#D6DAE8`) and disappear against the green; the reference roads are a clean neutral grey that reads as asphalt.
- **No life at all on the map**: no moving vehicles, no birds, no pedestrians, no smoke from a chimney, no flag movement, no shimmering water beyond a dashed line.
- Locked pins are grey pills with a padlock — nine of eleven pins are grey on first run, so a new child sees a grey map.

**Make it premium.** Full-bleed the map to the screen edges with a soft top haze into the sky. Redraw all eleven buildings as individuals (awnings, signage plate, chimney, window mullions, a shadow side). Add ambient life: a car looping a road, two birds, a bobbing boat, the fountain animating. Give locked pins a warm "coming soon" treatment rather than grey.

---

### `/training` Training Yard — *card list over a random slice of world*

**Works.** The card layout, the subject pill, the "≈120 s" chip and the "New!" flag are clean and readable.

**Flat / wrong.** The backdrop shows arbitrary fragments of world colliding with the list — a red-and-white pole and a hydrant sliced by the card edges at the left and right. The station tile icons are single flat glyphs on pale yellow squares (`src/screens/Training/TrainingStationTile.tsx` carries an emoji map: 💦 💧 🫙 🪜 🔢 📻 🎒 🧰 🧩 🗺️ 🚰 🌈 as fallback). There is no yard: no cones, no training tower, no hose rack, no chalk lines, no Rookie practising.

**Make it premium.** Give the screen an actual training-yard backdrop (chalk-marked apron, cone rows, a training tower silhouette, a hose drying rack) and blur/darken it behind the cards. Replace tile glyphs with drawn scene thumbnails in the `SceneThumb` style so a station card and its game look like the same place.

---

### `/kitchen` — *the backdrop is out of control*

**Works.** The "FIREHOUSE KITCHEN" enamel sign is a nice motif. Recipe cards with the red header tab match the doc.

**Flat / wrong.**
- **The backdrop is scaled up far past its design size.** Lampshades are cropped at the top, the "COOK LEARN HELP!" sign is half off the left edge, the window shows a truck floating on a green band, and 40 % of the screen is a bare brick wall with nothing on it. On tablet it is worse.
- **The sign has a speech-bubble tail** pointing down at nothing.
- **Text overflows badly** — "Fluffy stacks for the whole crew — measure, count, and…" wraps to three lines and collides with the chevron on phone.
- The Cooking pill's 🍳 emoji renders as a magnifier-ish blob at small size.
- Recipe glyphs are inconsistent: the bread is drawn, the pizza is a triangle inside a triangle frame, the taco is a yellow blob, the strawberry reads as a tomato.
- A large grey ghost of the pot sits behind the locked cards.

**Make it premium.** Re-anchor the backdrop to a fixed design box and let it letterbox rather than crop. Dress the wall: a pot rack, a pinned recipe, a chalkboard menu, a spice shelf, a fire-shield tea towel. Remove the tail from the sign. Make every recipe glyph a proper drawn food sticker.

---

### `/kitchen/pizza` recipe runner — *60 % bare brick*

The zoom problem again, worse. The brick wall occupies most of the frame with nothing on it, the pot is cut off at the right edge, the checked cloth is a hard-edged square, and Captain Bea is a head-in-a-circle. There is a large dead zone between the window and the dialogue card. **Fix:** compose the kitchen as a proper stage — counter across the lower third, wall furniture in the upper third, the crew standing at the counter — and never let a wall span more than a third of the screen unadorned.

---

### `/garage` — *nice truck, empty room*

**Works.** The truck is one of the better drawings in the app: shading tone, highlight, ground ellipse, a proper ladder rack. Pepper leaning out of the cab is delightful. The customiser controls are clean.

**Flat / wrong.** The room is a flat tan wall with two light cones and nothing else — no tool board, no lockers, no workbench, no hose reel, no oil stain, no jack, no tyre stack, no floor line. There is a mystery red half-disc floating at the right edge (a helmet, cropped). The "Fla…" decal pill is truncated. The truck's ground ellipse is a single soft blur rather than a contact shadow plus an ambient occlusion pool.

**Make it premium.** Build the garage: painted floor line, a pegboard of tools, a lockers bank, a workbench with a lamp, a coiled hose on the wall, a puddle reflecting the truck. Give the truck a hard contact shadow under the tyres and a soft ambient pool.

---

### `/locker` — *the avatar reveals every rig weakness*

**Works.** The locker bank backdrop is a good motif; the swatch pickers are clear.

**Flat / wrong.** At this size the Person rig falls apart: the torso is a single closed path with no waist, the arms are stubby detached ovals with no shoulder join, the legs are one navy trapezoid with a tiny base for feet, the hair is entirely hidden under the helmet so three of the four hair swatches change nothing visible, and the chest carries a red V + a yellow band + a flame decal that fight each other. The character floats over a thin ellipse.

**Make it premium.** Rebuild the torso with a waist break and visible sleeve cuffs; give the boots a real silhouette; let a fringe/curl of hair show below the helmet brim so the hair picker does something; simplify the chest to jacket + two reflective bands + one small badge.

---

### `/badges` Progress — *an ocean of grey*

**Works.** The rank medallion (helmet in a gold disc), the XP bar, the four stat tiles and the panel stack are all premium-grade UI. This is our best-crafted screen.

**Flat / wrong.** Twenty identical grey padlock shields, each labelled "Keep going!", is what a new child sees. The "Skills Practised" icon is a white triangle in an orange square that reads as a warning/play sign, not a cone. `BadgeArt` icons are monochrome (a single `fill` + derived `shade`), so even unlocked badges will never match the reference's full-colour badge art. The backdrop hills and trees are washed out behind the panels. The empty XP bar is a bare grey pill.

**Make it premium.** Give locked badges a warm silhouette in the badge's own colour at low saturation instead of uniform grey, and vary the label. Give badge icons a second colour. Make the empty XP bar show a faint end-goal marker.

---

### `/grownups` — *unbranded*

Correct and legible, but it is a keypad on a bare gradient with no world, no logo, no character. That is defensible for a parent gate, but it should still feel like Station Spark — add a small Captain Bea at the side and the station apron at the bottom.

---

### `/mission/[id]` Mission Brief — *the hero is a thumbnail*

**Works.** `SceneHero.tsx` contains the best per-place art in the codebase — the Bakery scene has an awning, a bread sign in the gable, a window with loaves, an OPEN sign, a lamp post and bushes. That is exactly the reference's register.

**Flat / wrong.** It is rendered as a small rounded card in the middle of the screen. The reference makes the storefront a **full-bleed hero** at roughly half the screen height, with the copy card overlapping its lower edge. Ours reads as a stock-photo placeholder. The subject pills below the CTA are clipped off-screen. Above the hero sit ~250 px of sky and a logo lock-up that repeats on every screen.

**Make it premium.** Full-bleed the SceneHero, let the brief card overlap it by ~24 px, drop the logo (the child knows what app they're in), and add one character standing outside the building.

---

### Mini-games

A shared verdict first, then the specifics. **Every mini-game is one object on a raw sky gradient.** There is no ground, no horizon, no dressing and no ambient motion. The reference frames for the same games (Hose Hero, Code the Route, Equipment Check, Pizza Fractions) are fully-dressed scenes. This is the single highest-leverage fix in the project: **build three reusable stage backdrops (street, yard, kitchen counter) and put every game on one of them.**

| Game | What works | What is wrong | The fix |
| --- | --- | --- | --- |
| **Hose Hero** | Flames read as friendly teardrops; the building/window grid is legible; hose and hydrant are drawn. | Building is a flat elevation with no side face; windows are navy squares with a diagonal streak and **no awnings or sills** (`sceneTheme` sets `awning: 'none'` for `station`); the counter uses **emoji 🔥 and 💧** (`CountStrip.tsx`); the "STATION" sign is a small pill; only two potted bushes; no truck, no crew, no crowd; huge sky. | Turn on striped awnings, add sills; add the fire truck at the left, Rookie holding the hose, two onlookers; draw the flame/drop counter as SVG; add a kerb, a drain, a lamp post and a chalkboard. |
| **Water Tank** | The tank fill and fraction lines are clear. | **Worst screen in the app.** A glass rectangle floating in the sky, with a disembodied pump lever attached to nothing. ~350 px of empty sky above, ~250 px below. No truck, no ground, no context. | Mount the tank *on the fire truck*. Put the pump lever on the truck body. Ground the truck on the station apron. |
| **Ladder Builder** | The ladder-piece tokens with number discs are nicely drawn. | The "wall" is a tan gradient rectangle in the sky — no building, no windows, no roof; the grass is a flat green rectangle with a hard top edge; **Rookie is a head-in-a-circle avatar**, not a rig; **the puppy is the generic `Puppy` from `Animals.tsx`, not Pepper** (off-model). | Make the wall a real building elevation with windows and a roof; use the full Rookie rig and Pepper; round/tuft the grass line; add a truck and cones at the base. |
| **Number Ladder** | Signed +/− jump buttons are clear and well-shaped. | A lone yellow ladder floating in the sky, leaning on nothing. Numbers clipped at the top (`26` under the banner) and bottom (`0` under the grass). Flat green rectangle ground. | Lean the ladder on a building. Clamp the number range to the visible window. Dress the base. |
| **Rescue Pets** | Bunny/kitten/duckling rigs are cute and blink. | **The entire screen is greyed out** by the 42 % navy modal scrim (`Modal.tsx` / `ModalCard.tsx`) — sky, trees, banner, all desaturated. **Rookie is a head-in-a-circle sitting in a basket**, which reads as a severed head in a basket. Five identical bunnies with no variation. The tree is three circles. | Drop the scrim to ~18 % and warm it, or float the question card with no scrim. Use the Pepper/Rookie rigs. Vary the animals (pose, tint, ear angle). Redraw the tree with a layered canopy. |
| **Build the Barrier** | The barrier tokens with number discs are good. | The play field is a hard-cornered green rectangle butted against the sky; the campfire is a heap of grey blobs; only two cones, in opposite corners; the token tray overflows and clips the "10" piece. | Round the field, add grass tufts and a dirt path; redraw the fire pit with proper logs and stones; ring the field with cones and a tape line; fix the tray height. |
| **Equipment Check** | The compartment grid with dashed silhouettes is a smart mechanic; `EquipmentIcon` art is genuinely good. | The scrim greys everything. The truck is small and cropped at the left; the compartment is a dark navy box. The reference makes the truck **full-bleed, filling the frame**, with a bright metal compartment. Huge empty sky above. | Make the truck fill the frame edge-to-edge as in the reference. Light the compartment interior. Fix the scrim. |
| **Gear Sort** | Bins with bilingual labels and count discs are clear; gear icons are well drawn. | ~250 px of empty sky between the title and the shelf; the shelf is a flat brown bar with no brackets and no wall behind it; Beacon's hint bubble covers the gear tray. | Put the shelf on a station wall with brackets, a pegboard and hanging gear. Move the hint bubble so it never covers interactive tiles. |
| **Dispatch Decoder** | The green-on-dark radio panel is on-brief and looks good. | Sky above and below; the antenna is a floating stub not attached to the body; no desk, no cable, no station room. The two answer thumbnails (School / Library) are the *same* house glyph with a different roof colour. | Sit the radio on a desk in the dispatch room. Attach the antenna. Give every building answer its own architecture. |
| **Code the Route** | The direction buttons are excellent — the best button set in the app. | Compare directly to the reference: theirs is a dense city grid with houses, trees, an excavator, a ROAD CLOSED sign, a pond and a burning bakery. Ours is pale green cells with tiny generic glyphs. **Street names render as white text struck through by the road dashes and are unreadable.** ~250 px sky above, ~200 px below. "Turn Around" wraps to two lines and overflows its tile. | Redraw the tiles at reference density; put street names on drawn street-sign posts instead of overlaid text; shrink the sky; fix the button label. |
| **Hydrant Match** | Hydrant colour-coding and number discs are clear. | **Over 500 px of empty sky.** The truck is cropped at the left and its dark navy body reads as a delivery van. The hydrant tray sits on a grey slab that looks like a placeholder. The hint bubble covers the whole bottom row and clips the "Say it again" button. | Put the hydrants on a street with a kerb. Show the whole truck. Replace the grey slab with pavement. |
| **Spray Patterns** | The pattern chips are legible. | Almost no art at all: ~350 px sky above, ~250 px below, chips floating with no rail or board; the progress bar is an unlabelled red/navy stub in the top-left corner. | Put the sequence on a drawn rail/ribbon; give the progress bar a frame and a label; add a spraying-hose vignette at the edge. |
| **Clock Watch** | The dial, hands and the 8:50 chip are well-shaped. | **DEFECT: the numerals render doubled and overlapping** — `12`, `11`, `10`, `9`, `6`, `5`, `4` are all drawn twice at slightly different positions. The clock floats in empty sky with no tower, no wall, no Luna the cat. | Fix the numeral rendering first. Then set the dial into the clock tower façade with Luna on the ledge. |
| **Hose Path** | The pipe-turn pieces are nicely drawn. | The grid is a cream board floating in the sky; ~350 px of empty sky above; the cells with trees have a mystery tan tint. | Set the board on the ground as a yard, or frame it as a physical board on a wall. |
| **Firefighter Signals** | The step cards and the ordering rail idea are sound. | **DEFECT: empty slots show literal `step 1 / step 2 / step 3 / step 4` placeholder strings.** Floating in sky, no art. Labels truncated ("Check the…", "Raise lad…"). | Replace placeholders with numbered empty sockets; put the sequence on a drawn clipboard or radio-call strip; fix the truncation. |
| **Vocab Tap** | The word card and the Escuchar button are clean. | Big empty sky; only two of four answer tiles are visible before the hint bubble covers the rest; Beacon appears only inside the bubble, not as a character on screen. | Compress the vertical layout; put Beacon on-screen holding the word card; keep the hint bubble clear of answers. |
| **Listen & Count** | The Spanish sentence card is clear. | ~350 px empty sky; ten identical rope coils floating above a bare brown bar; the crate is a flat trapezoid; a purple RadioCard fragment bleeds out behind Beacon's avatar. | Put the coils on a real shelf in the station store room; give the crate slats, a lid and a shadow. |
| **Pizza Fractions** | The fraction chips and the target wheel are clear; the ingredient bowls have decent shading. | **The pizza has no cheese and no toppings — it is a red disc with faint dots.** It sits on a *lollipop stick* (a peel handle drawn straight down from a top-down pizza). The checked cloth is a hard-edged square floating in the sky. **The whole indoor kitchen game is played against a blue sky.** "Bell pep…" truncated. The disabled CTA is pink-on-cream and reads as broken. | Redraw the pizza per the reference: golden puffy crust, sauce, shredded cheese, real topping shapes. Put it on a wooden peel drawn in the same top-down projection, on a counter, with a pizza cutter alongside. Kitchen backdrop, not sky. |
| **Measure & Pour** | The measuring-cup fill and the fraction marks are clear. | Sky backdrop for a kitchen game. The "azúcar" tile is **white sugar cubes on a white tile — effectively invisible**. The cup has no handle in front, only two white nubs behind the right edge. ~250 px empty sky. | Kitchen counter backdrop. Give the sugar container a colour. Draw a real handle. |
| **Count Ingredients** | The shopping-list card is a nice motif; the blender is decent. | Sky backdrop; shelves are bare brown bars; tokens repeat identically; "Ask a grown-up 👋" uses an **emoji hand**. | Counter backdrop, drawn shelf with brackets, varied tokens, SVG wave glyph. |
| **Divide & Share** | The `9 ÷ 3 = ?` chip is clear. | **DEFECT: the three crew plate cards overlap each other and their numbers (2, 3) sit outside the cards; a fourth card containing "4" floats below with no owner.** Names overlap the plate ellipses. Tacos are identical repeated glyphs on a tan tray in the sky. Crew are head-in-circle avatars. | Fix the layout. Use character rigs. Put the tray on a table. |
| **Recipe Scale** | The serves-3 → 6 header and the stepper rows are clear. | **Minus and plus are both engine red** — identical weight, so the only difference is the glyph; red on the destructive control also breaks "red is never wrong". Six truncated labels in one card ("mushr…", "champiñ…", "tomat…", "tomate · …", "aceituna …"). The pot floats in the sky. Crew are head-in-circle avatars. | Make minus a neutral/white tone and plus green or red-but-clearly-additive. Fix truncation (two lines, or smaller type). Kitchen backdrop. |

---

### `/dev/kit` gallery

Useful, and it confirms the drawing quality directly: the Rookie poses show the detached-oval-arm problem clearly at large size, and the emotion switcher works. The gallery itself is fine — it just needs the rigs fixed underneath it.

---

## The Top 25

Ranked by impact. **S** ≈ half a day, **M** ≈ 1–2 days, **L** ≈ 3+ days.

### Group W1 — Firehouse home, sky/world layers, station details

| # | What | Why it matters for a child | Where | Effort |
| ---: | --- | --- | --- | ---: |
| **1** | **Build a reusable three-layer world stage** — far haze band, mid silhouette band, near ground plane with a soft top edge and a contact-shadow helper — and export it as `<Stage variant="street" \| "yard" \| "counter">`. Every screen and mini-game uses it instead of raw sky. | Kills the "floating in a void" feeling everywhere at once. A child reads *place*, not *diagram*, and knows where the floor is. | new `src/world/Stage.tsx`, consumed by `src/ui/ScreenFrame.tsx`, `src/minigames/*/shared` | **L** |
| **2** | **Redraw the logo lock-up to match the reference.** Replace the two crescent "wings" (they read as a moustache) with a true gold ray-arc that seats onto the plaque's top edge; make the plaque an organic wobbly sticker, not a rounded rect; nest the flame into the arc instead of floating above it. | The logo is the first thing seen and it currently reads as a generic red button. The reference mark is the brand. | `src/ui/Logo.tsx` | **M** |
| **3** | **Dress the station apron**: hydrant, coiled hose, wall hose-reel, two bollards, a cone, "ENGINE 1" door numerals, an address plate, a noticeboard, tyre marks. | This is the child's home. Detail here is what makes them want to come back to it. | `src/world/StationDetails.tsx`, `src/world/StationFacade.tsx` | **M** |
| **4** | **Give the façade depth**: a side wall plane, a roof soffit shadow, a 4 px inset reveal on the bay doors, a cast shadow onto the apron. | Depth is the difference between a toy building and a drawing of a building. | `src/world/StationFacade.tsx` | **M** |
| **5** | **Close the empty sky on home** — raise the building ~15 % in frame, add two neighbour rooftops behind it, and darken/saturate `TownSkyline` so the horizon actually reads. | 120–180 px of nothing at the top of the home screen makes the app feel unfinished before the child touches anything. | `src/screens/Firehouse/FirehouseScreen.tsx`, `src/world/TownSkyline.tsx` | **S** |
| **6** | **Redraw the tree/bush/pine family** with layered canopies, silhouette variation and a darker back layer; add 3 variants each so `TreeLine` never repeats visibly. | Repeating three-circle trees is the loudest "clip-art" signal in the build. | `src/world/Trees.tsx` | **M** |
| **7** | **Unify the room-tile icon language** — every one of the six gets a ground shadow ellipse, one shade tone and one highlight; redraw the Map icon so it stops reading as the 🗺️ emoji. | Six icons in one grid drawn in three different languages is the first inconsistency a parent notices. | `src/screens/shared/RoomTile.tsx` | **S** |
| **8** | **Add ambient sky life**: one bird arcing across every ~20 s, a slow parallax on the far haze band, a soft radial sun bloom replacing the spoke sun. | "Alive at rest" is a stated principle. Right now only the near layer moves. | `src/world/Clouds.tsx`, `src/world/Sun.tsx`, new `src/world/Birds.tsx` | **S** |
| **9** | **Give the Garage a room**: floor line, pegboard of tools, lockers, workbench with a lamp, wall hose reel, a puddle; hard contact shadow under the truck tyres. Remove the stray cropped helmet. | The Garage is a reward screen. An empty tan wall makes the reward feel cheap. | `src/screens/Garage/GarageScreen.tsx` | **M** |
| **10** | **Fix the Dispatch hero band crop** and build a dispatch-desk foreground strip (console, radio, mic, community-message screen) with Bea seated at it; fix the tablet dead space below the card list. | Half an empty tablet screen reads as a bug. | `src/screens/Dispatch/DispatchScreen.tsx` | **M** |

### Group W2 — Spark City map, travel cinematic, mission SceneHero, mini-game scene dressing

| # | What | Why it matters for a child | Where | Effort |
| ---: | --- | --- | --- | ---: |
| **11** | **Dress every mini-game stage.** Apply W1's `<Stage>` to all 22 games and give each a scene: street games get kerb + drain + lamp post + parked truck + two onlookers; yard games get chalk lines + cones + a training tower; kitchen games get a counter + wall furniture. **No game may ship with more than ~120 px of undressed sky.** | This is the biggest single quality gap in the product. Right now 20 games look like wireframes. | `src/minigames/tactile/*`, `src/minigames/logic/*`, `src/kitchen/games/*` | **L** |
| **12** | **Full-bleed the Mission Brief SceneHero** to ~half the screen height with the brief card overlapping its lower edge; drop the logo; add a character outside the building. | The mission brief is the promise of the adventure. A postage-stamp thumbnail undersells it. | `src/screens/Mission/MissionBrief.tsx`, `src/screens/Mission/SceneHero.tsx` | **M** |
| **13** | **Redraw all eleven map buildings as individuals** — own architecture, awning, signage plate, chimney, window mullions, a shaded side. Kill the shared box+triangle template. | A child should be able to name every building on the map from its silhouette. | `src/world/TownMap.tsx` | **L** |
| **14** | **Full-bleed the map** to the screen edges with a soft haze into the sky at the top; remove the hard green rectangle. Darken the roads to read as asphalt. | The map is the world. A rectangle floating on blue is a picture of the world. | `src/world/TownMap.tsx`, `src/screens/Map/MapScreen.tsx` | **M** |
| **15** | **Put life on the map**: a car looping a road, two birds, the fountain running, a boat on the river, chimney smoke, the flag waving. | Nothing moves on the map today. Movement is what makes a child believe the town exists. | `src/world/TownMap.tsx` | **M** |
| **16** | **Rebuild the travel cinematic** — replace the **emoji 🚒** on the mini-map with the drawn `FireTruck`, and make the cinematic a real side-scroll: parallax buildings, a road with dashes, roadside props sweeping past, siren light wash. | The travel beat is the reward between beats. An emoji on a grey rail throws it away. | `src/world/travel/TravelCinematic.tsx` | **M** |
| **17** | **Turn awnings and sills back on for the `station` scene** and give every `BuildingFacade` a cornice, a shaded side plane, planters and a chalkboard. Hose Hero should look like the reference bakery. | Hose Hero is the signature game. It currently has less detail than a mission-card thumbnail. | `src/world/props/sceneTheme.ts`, `src/world/props/BuildingFacade.tsx` | **M** |
| **18** | **Redraw the pizza** — golden puffy crust, sauce, shredded cheese, real topping shapes — on a wooden peel in the same top-down projection, on a counter, with a cutter alongside. | The pizza is the hero object of five screens and currently reads as a red lollipop. | `src/kitchen/games/PizzaFractions/*` | **M** |
| **19** | **Mount Water Tank on the fire truck** and Hydrant Match on a street; both are pure sky today. | Two of the emptiest screens in the app become scenes for the cost of reusing existing art. | `src/minigames/tactile/WaterTank/*`, `src/minigames/logic/HydrantMatch/*` | **M** |
| **20** | **Re-anchor the kitchen backdrops** to a fixed design box (letterbox, never crop), dress the wall (pot rack, chalkboard menu, spice shelf, tea towel), remove the sign's orphan speech-bubble tail. | Cropped lampshades and half a sign read as a broken screen. | `src/kitchen/KitchenScreen.tsx`, `src/kitchen/KitchenRunner.tsx` | **M** |

### Group C — character rigs, faces, secondary motion, overlays, particle FX, icons

| # | What | Why it matters for a child | Where | Effort |
| ---: | --- | --- | --- | ---: |
| **21** | **Purge emoji from the world.** Draw SVG for: the flame/drop/star/paw counter glyphs, the six subject-pill glyphs, the mission-beat icons, the training-tile glyphs, the fourteen food glyphs, the ✨ Sparks mark, the 👋 grown-up chip, and the travel-map truck. Emoji render differently on every platform and instantly break the hand-drawn spell. | A drawn flame next to an emoji flame in the same strip is the clearest "unfinished" signal in the app. | `src/ui/kit/CountStrip.tsx`, `src/ui/SubjectPill.tsx`, `src/screens/Mission/MissionHud.tsx`, `src/screens/Training/TrainingStationTile.tsx`, `src/kitchen/food.ts`, `src/ui/kit/Chip.tsx`, `src/screens/shared/Counters.tsx`, `src/world/travel/TravelCinematic.tsx` | **L** |
| **22** | **Rebuild the Person rig's body.** Add a waist break between jacket and trousers, real shoulder joins so the arms stop reading as detached ovals, visible sleeve cuffs, a proper boot silhouette, and a fringe/curl of hair below the helmet brim so the hair picker changes something. Simplify the chest to jacket + two reflective bands + one badge. | Rookie *is* the child. A navy blob is not someone to be. | `src/characters/rig/Person.tsx`, `src/characters/Rookie.tsx` | **L** |
| **23** | **Stop using `CharacterPortrait` heads-in-circles as actors inside games.** Rescue Pets, Ladder Builder, Divide & Share and Recipe Scale must use the full rigs. (A head in a basket is genuinely unsettling.) | Off-model characters break the world's rules in exactly the games children spend most time in. | `src/minigames/tactile/RescuePets/*`, `src/minigames/tactile/LadderBuilder/*`, `src/kitchen/games/DivideShare/*`, `src/kitchen/games/RecipeScale/*` | **M** |
| **24** | **Fix the modal scrim.** Drop from `rgba(31,42,90,0.42)` to ~0.18 with a warm tint, or float question cards with no scrim and a soft shadow instead. Today it desaturates the whole world on six screens. | The child should never see the world go grey while being asked a friendly question. | `src/ui/kit/Modal.tsx`, `src/screens/shared/ModalCard.tsx` | **S** |
| **25** | **Give every mini-game a resident character with idle life** — Beacon hovering with a cyan ground glow, Pepper's tail wagging, a neighbour NPC watching — plus reaction beats on correct/wrong. And add drawn particle FX: water droplets, steam, sparkles, confetti, dust puffs on drop. | "Every tactile action = motion + sfx + haptic" and "nothing is static" are stated rules that 20 of 22 games break. | `src/characters/*`, `src/ui/kit/SparkleBurst.tsx`, `src/ui/kit/ConfettiBurst.tsx`, all game folders | **L** |

### Blocking defects — fix before any of the above

These are not polish; they are broken today and any of them would fail a store review.

- **Clock Watch dial numerals render doubled/overlapping** — `src/minigames/logic/ClockWatch/*`.
- **Divide & Share plate cards overlap; numbers sit outside their cards; an orphan "4" card floats below** — `src/kitchen/games/DivideShare/*`.
- **Firefighter Signals shows literal `step 1 … step 4` placeholder strings** — `src/minigames/logic/Signals/*`.
- **Beacon's hint bubble covers the answer row** on Vocab Tap, Gear Sort, Hydrant Match, Dispatch Decoder, Spray Patterns, Hose Path — `src/ui/kit/HintBubble.tsx` + the game frames.
- **Text truncation**: `Fla…` (Garage decal), `Bell pep…` (Pizza Fractions), `mushr… / champiñ… / tomat… / aceituna …` (Recipe Scale), `Check the… / Raise lad…` (Signals), and the Kitchen recipe blurb colliding with the chevron.
- **"azúcar" tile is white-on-white and invisible** — `src/kitchen/games/MeasurePour/*`.
- **Kitchen backdrop crops lampshades and the wall sign** at both phone and tablet — `src/kitchen/*`.

---

## Consistency rules

Ten rules. Every art engineer obeys all ten, on every element, with no exceptions. This is what makes the pass look like one hand drew it.

1. **No outlines, ever.** Shapes are separated by value, not by strokes. If a shape needs definition against its neighbour, darken the neighbour — never add a black or navy keyline. The only stroked elements in the app are the logo wordmark, dashed drop-target guides, and road dashes.

2. **Three tones per object, in this exact order.** Base flat fill → one shade tone at `rgba(31,42,90,0.14)` → one highlight at `rgba(255,255,255,0.32)`. Never a gradient inside an object smaller than ~120 px. Gradients are for skies, large walls and the logo plaque only.

3. **Every object that sits on ground gets a shadow ellipse.** `fill: palette.navy`, `opacity: 0.12`, `ry ≈ rx × 0.22`, centred on the object's contact point. No exceptions — icons in tiles, tokens in trays, characters, props, buildings. If an object floats (Beacon), it gets the same ellipse blurred and offset downward, plus its cyan glow.

4. **Corner radii come from `@/theme` and nothing else.** Cards `radii.card` (24), panels 28, tiles 20, pills 999, small chips 12. **No hard 90° corners anywhere in the world layer** — play fields, grids, tablecloths, grass bands and map boards all get a radius or a soft organic edge.

5. **Emoji are banned from the world layer.** No emoji in any scene, prop, character, counter, icon, glyph, food item, badge, subject pill, beat marker or map token. If a glyph is needed, it is drawn SVG in the shared icon kit. The *only* tolerated place is inside a `<Text>` run in the Grown-Ups area, and even there we would rather not.

6. **Palette limits.** Use only tokens from `src/theme/colors.ts`. Maximum **five** hues in any one composition plus neutrals. Red (`engineRed`) is brand energy — never a "wrong", never a destructive control, never a disabled state. Greys must be navy-tinted (`#C9CFE0` family), never neutral grey; pure `#808080` is banned.

7. **One ground plane per screen, with a soft top edge.** Ground bands are never a hard-edged rectangle: they get a gentle curve or a 6–10 px lighter lip, and they always meet the sky with a value step, never a seam. **No screen may show more than ~120 px of undressed sky gradient at phone size.**

8. **Buildings are 2.5D, not elevations.** Every building gets: a shaded side plane, a roof soffit shadow, window recesses with a sill, and a cast shadow onto its ground. Windows get either an awning or a lintel — never a bare rounded rectangle.

9. **Every scene idles.** Minimum per screen: one drifting element (cloud/bird/smoke), one swaying element (flag/sign/plant/bell), and one character breathing or blinking. Use `useIdleBob` / `useBlinkState` / `usePulse` / `useLoop` and the `idle`, `springs`, `timings` tokens from `@/theme` — **no ad-hoc durations**. Everything decorative must respect `useReducedMotion()`.

10. **One motif per job, reused everywhere.** One plaque treatment (the cream sign board with a tan edge), one glass/HUD panel, one hint bubble, one dispatch slip, one badge shield, one prompt banner. If you need a new motif, you are probably reusing an existing one wrongly. Text never truncates: if a label doesn't fit, the layout changes, not the label.

---

## Three.js opportunities

We already carry `three` and `@react-three/fiber`. Used sparingly, three moments would be genuinely elevated — and everywhere else, 3D would actively hurt.

**Worth building (three, in priority order):**

1. **The Garage truck turntable.** A low-poly, flat-shaded, toy-plastic fire engine the child can spin with a finger, with the colour/decal/light/horn customiser driving materials live. This is the one screen where the reward *is* the object, and being able to turn it is the whole fantasy. Flat-shaded, no PBR, no reflections, no shadows beyond a soft blob — it must look like the SVG world, extruded. Budget: one screen, ~800 tris, `<Suspense>` with the current SVG truck as the fallback.
2. **The badge flip.** `CelebrationOverlay` already flips a badge on its Y axis with a CSS-style transform; a real 3D shield with a beveled rim, a thickness of ~3 units and a specular sweep across the face as it lands would make earning a badge feel like receiving a medal. Small, self-contained, high emotional payoff.
3. **The pizza in the Kitchen finale.** Not the fractions game itself (that must stay a clean top-down 2D diagram — the maths depends on unambiguous halves and quarters) but the *"Looks Delicious!"* moment: tilt the finished pizza into a 3/4 view on its peel and let it rotate once with steam rising. Three seconds, once per recipe.

**Where 3D would hurt — do not use it:**

- **The Firehouse home screen and Spark City map.** These are illustrations with a deliberate flat-sticker charm. 3D would break the shape language, cost startup time on the exact screen where startup time is most visible, and gain nothing.
- **Any mini-game play field.** Fractions, counting, sorting, sequencing and routing all depend on unambiguous 2D reading. Perspective introduces foreshortening ambiguity, which is a learning-comprehension bug, not a style choice.
- **Characters.** The rigs' appeal is in the flat faces and the squash-and-stretch. A 3D Rookie would look like a different, worse character, and would need a whole second animation pipeline.
- **Anything on the mission-critical first-paint path.** Skia is already preloaded; adding a WebGL context to the boot sequence for decoration is not worth the cold-start cost on a child's hand-me-down tablet.

The rule: **3D only where the object itself is the reward, never where the object is information.**

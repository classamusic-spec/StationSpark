# Truck Run — the driving mini-game

> **The learning IS the steering.** The child never stops driving to answer a question;
> the answer is a gate, and the way you answer is to drive through it.

Kind: `truck-run` · Folder: `src/minigames/tactile/TruckRun/` · Yard: `training`
Renderers: 3D (`src/three/TruckRunScene3D.tsx`, lazy) with a full 2D fallback (`RoadView2D.tsx`).

---

## 1. Framing: driver training, not a call-out

Two framings were on the table — "responding to a call" and "driver training". **Driver training wins**, and
the whole game is easier and kinder because of it:

- A call-out means somebody is waiting, which makes *going slowly* feel like letting them down. This app has
  no timers that punish (ART_DIRECTION safety rules) and the truck can be slowed by a pothole at any moment,
  so the frame has to make slowing down harmless. On the practice road it is: bumping a cone is *the point of
  the exercise*, not a failure.
- Safety direction: cones, potholes and puddles only — no crashes, nobody in danger. A training road behind
  the station is exactly that world. A siren run through traffic is not.
- It lives in the Training Yard next to the cone course the yard already draws, so it needs no new place in
  the world and no new screen.

Captain Bea runs the session from the tower; Rookie drives. The truck is the child's own: colour, decal and
light bar come from `selectTruck` in the store, so the engine they painted in the Garage is the engine on the
road, in 3D and in the 2D fallback.

## 2. The loop

The truck drives itself forward. The child only ever does one thing: **choose a lane**.

```
   ┌ lane 0 ┬ lane 1 ┬ lane 2 ┐        the road is always three lanes wide
   │  cone  │        │ pothole│        hazards arrive, never all three at once
   │        │  ramp  │        │        a ramp sails you over whatever is next
   │ boost  │        │        │        a boost pad = speed + siren
   ├────────┼────────┼────────┤
   │  "12"  │  "13"  │  "14"  │  ←     ANSWER GATES: the question is in the TaskBar,
   └────────┴────────┴────────┘        you answer by driving through one
```

One **segment** = a stretch of hazard rows, then a set of three gates. Segments repeat until every question
has been answered, then a short victory straight, then the arrival.

- **Right gate** — the gate bursts open, boost, `correct` chime, sparkles, Captain Bea cheers, next question.
- **Wrong gate** — it is a **pothole, not a buzzer**. The truck slows and jolts, `wrong-soft` plays, Bea gives
  a hint, and **the same question comes back at the next gate set** with the answers rotated to a new lane.
  Nothing is red, nothing is lost, the truck keeps driving.

### Hazard, ramp and boost catalogue

| Prop | What it does | Feedback |
| --- | --- | --- |
| `pothole` | speed drops to 45 %, recovers over ~1 s | camera jolt, `bump`, `haptics.thud()` |
| `cone` | same slow — you knocked a cone over | `clank`, jolt, cone tips over |
| `hose` | a coil of hose left across a lane; same slow | `bump`, jolt |
| `puddle` | same slow, plus a splash | `splash`, jolt |
| `car` | a parked van; you squeeze past and slow | `bump`, jolt |
| `ramp` | **jump**: ~0.95 s airborne, sailing over everything in the next row | `whoosh` up, `drop` on landing, dust puff, `haptics.tap()` |
| `boost` | speed × 1.55 for 1.7 s | `boost` + `siren`, light bar flares, speed lines |

Every hazard does exactly the same thing — a slow and a jolt. They differ in look and sound, never in
consequence, so a child never has to learn a hazard *table* to be safe.

### The no-fail guarantee

- There is no crash, no damage, no lives, no timer, no game over. **The truck always arrives.**
- Every hazard row leaves at least one lane free, and consecutive rows are far enough apart that one lane
  change always fits (`rowGap ≥ speed × laneChange × 2`, checked by `validateChallenge`, proved for 200 seeds
  per band in `truckRun.test.ts` by an actual lane-path search).
- A wrong gate cannot end the run; it only repeats the question.
- The hint ladder (`src/minigames/types.ts`) is honoured exactly:
  **2nd miss** → Captain Bea's hint bubble, spoken, written so the answer is obvious.
  **3rd miss** → auto-assist: the correct gate wears the gold focus ring (`roles.state.focusRing`) and its
  banner lights up. The child still drives through it themselves.

### Stars

Stars come from `useMiniGameSession`, the house rule for all 26 games: **3** = every gate right first time
with no help, **2** = one wrong gate or one hint, **1** = otherwise. Never from speed, never from survival.

"How cleanly you drove" reaches the stars through the same door as every other kind of help: if the child
clips more than the band's bump budget (A 7 · B 6 · C 5), Captain Bea offers a *driving* coaching line
("Look at the lane ahead — move early!"). That is a hint, and a hint costs one star, exactly as it does in
Hose Hero. A tidy driver is never asked, so a clean run keeps all three. Bumps themselves are never counted
as mistakes: a pothole is not a wrong answer, and punishing the physical skill would break the promise that a
child can always finish.

## 3. Band scaling

`ctx.ageBand` shapes the road and the questions. Everything the sim needs is baked into the challenge, so the
band lives in the generated content and not in the component.

| | A (5–6) | B (7–8) | C (9–10) |
| --- | --- | --- | --- |
| road speed | 13 u/s | 17 u/s | 21 u/s |
| lane change | 0.34 s | 0.30 s | 0.27 s |
| row gap | 15.6 u (**1.20 s** of road) | 17.0 u (1.00 s) | 18.9 u (0.90 s) |
| hazard rows per segment | 4 | 5 | 6 |
| lanes blocked per row | 1 | 1–2 | 1–2 |
| ramps + boosts | ~45 % of rows | ~35 % | ~28 % |
| gate approach (clear road before the gates) | 2.4 × row gap | 2.0 × | 1.8 × |
| questions | 4 | 5 | 6 |
| bump budget before coaching | 7 | 6 | 5 |
| questions are… | number recognition (`number-word`), counting on (`count-on`) | + and − within 20 (`add-sub`), sight words (`sight-word`) | × and ÷ (`times-divide`), elapsed time (`elapsed`), Spanish word → meaning (`spanish`) |

A run picks **one** topic and sticks to it, so the recap and the mastery numbers say something true.
The lane spacing is expressed in *seconds of road*, which is what a child actually feels: band A gets 1.2 s
to read a row and move; band C gets 0.9 s and more rows to read.

Gate labels are always short enough to read at speed: at most 8 characters (`7`, `13`, `42`, `stop`,
`ladder`, `30 min`). The test enforces it for every seed of every band.

## 4. Architecture

```
src/learning/types.ts                    + TruckRunChallenge (ADDITIVE) + truckRunLanes
src/learning/generators/truck-run.ts       seeded generator + laneEscapeRoute() (the road's solver)
src/learning/validate.ts                 + case 'truck-run'  (labels, layout, clearability)
src/learning/__tests__/truckRun.test.ts    3 bands × 200 seeds
src/minigames/tactile/TruckRun/
  run.ts                                   THE SIM — pure, no React, fixed timestep
  __tests__/run.test.ts                    determinism, collisions, gates, no-fail
  TruckRun.tsx                             the component: gestures, audio, hint ladder, GameShell
  RoadView2D.tsx                           2D renderer (react-native-svg) — fully playable
  Scene3D.tsx                              lazy + boundary around the 3D renderer
src/three/TruckRunScene3D.tsx              the 3D road; reuses TruckModel with the child's TruckStyle
src/three/TruckRunSceneContent.tsx         camera, lights, road, props, chase rig
```

- **The sim is a plain module** (`run.ts`). Lane position, hazard spawning, collision, gate resolution, speed,
  jumps and scoring all live there, driven by a **fixed 1/60 s timestep** with a bounded accumulator, so the
  same inputs always give the same run on a 60 Hz phone, a 120 Hz tablet and in Jest. The component owns no
  game rules; it renders `RunState` and forwards `RunEvent`s to sound, haptics and the hint ladder.
- **Frame-rate independence**: the component measures real delta time, clamps it (a backgrounded tab must not
  teleport the truck through a gate) and feeds whole ticks into the sim.
- **One sim, two renderers.** `visibleItems(state, challenge)` is a pure function returning what is on screen
  and how far ahead it is; the 3D scene and the 2D fallback both draw exactly that list. Neither renderer can
  change the game.
- **3D is lazy and optional.** `@/three` is imported through `React.lazy` behind an error boundary, exactly
  like the badge flip in `CelebrationOverlay`: Jest never loads `three`, no route pays for it at first paint,
  and if WebGL is missing, blocked or broken the child gets the 2D road instead and can finish the run. Jest
  and the QA WebGL-less path both take the 2D road.

## 5. Controls and accessibility

- **Steer by dragging anywhere on the road** — a horizontal drag of ~1/7 of the screen moves one lane, and it
  repeats, so a long swipe crosses two lanes.
- **Or tap either side of the road**: the left and right halves of the play area are steer zones, far bigger
  than the 56 px minimum.
- **Or press the two steer pads** under the road (72 px tall, full accessibility labels: "Steer left" /
  "Steer right"). They are the keyboard/screen-reader/QA path and are always visible.
- **No device tilt.** It excludes children who cannot hold a tablet steady, needs a permission on iOS and is
  unusable lying down.
- The truck is never steered *for* the child, even at hint level 2 — the gold ring shows which gate, the child
  still drives it.

### Reduced motion (`useReducedMotion()`)

Never removes the game; calms it.

| | normal | `reduceMotion` |
| --- | --- | --- |
| camera jolt on a bump | shake + dip | one soft 120 ms dip, no shake |
| scenery drift / speed lines | on | off |
| dust, splash, sparkle particles | on | off (the gate still bursts, without confetti) |
| light bar | flashes | steady glow |
| jump | full arc | shorter, lower arc |
| road | scrolls (it *is* the game) | scrolls |

## 6. What the QA harness sees

`tools/qa/play.mjs` drives games by reading `globalThis.__SS_CHALLENGE__` and clicking accessibility labels.
`truck-run` is drivable the same way: read the challenge, work out the answer lane with
`options[(lane + attempt) % 3]`, and press "Steer left"/"Steer right" the right number of times. The harness's
`KINDS` list is hard-coded, so adding the driver there is a one-line change in a file this game does not own.

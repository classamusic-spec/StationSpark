# Station Spark — Architecture & Contracts

React Native (Expo SDK 57, RN 0.86, React 19, TypeScript strict). One codebase for iOS, Android and web.

```
npm run typecheck   # tsc --noEmit  (must be clean)
npm run lint        # eslint
npm test            # jest (pure logic: generators, machines, content)
npm run export:web  # static web bundle in dist/  (used for screenshot QA)
npm run sfx:build   # regenerate assets/sfx/*.wav from tools/sfx/build-sfx.mjs
```

## Stack decisions

| Need | Choice | Why |
| --- | --- | --- |
| 60 fps UI animation | `react-native-reanimated` v4 (+ `react-native-worklets`) | UI-thread animation, springs, layout transitions |
| Drag, swipe, aim | `react-native-gesture-handler` v2 | Native gestures, composes with Reanimated |
| Vector art (station, town, characters, UI) | `react-native-svg` | Crisp at any size, tiny bundle |
| Tactile canvas (water, particles, gauges, flames) | `@shopify/react-native-skia` | The RN equivalent of the design doc's "selective Three.js": GPU canvas for physical play |
| State machines | `xstate` v5 + `@xstate/react` | Mission flow, shift flow, minigame phases are explicit and testable |
| Global state + persistence | `zustand` + AsyncStorage | Small, selector-based, serialisable |
| Navigation | `expo-router` (native stack, custom fade) | Thin routes in `app/`, screens in `src/screens` |
| Sound | `expo-audio` via `src/services/audio.ts` | Pooled one-shots + loops, honours settings |
| Voice | `expo-speech` via `src/services/speech.ts` | Free offline English + Spanish TTS with per-character pitch |
| Haptics | `expo-haptics` via `src/services/haptics.ts` | Every tactile action has a physical echo |
| Fonts | Fredoka (display) + Nunito (body) | Matches the reference art's rounded chunky voice |

## Folder map

```
app/                     expo-router routes — THIN. Each just renders a screen from src/screens.
src/
  theme/                 tokens: palette, subjectColors, shadows, gradients, typeScale, spacing, radii, springs, timings, idle
  ui/                    shared primitives: Text, Button, Panel, SubjectPill, TopBar, ScreenFrame, SkyBackground, Logo, icons
                         + (kit) DispatchSlip, RecipeCard, RadioCard, ProgressBar, StarRow, Counter, Modal, Confetti, HintBubble…
  characters/            SVG rigs + idle animation: Rookie, Beacon, Pepper, CaptainBea, Npc; DialogueOverlay, CelebrationOverlay
  world/                 Sky layers, Clouds, Hills, Firehouse cutaway, Town map, Buildings, Truck, Hydrant, Flames…
  minigames/
    types.ts             MiniGameProps / MiniGameResult / MiniGameMeta   ← CONTRACT
    useMiniGameSession   attempts/hints/time → result + stars
    registry.ts          kind → { component, meta }  (merges ./tactile, ./logic, @/kitchen/games)
    tactile/…            Skia games         (HoseHero, WaterTank, LadderBuilder, NumberLadder, RescuePets, BuildBarrier)
    logic/…              drag/tap games     (EquipmentCheck, GearSort, DispatchDecoder, RescueRoute, HydrantMatch,
                                             SprayPattern, ClockWatch, HosePath, Signals, VocabTap, ListenCount)
  kitchen/               KitchenScreen, KitchenRunner, recipes, games/ (PizzaFractions, MeasurePour, CountIngredients, DivideShare, RecipeScale)
  learning/
    types.ts             AgeBand, SkillTag, Challenge union (22 kinds), GeneratorContext   ← CONTRACT
    generators/          one file per kind: `export const generateHoseHero: ChallengeGenerator<'hose-hero'>`
    vocabulary.ts        VocabWord bank (en/es, category)
    __tests__/           jest tests for every generator (all bands, 200 seeds each)
  content/
    types.ts             MissionDef, MissionBeat, DialogueLine, BadgeDef, RankDef, StationUpgradeDef, RecipeDef ← CONTRACT
    missions/            one file per mission + index (MVP: clock-tower-cat, bakery-bell, pizza-shop-panic, park-picnic, school-fair, community-cleanup)
    badges.ts ranks.ts upgrades.ts dispatchBoard.ts
  machines/              missionMachine.ts (XState) + tests; shiftMachine.ts; (minigame-local machines live with the game)
  state/store.ts         zustand store: profile, progress, station, settings, shift + actions
  services/              audio.ts (sfx), haptics.ts, speech.ts
  screens/               one folder per screen: Firehouse, Dispatch, Mission (MissionRunner), Map, Training, Kitchen, Garage, Badges, Locker, GrownUps, Onboarding, DevGallery
  hooks/                 useIdleBob, useBlink, useReducedMotion, useShiftBoard…
  utils/                 rng.ts (seeded), fractions.ts, grid.ts
assets/sfx/*.wav         generated (do not hand-edit)
tools/sfx/build-sfx.mjs  procedural SFX synthesiser (Node, no deps)
public/canvaskit.wasm    Skia web runtime
```

Import alias: `@/` → `src/`. Never use relative `../../` across top-level folders.

## The three contracts (read these files before writing code)

1. **`src/learning/types.ts`** — every mini-game consumes exactly one `Challenge` variant. Generators are pure `(ctx: GeneratorContext) => Challenge`, seeded via `ctx.rng`, and vary by `ctx.ageBand` (`A` 5–6, `B` 7–8, `C` 9–10). If a game genuinely needs an extra field, ADD it (optional) — never rename or remove.
2. **`src/minigames/types.ts`** — `MiniGameProps<K>`: `{ challenge, ageBand, onComplete(result), onEvent?, compact?, missionContext? }`. Use `useMiniGameSession(kind, onComplete, onEvent)` and call `correct()/incorrect()/hint()/progress()/say()/learnedWord()/complete()`. A child can ALWAYS finish (after 2 mistakes, show a Beacon hint that makes the answer obvious; after 3, auto-highlight the answer).
3. **`src/content/types.ts`** — a mission is a list of beats. `MissionRunner` renders `missionMachine` (src/machines/missionMachine.ts) — dialogue beats use `DialogueOverlay`, minigame beats use the registry, travel beats play the map cinematic, `recap` shows the subjects used, then `complete → reward` shows stars/badge/sparks and calls `useGame.getState().completeMission(...)`.

Registering a mini-game: add `{ component, meta }` under your group's index (`tactile/index.ts`, `logic/index.ts`, or `kitchen/games/index.ts`). `meta.yard` decides whether it appears in the Training Yard or the Kitchen.

## Store (src/state/store.ts)

`useGame((s) => s.progress.xp)` — always select. Actions: `startShift(board)`, `endShift()`, `recordMiniGame(result)`, `completeMission(id, stars, xp, sparks, badge)`, `completeRecipe(id, xp, badge)`, `awardBadge`, `addXp`, `buyUpgrade(id, cost)`, `setProfile/setAvatar/setSettings/setTruck`, `resetAll`. Ranks come from `content/ranks.ts` (`rankForXp`, `rankProgress`).

## Services

```ts
sfx.play('correct'); sfx.startLoop('water-spray'); sfx.stopLoop('water-spray');   // names: SfxName in services/audio.ts
haptics.tap() | select() | drop() | thud() | success() | nudge() | celebrate();
speech.say('¡Gracias!', { speaker: 'npc', lang: 'es' }); speech.sayWord({ en: 'water', es: 'agua' });
```
Pair sound + haptic on every physical action (drop = `sfx.play('drop')` + `haptics.drop()`).

## Non-negotiable rules

- **All text through `<Text variant=…>`** (src/ui/Text). Never `react-native`'s Text directly. Kid scale: body ≥ 18, buttons ≥ 19.
- **Tap targets ≥ 56 px** (`hit.min`), draggables ≥ 64.
- **Red is never "wrong".** Wrong = gentle wobble (`withSequence` ±6px), `sfx.play('wrong-soft')`, `haptics.nudge()`, Beacon hint. Right = pop/scale, `correct` chime, sparkle, character reaction.
- **Everything idles.** Characters bob/blink; props have a subtle life (flag waves, bell sways, clouds drift). Use `springs`/`timings`/`idle` from `@/theme` — no ad-hoc durations.
- **Entrances stagger** (`stagger.tile` / `stagger.card`) using Reanimated `entering={FadeInDown.delay(i*60).springify()}`.
- **Respect `settings.reduceMotion`** for decorative loops (use `useReducedMotion()` from `@/hooks`).
- **No `any`.** Strict TS, `noUncheckedIndexedAccess` is on — index arrays defensively.
- **Pure logic gets tests** (generators, machines, content integrity: every mission's beats reference registered kinds).
- **Web must not crash**: guard `Platform.OS === 'web'` for haptics/speech quirks; Skia is preloaded in `app/_layout.tsx`.
- **Safety** (see ART_DIRECTION.md): stylised, contained, friendly flames; no people in danger; no real-world fire procedure; kitchen heat/knives always show the "ask a grown-up" chip.

## Screen skeleton

```tsx
export function SomeScreen() {
  return (
    <ScreenFrame backdrop={<TownBackdrop />} chrome={<TopBar right={<StarCounter />} />}>
      …content…
    </ScreenFrame>
  );
}
```
Routes: `app/index.tsx` (Firehouse), `app/dispatch.tsx`, `app/mission/[id].tsx`, `app/map.tsx`, `app/training/index.tsx`, `app/training/[kind].tsx`, `app/kitchen/index.tsx`, `app/kitchen/[recipe].tsx`, `app/garage.tsx`, `app/badges.tsx`, `app/locker.tsx`, `app/grownups.tsx`, `app/onboarding.tsx`, `app/dev/gallery.tsx`.

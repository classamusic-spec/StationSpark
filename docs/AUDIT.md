# Station Spark — QA audit

**Scope:** every screen, every module, every mini-game.
**Method:** static read of all 443 `.ts`/`.tsx` files under `src/` and `app/`, plus `npx tsc --noEmit`,
`npx eslint .`, `npm test`, a 243,000-challenge generator sweep, a web export driven in headless
Chromium (`tools/qa/play.mjs`), and DOM measurement of tap targets and hit-testing.
**Date:** 2026-09-07 · audited against commit-in-progress on `claude/station-spark-redesign`.

> **`src/` was being edited by other agents while this ran.** Everything below was verified against
> the tree as it stood between 02:50 and 03:30 UTC. Line numbers are accurate as of that window;
> `src/screens/Mission/MissionRunner.tsx` is known to have changed underneath this audit. Re-grep
> before acting on a line number, not before acting on a finding.

---

## 1. Summary

| Severity | Count |
| --- | --- |
| Blocker | 1 |
| High | 7 |
| Medium | 10 |
| Low | 11 |
| **Total** | **29** |

The codebase is in good shape where it is *tested*: typecheck and lint are clean, 1,010 unit tests
passed, all 27 challenge generators produce valid, solvable challenges across 3,000 seeds × 3 age
bands with zero validator complaints, and the headless play-through walks 33 of 33 flows — every
training game, three missions, two recipes and the shift — with no console errors. Every defect below
lives in the layer the tests do not reach: persistence, React lifecycle, gesture edge cases,
accessibility, and the reporting that parents actually read.

### The three things I would fix first

1. **B1 — persisted saves have no version and no migration.** `zustand/persist` is configured with no
   `version` and no `migrate`, and the default merge is *shallow*, so a stored `progress` object
   replaces the whole fresh one. The next time anyone adds a field to `Progress` and ships it, every
   existing child's save arrives with `undefined` in the new slot. I reproduced the end state: a save
   missing `words` / `gamesPlayed` / `shiftDays` renders the Badges/Progress screen as a **blank white
   page**. This is the only finding that can destroy a child's save on an update.

2. **H1 — a child cannot leave an activity while a question is on screen.** Both `AskQuestion`
   variants paint a full-frame scrim at `zIndex` 80/60 with `pointerEvents="auto"`, and
   `ActivityFrame` renders the overlay *above* the TaskBar. Measured with `document.elementFromPoint`:
   on `/training/equipment-check` — which opens on a question — the element at the centre of the Back
   button is the scrim, not the button. Six games are affected. "A child can always finish" is
   satisfied; "a child can always stop" is not.

3. **H2 — the mastery percentages shown to parents are arithmetic nonsense.**
   `store.ts:168` computes `correct: m.correct + Math.max(1, r.attempts - (r.attempts - 1))`, which is
   `Math.max(1, 1)` — a constant 1 — while `attempts` grows by the game's full attempt count. A
   perfect six-item Gear Sort reports **Sorting 17%** on the Grown-Ups report card.

---

## 2. Findings

### BLOCKER

---

#### B1 · State & persistence · `src/state/store.ts:252-267` (crash surfaces at `src/state/selectors.ts:128`)

**What is wrong.** The `persist` config sets `name`, `storage`, `partialize` and
`onRehydrateStorage` — but no `version` and no `migrate`. `version` therefore defaults to `0`, and
`zustand`'s default merge is one level deep:

```js
merge: (persistedState, currentState) => ({ ...currentState, ...persistedState })
```

(verified in `node_modules/zustand/esm/middleware.mjs:334-338`). So the whole `progress` object comes
off disk verbatim and replaces `initialProgress`. Any field added to `Progress` after a save was
written is `undefined` for that child, forever, and nothing notices: `version` never changes, so the
migration branch is never even considered.

Several reads are unguarded against that:

- `selectors.ts:128` — `progress.words.length`
- `selectors.ts:129`, `selectors.ts:33` — `Object.values(progress.missions)`
- `store.ts:157` — `s.progress.shiftDays.includes(day)`
- `store.ts:171-172` — `[...s.progress.words, …]`, `s.progress.gamesPlayed[r.kind]` — **this one runs
  after every single mini-game**
- `GrownUpsScreen.tsx:60` — `words.map(...)`

`earnedBadgeIds` (`selectors.ts:47-51`) has a `try/catch`; nothing else does.

**Reproduction (verified).** Seed `localStorage['station-spark-v1']` with a save whose `progress`
lacks `words`, `gamesPlayed`, `shiftDays`, `mastery` and `recipes` — i.e. exactly what an
earlier-schema save looks like — then open `/badges`:

```
--- old-schema save @ /badges
   body: ""
   errors: ["TypeError: Cannot read properties of undefined (reading 'length')"]
```

`/` and `/grownups` still render (they do not touch those fields), so the child gets a working home
screen and a dead Badges screen — the worst possible failure shape, because it looks survivable.

**Proposed fix.**
1. Set `version: 1` and add a `migrate(persisted, from)` that fills every missing key from
   `initialProgress` / `initialStation` / `initialSettings` / `initialShift`, regardless of `from`.
2. Replace the default `merge` with a deep-per-slice merge so a partial rehydrate can never produce
   `undefined`:
   ```ts
   merge: (persisted, current) => {
     const p = (persisted ?? {}) as Partial<GameState>;
     return {
       ...current,
       profile:  { ...initialProfile,  ...p.profile },
       progress: { ...initialProgress, ...p.progress,
                   stats: { ...initialProgress.stats, ...p.progress?.stats } },
       station:  { ...initialStation,  ...p.station },
       settings: { ...initialSettings, ...p.settings },
       shift:    { ...initialShift,    ...p.shift },
     };
   },
   ```
3. `onRehydrateStorage` currently ignores its `error` argument. Take it, log it, and still set
   `hydrated: true` so a corrupt read starts a fresh profile rather than hanging.
4. Add a unit test that rehydrates a deliberately truncated save and asserts every screen selector
   still returns a value. This whole class is invisible to the current suite because the suite never
   rehydrates.

---

### HIGH

---

#### H1 · Correctness / dead end · `src/minigames/logic/shared/AskQuestion.tsx:129-141`, `src/minigames/tactile/shared/AskQuestion.tsx:139-151`, `src/ui/kit/ActivityFrame.tsx:141`

**What is wrong.** `ActivityFrame` renders `{overlay}` as its last child, above the `TaskBar`. Both
`AskQuestion` components are that overlay, and both are a full-frame scrim:

```ts
scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
         backgroundColor: 'rgba(31,42,90,0.06)', zIndex: 80 }   // logic; tactile uses 60
```

with `pointerEvents="auto"`. The TaskBar has no `zIndex`, so the scrim sits over it and swallows the
touch. The Back button — the only way out of a training round, and the only route to the mission
`QuitModal` — is unreachable for as long as the question is up.

**Reproduction (verified).** Open `/training/equipment-check` (its reducer's initial phase is `'ask'`,
so the question is up from the first frame) and hit-test the Back button:

```
/training/equipment-check  backRect 24,25 44×44  askVisible: true  backIsHit: false
   topmost element at that point: DIV z=80 pos=absolute pe=auto
/training/gear-sort        (no overlay)          backIsHit: true
/training/hose-hero        (no overlay yet)      backIsHit: true
```

Affected games: `EquipmentCheck` and `RescuePets` (question on open), `HoseHero`, `MarketMoney`,
`RescueRoute`, `ShapeBuilder` (mid-game).

**Proposed fix.** Either give the scrim an inset that starts below the task bar
(`top: activity.taskBarHeight`), or — better — leave the scrim full-frame for the dimming but render
it with `pointerEvents="box-none"` and put `pointerEvents="auto"` on the card only, then raise the
TaskBar's own `zIndex` above the overlay. A child must always be able to walk away from a question.

---

#### H2 · Scoring / parent-facing reporting · `src/state/store.ts:161-182` (line 168)

**What is wrong.**

```ts
mastery[skill] = {
  attempts: m.attempts + r.attempts,
  correct:  m.correct + Math.max(1, r.attempts - (r.attempts - 1)),
};
```

`r.attempts - (r.attempts - 1)` is `1` for every value of `r.attempts`. `Math.max(1, 1)` is `1`. So
`correct` increments by exactly one per game while `attempts` increments by the number of judged taps.
`useMastery` (`selectors.ts:211`) turns that into `ratio = correct / attempts`, and `ReportCard.tsx:85-88`
prints it as a percentage bar with `Math.round(ratio * 100)%`.

**Reproduction.** Play one Gear Sort with six items and make no mistakes. `useMiniGameSession.correct()`
bumps `attempts` once per correct placement, so the result is `{ attempts: 6, hintsUsed: 0, stars: 3 }`.
The store writes `mastery.sorting = { attempts: 6, correct: 1 }`. Open Grown-Ups → *Skills practised*:
**"Sorting 17%"** after a flawless round. A child who plays badly and one who plays perfectly converge
on the same number as attempts accumulate.

**Proposed fix.** `MiniGameResult` does not currently carry a mistake count, which is why this is
fudged. Add `mistakes: number` to `MiniGameResult` (`src/minigames/types.ts`) — `useMiniGameSession`
already tracks it in `mistakes.current` — and write
`correct: m.correct + Math.max(0, r.attempts - r.mistakes)`. Without a contract change, `stars` is a
usable proxy: `correct += r.attempts - (r.stars === 3 ? 0 : r.stars === 2 ? 1 : 2)`.

---

#### H3 · Progress data model · `src/content/badges.ts:14, 308`; call sites listed below

**What is wrong.** `session.learnedWord()` is called with the word's **display text**, but the badge
logic matches against the vocabulary bank's **ids**:

```ts
// badges.ts:14
const spanishWordIds = new Set(vocabulary.filter((w) => w.es.length > 0).map((w) => w.id));
// badges.ts:308
const spanishWords = progress.words.filter((id) => spanishWordIds.has(id)).length;
```

```ts
// VocabTap.tsx:80-81, WordBuilder.tsx:197-198, MarketMoney.tsx:318-319
session.learnedWord(word.en);
session.learnedWord(word.es);
// ListenCount.tsx:102-103, CountIngredients.tsx:236, MeasurePour.tsx:266,
// PizzaFractions.tsx:346, SoupPot.tsx:227, RecipeScale.tsx:128 — all `.es` text
// RescuePets.tsx:315 — `pet.en`
// HoseHero.tsx:366 — the literal string 'subtraction'
```

Measured against the real bank (291 words — it grew from 191 while this audit ran):
**271 entries have `id === en`, 11 have `id === es`, 20 have neither.** So:

- The "Spanish words" count is really a count of *English* words whose text happens to equal their id.
  Learning 30 vocabulary words records 60 strings, of which 29 are counted as Spanish — and only **2**
  of those 29 are actually Spanish strings. `spanish-speaker` (10) and `bilingual-buddy` (30) measure
  the wrong thing entirely.
- Every word is stored twice (en *and* es), so `stats.words` and the `word-watcher` badge (20 words)
  fire at roughly **ten** real words.
- The 20 multi-word entries whose id differs from their text (`fire-truck` / "fire truck",
  `first-aid` / "first-aid kit", `pet-shop`, `clock-tower`, `thank-you`, …) never match anything, and
  `GrownUpsScreen.tsx:58-61` renders them — plus every Spanish string, plus the literal
  `'subtraction'` — as translation-less chips in the parent's "Words learned" sheet.

**Reproduction.** Play Vocab Tap until 10 words are learned. Open Grown-Ups → *Words learned*: 20
chips, half of them Spanish words with no English beside them. Open the badge wall: `word-watcher` is
lit at half the intended work; `spanish-speaker` is lit by English words.

**Proposed fix.** Make `learnedWord` take the vocabulary **id** and pass `word.id` at all ten call
sites; `HoseHero.tsx:366` should not call it at all (`'subtraction'` is a skill, not a word — it is
already in `challengeSkills['hose-hero']`). Then `progress.words` is a set of ids, the badge match
works, the count is honest, and the Grown-Ups panel resolves every entry to a real en/es pair. Add a
one-line test asserting every string in `progress.words` resolves in the vocabulary bank.

---

#### H4 · State machine ↔ store divergence · `src/hooks/useShift.ts:156-159`, `src/machines/shiftMachine.ts:163`, `src/state/store.ts:154-159`, `src/content/badges.ts:324`

**What is wrong.** `useShift` exposes an `endShift` that sends `END_SHIFT` to the actor *and* calls the
store's `endShift()`. **Nothing in `app/` or `src/screens/` ever calls it** (grep: `endShift` appears
only in `useShift.ts`, `shiftMachine.ts`, `store.ts` and `badges.ts`). The normal way a shift ends is
the machine's own auto-transition:

```ts
MISSION_DONE: [
  { guard: 'willReachTarget', target: '#shift.shiftComplete', actions: ['finishMission', 'endShift'] },
```

— which runs the *machine's* `endShift` action only. Consequences:

1. `store.progress.shiftDays` never gains a day, so the **`team-player` badge (3 shift days) can never
   be earned**. I confirmed this against a maximal progress object: `team-player` is one of four badges
   unreachable from complete play.
2. `store.shift.active` is set `true` by `startShift` and never returns to `false`, and it is
   persisted. On the next launch the Firehouse reads `shift.active === true`
   (`FirehouseScreen.tsx:112`), so the "Start Shift" button skips `shift.startShift()` — and with it the
   station bell and the celebratory haptic — every time after the first shift. (`DispatchScreen.tsx:137`
   silently repairs the board, which is why this has never looked broken.)
3. `progress.streak` is declared, initialised and persisted, and **nothing ever writes it**. It is
   permanently 0.

**Reproduction.** Complete three missions in one sitting; the machine reaches `shiftComplete` on its
own. Inspect the store: `shift.active === true`, `progress.shiftDays === []`. Repeat on three
different days — `team-player` stays locked.

**Proposed fix.** Have `useShift` observe the actor and mirror the terminal state into the store, e.g.
subscribe once and call `storeEndShift()` when the snapshot reaches `shiftComplete`; or move the
store write into the `endShift` *action* via a callback the hook supplies. Either way, add
`streak` computation there (consecutive entries in `shiftDays`) or delete the field. A test that
drives the machine to `shiftComplete` and asserts `shiftDays.length === 1` would have caught it.

---

#### H5 · Gestures · `src/minigames/logic/shared/useDragToSlot.ts:159`, `src/minigames/tactile/shared/DragToken.tsx:59`, `src/kitchen/games/useKitchenGame.ts:303`, `src/minigames/tactile/WaterTank/WaterTank.tsx:197`, `src/minigames/tactile/RescuePets/RescuePets.tsx:118`, `src/minigames/tactile/TruckRun/TruckRun.tsx:300`

**What is wrong.** Gesture-handler calls `onEnd(event, success)` for **both** a real release and a
cancelled/failed gesture — confirmed in
`node_modules/react-native-gesture-handler/lib/commonjs/handlers/gestures/GestureDetector/useAnimatedGesture.js:110-120`:

```js
} else if ((event.state === State.FAILED || event.state === State.CANCELLED) && ...) {
  if (event.oldState === State.ACTIVE) {
    runWorklet(CALLBACK_TYPE.END, gesture, event, false);   // ← onEnd(e, false)
  }
  runWorklet(CALLBACK_TYPE.FINALIZE, gesture, event, false);
}
```

Every **Pan** `onEnd` in the app ignores the second argument:

```ts
// useDragToSlot.ts:159 — the shared drop used by 8 logic games
.onEnd((e) => {
  const hit = pickDropSlot(arena.slots.value, e.absoluteX - o.x, e.absoluteY - o.y, group, snapRadius);
  runOnJS(settle)(hit ? hit.id : null);     // commits a real drop
})
```

So a drag that the *system* cancels — a parent scroll view claiming the gesture, a second finger, an
incoming call, a background/foreground cycle — is committed as if the child had let go there. The
token snaps into whatever slot was under the last touch point, `onDrop` fires, and the game records a
correct or incorrect answer the child never gave — costing a star and a mistake on the hint ladder.

The author already knows the argument exists: every **Tap** handler in the same files uses it
(`DragToken.tsx:70` `.onEnd((_e, ok) => { if (ok) … })`, and likewise `RescuePets.tsx:129`,
`WordBuilder.tsx:106`, `ShapeBuilder.tsx:125`, `MarketMoney.tsx:107`, `PizzaFractions.tsx:1235`).
It is only the Pan handlers that drop it.

**Reproduction.** Begin a drag in Gear Sort and, without lifting, trigger a cancellation (on device:
take a call, or drag into a scrollable ancestor). The token lands in the nearest bin and the answer
is scored.

**Proposed fix.** In every Pan `onEnd`, take the flag and bail out to a neutral reset:

```ts
.onEnd((e, success) => {
  if (!success) { runOnJS(settle)(null); return; }   // or a dedicated cancel() that skips onDrop
  …
})
```

For `useDragToSlot` specifically, prefer a `cancel()` that springs `tx`/`ty`/`lift` home *without*
calling `optsRef.current.onDrop`, so no game state changes at all. `DragToken` and `useDragSource`
already reset their transforms in `onFinalize`; `useDragToSlot` does not, and should.

---

#### H6 · Child safety / dark pattern · `app/dev/gallery.tsx:38`, plus `app/dev/{cast,icon,kit,splash,three}.tsx`

**What is wrong.** All six `app/dev/*` routes are compiled into the shipping bundle (verified: the
strings `dev/gallery`, `dev/cast`, `dev/kit`, `dev/icon`, `dev/splash`, `dev/three` all appear in
`.a8-dist/_expo/static/js/web/entry-*.js`), and the app registers the `stationspark://` scheme, so
they are reachable by deep link on device and by URL on web. `/dev/gallery` offers:

```tsx
<Button label="Reset store" tone="navy" size="sm" onPress={resetAll} />
<Button label="Skip onboarding" tone="green" size="sm" onPress={() => setProfile({ onboarded: true })} />
```

`resetAll` is called **directly** — no parent gate, no confirmation, no undo. The same action in the
Grown-Ups screen is behind an arithmetic gate *and* a three-step confirmation
(`GrownUpsScreen.tsx:176-196`). One tap here erases every badge, all XP, all Sparks and the profile.

**Reproduction.** `stationspark://dev/gallery` (device) or `<host>/dev/gallery` (web) → "Reset store".

**Proposed fix.** Gate the whole `app/dev/` group on `__DEV__` — either return `null` from a
`app/dev/_layout.tsx` when `!__DEV__`, or exclude the directory from the production build. If they must
ship, at minimum route `resetAll` through the same `ParentGate` + two-step confirmation the Grown-Ups
screen uses. `docs/NATIVE.md §4` already flags these routes as "decide deliberately"; this is the
decision.

---

#### H7 · Accessibility · `src/minigames/logic/shared/Draggable.tsx:80-98`, `src/minigames/logic/shared/SlotZone.tsx:71-74`

**What is wrong.** `Draggable` renders an `Animated.View` with `accessible` and an
`accessibilityLabel` but **no `accessibilityRole`**, and its only input is a Pan gesture — there is no
tap fallback and no `accessibilityActions`. `SlotZone` has neither a role nor a label. Assistive tech
therefore sees a labelled but non-interactive blob and an unlabelled box, and a screen reader
intercepts the pan, so the drop can never be performed.

**Reproduction (verified in the exported DOM).**

```
/training/gear-sort
 drag tokens: [{"id":"drag:g2","role":null,"tabindex":null,"label":"Hose","w":110,"h":114}, …]
 slots:       [{"id":"slot:bin:red","role":null,"label":null,"w":117,"h":97}, …]
/training/signals
 drag tokens: [{"id":"drag:card-0","role":null,"tabindex":null,"label":"Truck rolls",…}, …]
 slots:       [{"id":"slot:step:0","role":null,"label":null,…}, …]
```

Across five activity screens only **24** nodes were exposed as interactive at all — essentially just
the TaskBar buttons. Eight games are affected: Gear Sort, Equipment Check, Hose Path, Signals, Shape
Builder, Word Builder, Market Money, Hydrant Match.

The tactile counterpart shows the right shape: `DragToken.tsx:86-87` sets
`accessibilityRole="button"` and races a `Gesture.Tap()` alongside the pan, so a tap places the token.

**Proposed fix.**
1. Add `accessibilityRole="button"` to `Draggable`'s node and an `accessibilityHint`
   ("Double tap to place it in the next empty slot").
2. Race a `Gesture.Tap()` into `useDragToSlot` (as `DragToken` does) that calls `onDrop` with the
   game's suggested next slot. Every one of these games already computes that slot for the hint
   ladder, so the target exists.
3. Give `SlotZone` an `accessibilityRole="button"`, an `accessibilityLabel` (bin/slot name) and an
   `accessibilityState={{ selected }}`, so the drop targets can be reached and their state read.

---

### MEDIUM

---

#### M1 · Effects / cleanup · `src/services/speech.ts:53, 73`; `src/ui/kit/TaskBar.tsx:79`; `src/minigames/logic/VocabTap/VocabTap.tsx:83`; `src/minigames/logic/WordBuilder/WordBuilder.tsx:203`; `src/minigames/logic/GearSort/GearSort.tsx:97`

**What is wrong.** `speech.say` wires `onStopped: opts.onDone` (`speech.ts:53`) so a cancelled
utterance still runs its continuation. `sayWord` (`speech.ts:73`) and `TaskBar.sayTask`
(`TaskBar.tsx:79`) both use that continuation to schedule the Spanish half through an *uncancelled*
`setTimeout`. `useMiniGameSession` stops speech on unmount (`useMiniGameSession.ts:36`), but the
pending timer fires afterwards and starts talking again.

So: tap "Hear it again", then tap Back within ~250 ms. Unmount → `speech.stop()` → `onStopped` fires →
250 ms later Captain Bea reads the Spanish half of the *previous* screen's task over the new one.
The same shape exists at `VocabTap.tsx:83` (500 ms), `WordBuilder.tsx:203` (380 ms) and
`GearSort.tsx:97` (1600 ms — the widest window), none of which clear their timers.

**Proposed fix.** Give the speech service a monotonically increasing "utterance epoch": `stop()`
increments it, and every chained continuation captures it and bails if it no longer matches. That
fixes all five call sites at once and any future one. Failing that, hold each `setTimeout` handle and
clear it in the component's unmount effect.

---

#### M2 · Robustness asymmetry · `src/kitchen/KitchenRunner.tsx:77-80, 285`

**What is wrong.** `MiniGameStage` wraps every game in `BeatErrorBoundary` and builds the challenge in
a `try/catch` that falls back to the friendly "still being built" card
(`MiniGameStage.tsx:110-120, 196-207`). `KitchenRunner` does neither:

```tsx
const challenges = useMemo<Challenge[]>(
  () => steps.map((s, i) => s.challenge({ ageBand, rng: createRng(seed + i * 7919) })),
  [ageBand, seed, steps],
);   // no try/catch — a throwing generator crashes during render
…
return <Game challenge={challenge} ageBand={ageBand} onComplete={onDone} onEvent={onEvent} />;
     // no error boundary
```

A crash inside Pizza Fractions, Soup Pot, Measure Pour, Divide Share, Recipe Scale or Count
Ingredients therefore takes down the whole Kitchen screen — and when the runner is embedded in a
`{ type: 'kitchen' }` mission beat (`KitchenBeat`), it takes the mission with it. `StepGame` already has
the graceful "This step is still cooking!" path; it just is not reachable from a throw.

**Proposed fix.** Wrap the generator call in the same `try/catch` (return `null` and let `usable` go
false), and wrap `<Game …/>` in `BeatErrorBoundary` with `resetKey={`${step.game}-${seed}`}` and the
existing "still cooking" card as the fallback.

---

#### M3 · Accessibility · tap targets under the 56 px house rule (all measured at 390×844)

`hit.min` is 56 and `docs/ARCHITECTURE.md` calls it non-negotiable. Measured in the exported build:

| Where | File | Visual | Native (with hitSlop) |
| --- | --- | --- | --- |
| TaskBar **Back** and **Hear it again** — all 27 activities | `src/ui/kit/TaskBar.tsx:91, 110` | **44 × 44** | 60 (`hitSlop 8`) |
| Garage picker pills (10 on screen) | `src/screens/Garage/PickerRow.tsx:70` — `minHeight: hit.min - 10` | **46** | 54 — still under |
| Shop "Buy" buttons, Badges screen | `Button size="sm"` → `src/ui/Button.tsx:33` | **52** | 64 |
| Word Builder letter slots | `src/minigames/logic/WordBuilder/WordBoard.tsx` via `SlotZone` | **47 × 47** | n/a (drop target only) |

Two aggravating factors:

- **`react-native-web` ignores `hitSlop` on `Pressable`** — it appears only in the legacy `Touchable`
  export (`node_modules/react-native-web/dist/exports/Touchable/index.js`). So on the web build every
  number in the "visual" column *is* the touch target.
- `PickerRow` is the only place in the app that writes `hit.min - 10`, i.e. it opts out of the rule
  explicitly.

The Spark City map pins are fine and worth recording as such: `MapPin`'s invisible halo measures
56 × 165 for a named place and 62 × 62 for a locked pin, even though the visible label is only 34 tall.

**Proposed fix.** Raise the TaskBar buttons to 48/56 (the compact bar has the vertical room — its
`paddingVertical` drops to 8), set `PickerRow.pill.minHeight = hit.min`, and give `Button size="sm"`
a 56 px `minHeight` on the pressable rather than relying on `hitSlop`. Where `hitSlop` is genuinely the
answer, add an equivalent transparent padding view so web gets it too.

---

#### M4 · Economy / motivation · `src/content/upgrades.ts` vs `src/content/missions/*.ts`

**What is wrong.** Sparks are only ever awarded by `completeMission` (`store.ts:199`). Totals:

- All 12 missions together award **189 sparks** (12–20 each).
- The 16 shop upgrades cost **1,080 sparks** (20, 30, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 120).

A child who finishes every mission in Spark City once can afford the first four upgrades (135 sparks)
and nothing else. The remaining twelve require replaying missions roughly **five more times over** —
the only source of sparks in the game. `upgrades.ts:5` states the design intent: *"nothing expires, and
every upgrade stays affordable by playing."* At the current numbers "playing" means grinding, which is
the shape of a pressure mechanic in a product that has carefully avoided every other one.

**Proposed fix.** A design call, not a code fix: either roughly triple mission spark rewards, award
sparks for training rounds and recipes (`TrainingPlayScreen` already grants XP and could grant 1–2
sparks), or cut the upper shop tier's prices. Whichever, add a test asserting
`Σ mission.sparks ≥ Σ upgrade.cost` (or a stated fraction of it) so the two never drift again.

---

#### M5 · Performance / listeners · `src/hooks/useReducedMotion.ts:9-19`

**What is wrong.** Every call registers its own `AccessibilityInfo.addEventListener('reduceMotionChanged', …)`
and fires its own `isReduceMotionEnabled()` promise:

```ts
useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled?.().then(…)
  const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', …);
  return () => { sub?.remove?.(); };
}, []);
```

There are **102 call sites across 55 components** (`useReducedMotion`, plus `usePulse`, `useIdleBob`
and `useBlink`, which each call it). The Firehouse alone mounts clouds, birds, the flag, the bell, the
sun, trees, both crew figures and every glowing button — dozens of simultaneous native listeners and
dozens of bridge round-trips on every screen mount. It is not a leak (they unsubscribe), but it is
O(components) where O(1) is available, and it is exactly the "listeners that accumulate" pattern.

**Proposed fix.** Move the OS query and the subscription to module scope: one listener, one cached
value, a `Set` of subscribers, and `useSyncExternalStore` in the hook. Behaviour is identical; the
native cost drops to one listener for the process.

---

#### M6 · React correctness · `src/minigames/tactile/shared/useHintLadder.ts:63-74`

**What is wrong.** `miss()` performs side effects *inside* a state updater:

```ts
setMisses((m) => {
  const next = m + 1;
  if (next >= 3) setAssist(true);          // setState inside an updater
  if (next >= 2 && hint) raise(hint);      // sfx.play + speech.say + onHint() inside an updater
  return next;
});
```

`raise()` plays a sound, speaks a line and calls the session's `hint()` — which costs the child a star.
React explicitly documents that updater functions must be pure and may be invoked more than once
(twice under StrictMode, and again whenever a concurrent render is rebased). `counted.current` protects
the star, but the "robot-beep" and Captain Bea's line can double up.

**Proposed fix.** Compute the next value outside the updater and run the effects after it — the hook
already owns `misses` in state, so `const next = misses + 1; setMisses(next); if (next >= 3) setAssist(true); if (next >= 2 && hint) raise(hint);`
is both simpler and correct. (The logic-side `useHintLadder` gets this right: it derives `level` from a
prop and raises the hint in a `useEffect`.)

---

#### M7 · Native readiness · `src/three/webgl.ts:25`

**What is wrong.**

```ts
return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
```

`three` is pinned at `^0.185.1`, and three dropped WebGL 1 support at r163. A browser or device that
offers only a WebGL 1 context therefore makes `WEBGL_AVAILABLE` **true**, `ThreeBoundary` starts
un-tripped, and three fails while setting up the canvas — outside React's render phase, which the file's
own header explains the boundary cannot catch. The child gets an empty transparent canvas over the 2D
backdrop instead of the 2D fallback: exactly the failure this module exists to prevent.

**Proposed fix.** Drop the `?? canvas.getContext('webgl')` fallback. Probing only `webgl2` matches what
three actually needs, and the 2D fallback (`TruckFallback`, `RoadView2D`) is a complete implementation,
not a placeholder.

---

#### M8 · Adaptive content that never adapts · `src/hooks/useShift.ts:140-145`, `src/content/dispatchBoard.ts:92-121`

**What is wrong.** `buildDispatchBoard`'s documented rules 4 and 5 — "then the ones with the fewest
stars" and "lead with the subject the child has practised least" — depend on `options.progress`. The
app's only caller passes ids instead:

```ts
const board = makeBoard({ completed: completedIds, ageBand, size, seed });
```

With `progress` absent, `dispatchBoard.ts:96-99` synthesises `{ missions: { id: { stars: 3 } } }` — every
completed mission gets a flat 3 stars, so the star tiebreak is inert — and `mastery` is `undefined`, so
`rustiestSubject()` returns `undefined` and the whole rusty-subject pass is skipped. Two of the six
documented board rules never run in the shipping app.

**Proposed fix.** Pass the real slice: `makeBoard({ progress: { missions: progress.missions, mastery: progress.mastery }, ageBand, size, seed })`.
`useShift` already selects `progress.missions`; add `progress.mastery` beside it. (Note this only becomes
meaningful once H2 is fixed — `mastery` is currently garbage.)

---

#### M9 · Child safety · `src/screens/GrownUps/ParentGate.tsx:16-23`

**What is wrong.** The six gate questions are `7 × 6`, `8 × 9`, `12 × 4`, `15 + 27`, `9 × 7`, `96 ÷ 8`.
Age band C is 9–10 year olds, and `challengeSkills` lists `multiplication` for `hydrant-match` and
`division` for `pizza-fractions`/`divide-share` — the app *teaches* this exact material to the children
the gate is meant to keep out. The list is also fixed and short enough to memorise. Behind the gate sit
the age-band setting and the three-step "Erase everything".

**Proposed fix.** Either raise the arithmetic well past the curriculum ceiling (two-digit ×
two-digit, or a written instruction like "type the year you were born"), or generate the question at
runtime from a range the app never teaches. Keeping the gate friendly is right; keeping it *inside the
syllabus* is not.

---

#### M10 · Performance · `src/minigames/tactile/TruckRun/TruckRun.tsx:245` (inside the rAF loop)

**What is wrong.** The driving loop calls `setFrame(runFrame(...))` on **every animation frame**, so the
whole `TruckRun` tree re-renders at 60 Hz through React. The leaf art is memoised
(`RoadView2D`, `TownBuildings`, `Building`, `Furniture`, `SkyBackdrop`, `GateLabels`), but `RoadView2D`
takes `frame` — a new object each tick — so the memo is bypassed by design, and `TownView2D`'s
`memo(Building)` compares against a `vp` recomputed per frame. `RoadView2D` and `TownView2D` together
draw ~105 SVG primitives. On the 2D path (which is what a device without WebGL 2 gets — see M7) that is
a full RN-SVG reconciliation per frame.

This is the one finding I could not measure without a device, so treat it as a place to look rather than
a proven regression. `docs/NATIVE.md §5.8` flags the sibling risk in `HoseRig`/`WaterGauge`
(`Skia.Path.Make()` inside `useDerivedValue` worklets, still present at `HoseRig.tsx:82, 135, 149, 175`
and `WaterGauge.tsx:54, 71`).

**Proposed fix.** Keep the frame in a `SharedValue` and drive the road from `useAnimatedProps` /
`useDerivedValue`, letting React see only phase changes (gate answered, arrived). Failing that, memoise
`vp` on the handful of scalars it derives from, so the town layers stop re-rendering when only the truck
moved.

---

### LOW

---

- **L1 · `src/machines/missionMachine.ts:148-157`** — the `brief` state's `NEXT` has guards for
  `firstIsDialogue / MinigameIntro / Minigame / Travel / Scene / Kitchen` but **no `firstIsRecap`**, so a
  mission whose first beat is a `recap` falls through to `{ target: 'complete' }` and silently ends
  before it starts. No shipping mission does this; add the guard (and a content test) before one does.

- **L2 · `src/learning/generators/rescue-route.ts:103, 245`, `src/minigames/logic/RescueRoute/cityPlan.ts:60`,
  `src/learning/adaptive.ts:174`** — `String.prototype.localeCompare` orders generator output. Hermes
  collates via platform ICU/`NSString`, not V8, so the same seed can yield a different puzzle on a phone
  than in the browser or Jest. Use `<`/`>` where the order only needs to be stable.
  (`docs/NATIVE.md §5.11`, still open.)

- **L3 · `src/screens/Mission/MiniGameStage.tsx:127-134`, `src/kitchen/KitchenRunner.tsx`** — the QA hook
  `globalThis.__SS_CHALLENGE__` publishes the live challenge on web in production builds. Harmless, but
  it is internal state on a global; gate it on `__DEV__` or a build flag.

- **L4 · `src/screens/Locker/parts/NamePatch.tsx:44-64`** — the name field sets `autoCorrect={false}` but
  no `autoComplete="off"` / `textContentType="none"`. A field labelled "Your name" can pull the device
  owner's real name into the keyboard's suggestion strip — the parent's identity offered to a child.
  One prop each.

- **L5 · `src/minigames/tactile/LadderBuilder/LadderBuilder.tsx:34, 71, 115`** — `Phase` includes
  `'again'`, but `case 'again'` assigns `phase: 'building'`, so `state.phase === 'again'` at line 115 is
  permanently false and the "Find another way!" prompt rests entirely on the second clause. It happens to
  be equivalent (`needed` is at most 2, per `ladder-builder.ts:33`), so this is dead code rather than a
  bug — but remove the member or make it reachable.

- **L6 · `src/minigames/tactile/HoseHero/HoseHero.tsx:363-368`** — `onAnswer` returns
  `() => clearTimeout(t)`, but it is an event callback passed to `AskQuestion`, not an effect. The
  returned cleanup is discarded and the timer is never cleared. Written as if it were a `useEffect`.

- **L7 · `src/state/store.ts:97`, `src/hooks/useShift.ts:144`** — `todayKey()` uses
  `toISOString().slice(0,10)` and the board seed uses `Math.floor(Date.now() / 86_400_000)`; both are
  UTC. A child in UTC-8 gets a new dispatch board at 4 pm and a "day" boundary that does not match their
  day. Matters more once `streak` exists (H4).

- **L8 · `src/minigames/tactile/TruckRun/TruckRun.tsx:127, 253-259`** — the mount effect's cleanup sets
  `running.current = false` but the effect never re-arms it. Under React StrictMode's double-invoke the
  game is frozen from the start. Production is unaffected because the component is keyed and remounts;
  set `running.current = true` at the top of the effect anyway.

- **L9 · Type-safety escape hatches.** Only five in the whole tree, all benign, listed for completeness:
  `src/world/Trees.tsx:107, 192, 236` use `!` on an index access that `pickVariant` does keep in range
  (`?? SHAPES[0]` would be honest); `src/minigames/logic/WordBuilder/WordBoard.tsx:16` and
  `src/world/FireTruck.tsx:205` use `as unknown as`. There is no `any` anywhere. Separately,
  `expo-keep-awake` is a dependency and autolinks but is never called — a mini-game a child reads for two
  minutes is precisely where `useKeepAwake()` belongs (`docs/NATIVE.md §2`).

- **L10 · Copy · `src/content/missions/pizza-shop-panic.ts:29`** — "Pizza Shop Panic" is the most
  alarming word in the app's user-facing text, printed on the dispatch slip and the mission title. The
  mission body is explicitly calm ("Nobody is in danger"), and the title comes from the design doc, so
  this is a judgement call rather than a defect — but for a five-year-old "Pizza Shop Puzzle" or
  "Pizza Shop Rush" costs nothing.

- **L11 · Audio · `src/services/audio.ts:87, 112-123`** — `players` holds exactly one `AudioPlayer` per
  sound and never releases it, so two taps 80 ms apart cut each other off and 33 native player objects
  accumulate for the process lifetime. `docs/NATIVE.md §5.3` describes this and it is still open; a pool
  of 2–3 round-robined players per name is the usual shape. Also `'ticktock'` is declared in `LOOPS` but
  `startLoop('ticktock')` is never called anywhere.

---

## 3. What I verified, and how

### Commands run and their results

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **clean**, exit 0, no output |
| `npx eslint .` | **clean**, exit 0, no errors *and no warnings* (so `react-hooks/exhaustive-deps` is satisfied everywhere) |
| `npm test` | **1,010 tests / 27 suites, all passing**, 18.5 s |
| `npx expo export --platform web --output-dir .a8-dist` | succeeded — 18 MB output, 4.7 MB entry bundle + 8 MB `canvaskit.wasm` |
| `node tools/qa/play.mjs .a8-dist` (headless Chromium) | **33/33 PASS, 0 console issues** — all 27 training kinds (incl. `truck-run`), 3 missions (`pizza-shop-panic`, `market-morning`, `festival-exchange`), 2 kitchen recipes (`quesadillas`, `veggie-caldo`) and the shift flow |

### Extra probes I wrote for this audit (all in a scratch directory, nothing added to the repo)

- **Generator sweep** — every one of the 27 kinds × 3 age bands × **3,000 seeds** (243,000 challenges)
  through `validateChallenge`. **Zero problems, zero throws.** Re-run at the end of the audit, after the
  generators had been edited underneath me; still zero. Also confirmed: 27 kinds, 27 generators,
  27 registry entries, 27 `case` arms in the validator — no kind silently unchecked. The generator layer
  is the strongest part of this codebase and I found nothing wrong with it.
- **Content reachability** — all 12 missions reachable through the `requires` graph; 18 recipes;
  30 badges, of which four are unreachable from maximal play (`word-watcher`, `spanish-speaker`,
  `team-player`, `bilingual-buddy` — see H3 and H4). Sparks economy measured (M4).
- **Vocabulary id-vs-text analysis** — 291 words; 271 with `id === en`, 11 with `id === es`, 20 with
  neither; simulated 30 learned words → 60 recorded strings, 29 counted as "Spanish", only 2 genuinely
  Spanish (H3). Re-run after the bank grew mid-audit; the ratio is unchanged.
- **Tap-target measurement** — 173 interactive nodes across `/`, `/dispatch`, `/map`, `/training`,
  `/kitchen`, `/garage`, `/badges`, `/locker`, `/grownups`, `/onboarding`, plus five activity routes, at
  390 × 844 with `getBoundingClientRect` (M3). Also measured `MapPin`'s invisible halo to confirm the map
  is *not* a violation.
- **Hit-test probe** — `document.elementFromPoint` at the centre of the TaskBar Back button on three
  activity routes, with the stacking context of whatever was on top (H1).
- **Accessibility-tree probe** — role/tabindex/label of every `drag:*` and `slot:*` node on three drag
  games (H7).
- **Persistence probe** — loaded the exported app against a deliberately older-schema save and captured
  the resulting page error (B1).
- **Third-party / network audit** — `grep` for `fetch(`, `XMLHttpRequest`, `WebSocket`, `axios` and any
  `http(s)://` literal across `src/` and `app/`: **zero matches**. No analytics SDK, no crash reporter, no
  ad network, no remote config, no telemetry of any kind. The only persistence is AsyncStorage on the
  device. The Android manifest requests exactly `INTERNET`, `MODIFY_AUDIO_SETTINGS` and `VIBRATE`, with
  `SYSTEM_ALERT_WINDOW` / `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` explicitly removed via
  `tools:node="remove"`; iOS requests no usage-description permissions at all. **Nothing triggers a
  runtime permission dialog.** This is genuinely well done and I want it on the record.
- **Dark-pattern sweep** — `grep` for urgency and loss framing ("hurry", "don't lose", "last chance",
  "expires", "running out", "come back tomorrow", "streak"). No hits in user-facing copy. XP and Sparks
  only ever increase; `completeMission` takes `Math.max(prev.stars, stars)` so a worse replay cannot take
  a star away; the shift machine's only timer is the greeting safety net; the reward screen has no
  countdown. The one pressure-shaped thing I found is the spark economy (M4), and it is arithmetic, not
  copy.
- **Content safety sweep** — mission text is deliberately and consistently non-threatening ("nobody is in
  danger", "no alarms, no danger", "nobody is hurt"). Nothing militarised, nothing frightening. Only L10
  is worth a second look.

### What I could NOT verify

- **Anything on real hardware.** There is no device, emulator, Android SDK, Xcode or CocoaPods in this
  container. Every native-side finding (H5's cancellation path, M3's `hitSlop` behaviour on iOS/Android,
  M5's listener cost, M7's WebGL 2 requirement, M10's frame cost, L11's audio pooling) is reasoned from
  code and from the platform's documented semantics, not observed. `docs/NATIVE.md §6` lists ten things
  that need hardware; all ten are still open.
- **No haptic in this app has ever fired.** `services/haptics.ts` is a no-op on web, so the entire
  "motion + sfx + haptic" pairing is unverified end to end.
- **What the play harness does not reach.** It finished 33/33, but it drives 3 of the 12 missions and
  2 of the 18 recipes, and it plays every game the *fast* way (read the answer from
  `__SS_CHALLENGE__`, tap it). It never misses twice, so it never exercises the hint ladder, the
  auto-highlight, or H1's scrim-over-the-back-button — which is exactly why a green harness and a
  trapped child can coexist. The nine unvisited missions and sixteen unvisited recipes are unverified
  end to end.
- **The test suite is red *right now*, from someone else's in-flight edit — not from anything here.**
  My first full run was green (1,010/1,010). Re-running `npx jest src/content` at the end of the audit
  gives 7 failures, all in `src/content/recipes.ts`, which another agent is mid-way through expanding:
  `recipes.ts:846` calls `generateMarketMoney(ctx)` with no import for it (`ReferenceError`), and the
  book has grown to 18 recipes while `badges.ts:299 TOTAL_RECIPES` still says 13 — which
  `content.test.ts:111` catches, and which currently over-awards `chef-de-station` at 13 of 18 recipes.
  I am recording this so it is not lost, not claiming it as a finding; it is almost certainly already in
  hand. Nothing else in the suite is failing.

- **`src/` was changing under me.** Six other agents were editing the tree. Treat the build I drove as a
  snapshot taken at 03:07 UTC and the source reads as spanning 02:50–03:30. `MissionRunner.tsx` demonstrably
  changed mid-audit (a scene-backdrop refactor that added `SCENE_STATES`/`HAZED_STATES`), and
  `MiniGameStage.tsx` was touched too, so any line number I quote in `src/screens/Mission/` is the least
  reliable in this document. I re-read both after the edits and the cited behaviour is unchanged.
- **Screen-reader behaviour itself.** H7 is proven from the rendered accessibility tree, not from a
  VoiceOver or TalkBack session.
- **Colour contrast.** I checked that state is never *only* colour (`AnswerTile` carries a drawn mark and
  an `accessibilityState`; `TaskBar`'s progress dots carry a `progressbar` label) but I did not run
  contrast-ratio maths over the palette.

---

## 4. Not-bugs

Things that look wrong and are not. Please do not "fix" these.

1. **The white arc over Captain Bea's cap** is `SVG ART/CAPTAIN.svg` rendering pixel-identically. The
   authored art *is* the shipped drawing (`CLAUDE.md`), and `npm run art:verify` exists to prove the
   render is unchanged. (The user has separately asked for that arc to be filled white; another agent is
   handling it.)

2. **Spanish text inside Vocab Tap and Listen & Count** is the lesson, not a leftover translation.
   `docs/ARCHITECTURE.md` is explicit: Spanish outside a Spanish lesson is a setting
   (`useShowTranslation()`), but the games whose *subject* is Spanish print it in full.

3. **`src/characters/art/*Art.ts` looks like unreadable generated soup because it is generated.**
   `tools/art/build-characters.mjs` writes it from `SVG ART/`. Edit the SVG, run `npm run art:build`,
   then `npm run art:verify`.

4. **Red is used heavily and is never an error colour.** `roles.state.retryFill` is a warm orange
   (`#FFE6D6`) and `Button` has no red "destructive" tone. This is the house rule, not an oversight.

5. **`ios/` and `android/` are build output, not source.** They are regenerated by
   `npx expo prebuild --clean` and hand edits are silently discarded. Everything the app needs is
   expressed in `app.json` (`docs/NATIVE.md §1`).

6. **`missionStars` returns 3 for a mission with no results** (`missionMachine.ts:64`). A story-only
   mission with no mini-game beats is not a failure to score; full marks is the correct answer.

7. **`metro.config.js` adds `wasm` to `assetExts` for all platforms** and `public/canvaskit.wasm` is
   copied into native exports. Both are web-only needs that are harmless on device
   (`docs/NATIVE.md §5.12`).

8. **`sfx.play` is called twice for one event in places** — once by the game and once by
   `MiniGameStage.onEvent`. `services/audio.ts` pools one player per sound name, so the doubled call is
   still one sound. `MiniGameStage.tsx:12-13` says so.

9. **`useArenaMeasure`'s effect lists `depsKey` without using it** (`DragArena.tsx:159-162`). That is the
   point: the primitive signature is what re-publishes the rect when a slot's id, group or enabled state
   changes.

10. **The tactile and logic games each have their own `AskQuestion`, `GameFrame`/`GameShell` and
    `useHintLadder`.** They are deliberately separate adapters over the shared `ActivityFrame`
    (`docs/ARCHITECTURE.md`), not accidental duplication — though note that the two hint ladders have
    diverged in quality (see M6).

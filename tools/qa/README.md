# QA tools

Three headless-Chromium tools that run against a **web export**, not the source.
Everything here needs `playwright-core` (a devDependency) and a Chromium binary:

```bash
export CHROMIUM_PATH=/opt/pw-browsers/chromium   # or: npx playwright install chromium
```

| tool | what it does |
| --- | --- |
| `play.mjs` | **plays** the game: every mini-game, three missions, a recipe and the shift flow |
| `shoot.mjs` | static screenshots of a list of routes |
| `shoot-gl.mjs` | the same, with WebGL on (the Garage) |
| `icons.mjs` | re-renders the app icon / splash / favicon from the real `<Logo/>` |

---

## `play.mjs` — the play-through harness

Drives the real DOM the way a child would: it taps buttons and answer tiles,
drags tokens into slots with the mouse, holds the hose down to spray, and reads
what is on screen to decide what to do. Nothing is stubbed; if a tap does not
land, the run fails.

### Run it

```bash
CI=1 npx expo export --platform web --output-dir /tmp/qa-dist   # build your own export, never ./dist
CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/qa/play.mjs /tmp/qa-dist
```

Exit code is 0 only when every row passes. Screenshots of failures and the
per-page console log land in `tools/qa/out/`.

`package.json` is shared with several engineers, so there is deliberately no
`npm run` alias — use the command above.

### Flags

| flag | effect |
| --- | --- |
| `--only=clock-watch,signals` | run just these mini-games (skips the stories) |
| `--missions` | run the stories too, even alongside `--only` |
| `--skip-training` | no mini-game sweep |
| `--skip-mission` / `--skip-shift` | drop the story / shift rows |
| `--headed` | watch it play |
| `QA_DEBUG=1` (env) | print the solved route / rotations for the puzzle games |

```bash
# one game, with reasoning
QA_DEBUG=1 node tools/qa/play.mjs /tmp/qa-dist --only=hose-path

# just the story flows
node tools/qa/play.mjs /tmp/qa-dist --skip-training --missions
```

### What it covers

1. **Every kind in the registry** at `/training/<kind>` (25 today), each driven
   to the "Nice work!" celebration.
2. **Three missions end to end** — `pizza-shop-panic`, `market-morning`,
   `festival-exchange` — brief → dialogue → mini-games → travel → kitchen beat →
   recap → celebration → **Return to Station**, then it asserts the persisted
   store shows the mission recorded, `xp > 0`, the mission badge, and that
   `wordsLearned` actually reached `progress.words`.
3. **A standalone recipe** at `/kitchen/quesadillas`, asserting
   `progress.recipes` and the XP bump.
4. **The shift flow**: `/` → Start Shift → the dispatch board → a slip → the
   brief → **QUIT** returns cleanly → the same mission replays.
5. **Console hygiene** on every page. React and Reanimated warnings are treated
   as failures-in-waiting and printed per row; headless-GPU and Skia
   deprecation noise is filtered (see `IGNORED` in the script).

### How it knows the right answer

- **Accessibility labels.** `accessibilityLabel` becomes `aria-label` on web, so
  `[aria-label="Pump water"]`, `[aria-label="3 coin"]`, `[aria-label="letter P"]`
  are the harness's whole vocabulary. Keeping labels honest keeps the app
  testable *and* screen-reader friendly — please do not drop them.
- **Two QA `testID`s.** `SlotZone` renders `data-testid="slot:<id>"` and
  `Draggable` renders `data-testid="drag:<id>"`, so drags have stable endpoints.
- **`globalThis.__SS_CHALLENGE__`.** `MiniGameStage` and `KitchenRunner` publish
  the live challenge on web (read-only; nothing in the app reads it back). The
  harness uses it to compute the answer — including full mirrors of
  `solveRoute` (Code the Route) and `solveHosePath` (Hose Path).

### Writing a driver for a new mini-game

Add the kind to `KINDS` and a `drivers['<kind>']` entry:

```js
async 'my-game'(page, challenge) {
  await tapLabel(page, challenge.correct);   // taps + waits, dismissing any hint bubble
  await dragSel(page, '[data-testid="drag:x"]', '[data-testid="slot:y"]');
}
```

Rules of thumb learned the hard way:

- **Verify, do not assume.** Entrance springs move things for ~1 s after mount;
  tap in a loop until the state actually changed (see `rescue-route`).
- **Press-and-hold needs a real hold.** A zero-length click does not fire
  `onPressIn`/`onPressOut` — use `mouse.down()`, wait, `mouse.up()` (see
  `measure-pour`).
- **Use the assist ladder** where free-form input cannot be automated: three
  deliberate misses unlock "Show me", which is also the path a stuck child
  takes, so the test doubles as an auto-assist check (see `pizza-fractions`).
- **Best effort is fine** for a game that cannot be solved from the DOM, as long
  as the row still proves no errors and that the child can finish.

### Things it cannot check

Sound, haptics and speech are fire-and-forget on web; the harness only proves
they do not throw. Idle-timer hints (13–15 s) are exercised by `hose-path` and
`pizza-fractions` but not timed precisely.

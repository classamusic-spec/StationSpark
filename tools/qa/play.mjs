#!/usr/bin/env node
/**
 * PLAY-THROUGH QA — actually plays Station Spark in headless Chromium.
 *
 *   CI=1 npx expo export --platform web --output-dir /tmp/qa-dist
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/qa/play.mjs /tmp/qa-dist
 *
 * What it does
 *   1. serves the export on a throwaway port and seeds the persisted store as
 *      an onboarded 7–8 year old with `bakery-bell` already finished
 *   2. opens /training/<kind> for EVERY kind in the registry and drives the DOM
 *      until the training celebration ("Nice work!") appears
 *   3. plays /mission/pizza-shop-panic end to end and asserts the store
 *   4. walks the shift flow: / → Start Shift → dispatch → slip → brief → quit
 *   5. prints a PASS/FAIL table, writes screenshots + console logs for failures
 *
 * Selectors come from real accessibility labels (`accessibilityLabel` →
 * `aria-label`) plus two QA-only `testID`s on the shared drag/slot primitives.
 * The live challenge is read from `globalThis.__SS_CHALLENGE__`, published by
 * MiniGameStage / KitchenRunner on web.
 *
 * Flags:  --only=kind,kind   --skip-training   --missions
 *         --skip-mission   --skip-shift   --headed
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/* ------------------------------------------------------------------ */
/* args + static server                                                 */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const distDir = args.find((a) => !a.startsWith('--')) ?? '/tmp/qa-dist';
const flag = (name) => args.find((a) => a.startsWith(`--${name}`));
const only = (flag('only') ?? '').split('=')[1];
const onlyKinds = only ? only.split(',').map((s) => s.trim()) : null;
const skipMission = !!flag('skip-mission');
const skipShift = !!flag('skip-shift');
const skipTraining = !!flag('skip-training');
/** run the story flows even when --only narrows the training sweep */
const forceStories = !!flag('missions');

const outDir = path.join('tools', 'qa', 'out');
fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error(`No export at ${distDir}. Run:\n  CI=1 npx expo export --platform web --output-dir ${distDir}`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(distDir, url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distDir, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const base = `http://localhost:${PORT}`;

/* ------------------------------------------------------------------ */
/* seeded store                                                         */
/* ------------------------------------------------------------------ */

const seedState = () => ({
  state: {
    profile: {
      name: 'Rookie',
      avatar: { skin: 'tan', hair: 'dark', helmet: 'red' },
      ageBand: 'B',
      createdAt: 1,
      onboarded: true,
    },
    progress: {
      xp: 0,
      rank: 'cadet',
      sparks: 0,
      // pizza-shop-panic requires bakery-bell
      missions: { 'bakery-bell': { stars: 3, plays: 1, lastAt: 1 } },
      badges: [],
      stats: { missions: 1, skills: 0, recipes: 0, words: 0 },
      mastery: {},
      words: [],
      recipes: [],
      gamesPlayed: {},
      shiftDays: [],
      streak: 0,
    },
    station: { unlocked: [], truck: { color: 'red', decal: 'flame', lights: 'classic', horn: 'classic' } },
    // voice off: expo-speech in headless Chromium is noisy and adds nothing here
    settings: { sfx: true, music: true, haptics: true, voice: false, spanishSupport: 'full', reduceMotion: false },
    shift: { active: false, startedAt: null, missionsDone: 0, board: [] },
  },
  version: 0,
});

/* ------------------------------------------------------------------ */
/* browser                                                             */
/* ------------------------------------------------------------------ */

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  headless: !flag('headed'),
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});

const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 1,
  hasTouch: false,
  isMobile: false,
});
await ctx.addInitScript((s) => {
  try {
    localStorage.setItem('station-spark-v1', JSON.stringify(s));
  } catch {
    /* ignore */
  }
}, seedState());

/* ------------------------------------------------------------------ */
/* tiny helpers                                                         */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Console/page errors we consider real bugs. */
const IGNORED = [
  /Failed to load resource/i,
  /favicon/i,
  /AudioContext/i,
  /play\(\) failed/i,
  /The AudioContext was not allowed to start/i,
  /Unable to preventDefault inside passive/i,
  /expo-speech/i,
  /canvaskit/i,
  // headless GPU + Skia housekeeping, not app bugs
  /GL Driver Message/i,
  /\[react-native-skia\] Sk\w+\.\w+\(\) is deprecated/i,
  /WebGL/i,
];
const interesting = (text) => !IGNORED.some((re) => re.test(text));

function watch(page, sink) {
  page.on('console', (m) => {
    const t = m.type();
    if (t !== 'error' && t !== 'warning') return;
    const text = m.text();
    if (interesting(text)) sink.push(`[${t}] ${text.slice(0, 400)}`);
  });
  page.on('pageerror', (e) => {
    const text = String(e && e.stack ? e.stack : e);
    if (interesting(text)) sink.push(`[pageerror] ${text.slice(0, 700)}`);
  });
}

const byLabel = (page, label, exact = true) =>
  page.locator(exact ? `[aria-label="${cssEscape(label)}"]` : `[aria-label*="${cssEscape(label)}"]`);

function cssEscape(v) {
  return String(v).replace(/"/g, '\\"');
}

/**
 * Beacon's hint bubble is a tap-to-dismiss card that floats over the tray, so
 * while it is up the child's next tap dismisses it instead of answering. A real
 * player does exactly this; the harness has to as well.
 */
async function clearHint(page) {
  const hint = page.locator('[aria-label^="Hint: "]');
  if ((await hint.count()) > 0) {
    await hint.first().click({ force: true }).catch(() => {});
    await sleep(150);
  }
}

/** Reanimated entering animations start at opacity 0 — click regardless. */
async function tap(page, locator, opts = {}) {
  const el = locator.first();
  await el.waitFor({ state: 'attached', timeout: opts.timeout ?? 8000 });
  if (opts.clearHint !== false) await clearHint(page);
  await el.click({ force: true, timeout: opts.timeout ?? 8000, position: opts.position });
  await sleep(opts.after ?? 120);
}

async function tapLabel(page, label, opts = {}) {
  await tap(page, byLabel(page, label, opts.exact !== false), opts);
}

const visible = async (locator) => {
  try {
    return (await locator.count()) > 0;
  } catch {
    return false;
  }
};

async function boxOf(page, selector) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'attached', timeout: 8000 });
  const b = await el.boundingBox();
  if (!b) throw new Error(`no box for ${selector}`);
  return { ...b, cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
}

/** press → several moves → release: what gesture-handler's Pan wants on web. */
async function dragBetween(page, from, to, steps = 14) {
  await page.mouse.move(from.cx, from.cy);
  await page.mouse.down();
  await sleep(40);
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(from.cx + ((to.cx - from.cx) * i) / steps, from.cy + ((to.cy - from.cy) * i) / steps);
    await sleep(12);
  }
  await sleep(60);
  await page.mouse.up();
}

async function dragSel(page, fromSel, toSel) {
  await clearHint(page);
  const a = await boxOf(page, fromSel);
  const b = await boxOf(page, toSel);
  await dragBetween(page, a, b);
  await sleep(520); // drop settle (280ms) + re-measure
}

const challengeOf = (page) => page.evaluate(() => globalThis.__SS_CHALLENGE__ ?? null);

async function waitForChallenge(page, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const c = await challengeOf(page);
    if (c) return c;
    await sleep(150);
  }
  return null;
}

async function hasText(page, text) {
  return (await page.getByText(text, { exact: false }).count()) > 0;
}

/* fractions ------------------------------------------------------- */
const frac = (f) => (f && f.den ? f.num / f.den : 0);

/* ------------------------------------------------------------------ */
/* pure solvers (mirrors of src/utils/grid.ts, for driving the games)   */
/* ------------------------------------------------------------------ */

const HEADINGS = ['N', 'E', 'S', 'W'];
const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const key = (p) => `${p.row},${p.col}`;
const same = (a, b) => a.row === b.row && a.col === b.col;
const inBounds = (g, p) => p.row >= 0 && p.row < g.rows && p.col >= 0 && p.col < g.cols;
const step = (p, h) => ({ row: p.row + DELTA[h][0], col: p.col + DELTA[h][1] });
const turnTo = (h, cmd) => HEADINGS[(HEADINGS.indexOf(h) + (cmd === 'right' ? 1 : cmd === 'left' ? 3 : 2)) % 4];

/** BFS over (pos, heading) — same order as src/utils/grid.ts solveRoute. */
function solveRoute(spec) {
  const walls = new Set(spec.blocked.map(key));
  const k = (n) => `${n.pos.row},${n.pos.col},${n.heading}`;
  const start = { pos: spec.start, heading: spec.startHeading };
  if (same(spec.start, spec.goal)) return [];
  const parents = new Map();
  const seen = new Set([k(start)]);
  let frontier = [start];
  const cmds = ['forward', 'left', 'right', 'turn-around'];
  while (frontier.length) {
    const next = [];
    for (const node of frontier) {
      for (const cmd of cmds) {
        let moved;
        if (cmd === 'forward') {
          const ahead = step(node.pos, node.heading);
          if (!inBounds(spec.grid, ahead) || walls.has(key(ahead))) continue;
          moved = { pos: ahead, heading: node.heading };
        } else {
          moved = { pos: node.pos, heading: turnTo(node.heading, cmd) };
        }
        const kk = k(moved);
        if (seen.has(kk)) continue;
        seen.add(kk);
        parents.set(kk, { from: k(node), via: cmd });
        if (same(moved.pos, spec.goal)) {
          const out = [];
          let cur = kk;
          while (cur) {
            const edge = parents.get(cur);
            if (!edge) break;
            out.push(edge.via);
            cur = edge.from;
          }
          return out.reverse();
        }
        next.push(moved);
      }
    }
    frontier = next;
  }
  return null;
}

/** DFS mirror of solveHosePath — returns the cell path start…end. */
function solveHosePath(spec) {
  const walls = new Set(spec.blocked.map(key));
  const budget = { straight: 0, corner: 0 };
  for (const p of spec.pieces) budget[p] += 1;
  const maxInterior = spec.pieces.length;
  const visited = new Set([key(spec.start)]);
  const path = [spec.start];
  const headingBetween = (a, b) => {
    if (a.row === b.row && b.col === a.col + 1) return 'E';
    if (a.row === b.row && b.col === a.col - 1) return 'W';
    if (a.col === b.col && b.row === a.row + 1) return 'S';
    if (a.col === b.col && b.row === a.row - 1) return 'N';
    return null;
  };
  const neighbours = (p) =>
    HEADINGS.map((h) => step(p, h)).filter((n) => inBounds(spec.grid, n) && !walls.has(key(n)));

  const walk = (cell, used) => {
    for (const next of neighbours(cell)) {
      if (visited.has(key(next))) continue;
      const nextUsed = { ...used };
      if (path.length > 1) {
        const prev = path[path.length - 2];
        const inDir = headingBetween(prev, cell);
        const outDir = headingBetween(cell, next);
        if (!inDir || !outDir) continue;
        if (inDir === outDir) nextUsed.straight += 1;
        else nextUsed.corner += 1;
        if (nextUsed.straight > budget.straight || nextUsed.corner > budget.corner) continue;
        if (nextUsed.straight + nextUsed.corner > maxInterior) continue;
      }
      visited.add(key(next));
      path.push(next);
      if (same(next, spec.end)) return [...path];
      const found = walk(next, nextUsed);
      if (found) return found;
      path.pop();
      visited.delete(key(next));
    }
    return null;
  };
  return walk(spec.start, { straight: 0, corner: 0 });
}

const rotateHeading = (h, q) => HEADINGS[(HEADINGS.indexOf(h) + ((q % 4) + 4)) % 4];
const openingsOf = (piece, rot) => {
  const base = piece === 'straight' ? ['N', 'S'] : ['N', 'E'];
  return [rotateHeading(base[0], rot), rotateHeading(base[1], rot)];
};
function placementFor(a, b) {
  const want = [a, b].sort().join('');
  for (const piece of ['straight', 'corner']) {
    for (const rotation of [0, 1, 2, 3]) {
      const [x, y] = openingsOf(piece, rotation);
      if ([x, y].sort().join('') === want) return { piece, rotation };
    }
  }
  return null;
}
/** cell key → { piece, rotation } for every interior cell of the path. */
function hosePlacements(path) {
  const headingBetween = (a, b) => {
    if (a.row === b.row && b.col === a.col + 1) return 'E';
    if (a.row === b.row && b.col === a.col - 1) return 'W';
    if (a.col === b.col && b.row === a.row + 1) return 'S';
    if (a.col === b.col && b.row === a.row - 1) return 'N';
    return null;
  };
  const out = new Map();
  for (let i = 1; i < path.length - 1; i += 1) {
    const inDir = headingBetween(path[i - 1], path[i]);
    const outDir = headingBetween(path[i], path[i + 1]);
    if (!inDir || !outDir) continue;
    const placed = placementFor(rotateHeading(inDir, 2), outDir);
    if (placed) out.set(key(path[i]), placed);
  }
  return out;
}

/** Fewest jumps from start to target (BFS), honouring the no-overshoot rule. */
function solveLadder(start, target, jumps, min, max, positiveOnly) {
  if (start === target) return [];
  const seen = new Set([start]);
  let frontier = [{ pos: start, path: [] }];
  for (let depth = 0; depth < 40 && frontier.length; depth += 1) {
    const next = [];
    for (const node of frontier) {
      for (const j of jumps) {
        const n = node.pos + j;
        if (n < min || n > max) continue;
        if (positiveOnly && n > target) continue;
        if (seen.has(n)) continue;
        const path = [...node.path, j];
        if (n === target) return path;
        seen.add(n);
        next.push({ pos: n, path });
      }
    }
    frontier = next;
  }
  return null;
}

/** Indices of a subset of `pieces` summing to `target` (skip `avoidKey` combos). */
function subsetIndices(pieces, target, avoid = new Set()) {
  const out = [];
  const walk = (from, acc, total) => {
    if (out.length) return;
    if (total === target && acc.length) {
      const k = acc.map((i) => pieces[i]).sort((a, b) => a - b).join('+');
      if (!avoid.has(k)) out.push([...acc]);
      return;
    }
    if (total > target) return;
    for (let i = from; i < pieces.length; i += 1) {
      acc.push(i);
      walk(i + 1, acc, total + pieces[i]);
      acc.pop();
      if (out.length) return;
    }
  };
  walk(0, [], 0);
  return out[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* mini-game drivers                                                    */
/* ------------------------------------------------------------------ */

const NAMES = { fire: 'fire', water: 'water', cone: 'cone', star: 'star' };

/**
 * Answer whatever AskQuestion / mid-game modal is on screen, if any.
 * The scrim fades out over ~300 ms after the card closes and still takes
 * touches while it does, so give it room before the caller starts playing.
 */
async function answerAsk(page, value) {
  const tile = byLabel(page, String(value));
  if ((await tile.count()) > 0) {
    await tap(page, tile, { after: 1500 });
    return true;
  }
  return false;
}

const drivers = {
  /* ---------------- logic ---------------- */

  async 'equipment-check'(page, c) {
    // optional subtraction beat first
    const ask = c.items.find((i) => i.alreadyPacked > 0 && i.need > i.alreadyPacked);
    if (ask) await answerAsk(page, ask.need - ask.alreadyPacked);
    for (const item of c.items) {
      const todo = item.need - item.alreadyPacked;
      for (let n = 0; n < todo; n += 1) {
        await dragSel(page, `[data-testid="drag:${item.id}"]`, `[data-testid="slot:${item.id}#${item.need - 1}"]`);
      }
    }
    await tapLabel(page, 'Done', { after: 400 });
  },

  async 'gear-sort'(page, c) {
    for (const item of c.items) {
      await dragSel(page, `[data-testid="drag:${item.id}"]`, `[data-testid="slot:bin:${item.bin}"]`);
    }
  },

  async 'dispatch-decoder'(page, c) {
    await tapLabel(page, c.correct, { after: 400 });
  },

  async 'hydrant-match'(page, c) {
    await dragSel(page, '[data-testid="drag:hose-end"]', `[data-testid="slot:hyd:${c.correct}"]`);
  },

  async 'spray-pattern'(page, c) {
    await tapLabel(page, NAMES[c.answer], { after: 400 });
  },

  async 'clock-watch'(page, c) {
    const startTotal = c.start.h * 60 + c.start.m;
    const targetTotal = c.target.h * 60 + c.target.m;
    const delta = (((targetTotal - startTotal) % 720) + 720) % 720;
    const presses = Math.round(delta / c.step);
    for (let i = 0; i < presses; i += 1) await tapLabel(page, `+${c.step}`, { after: 60 });
    await sleep(200);
    await tapLabel(page, 'Done', { after: 400 });
  },

  async 'rescue-route'(page, c) {
    if (c.compareRoutes) await answerAsk(page, c.compareRoutes.shorter.toUpperCase());
    const program = solveRoute({
      grid: c.grid,
      start: c.start,
      startHeading: c.startHeading,
      goal: c.goal,
      blocked: c.blocked,
    });
    if (!program) throw new Error('rescue-route: generated maze has no solution');
    if (program.length > c.maxCommands) throw new Error(`rescue-route: shortest route ${program.length} > maxCommands ${c.maxCommands}`);
    if (process.env.QA_DEBUG) console.log('  route:', program.join(','), 'max', c.maxCommands);
    const LABEL = { forward: 'Forward', left: 'Left', right: 'Right', 'turn-around': 'Turn Around' };
    const steps = () => page.locator('[aria-label^="Remove step "]').count();
    for (const cmd of program) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const before = await steps();
        await tapLabel(page, LABEL[cmd], { after: 160 });
        if ((await steps()) > before) break;
      }
    }
    const filled = await steps();
    if (process.env.QA_DEBUG) console.log('  filled slots:', filled, 'of', program.length);
    await tapLabel(page, 'Go', { after: 400 });
    await sleep(program.length * 460 + 2000);
  },

  async signals(page, c) {
    const used = new Set();
    for (let slot = 0; slot < c.steps.length; slot += 1) {
      const want = c.steps[slot];
      const cardIndex = c.shuffled.findIndex((id, i) => id === want && !used.has(i));
      if (cardIndex < 0) throw new Error(`signals: no card for step ${want}`);
      used.add(cardIndex);
      await dragSel(page, `[data-testid="drag:card-${cardIndex}"]`, `[data-testid="slot:step:${slot}"]`);
    }
    await tapLabel(page, 'Check', { after: 400 });
    await sleep(c.steps.length * 500 + 1200);
  },

  async 'vocab-tap'(page, c) {
    await tapLabel(page, c.word[c.promptLang], { after: 600 });
  },

  async 'listen-count'(page, c) {
    for (let i = 0; i < c.count; i += 1) await tapLabel(page, `Add one ${c.item.es}`, { after: 120 });
    await tapLabel(page, 'Done', { after: 500 });
  },

  async 'market-money'(page, c) {
    // pay with the shortest set of coins the purse can make; coins are tappable
    const solution = [...(c.solutions ?? [])].sort((a, b) => a.length - b.length)[0];
    if (!solution || solution.length === 0) throw new Error(`market-money: no way to pay ${c.price} from ${c.coins.join(',')}`);
    for (const value of solution) await tapLabel(page, `${value} coin`, { after: 260 });
    await tapLabel(page, 'Pay', { after: 900 });
    if (c.askChange) {
      await sleep(1500);
      if (!(await answerAsk(page, c.askChange.change))) throw new Error('market-money: the change question never appeared');
    }
    await sleep(1400);
  },

  async 'shape-builder'(page, c) {
    // tapping a tray piece places it when its turn matches an outline, and
    // turns it otherwise — so tap until the tray empties
    const loose = () => page.locator('[aria-label*=" piece"]').count();
    for (let placed = 0; placed < c.pieces.length; placed += 1) {
      const before = await loose();
      if (before === 0) break;
      let landed = false;
      // at most one full turn (4) plus the placing tap
      for (let attempt = 0; attempt < 6 && !landed; attempt += 1) {
        await tap(page, page.locator('[aria-label*=" piece"]'), { after: 280 });
        landed = (await loose()) < before;
      }
      if (!landed) throw new Error(`shape-builder: piece ${placed + 1} of ${c.pieces.length} never found its outline`);
    }
    await sleep(1800);
    if (c.askCount) {
      if (!(await answerAsk(page, c.askCount.count))) throw new Error('shape-builder: the count question never appeared');
      await sleep(1200);
    }
  },

  async 'word-builder'(page, c) {
    for (let i = c.prefilled; i < c.letters.length; i += 1) {
      await tapLabel(page, `letter ${c.letters[i]}`, { after: 320 });
    }
    await sleep(2600);
  },

  async 'hose-path'(page, c) {
    const path = solveHosePath({ grid: c.grid, start: c.start, end: c.end, blocked: c.blocked, pieces: c.pieces });
    if (!path) throw new Error('hose-path: generated board has no solution');
    const want = hosePlacements(path);
    const free = c.pieces.map((piece, index) => ({ piece, index, used: false }));
    const placed = [];
    for (const [cell, target] of want) {
      const tray = free.find((p) => !p.used && p.piece === target.piece);
      if (!tray) throw new Error(`hose-path: not enough ${target.piece} pieces`);
      tray.used = true;
      await dragSel(page, `[data-testid="drag:piece-${tray.index}"]`, `[data-testid="slot:cell:${cell}"]`);
      placed.push({ cell, rotation: target.rotation });
    }
    // Rotate each piece until its rendered angle really is the one we want —
    // a dropped tap here silently leaves the line unconnected.
    for (const p of placed) {
      const piece = page.locator(`[data-testid="slot:cell:${p.cell}"] [role="button"] > *`).first();
      const want = (((p.rotation * 90) % 360) + 360) % 360;
      const angle = () =>
        piece
          .evaluate((n) => {
            const m = new DOMMatrixReadOnly(getComputedStyle(n).transform);
            return (((Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI) % 360) + 360) % 360);
          })
          .catch(() => -1);
      const off = (now) => {
        const d = (((now - want) % 360) + 360) % 360;
        return Math.min(d, 360 - d);
      };
      for (let guard = 0; guard < 8; guard += 1) {
        const now = await angle();
        if (process.env.QA_DEBUG) console.log(`  cell ${p.cell} want ${want} now ${now}`);
        if (now >= 0 && off(now) < 12) break;
        await tap(page, page.locator(`[data-testid="slot:cell:${p.cell}"] [role="button"]`), { after: 420 });
      }
    }
    if (process.env.QA_DEBUG) {
      console.log('  path:', path.map((p) => `${p.row},${p.col}`).join(' → '));
      console.log('  want:', [...want].map(([k, v]) => `${k}=${v.piece}@${v.rotation}`).join(' '));
    }
    await sleep(path.length * 260 + 1800);
  },

  /* ---------------- tactile ---------------- */

  async 'water-tank'(page, c) {
    const pumps = Math.round(frac(c.target) / frac(c.pumpStep));
    for (let i = 0; i < pumps; i += 1) await tapLabel(page, 'Pump water', { after: 90 });
    await sleep(250);
    await tapLabel(page, 'I am ready', { after: 400 });
  },

  async 'number-ladder'(page, c) {
    const sizes = Array.from(new Set(c.jumps.map((j) => Math.abs(j)).filter((j) => j > 0))).sort((a, b) => a - b);
    const down = sizes.map((j) => -j);
    const jumps = c.target < c.start ? [...down, ...sizes] : [...sizes, ...down];
    const positiveOnly = jumps.every((j) => j > 0);
    const plan = solveLadder(c.start, c.target, jumps, c.min, c.max, positiveOnly);
    if (!plan) throw new Error(`number-ladder: ${c.start} → ${c.target} unreachable with ${jumps.join(',')}`);
    for (const j of plan) {
      await tapLabel(page, j > 0 ? `Jump up ${j}` : `Jump down ${Math.abs(j)}`, { after: 60 });
      await sleep(Math.min(Math.abs(j), 12) * 135 + 400);
    }
  },

  async 'ladder-builder'(page, c) {
    const needed = c.requiredSolutions ?? 1;
    const avoid = new Set();
    for (let round = 0; round < needed; round += 1) {
      const combo = subsetIndices(c.pieces, c.target, avoid);
      if (!combo) throw new Error(`ladder-builder: no combination ${round + 1} makes ${c.target}`);
      avoid.add(combo.map((i) => c.pieces[i]).sort((a, b) => a - b).join('+'));
      const tokens = page.locator('[aria-label^="Ladder piece of"]');
      for (const i of combo) await tap(page, tokens.nth(i), { after: 320 });
      await sleep(round + 1 < needed ? 2600 : 900);
    }
  },

  async 'build-barrier'(page, c) {
    const combo = subsetIndices(c.pieces, c.target);
    if (!combo) throw new Error(`build-barrier: no combination makes ${c.target}`);
    const tokens = page.locator('[aria-label^="Barrier of"]');
    for (const i of combo) await tap(page, tokens.nth(i), { after: 320 });
  },

  async 'rescue-pets'(page, c) {
    const needHelp = c.total - c.alreadySafe;
    await answerAsk(page, needHelp);
    for (let i = 0; i < needHelp; i += 1) {
      await tap(page, byLabel(page, 'Rescue the ', false), { after: 500 });
    }
  },

  async 'hose-hero'(page, c) {
    const surface = await boxOf(page, '[aria-label="Aim the hose and hold to spray"]');
    const total = Math.max(1, c.totalFlames);
    const already = Math.max(0, Math.min(c.alreadyOut ?? 0, total));
    const toDouse = total - already;

    await page.mouse.move(surface.cx, surface.y + surface.height * 0.9);
    await page.mouse.down();
    try {
      for (let pass = 0; pass < 4; pass += 1) {
        for (let i = 0; i < total; i += 1) {
          const flame = page.locator(`[data-testid="flame:${i}:burning"]`);
          if ((await flame.count()) === 0) continue;
          const b = await flame.first().boundingBox();
          if (!b) continue;
          const tx = b.x + b.width / 2;
          const ty = b.y + b.height * 0.72;
          // a couple of intermediate moves so the pan keeps updating
          await page.mouse.move(tx, ty);
          await sleep(120);
          await page.mouse.move(tx + 2, ty + 2);
          await sleep(900);
        }
        const left = await page.locator('[data-testid^="flame:"][data-testid$=":burning"]').count();
        if (left === 0) break;
        // mid-game maths beat blocks spraying — release, answer, resume
        if (await hasText(page, 'How many')) break;
      }
    } finally {
      await page.mouse.up();
    }

    // the subtraction beat, if it is up
    for (let i = 0; i < 3; i += 1) {
      if (!(await hasText(page, 'How many'))) break;
      const out = total - (await page.locator('[data-testid^="flame:"][data-testid$=":burning"]').count());
      if (!(await answerAsk(page, total - out))) break;
      await sleep(900);
      // resume spraying whatever is left
      await page.mouse.move(surface.cx, surface.y + surface.height * 0.9);
      await page.mouse.down();
      try {
        for (let k = 0; k < total; k += 1) {
          const flame = page.locator(`[data-testid="flame:${k}:burning"]`);
          if ((await flame.count()) === 0) continue;
          const b = await flame.first().boundingBox();
          if (!b) continue;
          await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.72);
          await sleep(120);
          await page.mouse.move(b.x + b.width / 2 + 2, b.y + b.height * 0.72 + 2);
          await sleep(900);
        }
      } finally {
        await page.mouse.up();
      }
    }
    void toDouse;
    await sleep(1500);
  },

  /* ---------------- kitchen ---------------- */

  async 'measure-pour'(page, c) {
    const shots = Math.round(frac(c.target) / frac(c.step));
    // the jug is press-and-hold (onPressIn/onPressOut), so hold each pour
    const jug = await boxOf(page, '[aria-label^="Hold to pour"]');
    for (let i = 0; i < shots; i += 1) {
      await page.mouse.move(jug.cx, jug.cy);
      await page.mouse.down();
      await sleep(160);
      await page.mouse.up();
      await sleep(220);
    }
    await tapLabel(page, 'Done', { after: 600 });
    // if we are not exactly on the line, use the assist ladder
    for (let i = 0; i < 4; i += 1) {
      if (await hasText(page, 'Measured!')) break;
      const show = byLabel(page, 'Show me');
      if ((await show.count()) > 0) {
        await tap(page, show, { after: 300 });
        await tapLabel(page, 'Done', { after: 600 });
        break;
      }
      await tapLabel(page, 'Done', { after: 600 });
    }
  },

  async 'count-ingredients'(page, c) {
    for (const need of c.needs) {
      for (let i = 0; i < need.count; i += 1) {
        await tap(page, byLabel(page, `${need.item.en} — ${need.item.es}`), { after: 160 });
      }
    }
    await tapLabel(page, 'Blend it!', { after: 700 });
  },

  /**
   * A pot is a SEQUENCE, so the driver has to respect the recipe order: all of
   * step 0 goes in before any of step 1. Tapping the right food in the wrong
   * order is a "not yet", not a mistake, but it would stall the run.
   */
  async 'soup-pot'(page, c) {
    for (const step of c.steps) {
      for (let i = 0; i < step.count; i += 1) {
        await tap(page, byLabel(page, `${step.item.en} — ${step.item.es}`), { after: 220 });
      }
    }
    await sleep(700);
    /* band C then asks how many pieces went in altogether */
    if (c.askTotal !== undefined) await answerAsk(page, c.askTotal);
    await sleep(900);
  },

  async 'divide-share'(page, c) {
    const each = Math.max(1, c.each || Math.floor(c.total / c.among));
    await answerAsk(page, each);
    await sleep(700);
    for (let i = 0; i < c.among * each; i += 1) {
      const token = byLabel(page, `${c.item.en} — ${c.item.es}`);
      if ((await token.count()) === 0) break;
      await tap(page, token, { after: 200 });
    }
    await sleep(1200);
  },

  async 'recipe-scale'(page, c) {
    for (let i = 0; i < c.lines.length; i += 1) {
      const line = c.lines[i];
      const delta = line.scaled - line.amount;
      const plus = page.locator('[aria-label="One more"]').nth(i);
      const minus = page.locator('[aria-label="One less"]').nth(i);
      for (let n = 0; n < Math.abs(delta); n += 1) await tap(page, delta > 0 ? plus : minus, { after: 90 });
    }
    await tapLabel(page, 'Into the pot!', { after: 800 });
  },

  async 'pizza-fractions'(page, c) {
    const TAU = Math.PI * 2;
    const lcm = (a, b) => {
      const g = (x, y) => (y === 0 ? Math.abs(x) : g(y, Math.abs(x % y)));
      return Math.abs(a * b) / g(a, b);
    };
    const count = Math.max(2, Math.min(12, c.toppings.map((t) => t.fraction.den).reduce((a, d) => lcm(a, d), 1)));
    const plan = c.toppings.map((t) => ({ topping: t.topping, need: Math.round((count * t.fraction.num) / t.fraction.den) }));

    /* --- phase 1: toppings --- */
    const pizza = page.locator('[aria-label^="Pizza — tap a slice"]').first();
    let region = 0;
    for (const p of plan) {
      // the bowl's label is the kid-facing word ("Bell pepper" for `pepper`),
      // so match on the id case-insensitively rather than guessing the label
      await tap(page, page.locator(`[role="button"][aria-label*="${p.topping}" i]`), { after: 250 });
      for (let n = 0; n < p.need && region < count; n += 1, region += 1) {
        const b = await pizza.boundingBox();
        if (!b) break;
        const mid = (region + 0.5) * (TAU / count);
        await pizza.click({
          force: true,
          position: { x: b.width * (0.5 + 0.3 * Math.sin(mid)), y: b.height * (0.5 - 0.3 * Math.cos(mid)) },
        });
        await sleep(180);
      }
    }
    await tapLabel(page, 'Looks Delicious!', { after: 700 });

    /* --- phase 2: cutting (3 short strokes unlock the assist, then Show me) --- */
    const cutter = page.locator('[aria-label="Drag the cutter across the pizza"]').first();
    await cutter.waitFor({ state: 'attached', timeout: 8000 });
    const cb = await cutter.boundingBox();
    if (cb) {
      for (let i = 0; i < 3; i += 1) {
        const from = { cx: cb.x + cb.width * 0.5, cy: cb.y + cb.height * 0.45 };
        const to = { cx: cb.x + cb.width * 0.62, cy: cb.y + cb.height * 0.55 };
        await dragBetween(page, from, to, 6);
        await sleep(300);
      }
    }
    const cuts = Math.max(1, Math.round(c.cutInto / 2));
    for (let i = 0; i < cuts + 2; i += 1) {
      const show = byLabel(page, 'Show me');
      if ((await show.count()) === 0) break;
      await tap(page, show, { after: 450 });
    }
    await sleep(Math.max(1, c.cutInto) * 360 + 1400);

    /* --- phase 3: how many each --- */
    const each = Math.max(1, c.each || Math.floor(c.cutInto / c.shareAmong));
    await answerAsk(page, each);
    await sleep(900);

    /* --- phase 4: share --- */
    for (let i = 0; i < c.cutInto + 2; i += 1) {
      const slice = byLabel(page, 'Pizza slice');
      if ((await slice.count()) === 0) break;
      await tap(page, slice, { after: 220 });
    }
    await sleep(1400);
  },
};


/* ------------------------------------------------------------------ */
/* training runs                                                        */
/* ------------------------------------------------------------------ */

const KINDS = [
  'hose-hero',
  'water-tank',
  'ladder-builder',
  'number-ladder',
  'rescue-pets',
  'build-barrier',
  'equipment-check',
  'gear-sort',
  'dispatch-decoder',
  'rescue-route',
  'hydrant-match',
  'spray-pattern',
  'clock-watch',
  'hose-path',
  'signals',
  'vocab-tap',
  'listen-count',
  'market-money',
  'shape-builder',
  'word-builder',
  'pizza-fractions',
  'measure-pour',
  'count-ingredients',
  'divide-share',
  'recipe-scale',
  'soup-pot',
];

const results = [];

async function runTraining(kind) {
  const page = await ctx.newPage();
  const issues = [];
  watch(page, issues);
  const row = { name: `training/${kind}`, ok: false, note: '', issues };
  try {
    await page.goto(`${base}/training/${kind}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const challenge = await waitForChallenge(page);
    if (!challenge) throw new Error('the mini-game never published a challenge (did the stage fall back?)');
    if (challenge.kind !== kind) throw new Error(`stage rendered "${challenge.kind}" for /training/${kind}`);
    await sleep(1400); // entrance springs (the tray spring lands ~1 s) + arena measure

    const drive = drivers[kind];
    if (!drive) throw new Error('no driver');
    await drive(page, challenge);

    await page.getByText('Nice work!', { exact: false }).first().waitFor({ state: 'attached', timeout: 25000 });
    row.ok = true;
  } catch (e) {
    row.note = String(e && e.message ? e.message : e).slice(0, 220);
    try {
      await page.screenshot({ path: path.join(outDir, `fail-${kind}.png`), fullPage: false });
    } catch {
      /* ignore */
    }
  }
  await page.close();
  results.push(row);
  console.log(`${row.ok ? 'PASS' : 'FAIL'}  training/${kind}${row.note ? `  — ${row.note}` : ''}${issues.length ? `  (${issues.length} console)` : ''}`);
  return row;
}

/* ------------------------------------------------------------------ */
/* generic beat advancer (missions + kitchen)                           */
/* ------------------------------------------------------------------ */

/** kind + a cheap signature, so we can tell "same beat again" from "next beat". */
const sigOf = (c) => (c ? `${c.kind}:${JSON.stringify(c).length}` : null);

async function advanceOnce(page, seen = new Map()) {
  // a mini-game is on stage
  const challenge = await challengeOf(page);
  if (challenge && drivers[challenge.kind]) {
    const sig = sigOf(challenge);
    const tries = (seen.get(sig) ?? 0) + 1;
    seen.set(sig, tries);
    // three attempts at the same beat means the beat is stuck, not slow
    if (tries > 3) return null;
    await sleep(600);
    await drivers[challenge.kind](page, challenge).catch(() => {});
    await sleep(900);
    return `minigame:${challenge.kind}`;
  }
  // travel cinematic
  const skipDrive = byLabel(page, 'Skip the drive');
  if ((await skipDrive.count()) > 0) {
    await tap(page, skipDrive, { after: 900 });
    return 'travel';
  }
  // celebration / recap / reward / kitchen CTAs
  for (const label of ['See my reward', 'Next', 'Nice work!', 'Back to the mission', 'Back to the kitchen', 'Keep cooking', 'Keep going', 'Continue', 'Back to the call ›']) {
    const l = byLabel(page, label);
    if ((await l.count()) > 0) {
      await tap(page, l, { after: 600 });
      return label;
    }
  }
  // dialogue overlay
  const dialogue = byLabel(page, ' says: ', false);
  if ((await dialogue.count()) > 0) {
    await tap(page, dialogue, { after: 420 });
    return 'dialogue';
  }
  const brief = byLabel(page, 'Get ready for ', false);
  if ((await brief.count()) > 0) {
    await tap(page, brief, { after: 700 });
    return 'brief';
  }
  return null;
}

async function runMission(id, badge) {
  const page = await ctx.newPage();
  const issues = [];
  watch(page, issues);
  const row = { name: `mission/${id}`, ok: false, note: '', issues };
  try {
    await page.goto(`${base}/mission/${id}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await byLabel(page, 'Get ready for ', false).first().waitFor({ state: 'attached', timeout: 30000 });

    let stalled = 0;
    const seen = new Map();
    const trail = [];
    for (let i = 0; i < 300 && stalled < 8; i += 1) {
      if ((await byLabel(page, 'Return to Station').count()) > 0) break;
      const did = await advanceOnce(page, seen);
      if (did === null) {
        stalled += 1;
        await sleep(700);
      } else {
        stalled = 0;
        if (trail[trail.length - 1] !== did) trail.push(did);
      }
    }
    row.note = trail.join(' → ').slice(0, 200);

    const reward = byLabel(page, 'Return to Station');
    if ((await reward.count()) === 0) throw new Error('never reached the reward screen');
    await tap(page, reward, { after: 1500 });

    const store = await page.evaluate(() => JSON.parse(localStorage.getItem('station-spark-v1') || '{}'));
    const p = store?.state?.progress ?? {};
    const problems = [];
    if (!p.missions?.[id]) problems.push('mission not recorded');
    if (!(p.xp > 0)) problems.push(`xp=${p.xp}`);
    if (badge && !(p.badges ?? []).includes(badge)) problems.push(`badges=${JSON.stringify(p.badges)}`);
    if (!((p.words ?? []).length > 0)) problems.push('no wordsLearned recorded');
    if (problems.length) throw new Error(`store: ${problems.join('; ')}`);
    row.ok = true;
    row.note = '';
  } catch (e) {
    row.note = String(e && e.message ? e.message : e).slice(0, 260);
    try {
      await page.screenshot({ path: path.join(outDir, `fail-mission-${id}.png`) });
    } catch {
      /* ignore */
    }
  }
  await page.close();
  results.push(row);
  console.log(`${row.ok ? 'PASS' : 'FAIL'}  mission/${id}${row.note ? `  — ${row.note}` : ''}`);
}

/**
 * One standalone recipe end to end: /kitchen/<id> → intro → every step →
 * the dinner table → "Recipe complete!" → back to the kitchen, then the store
 * has to show the recipe banked.
 */
async function runRecipe(recipeId) {
  const page = await ctx.newPage();
  const issues = [];
  watch(page, issues);
  const row = { name: `kitchen/${recipeId}`, ok: false, note: '', issues };
  try {
    await page.goto(`${base}/kitchen/${recipeId}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(2000);
    const before = await page.evaluate(
      () => JSON.parse(localStorage.getItem('station-spark-v1') || '{}')?.state?.progress?.xp ?? 0,
    );

    let stalled = 0;
    const seen = new Map();
    const trail = [];
    for (let i = 0; i < 200 && stalled < 8; i += 1) {
      const url = page.url();
      if (!url.includes(`/kitchen/${recipeId}`)) break; // navigated home = finished
      const did = await advanceOnce(page, seen);
      if (did === null) {
        stalled += 1;
        await sleep(700);
      } else {
        stalled = 0;
        if (trail[trail.length - 1] !== did) trail.push(did);
      }
    }
    row.note = trail.join(' → ').slice(0, 200);
    await sleep(1200);

    const store = await page.evaluate(() => JSON.parse(localStorage.getItem('station-spark-v1') || '{}'));
    const p = store?.state?.progress ?? {};
    const problems = [];
    if (!(p.recipes ?? []).includes(recipeId)) problems.push(`recipes=${JSON.stringify(p.recipes)}`);
    if (!(p.xp > before)) problems.push(`xp ${before} → ${p.xp}`);
    if (problems.length) throw new Error(`store: ${problems.join('; ')}`);
    row.ok = true;
    row.note = '';
  } catch (e) {
    row.note = String(e && e.message ? e.message : e).slice(0, 260);
    try {
      await page.screenshot({ path: path.join(outDir, `fail-recipe-${recipeId}.png`) });
    } catch {
      /* ignore */
    }
  }
  await page.close();
  results.push(row);
  console.log(`${row.ok ? 'PASS' : 'FAIL'}  kitchen/${recipeId}${row.note ? `  — ${row.note}` : ''}`);
}

async function runShift() {
  const page = await ctx.newPage();
  const issues = [];
  watch(page, issues);
  const row = { name: 'shift flow', ok: false, note: '', issues };
  try {
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await byLabel(page, 'Start your shift').first().waitFor({ state: 'attached', timeout: 30000 });
    await tap(page, byLabel(page, 'Start your shift'), { after: 1600 });

    await page.getByText('Dispatch', { exact: true }).first().waitFor({ state: 'attached', timeout: 15000 });
    const slips = page.locator('[role="button"][aria-label*="."]');
    const slipCount = await page.locator('[aria-label*="Locked"], [role="button"]').count();
    if (slipCount === 0) throw new Error('dispatch board rendered no slips');
    void slips;

    // pick the first unlocked slip on the board
    const unlocked = page.locator('[role="button"]:not([aria-label*="Locked"])');
    const n = await unlocked.count();
    let picked = null;
    for (let i = 0; i < n; i += 1) {
      const label = await unlocked.nth(i).getAttribute('aria-label');
      if (label && /\.\s/.test(label) && !/Settings|Grown|shift|Star/i.test(label)) {
        picked = label;
        await unlocked.nth(i).click({ force: true });
        break;
      }
    }
    if (!picked) throw new Error('no unlocked mission slip on the board');
    await sleep(1800);

    await byLabel(page, 'Get ready for ', false).first().waitFor({ state: 'attached', timeout: 20000 });

    // QUIT must come back cleanly
    await tap(page, byLabel(page, 'Leave the mission'), { after: 500 });
    await tap(page, byLabel(page, 'Leave for now'), { after: 1600 });
    const backOnBoard = (await page.getByText('Dispatch', { exact: true }).count()) > 0 || (await byLabel(page, 'Start your shift').count()) > 0 || (await byLabel(page, 'Continue your shift').count()) > 0;
    if (!backOnBoard) throw new Error('QUIT did not return to the board or the station');

    // a second play of the same mission must work
    await page.goto(`${base}/mission/pizza-shop-panic`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await byLabel(page, 'Get ready for ', false).first().waitFor({ state: 'attached', timeout: 25000 });
    await tap(page, byLabel(page, 'Get ready for ', false), { after: 900 });
    const advanced = await advanceOnce(page, new Map());
    if (advanced === null) throw new Error('second play of pizza-shop-panic stalled after Get Ready');

    row.ok = true;
  } catch (e) {
    row.note = String(e && e.message ? e.message : e).slice(0, 260);
    try {
      await page.screenshot({ path: path.join(outDir, 'fail-shift.png') });
    } catch {
      /* ignore */
    }
  }
  await page.close();
  results.push(row);
  console.log(`${row.ok ? 'PASS' : 'FAIL'}  shift flow${row.note ? `  — ${row.note}` : ''}`);
}

/* ------------------------------------------------------------------ */
/* go                                                                   */
/* ------------------------------------------------------------------ */

const MISSIONS = [
  ['pizza-shop-panic', 'pizza-rescue'],
  ['market-morning', 'market-helper'],
  ['festival-exchange', 'rescue-exchange'],
];

const kinds = skipTraining ? [] : (onlyKinds ?? KINDS);
for (const kind of kinds) await runTraining(kind);

const stories = !skipMission && (!onlyKinds || forceStories);
if (stories) {
  for (const [id, badge] of MISSIONS) await runMission(id, badge);
  await runRecipe('quesadillas');
  /* the caldo is the one recipe that runs a sequence beat (soup-pot) and a
     clock beat inside the kitchen chrome, so it is worth a second run */
  await runRecipe('veggie-caldo');
}
if (!skipShift && (!onlyKinds || forceStories)) await runShift();

await browser.close();
server.close();

/* ---- report ---- */
const pad = (s, n) => String(s).padEnd(n);
const width = Math.max(28, ...results.map((r) => r.name.length));
console.log('\n┌─ PLAY-THROUGH RESULTS ─────────────────────────────────');
for (const r of results) {
  console.log(`│ ${r.ok ? 'PASS' : 'FAIL'}  ${pad(r.name, width)}  ${r.issues.length ? `${r.issues.length} console` : ''} ${r.note}`);
}
const failed = results.filter((r) => !r.ok);
const noisy = results.filter((r) => r.issues.length > 0);
console.log(`└─ ${results.length - failed.length}/${results.length} passed, ${noisy.length} with console issues\n`);

const log = results
  .map((r) => `### ${r.name}  ${r.ok ? 'PASS' : 'FAIL'} ${r.note}\n${r.issues.join('\n')}`)
  .join('\n\n');
fs.writeFileSync(path.join(outDir, 'console.log'), log);
console.log(`console log → ${path.join(outDir, 'console.log')}`);

process.exit(failed.length ? 1 : 0);

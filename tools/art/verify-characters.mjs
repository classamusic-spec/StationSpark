/**
 * Proves the shipped characters ARE the authored art.
 *
 * Renders `SVG ART/*.svg` and, beside it, the generated part data painted in
 * the order the rig paints it, then compares the two images pixel by pixel.
 * Any difference at all fails: regrouping shapes for animation must never
 * change a single pixel of the drawing.
 *
 * Run: npm run art:verify
 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = mkdtempSync(join(tmpdir(), 'art-verify-'));

// Pull the generated part order out of rigs.ts so the check follows the real rig.
const rigs = readFileSync(`${SRC}/src/characters/art/rigs.ts`, 'utf8');
function layerOrder(constName) {
  const body = new RegExp(`const ${constName}[^=]*=\\s*\\[([\\s\\S]*?)\\n\\];`).exec(rigs)[1];
  return [...body.matchAll(/parts: \[([^\]]*)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
}

async function partsOf(file) {
  // Strip the few TS-only bits and import the emitted module for real, so the
  // check reads exactly the data the app will render.
  const src = readFileSync(`${SRC}/src/characters/art/${file}`, 'utf8')
    .replace(/^import type .*$/m, '')
    .replace(/^export type .*$/m, '')
    .replace(/: readonly ArtPart<\w+>\[\]/g, '')
    .replace(/ as const/g, '');
  const mod = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
  const list = Object.entries(mod).find(([k]) => k.endsWith('Parts'))[1];
  return new Map(list.map((p) => [p.name, p.shapes]));
}

const cases = [
  { name: 'CAPTAIN', art: 'captainArt.ts', rig: 'captainLayers' },
  { name: 'FIREFIGHTER', art: 'rookieArt.ts', rig: 'rookieLayers' },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 620, height: 620 }, deviceScaleFactor: 1 });
let bad = 0;
for (const c of cases) {
  const original = readFileSync(`${SRC}/SVG ART/${c.name}.svg`, 'utf8');
  const parts = await partsOf(c.art);
  const order = layerOrder(c.rig);
  const missing = order.filter((n) => !parts.has(n));
  if (missing.length) throw new Error(`${c.name}: rig names not in art data: ${missing}`);
  const extra = [...parts.keys()].filter((n) => !order.includes(n));
  if (extra.length) throw new Error(`${c.name}: art parts never drawn by the rig: ${extra}`);

  const body = order.map((n) => parts.get(n).map((s) =>
    s.circle
      ? `<circle cx="${s.circle.cx}" cy="${s.circle.cy}" r="${s.circle.r}" fill="${s.fill}"/>`
      : `<path d="${s.d}" fill="${s.fill}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.strokeWidth}" stroke-linecap="${s.strokeLinecap ?? 'butt'}"` : ''}/>`
  ).join('')).join('');
  const rebuilt = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;

  const shot = async (svg, file) => {
    await page.setContent(`<body style="margin:0;background:#fff"><div id="s" style="width:600px;height:600px">${svg.replace('<svg ', '<svg width="600" height="600" ')}</div></body>`);
    writeFileSync(file, await (await page.$('#s')).screenshot());
  };
  await shot(original, `${OUT}/${c.name}-a.png`);
  await shot(rebuilt, `${OUT}/${c.name}-b.png`);

  const diff = await page.evaluate(async ([a, b]) => {
    const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const cv = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
    const da = cv(ia), db = cv(ib);
    let n = 0, worst = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i]-db[i]), Math.abs(da[i+1]-db[i+1]), Math.abs(da[i+2]-db[i+2]));
      if (d > 6) n++; if (d > worst) worst = d;
    }
    return { n, total: da.length / 4, worst };
  }, [`data:image/png;base64,${readFileSync(`${OUT}/${c.name}-a.png`).toString('base64')}`,
      `data:image/png;base64,${readFileSync(`${OUT}/${c.name}-b.png`).toString('base64')}`]);

  const ok = diff.n === 0;
  if (!ok) bad++;
  console.log(
    ok
      ? `${c.name.padEnd(12)} IDENTICAL  ${diff.total} px checked`
      : `${c.name.padEnd(12)} DIFFERS    ${diff.n}/${diff.total} px differ, worst channel delta ${diff.worst} (images in ${OUT})`,
  );
}
await browser.close();
process.exit(bad ? 1 : 0);

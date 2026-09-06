#!/usr/bin/env node
/**
 * Proves `src/world/art/fireTruckArt.ts` still draws the authored engine.
 *
 * Renders `SVG ART/FIRE_TRUCK.svg` and a reconstruction from the generated
 * module side by side in headless Chromium and compares them pixel for pixel.
 * The reconstruction uses each shape's authored fill, so this checks the
 * geometry and the palette — not the re-tinting, which is the app's job.
 *
 *   npm run art:verify:truck
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const SRC = 'SVG ART/FIRE_TRUCK.svg';
const ART = 'src/world/art/fireTruckArt.ts';
const W = 956; /* 6x the authored width, so a half-pixel shift cannot hide */

/* Strip the types and import the data. */
const ts = fs.readFileSync(ART, 'utf8');
const js = ts
  .replace(/export interface [\s\S]*?\n}\n/g, '')
  .replace(/:\s*(TruckShape\[\]|TruckWheel\[\])/g, '')
  .replace(/ as const/g, '');
const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

const shape = (s) => {
  const stroke = s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.strokeWidth}" stroke-linecap="${s.strokeLinecap ?? 'butt'}"` : '';
  const fill = s.fill ? ` fill="${s.fill}"` : ' fill="none"';
  if (s.circle) return `<circle cx="${s.circle.cx}" cy="${s.circle.cy}" r="${s.circle.r}"${fill}${stroke}/>`;
  if (s.ellipse) return `<ellipse cx="${s.ellipse.cx}" cy="${s.ellipse.cy}" rx="${s.ellipse.rx}" ry="${s.ellipse.ry}"${fill}${stroke}/>`;
  return `<path d="${s.d}"${fill}${stroke}/>`;
};

const parts = [
  ...mod.truckBody,
  ...mod.truckBeaconBase,
  ...mod.truckBeaconDome,
  ...mod.truckDecalDisc,
  ...mod.truckDecalRing,
  ...mod.truckDecalFlame,
  ...mod.truckWheels.flatMap((w) => w.shapes),
];
const rebuilt = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${mod.TRUCK_ART_VB.w} ${mod.TRUCK_ART_VB.h}" width="${W}">${parts.map(shape).join('')}</svg>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const shoot = async (markup) => {
  const page = await browser.newPage({ viewport: { width: W, height: Math.ceil((W * mod.TRUCK_ART_VB.h) / mod.TRUCK_ART_VB.w) } });
  await page.setContent(`<body style="margin:0;background:#fff">${markup}</body>`);
  const buf = await page.screenshot();
  await page.close();
  return buf;
};

const source = fs.readFileSync(SRC, 'utf8').replace('<svg ', `<svg width="${W}" `);
const [a, b] = [await shoot(source), await shoot(rebuilt)];
await browser.close();

if (a.length === b.length && a.equals(b)) {
  console.log(`fire truck: IDENTICAL (${parts.length} shapes, ${W}px wide)`);
  process.exit(0);
}

/* Not byte-identical — count the pixels that actually differ. */
const page = await (await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })).newPage();
const diff = await page.evaluate(
  async ([x, y]) => {
    const load = (d) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = d; });
    const [ia, ib] = await Promise.all([load(x), load(y)]);
    const c = (im) => { const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; cv.getContext('2d').drawImage(im, 0, 0); return cv.getContext('2d').getImageData(0, 0, im.width, im.height).data; };
    const [da, db] = [c(ia), c(ib)];
    let n = 0;
    for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 6) n += 1;
    return { differing: n, total: da.length / 4 };
  },
  [`data:image/png;base64,${a.toString('base64')}`, `data:image/png;base64,${b.toString('base64')}`],
);
console.log(`fire truck: ${diff.differing} / ${diff.total} pixels differ`);
process.exit(diff.differing === 0 ? 0 : 1);

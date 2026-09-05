import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const distDir = '/tmp/qa-dist';
const kind = process.argv[2] ?? 'clock-watch';
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.wasm': 'application/wasm', '.ttf': 'font/ttf', '.png': 'image/png', '.wav': 'audio/wav', '.json': 'application/json', '.ico': 'image/x-icon', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(distDir, url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distDir, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const seed = {
  state: {
    profile: { name: 'Rookie', avatar: { skin: 'tan', hair: 'dark', helmet: 'red' }, ageBand: 'B', createdAt: 1, onboarded: true },
    settings: { sfx: true, music: true, haptics: true, voice: false, spanishSupport: 'full', reduceMotion: false },
  },
  version: 0,
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 } });
await ctx.addInitScript((s) => localStorage.setItem('station-spark-v1', JSON.stringify(s)), seed);
const page = await ctx.newPage();
page.on('console', (m) => console.log(`  [${m.type()}] ${m.text().slice(0, 300)}`));
page.on('pageerror', (e) => console.log(`  [pageerror] ${String(e).slice(0, 500)}`));

await page.goto(`http://localhost:${port}/training/${kind}`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!globalThis.__SS_CHALLENGE__, null, { timeout: 20000 });
const c = await page.evaluate(() => globalThis.__SS_CHALLENGE__);
console.log('challenge:', JSON.stringify(c).slice(0, 600));
await page.waitForTimeout(900);

// instrument clicks
await page.evaluate(() => {
  globalThis.__hits = [];
  document.addEventListener('click', (e) => globalThis.__hits.push(`click ${e.target.tagName}.${e.target.className?.toString?.().slice(0, 40)} label=${e.target.getAttribute?.('aria-label')}`), true);
  document.addEventListener('pointerdown', (e) => globalThis.__hits.push(`pdown ${e.target.tagName} label=${e.target.getAttribute?.('aria-label')}`), true);
});

const label = process.argv[3] ?? '+15';
const loc = page.locator(`[aria-label="${label}"]`);
console.log('count for', label, await loc.count());
const b = await loc.first().boundingBox();
console.log('box', JSON.stringify(b));
console.log('elementFromPoint:', await page.evaluate(([x, y]) => {
  const el = document.elementFromPoint(x, y);
  const chain = [];
  let n = el;
  while (n && chain.length < 6) { chain.push(`${n.tagName}[${n.getAttribute('aria-label') ?? ''}]`); n = n.parentElement; }
  return chain.join(' < ');
}, [b.x + b.width / 2, b.y + b.height / 2]));

await loc.first().click({ force: true });
await page.waitForTimeout(600);
console.log('hits:', await page.evaluate(() => globalThis.__hits));
await page.screenshot({ path: `/tmp/dbg-${kind}.png` });

await browser.close();
server.close();

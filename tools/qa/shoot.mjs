#!/usr/bin/env node
/**
 * Screenshot QA — renders the exported web build in headless Chromium.
 *
 *   npm run export:web
 *   node tools/qa/shoot.mjs dist out 390x844 "/,/dispatch,/map" [waitMs]
 *
 * Seeds the persisted store as "onboarded" so the Firehouse renders instead of
 * redirecting. Console errors/warnings per route land in out/console.log.
 * Needs `playwright-core` (devDependency) and a Chromium: set CHROMIUM_PATH or
 * run `npx playwright install chromium` once.
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [distDir, outDir, size = '390x844', routesArg = '/', waitArg] = process.argv.slice(2);
if (!distDir || !outDir) {
  console.error('usage: node tools/qa/shoot.mjs <distDir> <outDir> [WxH] [/route,/route] [waitMs]');
  process.exit(1);
}
const [W, H] = size.split('x').map(Number);
const routes = routesArg.split(',');
const waitMs = Number(waitArg ?? 2200);
fs.mkdirSync(outDir, { recursive: true });

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.wav': 'audio/wav',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.css': 'text/css',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(distDir, url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distDir, 'index.html');
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const seed = {
  state: {
    profile: { name: 'Rookie', avatar: { skin: 'tan', hair: 'dark', helmet: 'red' }, ageBand: 'B', createdAt: 1, onboarded: true },
  },
  version: 0,
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: W < 700 });
await ctx.addInitScript((s) => {
  try {
    if (!localStorage.getItem('station-spark-v1')) localStorage.setItem('station-spark-v1', JSON.stringify(s));
  } catch {}
}, seed);

const log = [];
for (const route of routes) {
  const page = await ctx.newPage();
  const issues = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') issues.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
  });
  page.on('pageerror', (e) => issues.push(`[pageerror] ${String(e).slice(0, 300)}`));
  try {
    await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(waitMs);
    const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[/[\]?=&]/g, '_');
    await page.screenshot({ path: path.join(outDir, `${name}.png`) });
    console.log(`shot ${route} → ${name}.png (${issues.length} console issues)`);
  } catch (e) {
    console.log(`FAILED ${route}: ${String(e).slice(0, 200)}`);
  }
  log.push(`### ${route}\n${issues.join('\n')}`);
  await page.close();
}
fs.writeFileSync(path.join(outDir, 'console.log'), log.join('\n\n'));
await browser.close();
server.close();

#!/usr/bin/env node
/**
 * Screenshot QA for the WebGL routes.
 *
 * Identical to tools/qa/shoot.mjs except that Chromium is launched with a
 * software GL stack (SwiftShader) so `<canvas>` actually paints in headless —
 * without these flags the 3D truck screenshots come out blank.
 *
 *   npx expo export --platform web --output-dir /tmp/three-dist
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium \
 *     node tools/qa/shoot-gl.mjs /tmp/three-dist /tmp/three-shots 390x844 "/garage,/dev/three" 3000
 *
 * Console errors/warnings per route land in <outDir>/console.log.
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [distDir, outDir, size = '390x844', routesArg = '/', waitArg] = process.argv.slice(2);
if (!distDir || !outDir) {
  console.error('usage: node tools/qa/shoot-gl.mjs <distDir> <outDir> [WxH] [/route,/route] [waitMs]');
  process.exit(1);
}
const [W, H] = size.split('x').map(Number);
const routes = routesArg.split(',');
const waitMs = Number(waitArg ?? 3000);
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
    station: { unlocked: [], truck: { color: 'red', decal: 'flame', lights: 'classic', horn: 'classic' } },
  },
  version: 0,
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: [
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    // software rasteriser so WebGL works with no GPU in the container
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--disable-gpu-sandbox',
  ],
});
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: W < 700 });
await ctx.addInitScript((s) => {
  try {
    localStorage.setItem('station-spark-v1', JSON.stringify(s));
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
    // Report whether a GL canvas actually painted anything.
    const gl = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      return canvases.map((c) => ({
        w: c.width,
        h: c.height,
        gl: !!(c.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) || c.getContext('webgl')),
      }));
    });
    issues.push(`[canvas] ${JSON.stringify(gl)}`);
    const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[/[\]?=&]/g, '_');
    await page.screenshot({ path: path.join(outDir, `${name}.png`) });
    console.log(`shot ${route} → ${name}.png  canvases=${gl.length}`);
  } catch (e) {
    console.log(`FAILED ${route}: ${String(e).slice(0, 200)}`);
  }
  log.push(`### ${route}\n${issues.join('\n')}`);
  await page.close();
}
fs.writeFileSync(path.join(outDir, 'console.log'), log.join('\n\n'));
await browser.close();
server.close();

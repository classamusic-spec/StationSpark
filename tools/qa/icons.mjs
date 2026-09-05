#!/usr/bin/env node
/**
 * Renders the app icon set from the real <Logo/> via the /dev/icon route.
 *   npm run export:web && node tools/qa/icons.mjs dist
 * Writes assets/icon.png, assets/android-icon-foreground.png,
 * assets/splash-icon.png and assets/favicon.png.
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const distDir = process.argv[2] ?? 'dist';
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(distDir, url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distDir, 'index.html');
  const ext = path.extname(file);
  const type = { '.js': 'application/javascript', '.wasm': 'application/wasm', '.ttf': 'font/ttf', '.html': 'text/html' }[ext];
  res.writeHead(200, { 'Content-Type': type ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
const jobs = [
  { variant: 'icon', out: 'assets/icon.png', size: 1024, transparent: false },
  { variant: 'foreground', out: 'assets/android-icon-foreground.png', size: 1024, transparent: true },
  { variant: 'splash', out: 'assets/splash-icon.png', size: 1024, transparent: true },
  { variant: 'favicon', out: 'assets/favicon.png', size: 64, transparent: false },
];
for (const job of jobs) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: job.size / 1024 });
  const page = await ctx.newPage();
  if (job.transparent) {
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent = 'html,body,#root{background:transparent !important}';
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
    });
  }
  await page.goto(`http://localhost:${port}/dev/icon?variant=${job.variant}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: job.out, omitBackground: job.transparent, clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  console.log(`wrote ${job.out}`);
  await ctx.close();
}
await browser.close();
server.close();

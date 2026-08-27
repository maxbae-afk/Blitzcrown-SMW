/**
 * game.html 확인용. 전체 화면 한 장, 상단 블록 한 장, 전체 보기 한 장을 찍는다.
 * 시퀀스가 없는 페이지라 page.mjs 의 대기 조건을 쓸 수 없다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run game-shot.mjs                 # 데스크톱 1440
 *   bun run game-shot.mjs 390 mobile      # 모바일
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';
const width = Number(process.argv[2] ?? 1440);
const tag = process.argv[3] ?? 'desktop';
const slug = process.argv[4] ?? 'smash-tower';

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
});

const page = await browser.newPage();
await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
page.on('response', (r) => {
  if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`http ${r.status()}: ${r.url()}`);
});

await page.goto(`http://127.0.0.1:4321/game.html?title=${slug}`, { waitUntil: 'networkidle0' });

// 리빌은 화면에 들어와야 켜진다. 전체를 한 장으로 찍으려면 먼저 끝까지 훑는다.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  await new Promise((r) => setTimeout(r, 500));
});

await page.screenshot({ path: `${OUT}/game-${tag}-top.png` });
await page.screenshot({ path: `${OUT}/game-${tag}-full.png`, fullPage: true });

await page.click('#gameExpand');
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${OUT}/game-${tag}-lightbox.png` });

const report = await page.evaluate(() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  };
  return {
    title: document.title,
    stage: box('.gd-stage'),
    thumbs: document.querySelectorAll('.gd-thumb').length,
    metaRows: document.querySelectorAll('#gameMeta > div').length,
    specRows: document.querySelectorAll('#gameSpecs > div').length,
    docWidth: document.documentElement.scrollWidth,
  };
});

console.log(JSON.stringify(report, null, 2));
console.log(errors.length ? errors.join('\n') : 'no errors');

await browser.close();

/**
 * article.html 확인용. 기사 하나를 열어 본문 블록이 다 그려졌는지 세고 화면을 찍는다.
 * 없는 번호로 들어갔을 때 목록으로 돌아가는지도 함께 본다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run article-shot.mjs                 # 01번, 데스크톱
 *   bun run article-shot.mjs 390 mobile 09
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';
const width = Number(process.argv[2] ?? 1440);
const tag = process.argv[3] ?? 'desktop';
const id = process.argv[4] ?? '01';

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

await page.goto(`http://127.0.0.1:4321/article.html?id=${id}`, { waitUntil: 'networkidle0' });

// 리빌은 화면에 들어와야 켜진다. 전체를 한 장으로 찍으려면 먼저 훑는다.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  await new Promise((r) => setTimeout(r, 500));
});

await page.screenshot({ path: `${OUT}/article-${tag}-top.png` });
await page.screenshot({ path: `${OUT}/article-${tag}-full.png`, fullPage: true });

const report = await page.evaluate(() => ({
  title: document.title,
  head: document.getElementById('articleMeta').textContent,
  paragraphs: document.querySelectorAll('.article-body p').length,
  headings: document.querySelectorAll('.article-h').length,
  quotes: document.querySelectorAll('.article-quote').length,
  lists: document.querySelectorAll('.article-list').length,
  figures: document.querySelectorAll('.article-figure').length,
  nav: Array.from(document.querySelectorAll('.article-nav-role')).map((n) => n.textContent),
  dim: Array.from(document.querySelectorAll('.article-body > *')).filter(
    (n) => Number(getComputedStyle(n).opacity) < 0.99,
  ).length,
  docWidth: document.documentElement.scrollWidth,
}));

// 없는 번호로 들어오면 목록으로 돌려보내야 한다.
await page.goto('http://127.0.0.1:4321/article.html?id=99', { waitUntil: 'networkidle0' });
report.badId = new URL(page.url()).pathname;

console.log(JSON.stringify(report, null, 2));
console.log(errors.length ? errors.join('\n') : '오류 없음');

await browser.close();

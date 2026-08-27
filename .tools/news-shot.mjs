/**
 * news.html 확인용. 목록 · 카테고리 필터 · LOAD MORE 를 차례로 눌러 보고 화면을 찍는다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run news-shot.mjs                # 데스크톱 1440
 *   bun run news-shot.mjs 390 mobile     # 모바일
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';
const width = Number(process.argv[2] ?? 1440);
const tag = process.argv[3] ?? 'desktop';

mkdirSync(OUT, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

await page.goto('http://127.0.0.1:4321/news.html', { waitUntil: 'networkidle0' });

const read = () =>
  page.evaluate(() => ({
    rows: document.querySelectorAll('.news-row').length,
    count: document.getElementById('newsCount').textContent,
    more: document.getElementById('newsMore').parentElement.hidden
      ? '(없음)'
      : document.getElementById('newsMore').textContent,
    pressed: document.querySelector('.chip[aria-pressed="true"]')?.textContent,
    url: location.search || '(없음)',
    // 리빌이 켜지지 않은 줄이 남아 있으면 그 줄은 끝까지 흐릿하게 보인다.
    dim: Array.from(document.querySelectorAll('.news-rows > li')).filter(
      (li) => Number(getComputedStyle(li).opacity) < 0.99,
    ).length,
  }));

const rows = [];

// 리빌은 화면에 들어와야 켜진다. 전체를 한 장으로 찍으려면 먼저 훑는다.
// 상태를 읽는 것도 훑은 뒤여야 한다. 그전에 읽으면 아직 켜지는 중인 줄을 흐리다고 세게 된다.
const sweep = () =>
  page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 500));
  });

await sweep();
rows.push({ step: '첫 화면', ...(await read()) });
await page.screenshot({ path: `${OUT}/news-${tag}-top.png` });

await page.click('#newsMore');
await wait(400);
await sweep();
rows.push({ step: 'LOAD MORE', ...(await read()) });
await page.screenshot({ path: `${OUT}/news-${tag}-full.png`, fullPage: true });

// 카테고리를 고르면 개수와 주소가 함께 바뀌어야 한다.
await page.evaluate(() =>
  document.querySelector('.chip[data-category="LICENSING"]').click(),
);
await wait(400);
await sweep();
rows.push({ step: 'LICENSING 필터', ...(await read()) });
await page.screenshot({ path: `${OUT}/news-${tag}-filter.png` });

console.table(rows);
console.log(errors.length ? errors.join('\n') : '오류 없음');

await browser.close();

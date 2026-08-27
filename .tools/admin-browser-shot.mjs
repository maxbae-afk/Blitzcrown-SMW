/**
 * 서버 없이 도는 상태 확인. 배포된 사이트가 이 상태다.
 *
 * 관리자 서버가 아닌 그냥 정적 서버(serve.mjs)로 띄우고,
 * 고친 내용이 브라우저 안에만 남되 사이트 전체에는 보이는지 본다.
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = `http://127.0.0.1:${process.argv[2] ?? 4399}`;
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';
const PASSWORD = 'crown-2026';

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('dialog', (d) => d.accept());

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(`${BASE}/admin.html`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.gate input');
await page.type('.gate input', PASSWORD);
await page.click('.gate button[type="submit"]');
await page.waitForSelector('.adm-item', { timeout: 10000 });
await wait(300);

console.log(
  '모드',
  await page.evaluate(() => document.querySelector('#admMode').dataset.mode),
);

/* 첫 게임 제목을 바꾸고 저장 */
await page.evaluate(() => {
  const input = document.querySelector('.adm-editor input');
  input.value = 'DRAFT TITLE TEST';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.click('#admSave');
await page.waitForFunction(() => document.querySelector('#admStatus').textContent.includes('브라우저에만'), {
  timeout: 8000,
});
await page.screenshot({ path: `${OUT}/admin-browser.png` });

/* 사이트에 보이는지 */
await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
console.log(
  '홈 피처드 제목',
  await page.evaluate(() => document.querySelector('.feature-title')?.textContent),
);
await page.goto(`${BASE}/games.html`, { waitUntil: 'networkidle0' });
console.log(
  '목록 첫 카드',
  await page.evaluate(() => document.querySelector('.card h3')?.textContent),
);

/* 임시 저장을 지우면 원래대로 */
await page.goto(`${BASE}/admin.html`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.adm-item');
await page.click('#admReset');
await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
await wait(600);
await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
console.log(
  '지운 뒤 홈 제목',
  await page.evaluate(() => document.querySelector('.feature-title')?.textContent),
);

/* 파일이 안 바뀌었는지 */
const disk = await Bun.file(
  'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling/js/games.data.js',
).text();
console.log('파일에 임시값이 새어 들어갔나:', disk.includes('DRAFT TITLE TEST'));

console.log(errors.length ? errors.join('\n') : '오류 없음');
await browser.close();

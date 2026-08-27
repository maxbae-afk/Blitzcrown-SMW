/**
 * 관리자 화면 확인.
 *
 * 비밀번호 창 → 게임 편집 → 뉴스 편집 순으로 열어 보고, 서버 모드에서 저장이
 * 실제 파일까지 닿는지 본다. 저장 검사는 제목을 잠깐 바꿨다가 되돌리는 식이라
 * 자료를 더럽히지 않는다.
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'http://127.0.0.1:4321';
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
page.on('response', (r) => {
  if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`http ${r.status()}: ${r.url()}`);
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];

/* 1. 푸터 버튼이 있고, 틀린 비밀번호는 막히는지 */
await page.goto(`${BASE}/games.html`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.admin-link');
await page.click('.admin-link');
await page.waitForSelector('.gate input');
await page.screenshot({ path: `${OUT}/admin-gate.png` });

await page.type('.gate input', '틀린값');
await page.click('.gate button[type="submit"]');
await wait(300);
rows.push({
  단계: '틀린 비밀번호',
  결과: await page.evaluate(() => ({
    열림: Boolean(document.querySelector('dialog.gate[open]')),
    오류: !document.querySelector('.gate-error')?.hidden,
    주소: location.pathname,
  })),
});

/* 2. 맞는 비밀번호 → 관리자 화면 */
await page.evaluate(() => {
  document.querySelector('.gate input').value = '';
});
await page.type('.gate input', PASSWORD);
await page.click('.gate button[type="submit"]');
await page.waitForFunction(() => location.pathname.endsWith('/admin.html'), { timeout: 10000 });
await page.waitForSelector('.adm-item', { timeout: 10000 });
await wait(400);

rows.push({
  단계: '관리자 진입',
  결과: await page.evaluate(() => ({
    모드: document.querySelector('#admMode').dataset.mode,
    게임수: document.querySelectorAll('.adm-item').length,
    제목: document.querySelector('.adm-head h2')?.textContent,
    입력칸: document.querySelectorAll('.adm-editor input, .adm-editor textarea, .adm-editor select').length,
  })),
});
await page.screenshot({ path: `${OUT}/admin-games.png` });

/* 3. 뉴스 탭 */
await page.click('.adm-tab[data-tab="news"]');
await wait(400);
rows.push({
  단계: '뉴스 탭',
  결과: await page.evaluate(() => ({
    기사수: document.querySelectorAll('.adm-item').length,
    제목: document.querySelector('.adm-head h2')?.textContent?.slice(0, 28),
    블록: document.querySelectorAll('.adm-block').length,
  })),
});
await page.screenshot({ path: `${OUT}/admin-news.png` });

/* 4. 서버 저장이 파일까지 닿는지. 제목 뒤에 표시를 붙였다가 되돌린다. */
await page.click('.adm-tab[data-tab="games"]');
await wait(300);

const original = await page.evaluate(() => document.querySelector('.adm-editor input').value);
await page.evaluate(() => {
  const input = document.querySelector('.adm-editor input');
  input.value = `${input.value} · TEST`;
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.click('#admSave');
await page.waitForFunction(() => document.querySelector('#admStatus').textContent.includes('파일에 저장'), {
  timeout: 10000,
});

const saved = await fetch(`${BASE}/api/data`).then((r) => r.json());
rows.push({ 단계: '저장 후 파일', 결과: { 첫게임: saved.games[0].title } });

// 되돌린다
await page.evaluate((value) => {
  const input = document.querySelector('.adm-editor input');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}, original);
await page.click('#admSave');
await page.waitForFunction(() => document.querySelector('#admStatus').textContent.includes('파일에 저장'), {
  timeout: 10000,
});

const back = await fetch(`${BASE}/api/data`).then((r) => r.json());
rows.push({ 단계: '되돌린 뒤', 결과: { 첫게임: back.games[0].title } });

/* 5. 열쇠 없이 쓰기 시도 */
const denied = await fetch(`${BASE}/api/data`, {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ games: [], news: [] }),
});
rows.push({ 단계: '열쇠 없이 저장', 결과: { 상태: denied.status } });

rows.forEach((row) => console.log(row.단계.padEnd(16), JSON.stringify(row.결과)));
console.log(errors.length ? errors.join('\n') : '오류 없음');
await browser.close();

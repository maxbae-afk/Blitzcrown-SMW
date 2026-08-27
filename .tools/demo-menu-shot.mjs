/**
 * 상단 PLAY DEMO 패널 확인.
 *
 * 홈은 부팅과 시퀀스가 걸려 있어 page.mjs 를 쓰고, 나머지 페이지는 바로 연다.
 * 열기(호버/클릭), 닫기(Esc/바깥 클릭), 항목 수, 눌리는 데모 수를 함께 본다.
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'http://127.0.0.1:4321';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';

mkdirSync(OUT, { recursive: true });

const width = Number(process.argv[2] ?? 1440);
const tag = process.argv[3] ?? 'desktop';

const read = (page) =>
  page.evaluate(() => {
    const panel = document.querySelector('.demo-menu');
    const trigger = document.querySelector('.top-cta');
    if (!panel) return { open: false, items: 0 };
    const rect = panel.getBoundingClientRect();
    return {
      open: panel.classList.contains('is-open'),
      expanded: trigger.getAttribute('aria-expanded'),
      inert: panel.inert,
      items: panel.querySelectorAll('.demo-item').length,
      playable: panel.querySelectorAll('.btn--primary').length,
      note: panel.querySelector('.demo-menu-note')?.textContent ?? '',
      // 오른쪽 끝이 버튼 오른쪽 끝과 맞는지, 화면 밖으로 나가지 않는지
      right: Math.round(document.documentElement.clientWidth - rect.right),
      ctaRight: Math.round(
        document.documentElement.clientWidth - trigger.getBoundingClientRect().right,
      ),
      overflowLeft: Math.round(rect.left),
    };
  });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
});

const page = await browser.newPage();
const touch = tag === 'mobile';
await page.setViewport({ width, height: 844, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch });

/*
  좁게 줄이는 것만으로는 hover 판정이 바뀌지 않는다.
  손가락으로 쓰는 화면에서는 눌러야 열리고 닫히므로, 그 경로를 보려면 미디어를 직접 바꿔 준다.
*/
if (touch) {
  const cdp = await page.target().createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'hover', value: 'none' },
      { name: 'pointer', value: 'coarse' },
    ],
  });
}

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('response', (r) => {
  if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`http ${r.status()}: ${r.url()}`);
});

const rows = [];

async function visit(file, label) {
  await page.goto(`${BASE}/${file}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.demo-menu', { timeout: 20000 });

  const tap = () => page.evaluate(() => document.querySelector('.top-cta').click());
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  rows.push({ 페이지: label, 단계: '처음', ...(await read(page)) });

  if (touch) {
    await tap();
    await wait(350);
    rows.push({ 페이지: label, 단계: '누름', ...(await read(page)) });
    await page.screenshot({ path: `${OUT}/demo-menu-${tag}-${label}.png` });

    await tap();
    await wait(350);
    rows.push({ 페이지: label, 단계: '다시누름', ...(await read(page)) });
    return;
  }

  await page.hover('.top-cta');
  await wait(400);
  rows.push({ 페이지: label, 단계: '호버', ...(await read(page)) });

  await page.screenshot({ path: `${OUT}/demo-menu-${tag}-${label}.png` });

  // 바깥으로 마우스를 빼면 잠깐 뒤에 닫힌다
  await page.mouse.move(width / 2, 820);
  await wait(500);
  rows.push({ 페이지: label, 단계: '벗어남', ...(await read(page)) });

  // 마우스를 옮기지 않고 누른다. page.click 은 커서를 먼저 올려서 호버와 구분이 안 된다.
  await tap();
  await wait(350);
  rows.push({ 페이지: label, 단계: '클릭만', ...(await read(page)) });

  await page.keyboard.press('Escape');
  await wait(350);
  rows.push({ 페이지: label, 단계: 'Esc', ...(await read(page)) });

  // 호버로 연 뒤 눌러도 닫히지 않아야 한다
  await page.hover('.top-cta');
  await wait(350);
  await page.click('.top-cta');
  await wait(350);
  rows.push({ 페이지: label, 단계: '호버뒤클릭', ...(await read(page)) });

  await page.mouse.move(width / 2, 820);
  await page.mouse.down();
  await page.mouse.up();
  await wait(400);
  rows.push({ 페이지: label, 단계: '바깥클릭', ...(await read(page)) });
}

await visit('index.html', 'home');
await visit('games.html', 'games');

console.table(rows);
console.log(errors.length ? errors.join('\n') : '오류 없음');
await browser.close();

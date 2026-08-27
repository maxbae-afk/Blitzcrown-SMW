/**
 * 자동 재생 버튼 확인.
 * 눌렀을 때 실제로 굴러가는지, 다시 눌러 멈추는지, 사용자가 휠을 돌리면 스스로 멈추는지,
 * 끝까지 가면 멈추고 처음으로 되돌릴 수 있는지를 본다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run autoplay-check.mjs
 */

import { open, state, OUT } from './page.mjs';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (page) => page.evaluate(() => ({
  y: window.scrollY,
  playing: document.getElementById('playSequence').getAttribute('aria-pressed') === 'true',
  icon: document.getElementById('playSequenceIcon').getAttribute('src'),
}));

const { browser, page, errors } = await open({ width: 1440, height: 900 });

const rows = [];
const log = (label, extra = {}) =>
  read(page).then((s) => rows.push({ label, ...s, ...extra }));

await log('시작');

await page.click('#playSequence');
await wait(300);
await log('재생 직후');

await wait(4000);
const moving = await read(page);
const frames = await state(page);
rows.push({ label: '4초 뒤', ...moving, frame: frames.frames.find((f) => f > 0) });

// 다시 눌러 멈춘다
await page.click('#playSequence');
await wait(400);
const paused = await read(page);
await wait(700);
const stillPaused = await read(page);
rows.push({ label: '정지 직후', ...paused });
rows.push({ label: '정지 0.7초 뒤', ...stillPaused, drift: stillPaused.y - paused.y });

// 다시 틀고 사용자가 휠을 돌리면 스스로 멈춰야 한다
await page.click('#playSequence');
await wait(500);
await page.mouse.wheel({ deltaY: 400 });
await wait(500);
await log('휠 개입 뒤');

// 끝까지
await page.click('#skipSequence');
await wait(400);
await log('끝으로 이동');

await page.click('#playSequence');
await wait(600);
await log('끝에서 재생 (처음으로 되감김)');

await page.click('#playSequence');
await wait(200);

// 버튼 세 개가 오른쪽 아래에 나란한지 눈으로도 확인한다.
await page.screenshot({ path: `${OUT}/sequence-controls.png` });

console.table(rows);
console.log(errors.length ? errors.join('\n') : '오류 없음');

await browser.close();

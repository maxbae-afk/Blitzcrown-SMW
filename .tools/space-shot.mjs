/**
 * 시퀀스 아래 문서 구간만 한 장으로 이어 찍는다.
 * 섹션 사이 간격은 화면 하나씩 봐서는 비교가 안 되므로, 세로로 붙여 놓고 본다.
 *
 *   bun run space-shot.mjs           # 1440px
 *   bun run space-shot.mjs 1024
 */

import sharp from 'sharp';
import { open, seek, OUT } from './page.mjs';

const width = Number(process.argv[2] ?? 1440);
const VH = 900;

const { browser, page } = await open({ width, height: VH });

await page.evaluate(() => {
  for (const el of document.querySelectorAll('.reveal')) el.classList.add('in');
  for (const el of document.querySelectorAll('.milestone')) el.classList.add('in');
  // 고정 UI 는 이어 붙일 때 같은 자리에 반복해서 찍혀 간격 판단을 방해한다.
  for (const el of document.querySelectorAll('.topbar, .hud, .rail, .cue')) el.style.display = 'none';
});

const { start, end } = await page.evaluate(() => ({
  start: document.getElementById('release').offsetTop,
  end: document.documentElement.scrollHeight,
}));

const shots = [];
for (let y = start; y < end - VH; y += VH) {
  await seek(page, y, 260);
  shots.push(await page.screenshot());
}

await browser.close();

const scale = 0.5;
const tw = Math.round(width * scale);
const th = Math.round(VH * scale);
const tiles = await Promise.all(shots.map((b) => sharp(b).resize(tw, th).png().toBuffer()));

// 한 줄에 다 세우면 너무 길어지니 여러 열로 접는다.
const COLS = 4;
const rows = Math.ceil(tiles.length / COLS);
await sharp({ create: { width: COLS * tw, height: rows * th, channels: 3, background: '#000' } })
  .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * tw, top: Math.floor(i / COLS) * th })))
  .png()
  .toFile(`${OUT}/space-${width}.png`);

console.log(`space-${width}.png · ${shots.length}컷`);

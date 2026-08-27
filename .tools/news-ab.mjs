/**
 * "우리가 변환한 파일이 화질을 깎았는가" 를 가린다.
 *
 * 원본 PNG 와 변환한 webp 를 같은 폭으로 브라우저에 그린 뒤 같은 자리를 잘라 겹쳐 본다.
 * 원본 쪽이 더 낫다면 변환이 범인이고, 둘이 같다면 남은 원인은 늘려 그리는 것뿐이다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run news-ab.mjs
 */

import sharp from 'sharp';
import { copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { open } from './page.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const SITE = `${ROOT}/srolling`;
const NAME = 'news-03-stand';

// 임시 파일. 비교가 끝나면 지운다.
const tmpPng = `${SITE}/assets/news/_ab-src.png`;
const tmpHtml = `${SITE}/_ab.html`;

copyFileSync(`${ROOT}/_source-news/${NAME}.png`, tmpPng);

/*
  기사 상단과 같은 조건으로 맞춘다. 폭 1328px, 21:9 로 잘라 넣기.
  srcset 을 주지 않아 브라우저가 이 파일 하나만 쓰게 한다.
*/
const box = 'width:1328px;aspect-ratio:21/9;object-fit:cover;display:block;';
writeFileSync(
  tmpHtml,
  `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#05070a">
   <img id="a" style="${box}" src="assets/news/_ab-src.png">
   <img id="b" style="${box}" src="assets/news/${NAME}-2x.webp">
   </body>`,
);

const { browser, page } = await open({ width: 1440, height: 900, dpr: 2 });
await page.goto('http://127.0.0.1:4321/_ab.html', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 400));

for (const id of ['a', 'b']) {
  const el = await page.$(`#${id}`);
  await el.screenshot({ path: `shots/ab-${id}.png` });
}
await browser.close();

const CROP = { left: 880, top: 120, width: 920, height: 300 };
const gap = 12;
const a = await sharp('shots/ab-a.png').extract(CROP).toBuffer();
const b = await sharp('shots/ab-b.png').extract(CROP).toBuffer();

await sharp({
  create: { width: CROP.width, height: CROP.height * 2 + gap, channels: 3, background: '#ff00ff' },
})
  .composite([
    { input: a, top: 0, left: 0 },
    { input: b, top: CROP.height + gap, left: 0 },
  ])
  .png()
  .toFile('shots/ab-compare.png');

rmSync(tmpPng);
rmSync(tmpHtml);

console.log('위: 원본 PNG 를 브라우저가 늘린 것 / 아래: 변환한 webp');

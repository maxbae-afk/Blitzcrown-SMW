/**
 * 화질 개선 전후를 같은 영역에서 1:1 로 붙여 본다.
 * 줄여서 보면 차이가 사라지므로 자른 그대로 위아래로 쌓는다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run news-compare.mjs
 */

import sharp from 'sharp';

const [left, top, width, height] = (process.argv[2] ?? '880,120,920,300').split(',').map(Number);
const CROP = { left, top, width, height };
const LABELS = ['before', 'after'];

const parts = [];
for (const tag of LABELS) {
  const buf = await sharp(`shots/q-${tag}-dpr2.png`).extract(CROP).toBuffer();
  parts.push(buf);
}

const gap = 12;
await sharp({
  create: {
    width: CROP.width,
    height: CROP.height * 2 + gap,
    channels: 3,
    background: '#ff00ff',
  },
})
  .composite([
    { input: parts[0], top: 0, left: 0 },
    { input: parts[1], top: CROP.height + gap, left: 0 },
  ])
  .png()
  .toFile('shots/q-compare.png');

console.log('위: 개선 전 / 아래: 개선 후');

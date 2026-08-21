/**
 * 그레이딩 전/후를 위아래로 붙여 비교 이미지를 만든다.
 * 264장을 다 변환하기 전에 값을 확인하는 용도.
 *
 *   bun run preview-grade.mjs
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { listSource } from './pacing.mjs';
import { applyGrade } from './grade.mjs';

const SRC = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';

mkdirSync(OUT, { recursive: true });

const W = 900;
const H = 506;

const files = listSource(SRC);
const picks = [
  [20, '동전 폭발'],
  [62, '성 등장'],
  [110, '대홀'],
  [136, '딜러'],
  [175, '카드 딜링'],
  [232, '비행'],
];

const label = (text, w) =>
  Buffer.from(
    `<svg width="${w}" height="26">
       <rect x="0" y="0" width="${w}" height="26" fill="#000" opacity="0.66"/>
       <text x="10" y="18" font-family="monospace" font-size="14" fill="#3ee0b8">${text}</text>
     </svg>`,
  );

for (const [idx, name] of picks) {
  const base = sharp(`${SRC}/${files[idx]}`).resize(W, H).removeAlpha();

  const before = await base.clone().png().toBuffer();

  const { data, info } = await base.clone().raw().toBuffer({ resolveWithObject: true });
  applyGrade(data);
  const after = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 3 },
  })
    .png()
    .toBuffer();

  await sharp({ create: { width: W, height: H * 2, channels: 3, background: '#000' } })
    .composite([
      { input: before, top: 0, left: 0 },
      { input: after, top: H, left: 0 },
      { input: label(`${idx}  ${name}  —  BEFORE`, W), top: 0, left: 0 },
      { input: label(`${idx}  ${name}  —  AFTER`, W), top: H, left: 0 },
    ])
    .png()
    .toFile(`${OUT}/grade-${String(idx).padStart(3, '0')}.png`);

  console.log(`grade-${String(idx).padStart(3, '0')}.png  ${name}`);
}

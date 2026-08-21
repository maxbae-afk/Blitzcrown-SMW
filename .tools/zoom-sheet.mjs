/**
 * 특정 구간만 크게 뽑는 컨택트 시트. 컷 경계를 프레임 단위로 확정할 때 쓴다.
 *
 *   bun run zoom-sheet.mjs 140 205
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { listSource } from './pacing.mjs';

const SRC = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';

const from = Number(process.argv[2] ?? 0);
const to = Number(process.argv[3] ?? from + 40);

const COLS = 8;
const TW = 256;
const TH = 144;

mkdirSync(OUT, { recursive: true });

const files = listSource(SRC);
const comps = [];

for (let i = from; i <= to && i < files.length; i += 1) {
  const k = i - from;
  const left = (k % COLS) * TW;
  const top = Math.floor(k / COLS) * TH;
  comps.push({ input: await sharp(`${SRC}/${files[i]}`).resize(TW, TH).png().toBuffer(), left, top });
  comps.push({
    input: Buffer.from(
      `<svg width="${TW}" height="${TH}">
         <rect x="0" y="0" width="42" height="20" fill="#000" opacity="0.75"/>
         <text x="5" y="15" font-family="monospace" font-size="14" fill="#3ee0b8">${i}</text>
       </svg>`,
    ),
    left,
    top,
  });
}

const rows = Math.ceil((to - from + 1) / COLS);
await sharp({ create: { width: COLS * TW, height: rows * TH, channels: 3, background: '#111' } })
  .composite(comps)
  .png()
  .toFile(`${OUT}/sheet-zoom-${from}-${to}.png`);

console.log(`sheet-zoom-${from}-${to}.png`);

/**
 * 아무 폴더나 받아서 썸네일 시트를 만든다.
 * contact-sheet.mjs 는 pacing.mjs 에 등록된 시퀀스만 다루는데,
 * 새로 받은 원본은 아직 등록 전이라 내용을 먼저 봐야 한다.
 *
 *   bun run peek-sheet.mjs <폴더> [출력이름]
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { listSource } from './pacing.mjs';

const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';

const src = process.argv[2];
const tag = process.argv[3] ?? 'peek';
if (!src) {
  console.error('폴더를 지정하세요.');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const files = listSource(src);
console.log(`${files.length}장`);

const COLS = 10;
const TW = 192;
const TH = 108;
const CHUNK = 60;

for (let c = 0; c * CHUNK < files.length; c += 1) {
  const offset = c * CHUNK;
  const slice = files.slice(offset, offset + CHUNK);
  const rows = Math.ceil(slice.length / COLS);
  const composites = [];

  for (let i = 0; i < slice.length; i += 1) {
    const left = (i % COLS) * TW;
    const top = Math.floor(i / COLS) * TH;
    composites.push({
      input: await sharp(`${src}/${slice[i]}`).resize(TW, TH).png().toBuffer(),
      left,
      top,
    });
    composites.push({
      input: Buffer.from(
        `<svg width="${TW}" height="${TH}">
           <rect x="0" y="0" width="40" height="16" fill="#000" opacity="0.72"/>
           <text x="4" y="12" font-family="monospace" font-size="12" fill="#3ee0b8">${
             offset + i
           }</text>
         </svg>`,
      ),
      left,
      top,
    });
  }

  await sharp({
    create: { width: COLS * TW, height: rows * TH, channels: 3, background: '#111' },
  })
    .composite(composites)
    .png()
    .toFile(`${OUT}/sheet-${tag}-${c}.png`);

  console.log(`sheet-${tag}-${c}: ${offset} – ${offset + slice.length - 1}`);
}

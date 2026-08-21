/**
 * 원본 시퀀스를 60프레임씩 묶어 썸네일 시트로 만든다.
 * 각 칸에 0-based 프레임 번호를 찍어 두어 컷 경계를 바로 읽을 수 있다.
 *
 *   bun run contact-sheet.mjs           # main
 *   bun run contact-sheet.mjs ascent
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { listSource, sequenceById } from './pacing.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const OUT = `${ROOT}/.tools/shots`;

const sequence = sequenceById(process.argv[2] ?? 'main');
const src = `${ROOT}/${sequence.src}`;

mkdirSync(OUT, { recursive: true });

const files = listSource(src);
if (!files.length) {
  console.error(`원본을 찾지 못했습니다: ${src}`);
  process.exit(1);
}

const COLS = 10;
const TW = 192;
const TH = 108;
const CHUNK = 60;

console.log(`[${sequence.id}] ${files.length}장`);

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
    const label = Buffer.from(
      `<svg width="${TW}" height="${TH}">
         <rect x="0" y="0" width="34" height="16" fill="#000" opacity="0.72"/>
         <text x="4" y="12" font-family="monospace" font-size="12" fill="#3ee0b8">${
           offset + i
         }</text>
       </svg>`,
    );
    composites.push({ input: label, left, top });
  }

  await sharp({
    create: { width: COLS * TW, height: rows * TH, channels: 3, background: '#111' },
  })
    .composite(composites)
    .png()
    .toFile(`${OUT}/sheet-${sequence.id}-${c}.png`);

  console.log(`sheet-${sequence.id}-${c}: 프레임 ${offset} – ${offset + slice.length - 1}`);
}

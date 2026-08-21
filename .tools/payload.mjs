/**
 * 세트별 장수와 실제 용량. 페이지의 SPECS 숫자를 여기에 맞춘다.
 *
 *   bun run payload.mjs
 */

import { readdirSync, statSync } from 'node:fs';
import { SEQUENCES } from './pacing.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling/frames';
const MB = (b) => (b / 1024 / 1024).toFixed(2);

const totals = {};

console.log('시퀀스   세트      장수    AVIF      WebP');
for (const seq of SEQUENCES) {
  for (const set of ['retina', 'desktop', 'mobile']) {
    let files;
    try {
      files = readdirSync(`${ROOT}/${seq.id}/${set}`);
    } catch {
      continue;
    }

    const size = { avif: 0, webp: 0 };
    let count = 0;
    for (const f of files) {
      const ext = f.split('.').pop();
      if (!(ext in size)) continue;
      size[ext] += statSync(`${ROOT}/${seq.id}/${set}/${f}`).size;
      if (ext === 'avif') count += 1;
    }

    totals[set] ??= { count: 0, avif: 0, webp: 0 };
    totals[set].count += count;
    totals[set].avif += size.avif;
    totals[set].webp += size.webp;

    console.log(
      `${seq.id.padEnd(8)} ${set.padEnd(8)} ${String(count).padStart(4)}  ${MB(size.avif).padStart(
        7,
      )}MB  ${MB(size.webp).padStart(7)}MB`,
    );
  }
}

console.log('');
for (const [set, t] of Object.entries(totals)) {
  console.log(
    `합계 ${set.padEnd(8)} ${String(t.count).padStart(4)}장  AVIF ${MB(t.avif)}MB  WebP ${MB(
      t.webp,
    )}MB`,
  );
}

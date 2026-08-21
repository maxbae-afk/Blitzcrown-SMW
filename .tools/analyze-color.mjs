/**
 * 원본 프레임의 색 분포를 잰다. 그레이딩 값을 감으로 정하지 않기 위한 사전 측정.
 *
 * 보는 것:
 *  - 블랙/화이트 포인트: 실제로 0과 255를 쓰고 있는지. 안 쓰고 있으면 대비를 손해 보는 중.
 *  - 채널별 중앙값: 특정 채널이 치우쳐 있으면 색 캐스트가 있다는 뜻.
 *  - 채도: 낮으면 올릴 여지가 있다.
 *
 *   bun run analyze-color.mjs
 */

import sharp from 'sharp';
import { listSource } from './pacing.mjs';

const SRC = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames';
const W = 480;
const H = 270;

const files = listSource(SRC);
const picks = [0, 20, 40, 60, 90, 110, 130, 150, 175, 200, 215, 240, 260].filter(
  (i) => i < files.length,
);

function percentile(hist, total, p) {
  const want = total * p;
  let acc = 0;
  for (let v = 0; v < 256; v += 1) {
    acc += hist[v];
    if (acc >= want) return v;
  }
  return 255;
}

console.log('프레임   블랙(0.5%)  화이트(99.5%)  중간값   채도    R/G/B 중앙값');

const agg = { black: [], white: [], sat: [] };

for (const idx of picks) {
  const { data } = await sharp(`${SRC}/${files[idx]}`)
    .resize(W, H)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const luma = new Uint32Array(256);
  const ch = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  let satSum = 0;
  const n = data.length / 3;

  for (let p = 0; p < data.length; p += 3) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const y = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    luma[y] += 1;
    ch[0][r] += 1;
    ch[1][g] += 1;
    ch[2][b] += 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    satSum += max === 0 ? 0 : (max - min) / max;
  }

  const black = percentile(luma, n, 0.005);
  const white = percentile(luma, n, 0.995);
  const mid = percentile(luma, n, 0.5);
  const sat = satSum / n;
  const meds = ch.map((c) => percentile(c, n, 0.5));

  agg.black.push(black);
  agg.white.push(white);
  agg.sat.push(sat);

  console.log(
    `${String(idx).padStart(5)}  ${String(black).padStart(9)}  ${String(white).padStart(12)}  ${String(
      mid,
    ).padStart(6)}  ${sat.toFixed(3).padStart(6)}   ${meds.join(' / ')}`,
  );
}

const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(
  `\n평균  블랙 ${avg(agg.black).toFixed(1)}  화이트 ${avg(agg.white).toFixed(1)}  채도 ${avg(
    agg.sat,
  ).toFixed(3)}`,
);
console.log(`블랙 최대 ${Math.max(...agg.black)} · 화이트 최소 ${Math.min(...agg.white)}`);

/**
 * 프레임 간 변화량을 재서 시퀀스의 "속도 프로파일"을 뽑는다.
 * 값이 크면 그 구간은 프레임당 움직임이 커서 스크럽할 때 뚝뚝 끊겨 보이고,
 * 값이 작으면 거의 정지에 가까워 스크롤을 낭비하는 구간이다.
 */

import sharp from 'sharp';
import { readdirSync } from 'node:fs';

const SRC = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames';
const W = 160;
const H = 90;

const files = readdirSync(SRC)
  .filter((f) => /\.png$/i.test(f))
  .sort();

async function gray(file) {
  const { data } = await sharp(`${SRC}/${file}`)
    .resize(W, H)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

const diffs = [];
let prev = await gray(files[0]);

for (let i = 1; i < files.length; i += 1) {
  const cur = await gray(files[i]);
  let sum = 0;
  for (let p = 0; p < cur.length; p += 1) sum += Math.abs(cur[p] - prev[p]);
  diffs.push(sum / cur.length);
  prev = cur;
}

const max = Math.max(...diffs);
const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;

// 컷 구간별 평균
const sections = [
  ['코인 클로즈업', 0, 34],
  ['균열·발광', 35, 46],
  ['워프→성 등장', 47, 83],
  ['성문 진입', 84, 94],
  ['대홀 진입', 95, 130],
  ['딜러 등장', 131, 155],
  ['카드 딜링', 156, 190],
  ['로고 발광', 191, 202],
  ['구름', 203, 212],
  ['비행', 213, 262],
];

console.log(`전체 평균 변화량 ${avg.toFixed(2)} / 최대 ${max.toFixed(2)}\n`);
console.log('구간              프레임      평균변화  상대속도  막대');

for (const [name, from, to] of sections) {
  const slice = diffs.slice(from, to + 1);
  const m = slice.reduce((a, b) => a + b, 0) / slice.length;
  const rel = m / avg;
  const bar = '█'.repeat(Math.max(1, Math.round(rel * 18)));
  console.log(
    `${name.padEnd(14)} ${String(from).padStart(3)}–${String(to).padEnd(3)}  ${m
      .toFixed(2)
      .padStart(8)}  ${rel.toFixed(2).padStart(6)}x  ${bar}`,
  );
}

const worst = diffs.indexOf(max);
console.log(`\n가장 튀는 지점: ${worst} → ${worst + 1} 프레임 (변화량 ${max.toFixed(2)})`);

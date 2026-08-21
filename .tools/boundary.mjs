/**
 * 시퀀스가 맞닿는 지점의 프레임을 나란히 붙여 본다.
 * 앞 시퀀스의 마지막 컷과 뒤 시퀀스의 첫 컷이 같은 구도·같은 톤이어야 교차가 보이지 않는다.
 *
 * 기본은 실제로 화면에 나가는 변환 결과를 본다. 원본은 톤이 시퀀스마다 다를 수 있고
 * 그 차이는 변환 단계의 클립 맞추기(pacing.mjs 의 match)에서 잡기 때문이다.
 *
 *   bun run boundary.mjs            # 변환 결과
 *   bun run boundary.mjs --source   # 원본 PNG
 */

import sharp from 'sharp';
import { SEQUENCES, listSource } from './pacing.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const SITE = `${ROOT}/srolling`;
const USE_SOURCE = process.argv.includes('--source');
const W = 420;
const H = Math.round((W * 9) / 16);
const LABEL_H = 22;

const pad4 = (n) => String(n).padStart(4, '0');

/** 원본과 변환 결과는 장수가 같고 순서도 같다. 보고 싶은 쪽의 경로를 돌려준다. */
function frames(seq) {
  const names = listSource(`${ROOT}/${seq.src}`);
  if (USE_SOURCE) return names.map((f) => `${ROOT}/${seq.src}/${f}`);
  return names.map((_, i) => `${SITE}/frames/${seq.id}/desktop/frame_${pad4(i + 1)}.avif`);
}

/** 경계마다 [앞 시퀀스 끝, 뒤 시퀀스 시작] 두 장을 뽑는다. */
const picks = [];
for (let i = 0; i < SEQUENCES.length; i += 1) {
  const seq = SEQUENCES[i];
  const files = frames(seq);
  if (i > 0) picks.push({ seq: seq.id, idx: 0, file: files[0] });
  if (i < SEQUENCES.length - 1) {
    const last = files.length - 1;
    picks.push({ seq: seq.id, idx: last, file: files[last] });
  }
}

const tiles = await Promise.all(
  picks.map(async (p) => ({
    ...p,
    buf: await sharp(p.file).resize(W, H, { fit: 'cover' }).toBuffer(),
  })),
);

const canvas = sharp({
  create: {
    width: W * tiles.length,
    height: H + LABEL_H,
    channels: 3,
    background: { r: 8, g: 10, b: 12 },
  },
});

const layers = [];
tiles.forEach((t, i) => {
  layers.push({ input: t.buf, left: i * W, top: LABEL_H });
  const svg = `<svg width="${W}" height="${LABEL_H}"><rect width="${W}" height="${LABEL_H}" fill="#080a0c"/><text x="8" y="15" font-family="monospace" font-size="12" fill="#32dab4">${t.seq}  frame ${t.idx}</text></svg>`;
  layers.push({ input: Buffer.from(svg), left: i * W, top: 0 });
});

await canvas.composite(layers).png().toFile('./shots/boundary.png');

const thumb = (file) => sharp(file).resize(64, 36).greyscale().raw().toBuffer();

async function diff(fileA, fileB) {
  const [a, b] = await Promise.all([thumb(fileA), thumb(fileB)]);
  let sum = 0;
  for (let p = 0; p < a.length; p += 1) sum += Math.abs(a[p] - b[p]);
  return sum / a.length;
}

/**
 * 이웃한 두 프레임이 평소 얼마나 달라지는지. 경계의 차이를 견줄 기준이 된다.
 * 경계 차이가 이 값 언저리면 컷으로 넘겨도 평범한 프레임 진행과 구별되지 않는다.
 */
async function typicalStep(seq, fromEnd) {
  const files = frames(seq);
  const window = fromEnd ? files.slice(-6) : files.slice(0, 6);
  const steps = [];
  for (let i = 0; i + 1 < window.length; i += 1) steps.push(await diff(window[i], window[i + 1]));
  return steps.reduce((s, n) => s + n, 0) / steps.length;
}

// 맞닿는 두 장의 평균 밝기차로 컷이 튀는지 가늠한다.
console.log('경계 차이 (평균 밝기 / 255)\n');
for (let i = 0, s = 0; i + 1 < tiles.length; i += 2, s += 1) {
  const a = tiles[i];
  const b = tiles[i + 1];
  const gap = await diff(a.file, b.file);
  const [stepA, stepB] = await Promise.all([
    typicalStep(SEQUENCES[s], true),
    typicalStep(SEQUENCES[s + 1], false),
  ]);
  const step = (stepA + stepB) / 2;

  console.log(`  ${a.seq}#${a.idx} ↔ ${b.seq}#${b.idx}`);
  console.log(`    경계 차이      ${gap.toFixed(2)}`);
  console.log(`    평소 프레임 간격 ${step.toFixed(2)}  (앞 ${stepA.toFixed(2)} · 뒤 ${stepB.toFixed(2)})`);
  console.log(`    비율          ${(gap / step).toFixed(2)}x\n`);
}

console.log('shots/boundary.png');

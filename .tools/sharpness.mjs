/**
 * 원본이 표기 해상도(1920)만큼의 디테일을 실제로 담고 있는지 검사한다.
 *
 * 방법: 절반으로 줄였다가 다시 1920으로 되돌린 뒤 원본과 비교한다.
 * 차이가 거의 없다면 그 프레임은 사실상 960 수준의 정보만 가진 것이고,
 * 더 높은 해상도로 다시 렌더해도 얻을 게 없다는 뜻이다.
 */

import sharp from 'sharp';
import { readdirSync } from 'node:fs';

const SRC = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames';

const files = readdirSync(SRC).filter((f) => /\.png$/i.test(f)).sort();
const samples = [0, 30, 60, 95, 132, 180, 210, 250].map((i) => files[i]).filter(Boolean);

/** 그레이스케일 픽셀 배열 */
async function gray(input, w = 960, h = 540) {
  const { data } = await sharp(input).resize(w, h).greyscale().raw().toBuffer({ resolveWithObject: true });
  return data;
}

function rmse(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum / a.length);
}

/** 라플라시안 분산 — 값이 클수록 경계가 또렷하다 */
async function laplacianVariance(input) {
  const w = 960;
  const h = 540;
  const data = await gray(input, w, h);
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const v = 4 * data[i] - data[i - 1] - data[i + 1] - data[i - w] - data[i + w];
      sum += v;
      sumSq += v * v;
      n += 1;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

console.log('frame            해상력손실(RMSE)  선명도(LapVar)');

for (const file of samples) {
  const path = `${SRC}/${file}`;

  const original = await sharp(path).resize(1920, 1080).png().toBuffer();
  // sharp 는 파이프라인당 resize 를 한 번만 적용한다. 중간 결과를 반드시 버퍼로 확정해야 한다.
  const half = await sharp(original).resize(960, 540).png().toBuffer();
  const roundTrip = await sharp(half).resize(1920, 1080).png().toBuffer();

  const [a, b] = await Promise.all([gray(original, 1920, 1080), gray(roundTrip, 1920, 1080)]);
  const loss = rmse(a, b);
  const sharpness = await laplacianVariance(original);

  console.log(
    `${file.padEnd(18)} ${loss.toFixed(2).padStart(8)}      ${sharpness.toFixed(0).padStart(8)}`,
  );
}

console.log('\nRMSE 3 미만 = 절반 해상도와 사실상 동일(디테일 없음)');
console.log('RMSE 6 이상 = 1920 해상도를 실제로 쓰고 있음');

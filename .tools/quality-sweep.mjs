/**
 * 인코딩 설정별 화질/용량을 잰다. "quality 를 올리면 정말 좋아지는가"를 확인하는 용도.
 *
 * RMSE 는 그레이딩까지 마친 1920 이미지를 기준으로 잰다. 대비를 올리면 압축 아티팩트가
 * 더 잘 보이므로, 그레이딩 전 기준으로 재면 실제보다 좋게 나온다.
 *
 *   bun run quality-sweep.mjs
 */

import sharp from 'sharp';
import { listSource } from './pacing.mjs';
import { applyGrade } from './grade.mjs';

const SRC = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames';

// bun run quality-sweep.mjs mobile  → 960×540 · 132장 기준으로 잰다
const MOBILE = process.argv[2] === 'mobile';
const W = MOBILE ? 960 : 1920;
const H = MOBILE ? 540 : 1080;
const COUNT = MOBILE ? 132 : 264;
const SHARPEN = MOBILE ? { sigma: 0.7, m1: 0, m2: 2.5 } : { sigma: 1.0, m1: 0, m2: 3 };
const BASE = MOBILE ? 'webp q78' : 'webp q86';

const files = listSource(SRC);
const picks = [20, 62, 110, 136, 175, 232];

const webp = (q) => ({
  name: `webp q${q}`,
  enc: (p) => p.webp({ quality: q, effort: 5, smartSubsample: true }),
});
const avif = (q) => ({
  name: `avif q${q}`,
  enc: (p) => p.avif({ quality: q, effort: 4, chromaSubsampling: '4:4:4' }),
});

const codecs = MOBILE
  ? [webp(74), webp(78), webp(82), avif(52), avif(58), avif(62), avif(66)]
  : [webp(82), webp(86), webp(90), webp(94), avif(64), avif(70), avif(74), avif(78)];

/** 두 RGB 버퍼의 평균 제곱근 오차. 값이 작을수록 원본에 가깝다. */
function rmse(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum / a.length);
}

// 그레이딩까지 끝낸 기준 이미지를 만들어 둔다.
const refs = [];
for (const idx of picks) {
  const { data, info } = await sharp(`${SRC}/${files[idx]}`)
    .resize(W, H, { fit: 'cover' })
    .sharpen(SHARPEN)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  applyGrade(data);
  refs.push({ idx, data, info });
}

console.log(`${W}×${H} · ${COUNT}장 기준\n`);
console.log(`설정            평균 RMSE   평균 KB   최대 KB   ${COUNT}장 합계`);

const results = [];

for (const codec of codecs) {
  const errs = [];
  const sizes = [];

  for (const ref of refs) {
    const encoded = await codec
      .enc(sharp(ref.data, { raw: { width: W, height: H, channels: 3 } }))
      .toBuffer();
    sizes.push(encoded.length);

    const back = await sharp(encoded).removeAlpha().raw().toBuffer();
    errs.push(rmse(ref.data, back));
  }

  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const avgSize = avg(sizes);
  results.push({ name: codec.name, rmse: avg(errs), avgSize });

  console.log(
    `${codec.name.padEnd(14)}${avg(errs).toFixed(3).padStart(10)}${(avgSize / 1024)
      .toFixed(1)
      .padStart(10)}${(Math.max(...sizes) / 1024).toFixed(0).padStart(10)    }${((avgSize * COUNT) / 1024 / 1024)
      .toFixed(1)
      .padStart(11)}MB`,
  );
}

const base = results.find((r) => r.name === BASE);
console.log(`\n${BASE} 대비`);
for (const r of results) {
  if (r === base) continue;
  const dq = ((base.rmse - r.rmse) / base.rmse) * 100;
  const ds = ((r.avgSize - base.avgSize) / base.avgSize) * 100;
  console.log(
    `${r.name.padEnd(14)} 오차 ${dq >= 0 ? '-' : '+'}${Math.abs(dq)
      .toFixed(1)
      .padStart(5)}%   용량 ${ds >= 0 ? '+' : ''}${ds.toFixed(1)}%`,
  );
}

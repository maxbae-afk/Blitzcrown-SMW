/**
 * "화질을 유지한 채" 용량을 줄일 수 있는지 잰다.
 *
 * quality-sweep.mjs 는 quality 축만 훑는다. quality 를 낮추면 당연히 작아지지만 화질도 같이
 * 떨어지므로, 그 표로는 이 질문에 답할 수 없다. 여기서는 화질을 건드리지 않는 축을 본다.
 *
 *  - effort: 인코더가 압축 방법을 얼마나 오래 찾을지. 결과 화질 목표는 그대로고 탐색만 길어진다.
 *            즉 같은 화질에서 파일이 작아진다. 비용은 변환 시간뿐이고 재생에는 영향이 없다.
 *  - chromaSubsampling: 색 해상도를 절반으로 줄인다. 용량은 크게 줄지만 화질은 변한다.
 *            "손실 없음"에 해당하지 않으므로 비교용으로만 같이 잰다.
 *
 * 기준은 그레이딩까지 끝낸 이미지다. 대비를 올린 뒤에 압축 아티팩트가 더 잘 보이기 때문에,
 * 그레이딩 전으로 재면 실제보다 좋게 나온다.
 *
 *   bun run encode-sweep.mjs            # effort·서브샘플링 전체 비교
 *   bun run encode-sweep.mjs 67 68 69   # effort 9 에서 quality 만 좁혀 보기
 */

import sharp from 'sharp';
import { SEQUENCES, listSource } from './pacing.mjs';
import { applyGrade, applyMatch } from './grade.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const W = 1920;
const H = 1080;
const SHARPEN = { sigma: 1.0, m1: 0, m2: 3 };
const TOTAL = 430;

// 현재 설정. 이 값과 견준다.
const CURRENT = { quality: 74, effort: 4, chroma: '4:4:4' };

const narrow = process.argv.slice(2).map(Number).filter(Boolean);

const configs = narrow.length
  ? [CURRENT, ...narrow.map((quality) => ({ quality, effort: 9, chroma: '4:4:4' }))]
  : [
  CURRENT,
  { quality: 74, effort: 6, chroma: '4:4:4' },
  { quality: 74, effort: 8, chroma: '4:4:4' },
  { quality: 74, effort: 9, chroma: '4:4:4' },
  // effort 를 올린 만큼 quality 를 낮춰도 되는지. 오차가 현재와 같으면 그만큼이 순이득이다.
  { quality: 70, effort: 9, chroma: '4:4:4' },
  { quality: 66, effort: 9, chroma: '4:4:4' },
  { quality: 74, effort: 6, chroma: '4:2:0' },
    ];

/** 시퀀스마다 고르게 뽑는다. 한 시퀀스만 보면 장면 성격에 따라 결론이 치우친다. */
function samples() {
  const out = [];
  for (const seq of SEQUENCES) {
    const files = listSource(`${ROOT}/${seq.src}`);
    const at = [0.15, 0.45, 0.8].map((r) => Math.floor(files.length * r));
    for (const i of at) out.push({ seq, file: `${ROOT}/${seq.src}/${files[i]}`, idx: i });
  }
  return out;
}

/** 인코딩 직전 상태. 변환 파이프라인과 같은 순서를 거쳐야 의미가 있다. */
async function reference(pick) {
  const { data } = await sharp(pick.file)
    .resize(W, H, { fit: 'cover' })
    .sharpen(SHARPEN)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  applyMatch(data, pick.seq.match);
  applyGrade(data);
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

/**
 * 가장 나쁜 32×32 블록의 오차.
 *
 * 전체 평균은 화면 대부분이 멀쩡하면 낮게 나온다. 압축 아티팩트는 하늘 그라데이션이나
 * 어두운 면처럼 특정 구역에만 몰려서 생기므로, 그 구역이 얼마나 나빠졌는지 따로 봐야 한다.
 */
function worstBlock(a, b, width, height, block = 32) {
  let worst = 0;
  for (let y = 0; y + block <= height; y += block) {
    for (let x = 0; x + block <= width; x += block) {
      let sum = 0;
      for (let row = 0; row < block; row += 1) {
        let i = ((y + row) * width + x) * 3;
        for (let col = 0; col < block * 3; col += 1, i += 1) {
          const d = a[i] - b[i];
          sum += d * d;
        }
      }
      const err = Math.sqrt(sum / (block * block * 3));
      if (err > worst) worst = err;
    }
  }
  return worst;
}

const picks = samples();
console.log(`${W}×${H} · 표본 ${picks.length}장 (시퀀스별 3장) · 전체 ${TOTAL}장 환산\n`);

const refs = await Promise.all(picks.map(reference));
const raw = { raw: { width: W, height: H, channels: 3 } };

console.log('설정                    평균 RMSE   최악 블록   평균 KB   430장 합계   인코딩');

const results = [];

for (const cfg of configs) {
  const started = Date.now();
  const rows = await Promise.all(
    refs.map(async (ref) => {
      const encoded = await sharp(ref, raw)
        .avif({ quality: cfg.quality, effort: cfg.effort, chromaSubsampling: cfg.chroma })
        .toBuffer();
      const back = await sharp(encoded).removeAlpha().raw().toBuffer();
      return { size: encoded.length, err: rmse(ref, back), worst: worstBlock(ref, back, W, H) };
    }),
  );

  const avg = (key) => rows.reduce((s, r) => s + r[key], 0) / rows.length;
  const size = avg('size');
  const err = avg('err');
  const worst = avg('worst');
  const label = `q${cfg.quality} effort${cfg.effort} ${cfg.chroma}`;
  results.push({ label, err, worst, size, cfg });

  console.log(
    `${label.padEnd(22)}${err.toFixed(3).padStart(10)}${worst.toFixed(2).padStart(12)}` +
      `${(size / 1024).toFixed(1).padStart(10)}${((size * TOTAL) / 1024 / 1024)
        .toFixed(1)
        .padStart(12)}MB${((Date.now() - started) / picks.length / 1000).toFixed(1).padStart(8)}s/장`,
  );
}

const base = results[0];
console.log(`\n현재 설정(${base.label}) 대비`);
for (const r of results.slice(1)) {
  const dq = ((r.err - base.err) / base.err) * 100;
  const dw = ((r.worst - base.worst) / base.worst) * 100;
  const ds = ((r.size - base.size) / base.size) * 100;
  // 평균과 최악 블록이 둘 다 나빠지지 않아야 "화질 유지"라고 할 수 있다.
  const verdict = dq <= 0.5 && dw <= 0.5 && ds < 0 ? '  ← 화질 유지하며 감소' : '';
  console.log(
    `${r.label.padEnd(22)} 평균 ${dq >= 0 ? '+' : ''}${dq.toFixed(1).padStart(5)}%` +
      `   최악 ${dw >= 0 ? '+' : ''}${dw.toFixed(1).padStart(5)}%` +
      `   용량 ${ds >= 0 ? '+' : ''}${ds.toFixed(1)}%${verdict}`,
  );
}

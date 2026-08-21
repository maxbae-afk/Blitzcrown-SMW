/**
 * 이음매 앞뒤의 색을 재서 시퀀스끼리 톤이 맞는지 본다.
 *
 * boundary.mjs 는 흑백 밝기차만 봐서 색이 틀어진 건 잡지 못한다.
 * 여기서는 평균 RGB·채도·따뜻함(R-B)을 원본과 변환 결과 양쪽에서 재고,
 * 차이가 원본에서 온 것인지 변환에서 생긴 것인지 가른다.
 *
 *   bun run color-check.mjs
 *   bun run color-check.mjs 12      # 경계에서 몇 장씩 볼지
 */

import sharp from 'sharp';
import { SEQUENCES, listSource } from './pacing.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const SITE = `${ROOT}/srolling`;
const K = Number(process.argv[2] ?? 10);

/** 한 장의 평균 색. 작게 줄여서 재도 평균은 거의 그대로다. */
async function measure(file) {
  const { data } = await sharp(file).resize(96, 54, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  let sat = 0;
  const n = data.length / 3;

  for (let p = 0; p < data.length; p += 3) {
    const R = data[p];
    const G = data[p + 1];
    const B = data[p + 2];
    r += R;
    g += G;
    b += B;
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    sat += max === 0 ? 0 : (max - min) / max;
  }

  r /= n;
  g /= n;
  b /= n;
  return { r, g, b, sat: sat / n, luma: 0.2126 * r + 0.7152 * g + 0.0722 * b, warm: r - b };
}

const mean = (list, key) => list.reduce((s, x) => s + x[key], 0) / list.length;

async function summarise(files) {
  const list = await Promise.all(files.map(measure));
  return {
    r: mean(list, 'r'),
    g: mean(list, 'g'),
    b: mean(list, 'b'),
    sat: mean(list, 'sat'),
    luma: mean(list, 'luma'),
    warm: mean(list, 'warm'),
  };
}

const pad4 = (n) => String(n).padStart(4, '0');

/** 원본 PNG 경로 목록과 변환된 desktop AVIF 경로 목록. */
function paths(seq) {
  const src = `${ROOT}/${seq.src}`;
  const source = listSource(src).map((f) => `${src}/${f}`);
  const outDir = `${SITE}/frames/${seq.id}/desktop`;
  const out = source.map((_, i) => `${outDir}/frame_${pad4(i + 1)}.avif`);
  return { source, out };
}

const row = (label, m) =>
  `  ${label.padEnd(22)} R ${m.r.toFixed(1).padStart(5)}  G ${m.g.toFixed(1).padStart(5)}  ` +
  `B ${m.b.toFixed(1).padStart(5)}  채도 ${m.sat.toFixed(3)}  밝기 ${m.luma.toFixed(1).padStart(5)}  ` +
  `따뜻함 ${m.warm >= 0 ? '+' : ''}${m.warm.toFixed(1)}`;

const table = SEQUENCES.map((seq) => ({ seq, ...paths(seq) }));

/**
 * 경계를 한 프레임씩 훑는다.
 * 색이 서서히 변하는 거라면 완만한 기울기가, 클립이 안 맞는 거라면 계단이 보인다.
 */
if (process.argv.includes('--trace')) {
  // --out 을 주면 변환 결과를, 아니면 원본을 훑는다.
  const kind = process.argv.includes('--out') ? 'out' : 'source';
  const label = kind === 'out' ? '변환 AVIF' : '원본 PNG';

  for (let i = 0; i + 1 < table.length; i += 1) {
    const a = table[i];
    const b = table[i + 1];
    console.log(`\n[프레임별] ${a.seq.id} 끝 5장 → ${b.seq.id} 앞 5장 (${label})`);
    const picks = [
      ...a[kind].slice(-5).map((f, k) => [`${a.seq.id} -${5 - k}`, f]),
      ...b[kind].slice(0, 5).map((f, k) => [`${b.seq.id} +${k + 1}`, f]),
    ];
    let previous = null;
    for (const [label, file] of picks) {
      const m = await measure(file);
      const step = previous ? ` 직전 대비 밝기 ${(m.luma - previous).toFixed(1)}` : '';
      console.log(`${row(label, m)}${step}`);
      previous = m.luma;
    }
  }
  process.exit(0);
}

for (let i = 0; i + 1 < table.length; i += 1) {
  const a = table[i];
  const b = table[i + 1];
  console.log(`\n${a.seq.id} 끝 ${K}장  ↔  ${b.seq.id} 앞 ${K}장`);

  for (const kind of ['source', 'out']) {
    const tail = a[kind].slice(-K);
    const head = b[kind].slice(0, K);
    const [ma, mb] = await Promise.all([summarise(tail), summarise(head)]);

    console.log(`  [${kind === 'source' ? '원본 PNG' : '변환 AVIF'}]`);
    console.log(row(a.seq.id, ma));
    console.log(row(b.seq.id, mb));
    console.log(
      row('차이', {
        r: mb.r - ma.r,
        g: mb.g - ma.g,
        b: mb.b - ma.b,
        sat: mb.sat - ma.sat,
        luma: mb.luma - ma.luma,
        warm: mb.warm - ma.warm,
      }),
    );
  }
}

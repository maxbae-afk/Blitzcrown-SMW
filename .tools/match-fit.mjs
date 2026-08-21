/**
 * 한 시퀀스의 색을 이웃 시퀀스에 맞추는 계수를 뽑는다.
 *
 * 시퀀스마다 원본 렌더의 톤이 다르면 이음매에서 색이 계단처럼 튄다.
 * 앞뒤 시퀀스의 경계 프레임을 기준 삼아, 대상 클립을 거기에 얹는 1차식을 채널별로 구한다.
 *
 * 경계에서는 앞뒤가 같은 구도이므로 두 클립의 화면 통계를 직접 견줄 수 있다.
 * 평균만 맞추면 밝기는 맞아도 대비가 틀어지므로, 어두운 쪽(p20)과 밝은 쪽(p80)
 * 두 지점을 함께 맞춰 게인과 리프트를 동시에 푼다.
 *
 *   bun run match-fit.mjs bridge
 *
 * 출력된 match 값을 pacing.mjs 의 해당 시퀀스에 넣고 convert.mjs 로 다시 변환한다.
 */

import sharp from 'sharp';
import { SEQUENCES, listSource } from './pacing.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const K = 5;

const id = process.argv[2];
const index = SEQUENCES.findIndex((s) => s.id === id);

if (index < 0) {
  console.error(`시퀀스를 찾지 못했습니다. 사용 가능: ${SEQUENCES.map((s) => s.id).join(', ')}`);
  process.exit(1);
}
if (index === 0 && SEQUENCES.length < 2) {
  console.error('맞출 이웃이 없습니다.');
  process.exit(1);
}

const files = (seq) => {
  const dir = `${ROOT}/${seq.src}`;
  return listSource(dir).map((f) => `${dir}/${f}`);
};

/** 채널별 히스토그램을 모아 백분위 값을 낸다. */
async function stats(list) {
  const hist = [new Float64Array(256), new Float64Array(256), new Float64Array(256)];
  let total = 0;

  for (const file of list) {
    const { data } = await sharp(file)
      .resize(160, 90, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let p = 0; p < data.length; p += 3) {
      hist[0][data[p]] += 1;
      hist[1][data[p + 1]] += 1;
      hist[2][data[p + 2]] += 1;
    }
    total += data.length / 3;
  }

  const at = (c, q) => {
    const want = total * q;
    let seen = 0;
    for (let v = 0; v < 256; v += 1) {
      seen += hist[c][v];
      if (seen >= want) return v;
    }
    return 255;
  };

  return [0, 1, 2].map((c) => ({ p20: at(c, 0.2), p80: at(c, 0.8), mean: at(c, 0.5) }));
}

const target = [];
if (index > 0) target.push(...files(SEQUENCES[index - 1]).slice(-K));
if (index + 1 < SEQUENCES.length) target.push(...files(SEQUENCES[index + 1]).slice(0, K));

// 대상은 양 끝을 쓴다. 앞쪽은 앞 시퀀스와, 뒤쪽은 뒤 시퀀스와 맞닿는 부분이다.
const own = files(SEQUENCES[index]);
const source = [...own.slice(0, K), ...own.slice(-K)];

const [t, s] = await Promise.all([stats(target), stats(source)]);

const gain = [];
const lift = [];
const names = ['R', 'G', 'B'];

console.log(`[${id}] 기준 ${target.length}장 ↔ 대상 ${source.length}장\n`);
console.log('  채널   기준 p20/p80    대상 p20/p80    게인    리프트');

for (let c = 0; c < 3; c += 1) {
  const spread = s[c].p80 - s[c].p20;
  const g = spread === 0 ? 1 : (t[c].p80 - t[c].p20) / spread;
  const l = t[c].p20 - s[c].p20 * g;
  gain.push(Number(g.toFixed(4)));
  lift.push(Number(l.toFixed(2)));

  console.log(
    `  ${names[c]}     ${String(t[c].p20).padStart(3)} / ${String(t[c].p80).padStart(3)}` +
      `       ${String(s[c].p20).padStart(3)} / ${String(s[c].p80).padStart(3)}` +
      `      ${g.toFixed(4)}  ${l >= 0 ? '+' : ''}${l.toFixed(2)}`,
  );
}

console.log('\npacing.mjs 의 해당 시퀀스에 넣으세요:\n');
console.log(`    match: { gain: [${gain.join(', ')}], lift: [${lift.join(', ')}] },`);

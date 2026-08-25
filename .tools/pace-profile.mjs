/**
 * 구간마다 "그 구간을 지나는 데 필요한 스크롤 거리" 를 두 가지 기준으로 뽑는다.
 *
 * 페이싱 표의 배수는 시퀀스 안에서의 상대값이라, 두 시퀀스를 가로질러 비교할 수 없다.
 * 아래 두 값은 절대치라 이음매에서 속도가 튀는지 바로 보인다.
 *
 *   vh/프레임 - 프레임 한 장이 넘어가는 데 드는 거리. 얼마나 촘촘히 갱신되는지.
 *   체감      - 위 값에 시퀀스의 density 를 곱한 것. 원본이 촘촘하면 vh/프레임은 낮아도
 *               화면이 지나가는 속도는 같으므로, 시퀀스를 가로지르는 비교는 이 값으로 한다.
 *
 *   bun run pace-profile.mjs
 */

import { readFileSync } from 'node:fs';
import { SEQUENCES } from './pacing.mjs';

const SITE = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling';
const manifest = JSON.parse(readFileSync(`${SITE}/frames/manifest.json`, 'utf8'));
const css = readFileSync(`${SITE}/styles.css`, 'utf8');

/** :root 의 vh 변수를 읽는다. 모바일 미디어쿼리 값은 뒤에 나오므로 첫 번째를 쓴다. */
function vhVar(name) {
  const m = css.match(new RegExp(`${name}:\\s*([\\d.]+)vh`));
  return m ? Number(m[1]) : null;
}

const rows = [];

for (const sequence of SEQUENCES) {
  const set = manifest.sequences?.find((s) => s.id === sequence.id)?.sets?.desktop;
  if (!set?.pacing) continue;

  // --travel-* 는 재생 중 실제로 굴러가는 거리다. 구간 자의 높이가 아니므로 그대로 쓴다.
  const totalVh = vhVar(`--travel-${sequence.id}`);
  if (!totalVh) {
    console.error(`--travel-${sequence.id} 를 styles.css 에서 찾지 못했습니다.`);
    continue;
  }

  const { pacing, count } = set;
  const density = sequence.density ?? 1;

  for (const s of sequence.sections) {
    const from = Math.min(s.from, count - 1);
    const to = Math.min(s.to, count - 1);
    // 이 구간이 차지하는 스크롤 비율 × 전체 길이 ÷ 프레임 수
    const share = pacing[Math.min(to + 1, count - 1)] - pacing[from];
    const frames = to - from + 1;
    const vhPerFrame = (share * totalVh) / frames;

    rows.push({
      seq: sequence.id,
      name: s.name,
      frames,
      speed: s.speed,
      vhPerFrame,
      felt: vhPerFrame * density,
    });
  }
}

const avg =
  rows.reduce((a, r) => a + r.felt * r.frames, 0) / rows.reduce((a, r) => a + r.frames, 0);

console.log(`전체 평균 ${avg.toFixed(2)}vh (체감 기준)\n`);
console.log('시퀀스   구간            장수  speed   vh/프레임   체감    평균대비');

for (const r of rows) {
  const rel = r.felt / avg;
  const bar = '█'.repeat(Math.min(Math.round(rel * 14), 40));
  console.log(
    `${r.seq.padEnd(8)} ${r.name.padEnd(14)} ${String(r.frames).padStart(4)}  ${(
      r.speed ? r.speed.toFixed(2) : '  — '
    ).padStart(5)}  ${r.vhPerFrame.toFixed(2).padStart(9)}  ${r.felt
      .toFixed(2)
      .padStart(6)}   ${rel.toFixed(2).padStart(5)}x ${bar}`,
  );
}

// 이음매마다 맞닿는 두 구간을 비교한다. 여기서 튀면 전환이 어색하게 읽힌다.
console.log('');
for (let i = 0; i + 1 < SEQUENCES.length; i += 1) {
  const last = rows.findLast((r) => r.seq === SEQUENCES[i].id);
  const first = rows.find((r) => r.seq === SEQUENCES[i + 1].id);
  if (!last || !first) continue;
  const delta = (first.felt / last.felt - 1) * 100;
  const verdict = Math.abs(delta) <= 10 ? '' : '  ← 속도가 튄다';
  console.log(
    `이음매 ${SEQUENCES[i].id} → ${SEQUENCES[i + 1].id}: ` +
      `${last.name} ${last.felt.toFixed(2)}vh → ${first.name} ${first.felt.toFixed(2)}vh` +
      `  (${delta > 0 ? '+' : ''}${delta.toFixed(0)}%)${verdict}`,
  );
}

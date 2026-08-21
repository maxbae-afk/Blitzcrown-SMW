/**
 * 이음매 앞뒤에서 프레임 번호가 실제로 멈춰 있는 구간을 픽셀 단위로 잰다.
 * 화면 픽셀이 아니라 번호 기준이므로, 체감까지 보려면 motion-check.mjs 와 같이 본다.
 *
 *   bun run serve.mjs           # 별도 터미널
 *   bun run hold-check.mjs
 *   bun run hold-check.mjs 10   # 10px 간격으로 촘촘히
 *
 * 간격보다 짧은 정지는 잡히지 않는다. 짧은 교차를 검증할 때는 간격을 줄인다.
 */

import { SEQUENCES } from './pacing.mjs';
import { open, seek, state, layout } from './page.mjs';

const STEP = Number(process.argv[2] ?? 50);
const BEFORE = Number(process.argv[3] ?? 300);
const AFTER = Number(process.argv[4] ?? 500);

const { browser, page } = await open();
const { ranges, vh } = await layout(page);

console.log('구간 자');
for (const r of ranges) {
  console.log(`  ${r.id.padEnd(7)} ${r.top} … ${r.top + r.height} (높이 ${r.height})`);
}
console.log(`뷰포트 ${vh}\n`);

for (let i = 0; i + 1 < SEQUENCES.length; i += 1) {
  const edge = ranges[i].top + ranges[i].height - vh;
  console.log(`=== 이음매 ${SEQUENCES[i].id} → ${SEQUENCES[i + 1].id} · 교차 시작 y=${edge} ===`);
  console.log('    스크롤   seam    보이는 프레임');

  let prev = null;
  let frozenFrom = null;
  const frozen = [];

  for (let y = edge - BEFORE; y <= edge + AFTER; y += STEP) {
    await seek(page, y, 700);
    const { frames, seam } = await state(page);

    // 교차 중에는 어느 쪽 번호를 믿어야 할지 모르므로, 실제로 덮고 있는 쪽을 본다.
    const index = seam[i + 1] >= 0.5 ? i + 1 : i;
    const shown = `${SEQUENCES[index].id}:${frames[index]}`;

    const still = prev !== null && shown === prev;
    if (still && frozenFrom === null) frozenFrom = y - STEP;
    if (!still && frozenFrom !== null) {
      frozen.push([frozenFrom, y - STEP]);
      frozenFrom = null;
    }
    prev = shown;

    console.log(
      `${String(y).padStart(10)}  ${seam[i + 1].toFixed(2).padStart(5)}   ${shown}${
        still ? '  ← 정지' : ''
      }`,
    );
  }
  if (frozenFrom !== null) frozen.push([frozenFrom, edge + AFTER]);

  if (frozen.length) {
    console.log('정지 구간');
    for (const [a, b] of frozen) {
      console.log(`  y ${a} … ${b}  (${b - a}px · ${((b - a) / vh).toFixed(2)}화면)`);
    }
  } else {
    console.log('정지 구간 없음');
  }
  console.log('');
}

await browser.close();

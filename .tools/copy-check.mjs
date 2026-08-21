/**
 * 스크롤을 내려가며 어느 카피가 화면에 떠 있는지 훑는다.
 * 이음매를 걸치는 카피가 중간에 끊기지 않는지 확인하는 용도.
 *
 *   bun run serve.mjs      # 별도 터미널
 *   bun run copy-check.mjs
 */

import { SEQUENCES } from './pacing.mjs';
import { open, seek, state, layout } from './page.mjs';

const STEPS = 64;
// 이보다 흐리면 화면에 있다고 보지 않는다.
const VISIBLE = 0.35;

const { browser, page } = await open();
const { ranges, after, vh } = await layout(page);

const edges = [];
for (let i = 0; i + 1 < SEQUENCES.length; i += 1) {
  edges.push(ranges[i].top + ranges[i].height - vh);
}
console.log(`이음매 y=${edges.join(', ')}\n`);
console.log('    스크롤   t      보이는 카피');

const seen = new Map();

for (let i = 0; i <= STEPS; i += 1) {
  const y = Math.round(((after - vh) * i) / STEPS);
  await seek(page, y, 320);

  const { progress } = await state(page);
  const visible = await page.evaluate(
    (min) =>
      Array.from(document.querySelectorAll('#chapters .chapter'))
        .filter((el) => Number(el.style.getPropertyValue('--amount') || 0) > min)
        .map((el) => el.querySelector('.ch-label').textContent.trim()),
    VISIBLE,
  );

  const t = progress.reduce((a, b) => a + b, 0);
  for (const label of visible) {
    const hit = seen.get(label) ?? { from: y, to: y };
    hit.to = y;
    seen.set(label, hit);
  }

  const nearSeam = edges.some((e) => Math.abs(y - e) <= 200);
  console.log(
    `${String(y).padStart(10)}  ${t.toFixed(3)}  ${visible.join(' + ') || '—'}${
      nearSeam ? '   ← 이음매' : ''
    }`,
  );
}

console.log('\n카피별 노출 구간');
for (const [label, { from, to }] of seen) {
  console.log(
    `  ${label.padEnd(18)} y ${String(from).padStart(6)} … ${String(to).padStart(6)}  (${
      to - from
    }px · ${((to - from) / vh).toFixed(2)}화면)`,
  );
}

await browser.close();

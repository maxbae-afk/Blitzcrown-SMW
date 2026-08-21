/**
 * 스크롤을 균등하게 나눠 내려가면서 각 지점의 프레임 번호를 읽는다.
 * "같은 양을 스크롤했을 때 몇 프레임이 지나가는가" = 체감 속도.
 *
 *   bun run scan.mjs           # main
 *   bun run scan.mjs bridge
 *   bun run scan.mjs ascent
 */

import { SEQUENCES, sequenceById } from './pacing.mjs';
import { open, seek, state, layout } from './page.mjs';

const STEPS = 60;

const id = process.argv[2] ?? 'main';
const { sections } = sequenceById(id);
const index = SEQUENCES.findIndex((s) => s.id === id);

const { browser, page } = await open();

const { ranges, vh } = await layout(page);
const range = ranges[index];

const samples = [];
for (let i = 0; i <= STEPS; i += 1) {
  const t = i / STEPS;
  await seek(page, range.top + (range.height - vh) * t, 320);
  const { frames } = await state(page);
  samples.push({ t, frame: frames[index] });
}

await browser.close();

// 스크롤 1스텝당 몇 프레임이 지나갔는지
console.log(`[${id}]\n스크롤   프레임   이번 스텝 프레임수   구간`);
let prev = 0;
for (const { t, frame } of samples) {
  const delta = frame - prev;
  prev = frame;
  const section = sections.find((s) => frame >= s.from && frame <= s.to);
  const bar = '█'.repeat(Math.min(Math.max(Math.round(delta), 0), 30));
  console.log(
    `${t.toFixed(3)}  ${String(frame).padStart(5)}  ${String(delta).padStart(6)}  ${bar} ${
      section?.name ?? ''
    }`,
  );
}

const monotonic = samples.every((s, i) => i === 0 || s.frame >= samples[i - 1].frame);
console.log(`\n프레임 단조 증가: ${monotonic ? 'OK' : '깨짐'}`);
console.log(`끝 프레임: ${samples.at(-1).frame} (기대 ${sections.at(-1).to})`);

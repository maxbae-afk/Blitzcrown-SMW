/**
 * 이음매 앞뒤에서 "화면이 실제로 얼마나 변하는지" 를 픽셀로 잰다.
 *
 * 프레임 번호만 보면 교차 중에는 어느 쪽 숫자를 믿어야 할지 알 수 없다.
 * 스크린샷을 한 스텝씩 비교하면 체감 정지 구간이 그대로 드러난다.
 *
 *   bun run serve.mjs        # 별도 터미널
 *   bun run motion-check.mjs
 */

import sharp from 'sharp';
import { SEQUENCES } from './pacing.mjs';
import { open, seek, layout } from './page.mjs';

const STEP = 40;
const BEFORE = 400;
const AFTER = 700;
// 이보다 변화가 작으면 눈에는 멈춘 것으로 읽힌다.
const STILL = 0.4;

const { browser, page } = await open();
const { ranges, vh } = await layout(page);

// 카피가 페이드하는 것까지 "움직임" 으로 세면 안 되므로 화면 오른쪽 절반만 본다.
const CROP = { left: 720, top: 120, width: 720, height: 660 };
const grey = async (buf) => sharp(buf).extract(CROP).resize(180, 165).greyscale().raw().toBuffer();

for (let i = 0; i + 1 < SEQUENCES.length; i += 1) {
  const edge = ranges[i].top + ranges[i].height - vh;
  console.log(`\n=== 이음매 ${SEQUENCES[i].id} → ${SEQUENCES[i + 1].id} · 교차 시작 y=${edge} ===`);
  console.log('    스크롤   화면변화   비고');

  let prev = null;
  const rows = [];

  for (let y = edge - BEFORE; y <= edge + AFTER; y += STEP) {
    await seek(page, y, 800);
    const cur = await grey(await page.screenshot());
    if (prev) {
      let sum = 0;
      for (let k = 0; k < cur.length; k += 1) sum += Math.abs(cur[k] - prev[k]);
      const delta = sum / cur.length;
      rows.push({ y, delta });
      const bar = '█'.repeat(Math.min(Math.round(delta * 4), 40));
      console.log(
        `${String(y).padStart(10)}  ${delta.toFixed(2).padStart(8)}   ${bar}${
          delta < STILL ? ' ← 정지' : ''
        }`,
      );
    }
    prev = cur;
  }

  const still = rows.filter((r) => r.delta < STILL);
  if (still.length) {
    const a = still[0].y - STEP;
    const b = still.at(-1).y;
    console.log(`정지 구간 y ${a} … ${b} (${b - a}px · ${((b - a) / vh).toFixed(2)}화면)`);
  } else {
    console.log('정지 구간 없음');
  }
}

await browser.close();

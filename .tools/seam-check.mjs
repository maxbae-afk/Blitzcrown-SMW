/**
 * 시퀀스가 넘어가는 구간을 실제 페이지에서 연속으로 찍는다.
 * 이음매가 여럿이므로 경계마다 한 장씩 만든다. (shots/seam-1-scroll.png …)
 *
 *   bun run serve.mjs      # 별도 터미널
 *   bun run seam-check.mjs
 */

import sharp from 'sharp';
import { SEQUENCES } from './pacing.mjs';
import { open, seek, state, layout, OUT } from './page.mjs';

const { browser, page } = await open();
const { ranges, vh } = await layout(page);

const TW = 480;
const TH = 300;
const SHOTS = 8;
const STEP = 45;

for (let i = 0; i + 1 < SEQUENCES.length; i += 1) {
  const edge = ranges[i].top + ranges[i].height - vh;
  const label = `${SEQUENCES[i].id}-${SEQUENCES[i + 1].id}`;

  // 잔상이 찍히지 않도록 멀찍이서 한 번 자리를 잡고 들어간다.
  await seek(page, edge - 1400, 1200);

  const shots = [];
  for (let k = 0; k < SHOTS; k += 1) {
    const y = Math.round(edge - 100 + k * STEP);
    // 감쇠 보간이 목표를 따라잡을 때까지 넉넉히 기다린다.
    await seek(page, y, 1800);
    const { seam, frames } = await state(page);
    shots.push({
      y,
      note: `seam ${seam[i + 1].toFixed(2)}  f ${frames[i]}→${frames[i + 1]}`,
      buf: await page.screenshot(),
    });
  }

  await sharp({
    create: { width: TW * 4, height: TH * 2, channels: 3, background: '#111' },
  })
    .composite(
      await Promise.all(
        shots.map(async (s, k) => ({
          input: await sharp(await sharp(s.buf).resize(TW, TH).png().toBuffer())
            .composite([
              {
                input: Buffer.from(
                  `<svg width="${TW}" height="${TH}"><rect x="0" y="0" width="260" height="22" fill="#000" opacity="0.8"/><text x="7" y="17" font-family="monospace" font-size="13" fill="#3ee0b8">y ${s.y}  ${s.note}</text></svg>`,
                ),
                left: 0,
                top: 0,
              },
            ])
            .png()
            .toBuffer(),
          left: (k % 4) * TW,
          top: Math.floor(k / 4) * TH,
        })),
      ),
    )
    .png()
    .toFile(`${OUT}/seam-${i + 1}-scroll.png`);

  console.log(`이음매 ${label}: y ${edge - 100} ~ ${edge - 100 + (SHOTS - 1) * STEP} 촬영`);
  console.log(`  shots/seam-${i + 1}-scroll.png`);
}

await browser.close();

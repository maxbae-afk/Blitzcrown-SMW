/**
 * 특정 스크롤 위치를 원본 크기로 한 장 찍는다.
 *
 *   bun run serve.mjs      # 별도 터미널
 *   bun run peek.mjs 9845
 */

import { open, seek, state, OUT } from './page.mjs';

const Y = Number(process.argv[2] ?? 0);

const { browser, page } = await open();
await seek(page, Y, 2500);

await page.screenshot({ path: `${OUT}/peek-${Y}.png` });

const { frames, seam, ids } = await state(page);

// 화면 중앙을 덮고 있는 요소가 무엇인지 같이 알려준다.
const stack = await page.evaluate(() =>
  document
    .elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2)
    .slice(0, 6)
    .map((el) => {
      const s = getComputedStyle(el);
      return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${
        el.className || '-'
      } · opacity ${s.opacity}`;
    }),
);

console.log(`peek-${Y}.png`);
console.log(ids.map((id, i) => `${id} f${frames[i]} seam ${seam[i].toFixed(2)}`).join('  ·  '));
console.log(stack.join('\n'));

await browser.close();
